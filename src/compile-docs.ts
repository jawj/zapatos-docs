
import * as fs from 'fs';
import * as path from 'path';
import MarkdownIt = require('markdown-it');
import { execSync } from 'child_process';
import * as hljs from 'highlight.js';
import { JSDOM } from 'jsdom';

(async () => {

  const tmpdb = `zapatos_docs_${new Date().toISOString().replace(/\D+/g, '')}`;
  const dbEnv = { ...process.env, ZDBNAME: tmpdb };

  console.info('Creating temporary DB...');
  execSync(`createdb ${tmpdb}`);
  execSync(`psql ${tmpdb} < schema.sql`);

  console.info('Running Zapatos ...');
  execSync(`npx zapatos`, { env: dbEnv });

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

  // --- add source code links ---

  console.info('Adding source code links ...');
  const
    rawSrc = fs.readFileSync('./src/index.md', { encoding: 'utf8' }),
    src = rawSrc.replace(/^=>\s*(\S+)\s*(.*)$/gm, (_dummy, srcFileName, targetLine) => {
      const
        srcPath = `./build-src/zapatos/src/${srcFileName}`,
        srcFile = fs.readFileSync(srcPath, { encoding: 'utf8' }),
        targetRegEx = new RegExp('^\\s*' + targetLine.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\s*$', 'm'),
        foundAtIndex = srcFile.match(targetRegEx)?.index;

      if (foundAtIndex === undefined) throw new Error(`"${targetLine}" not found in ${srcPath}`);
      const lineNo = srcFile.slice(0, foundAtIndex).split('\n').length + 2;

      return `<div class="src-link"><a href="https://github.com/jawj/zapatos/blob/master/src/${srcFileName}#L${lineNo}">Source code »</a></div>`;
    });

  // --- transform and highlight Markdown ---

  console.info('Transforming Markdown ...');
  const
    md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str: string, langPlusOptions: string) => {
        const [lang, ...options] = langPlusOptions.split(':');
        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre class="language-${lang}${options.map(o => ' ' + o)}"><code>${hljs.highlight(lang, str).value}</code></pre>`;
          } catch (err) {
            console.error('Highlighting error', err);
          }
        }
        return '';
      }
    }),
    htmlContent = md.render(src),
    html = `<!DOCTYPE html>
    <html>
      <head>
        <title>Zapatos: Docs</title>
        <!-- tocbot -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.11.1/tocbot.min.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.11.1/tocbot.css">
        <!-- highlighting -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.1/styles/xcode.min.css">
        <!-- monaco editor -->
        <script src="monaco/vs/loader.js"></script>
        <script src="zapatos-bundle.js"></script>
        <!-- fonts -->
        <link rel="stylesheet" href="https://use.typekit.net/mdb7zvi.css">
        <!-- custom -->
        <link rel="stylesheet" href="docs.css">
      </head>
      <body>
        <!-- http://tholman.com/github-corners/ -->
        <a href="https://github.com/jawj/zapatos" class="github-corner" aria-label="View source on GitHub"><svg width="80" height="80" viewBox="0 0 250 250" style="fill:#aaa; color:#fff; position: fixed; z-index: 150; top: 0; border: 0; right: 0;" aria-hidden="true"><path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path></svg></a><style>.github-corner:hover .octo-arm{animation:octocat-wave 560ms ease-in-out}@keyframes octocat-wave{0%,100%{transform:rotate(0)}20%,60%{transform:rotate(-25deg)}40%,80%{transform:rotate(10deg)}}@media (max-width:500px){.github-corner:hover .octo-arm{animation:none}.github-corner .octo-arm{animation:octocat-wave 560ms ease-in-out}}</style>
      
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
    maxIdLength = 64,
    content = document.querySelector('#content'),
    headings = content!.querySelectorAll('h1, h2, h3, h4, h5'),
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

  console.log('Checking internal links ...');

  const links = content!.querySelectorAll('a');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href?.charAt(0) !== '#') return;
    if (!content?.querySelector(href)) console.error(` => No link target "${href}"`);
  });

  console.info('Collecting TypeScript scripts ..');

  const runnableTags = Array.from(content!.querySelectorAll('.language-typescript'))
    .filter(ts => !ts.className.match(/\bnorun\b/));

  runnableTags.forEach((runnableTag, i) => {
    const
      ts = runnableTag.textContent,
      instrumentedTs = `
        import * as xyz from './zapatos/src';
        xyz.setConfig({
          queryListener: (x: any) => {
            console.log('%%text%:' + x.text + '%%');
            if (x.values.length) {
              console.log('%%values%:[' + x.values.map((v: any) => JSON.stringify(v)).join(', ') + ']%%');
            }
          },
          resultListener: (x: any) => {
            if (x && !(Array.isArray(x) && x.length === 0)) {
              console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
            }
          }
        });
        ${ts?.match(/^\s*import\b/m) ? '' : `
          import * as db from './zapatos/src';
          import * as s from './zapatos/schema';
          import { pool } from './pgPool';
        `}

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
    formatSQL = (sql: string) => {
      try {
        return execSync(`perl ./lib/pgFormatter/pg_format ${pgFmtArgs}`, {
          encoding: 'utf8',
          input: sql,
        });
      } catch (err) {  // https://github.com/darold/pgFormatter/issues/183
        return sql.trim();
      }
    }

  runnableTags.forEach((runnableTag, i) => {
    console.info(`Running script block ${i} ...`);

    const stdout = execSync(`node --harmony-top-level-await --experimental-specifier-resolution=node --no-warnings tsblock-${i}.js`,
      { cwd: './build-src', encoding: 'utf8', env: dbEnv });
    // console.log(stdout);

    const parts = stdout.split(/%{2,}/);

    if (!runnableTag.className.match(/\bnoresult\b/)) {
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
      runnableTag.insertAdjacentHTML('afterend', output);
    }

    const script = runnableTag.textContent;
    runnableTag.insertAdjacentHTML('afterbegin', '<code class="imports">' +
      (script?.match(/\bdb[.]/) ?
        `<span class="hljs-keyword">import</span> * <span class="hljs-keyword">as</span> db <span class="hljs-keyword">from</span> <span class="hljs-string">'./zapatos/src'</span>;\n` : '') +
      (script?.match(/\bs[.]/) ?
        `<span class="hljs-keyword">import</span> * <span class="hljs-keyword">as</span> s <span class="hljs-keyword">from</span> <span class="hljs-string">'./zapatos/schema'</span>;\n` : '') +
      (script?.match(/\bpool\b/) ?
        `<span class="hljs-keyword">import</span> { pool } <span class="hljs-keyword">from</span> <span class="hljs-string">'./pgPool'</span>;\n` : '') +
      '</code>'
    );

    runnableTag.className += ' runnable';
  });

  console.info(`Writing HTML ...`);
  fs.writeFileSync('./web/index.html', dom.serialize(), { encoding: 'utf8' });

  console.info('Dropping temporary DB...');
  execSync(`dropdb ${tmpdb}`);
})();

