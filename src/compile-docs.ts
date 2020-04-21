
import * as fs from 'fs';
import * as path from 'path';
import MarkdownIt = require('markdown-it');
import { execSync } from 'child_process';
import * as hljs from 'highlight.js';
import { JSDOM } from 'jsdom';

(async () => {
  // --- Monaco editor and Zapatos file bundle for it ---

  console.info('Copying Monaco editor ...');
  execSync(`cp -r ./node_modules/monaco-editor/min ./web/monaco`);

  console.info('Bundling zapatos source for Monaco ...');
  const recurseNodes = (node: string): string[] =>
    fs.statSync(node).isFile() ? [node] :
      fs.readdirSync(node).reduce<string[]>((memo, n) =>
        memo.concat(recurseNodes(path.join(node, n))), []);

  const all = recurseNodes('./build-src/zapatos').reduce<{ [k: string]: string; }>((memo, p) => {
    const localPath = p.replace(/^build-src[/]/, '');
    memo[localPath] = fs.readFileSync(p, { encoding: 'utf8' });
    return memo;
  }, {});

  Object.assign(all, {
    // stubs for key pg types
    'pg.ts': `
      export interface Pool {}
      export interface PoolClient {}
      export interface QueryResult {
        rows: any;
      }`,
    // pretend pg.Pool
    'pgPool.ts': `
      import * as pg from 'pg';
      export let pool: pg.Pool;`,
    // workaround for Monaco Editor not finding index.ts inside folders:
    'zapatos/src.ts': `
      export * from './src/index';`,
  });

  fs.writeFileSync('./web/zapatos-bundle.js', `const zapatosBundle = ${JSON.stringify(all)};`);

  // --- transform and highlight Markdown ---

  console.info('Transforming Markdown ...');
  const
    md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str: string, lang: string) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre class="language-${lang}"><code>${hljs.highlight(lang, str).value}</code></pre>`;
          } catch (err) {
            console.log('Highlighting error', err);
          }
        }
        return '';
      }
    }),
    src = fs.readFileSync('./src/index.md', { encoding: 'utf8' }),
    htmlContent = md.render(src),
    html = `<!DOCTYPE html>
    <html>
      <head>
        <!-- tocbot -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.11.1/tocbot.min.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.11.1/tocbot.css">
        <!-- highlighting -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.1/styles/default.min.css">
        <!-- monaco editor -->
        <script src="monaco/vs/loader.js"></script>
        <script src="zapatos-bundle.js"></script>
        <!-- custom -->
        <link rel="stylesheet" href="https://use.typekit.net/mdb7zvi.css">
        <link rel="stylesheet" href="docs.css">
      </head>
      <body>
        <div id="toc"></div>
        <div id="content">${htmlContent}</div>
        <script src="docs.js"></script>
      </body>
    </html>
  `;

  const
    dom = new JSDOM(html),
    document = dom.window.document;

  console.info('Adding id attributes to headings...');

  const
    maxIdLength = 32,
    content = document.querySelector('#content'),
    headings = content!.querySelectorAll('h1, h2, h3, h4'),
    headingMap: { [k: string]: number } = {};

  headings.forEach((heading, i) => {
    let id = heading.id ? heading.id : heading.textContent!
      .trim().toLowerCase()
      .split(/\s+/).join('-')
      .replace(/[^-_a-z0-9]+/g, '');

    if (id.length > maxIdLength) id = id.substring(0, id.lastIndexOf('-', maxIdLength));
    headingMap[id] = headingMap[id] === undefined ? 0 : ++headingMap[id];
    if (headingMap[id]) id += '-' + headingMap[id];

    heading.id = id;
  });

  console.info('Collecting TypeScript scripts ..');

  const runnableTags = Array.from(content!.querySelectorAll('.language-typescript'))
    .filter(ts => ts.textContent?.match(/^\s*import\b/m));

  runnableTags.forEach((runnableTag, i) => {
    const
      ts = runnableTag.textContent,
      instrumentedTs = `
        import * as xyz from './zapatos/src';
        xyz.setConfig({
          queryListener: (x: any) => {
            console.log('%%text%:' + x.text + '%%');
            if (x.values.length) console.log('%%values%:[' + 
              x.values.map((v: any) => JSON.stringify(v)).join(', ') + ']%%');
          },
          resultListener: (x: any) => {
            if (x.length) console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
          }
        });

        /* original script begins */
        ${ts}
        /* original script ends */

        pool.end();
      `;

    fs.writeFileSync(`./build-src/tsblock-${i}.ts`, instrumentedTs, { encoding: 'utf8' });
  });

  console.info('Compiling TypeScript script blocks ..');
  try {
    execSync('tsc', { cwd: './build-src', encoding: 'utf8' });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  const
    pgFmtArgs = '--spaces 2 --wrap-after 30 --format text --keyword-case 0 --type-case 0',
    formatSQL = (sql: string) =>
      execSync(`perl ./lib/pgFormatter/pg_format ${pgFmtArgs}`, {
        encoding: 'utf8',
        input: sql,
      });

  runnableTags.forEach((runnableTag, i) => {
    console.info(`Running script block ${i} ..`);

    const
      stdout = execSync(`node --harmony-top-level-await --experimental-specifier-resolution=node tsblock-${i}.js`,
        { cwd: './build-src', encoding: 'utf8' }),
      parts = stdout.split(/%{2,}/);

    let output = '<div class="sqlstuff">\n';
    for (const part of parts) {
      const [type, str] = part.split('%:');

      if (type === 'text') {
        const
          fmtSql = formatSQL(str),
          highlightSql = hljs.highlight('sql', fmtSql).value.trim().replace(/\n/g, '<br>');
        output += `<pre class="sqltext"><code>${highlightSql}</code></pre>\n`;

      } else if (type === 'values') {
        const highlightValues = hljs.highlight('json', str).value.replace(/\n/g, '<br>');
        output += `<pre class="sqlvalues"><code>${highlightValues}</code></pre>\n`;

      } else if (type === 'result') {
        const highlightResult = hljs.highlight('json', str).value.replace(/\n/g, '<br>');
        output += `<pre class="sqlresult"><code>${highlightResult}</code></pre>\n`;

      } else {  // console output
        const logs = type.trim();
        if (logs) output += `<pre class="console"><code>${logs}</code></pre>\n`;
      }
    }
    output += '</div>'

    runnableTag.className += ' runnable';
    runnableTag.insertAdjacentHTML('afterend', output);
  });

  fs.writeFileSync('./web/index.html', dom.serialize(), { encoding: 'utf8' });
})();

