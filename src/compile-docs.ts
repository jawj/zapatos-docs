
import * as fs from 'fs';
import * as path from 'path';
import * as z from 'zapatos/generate';
import MarkdownIt = require('markdown-it');
import { execSync } from 'child_process';
import hljs from 'highlight.js';
import { JSDOM } from 'jsdom';
import * as pgcs from 'pg-connection-string';

void (async () => {

  const
    tmpdb = `zapatos_docs_${new Date().toISOString().replace(/\D+/g, '')}`,
    dbURL = fs.readFileSync(path.join(__dirname, '..', 'pgURLTemplate'), { encoding: 'utf8' })
      .trim().replace('{{ZDBNAME}}', tmpdb),
    dbEnv = { ...process.env, ZDBURL: dbURL };

  console.info(`Creating temporary DB (${tmpdb}) ...`);

  const { host, port, user, password } = pgcs.parse(dbURL);
  if (password) throw new Error('No support for Postgres password auth');

  const connOpts =
    (host ? ` -h '${host}'` : '') +
    (port ? ` -p ${port}` : '') +
    (user ? ` -U '${user}'` : '');

  execSync(`createdb${connOpts} ${tmpdb}`);
  execSync(`psql${connOpts} ${tmpdb} < schema.sql`);


  console.info('Running Zapatos ...');

  const zapCfg: z.Config = {
    db: { connectionString: dbURL },
    outDir: "./build-src",
    schemas: {
      public: {
        include: "*",
        exclude: [
          "geography_columns",
          "geometry_columns",
          "raster_columns",
          "raster_overviews",
          "spatial_ref_sys"
        ]
      }
    },
    customJSONParsingForLargeNumbers: true,
  };
  await z.generate(zapCfg);


  console.info('Copying Monaco editor ...');

  execSync(`cp -r ./node_modules/monaco-editor/min/vs ./web/monaco`);


  console.info('Bundling Zapatos types for Monaco ...');

  const recurseNodes = (node: string): string[] =>
    fs.statSync(node).isFile() ? [node] :
      fs.readdirSync(node).reduce<string[]>((memo, n) =>
        memo.concat(recurseNodes(path.join(node, n))), []);

  const
    files = [
      ...recurseNodes('build-src/zapatos'),
      ...recurseNodes('node_modules/zapatos/dist'),
      ...recurseNodes('node_modules/@types/pg'),
      ...recurseNodes('node_modules/@types/luxon'),
      ...recurseNodes('node_modules/@types/big.js'),
    ].filter(f => f.match(/[.]d[.]ts$/)),
    all = files.reduce<{ [k: string]: string }>((memo, p) => {
      const localPath = p
        .replace(/^node_modules[/]zapatos[/]dist[/]/, 'node_modules/@types/zapatos/')
        .replace(/^build-src[/]zapatos[/]/, '');
      memo[localPath] = fs.readFileSync(p, { encoding: 'utf8' });
      console.log('- ' + localPath);
      return memo;
    }, {});

  Object.assign(all, {
    // pretend pg.Pool
    'pgPool.ts': `
      import * as pg from 'pg';
      export default new pg.Pool();`,
  });

  fs.writeFileSync('./web/zapatos-bundle.js', `const zapatosBundle = ${JSON.stringify(all)};`);


  console.info('Adding source code links ...');

  const
    rawSrc = fs.readFileSync('./src/index.md', { encoding: 'utf8' }),
    src = rawSrc.replace(/^=>\s*(\S+)\s*(.*)$/gm, (_dummy, srcFileName, targetLine) => {
      const
        srcPath = `../zapatos/src/db/${srcFileName}`,
        srcFile = fs.readFileSync(srcPath, { encoding: 'utf8' }),
        targetRegEx = new RegExp('^[\t ]*' + targetLine.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '[\t ]*$', 'm'),
        foundAtIndex = srcFile.match(targetRegEx)?.index;

      if (foundAtIndex === undefined) throw new Error(`"${targetLine}" not found in ${srcPath}`);
      const lineNo = srcFile.slice(0, foundAtIndex + 1).split('\n').length;

      return `<div style="height: 1px; clear: both;"></div><div class="src-link"><a href="https://github.com/jawj/zapatos/blob/master/src/db/${srcFileName}#L${lineNo}">Source code »</a></div>`;
    });


  console.info('Transforming Markdown and highlighting code blocks...');

  const
    md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str: string, langPlusOptions: string) => {
        const [lang, ...options] = langPlusOptions.split(':');
        if (lang && hljs.getLanguage(lang)) {
          try {
            return `<pre class="language-${lang}${options.map(o => ' ' + o)}"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
          } catch (err) {
            console.error('Highlighting error', err);
          }
        }
        return '';
      }
    }),
    htmlContent = md.render(src),
    html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8"> 
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <meta name="google-site-verification" content="tN1ANkxDkpFanVNXNfGs0pOFnDVAZH6tkBCRW2fkV8I">
        <!-- tocbot -->
        <script src="https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.11.1/tocbot.min.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.11.1/tocbot.css">
        <!-- highlighting -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.1/styles/xcode.min.css">
        <!-- monaco editor -->
        <script src="monaco/vs/loader.js"></script>
        <script src="zapatos-bundle.js"></script>
        <!-- fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,700;1,8..60,400;1,8..60,700&display=swap" rel="stylesheet">
        <!-- octocat -->
        <style>.github-corner:hover .octo-arm{animation:octocat-wave 560ms ease-in-out}@keyframes octocat-wave{0%,100%{transform:rotate(0)}20%,60%{transform:rotate(-25deg)}40%,80%{transform:rotate(10deg)}}@media (max-width:500px){.github-corner:hover .octo-arm{animation:none}.github-corner .octo-arm{animation:octocat-wave 560ms ease-in-out}}</style>
        <!-- custom -->
        <link rel="stylesheet" href="docs.css">
      </head>
      <body>
        <!-- http://tholman.com/github-corners/ -->
        <a href="https://github.com/jawj/zapatos" class="github-corner" aria-label="View source on GitHub"><svg width="80" height="80" viewBox="0 0 250 250" style="fill:#aaa; color:#fff; position: fixed; z-index: 150; top: 0; border: 0; right: 0;" aria-hidden="true"><path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path><path d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2" fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path><path d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z" fill="currentColor" class="octo-body"></path></svg></a>

        <div id="outer-toc">
          <div id="toc"></div>
          <div style="padding: 15px 20px;"><a href="https://github.com/jawj/zapatos">GitHub »</a></div>
        </div>
        <div id="content">${htmlContent}</div>
        <script src="docs.js"></script>
      </body>
    </html>
  `;

  const
    dom = new JSDOM(html),
    document = dom.window.document;


  console.info('Adding title ...');

  document.head.insertAdjacentHTML('beforeend', `<title>${document.querySelector('h1')!.textContent}</title>`);


  console.info('Adding id attributes to headings...');

  const
    maxIdLength = 64,
    content = document.querySelector('#content'),
    headings = content!.querySelectorAll('h1, h2, h3, h4, h5, h6'),
    headingMap: { [k: string]: number } = {};

  headings.forEach(heading => {
    let id = heading.id ? heading.id : heading.textContent!
      .trim().toLowerCase()
      .split(/\s+/).join('-')
      .replace(/[^-_a-z0-9]+/g, '');

    if (id.length > maxIdLength) id = id.substring(0, id.lastIndexOf('-', maxIdLength));
    headingMap[id] = headingMap[id] === undefined ? 0 : ++headingMap[id];
    if (headingMap[id]) id += '-' + headingMap[id];

    heading.id = id;
  });


  const links = Array.from(new Set(Array.from(content!.querySelectorAll('a'))));  // unique
  console.log(`Checking ${links.length} unique links ...`);

  for (const link of links) {
    const href = link.getAttribute('href');
    if (!href) continue;
    if (href.charAt(0) === '#') {
      if (!content!.querySelector(href)) console.error(` => No link target "${href}"`);
      continue;

    } else {
      const res = await fetch(href);
      if (res.status !== 200) console.error(`*** HTTP status ${res.status} for link target ${href} ***`);
    }
  }


  console.info('Collecting TypeScript scripts ..');

  const runnableTags = Array.from(content!.querySelectorAll('.language-typescript'))
    .filter(ts => !ts.className.match(/\bnorun\b/));

  runnableTags.forEach((runnableTag, i) => {
    const
      ts = runnableTag.textContent,
      instrumentedTs = `
        import * as xyz from 'zapatos/db';
        xyz.setConfig({
          queryListener: (x: any, txnId?: number) => {
            if (txnId != null) console.log('%%txnId%:' + txnId + '%%');
            console.log('%%text%:' + x.text + '%%');
            if (x.values.length) {
              console.log('%%values%:[' + x.values.map((v: any) => JSON.stringify(v)).join(', ') + ']%%');
            }
          },
          resultListener: (x: any, txnId?: number) => {
            if (${runnableTag.className.match(/\bshownull\b/) ? true : false} || (x != null && (${runnableTag.className.match(/\bshowempty\b/) ? true : false} || !(Array.isArray(x) && x.length === 0)))) {
              if (txnId != null) console.log('%%txnId%:' + txnId + '%%');
              console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');
            }
          },
          transactionListener: (x: any, txnId?: number) => {
            if (txnId != null) console.log('%%txnId%:' + txnId + '%%');
            console.log('%%transaction%:' + x + '%%');
          },
        });
        ${ts?.match(/^\s*import\b/m) ? ts : `
          import * as db from 'zapatos/db';
          import { conditions as dc } from 'zapatos/db';
          import type * as s from 'zapatos/schema';
          import pool from './pgPool.js';
        
          try {
          /* original script begins */
          ${ts}
          /* original script ends */
          } catch(e: any) {
            console.log(e.name + ': ' + e.message);
            console.error('  -> error: ' + e.message);
          }

          await pool.end();
          `
        }`;

    fs.writeFileSync(`./build-src/tsblock-${i}.ts`, instrumentedTs, { encoding: 'utf8' });
  });


  console.info('Compiling TypeScript script blocks ...');

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
    };

  runnableTags.forEach((runnableTag, i) => {
    console.info(`- Running script block ${i} ...`);

    const
      stdout = execSync(`node tsblock-${i}.js`,
        { cwd: './build-src', encoding: 'utf8', env: dbEnv }),
      parts = stdout.split(/%{2,}/);

    if (!runnableTag.className.match(/\bnoresult\b/)) {
      let output = '<div class="sqlstuff">\n';
      for (const part of parts) {
        const [type, str] = part.split('%:');

        if (type === 'text') {
          const
            fmtSql = formatSQL(str),
            highlightSql = hljs.highlight(fmtSql, { language: 'sql' }).value.trim();
          output += `<pre class="sqltext"><code>${highlightSql}</code></pre>\n`;

        } else if (type === 'values') {
          const highlightValues = hljs.highlight(str, { language: 'json' }).value;
          output += `<pre class="sqlvalues"><code>${highlightValues}</code></pre>\n`;

        } else if (type === 'result') {
          const highlightResult = hljs.highlight(str, { language: 'json' }).value;
          output += `<pre class="sqlresult"><code>${highlightResult}</code></pre>\n`;

        } else if (type === 'transaction') {
          output += `<pre class="transactionlog"><code>${str}</code></pre>\n`;

        } else if (type === 'txnId') {
          output += `<pre class="transactionid"><code>Transaction ${str}</code></pre>\n`;

        } else {  // console output
          const logs = type.trim();
          if (logs) output += `<pre class="console"><code>${logs}</code></pre>\n`;
        }
      }
      output += '</div>';
      runnableTag.insertAdjacentHTML('afterend', output);
    }

    const script = runnableTag.textContent;
    if (!script?.match(/^\s*import\b/m)) runnableTag.insertAdjacentHTML('afterbegin', '<code class="imports">' +
      (script?.match(/\bdb[.]/) ?
        `<span class="hljs-keyword">import</span> * <span class="hljs-keyword">as</span> db <span class="hljs-keyword">from</span> <span class="hljs-string">'zapatos/db'</span>;\n` : '') +
      (script?.match(/\bdc[.]/) ?
        `<span class="hljs-keyword">import</span> { conditions <span class="hljs-keyword">as</span> dc } <span class="hljs-keyword">from</span> <span class="hljs-string">'zapatos/db'</span>;\n` : '') +
      (script?.match(/\bs[.]/) ?
        `<span class="hljs-keyword">import type</span> * <span class="hljs-keyword">as</span> s <span class="hljs-keyword">from</span> <span class="hljs-string">'zapatos/schema'</span>;\n` : '') +
      (script?.match(/\bpool\b/) ?
        `<span class="hljs-keyword">import</span> pool <span class="hljs-keyword">from</span> <span class="hljs-string">'./pgPool'</span>;\n` : '') +
      '</code>'
    );

    runnableTag.className += ' runnable';
  });


  console.info(`Wrapping code for nicely indented line breaks ...`);

  Array.from(content!.querySelectorAll('pre code')).forEach(function (code) {
    const
      lines = code.innerHTML.trim().split('\n'),
      tagStack: string[] = [],

      // here, we're closing any open spans at the end of a line, and reopening them on the next line ...
      mangledLines = lines.map(function (line) {
        const
          re = /<[/]?span[^>]*>/g,
          openingSpans = tagStack.join('');

        let m;
        while (m = re.exec(line)) {
          if (m[0] == '</span>') tagStack.pop();
          else tagStack.push(m[0]);
        }
        let closingSpans = '';
        for (var i = 0; i < tagStack.length; i++) closingSpans += '</span>';

        // ... so that we can then wrap the line in a new span that causes it to wrap with indent
        const wrapIndent = line.replace(/<[^<]+>/g, '').match(/^\s*/)![0].length + 4;

        return '<span class="indent-line" style="padding-left: ' + wrapIndent + 'ch; text-indent: -' + wrapIndent + 'ch;">' +
          openingSpans + line + closingSpans +
          '</span>';
      });

    code.innerHTML = mangledLines.join('\n');
  });


  console.info(`Writing HTML ...`);

  fs.writeFileSync('./web/index.html', dom.serialize(), { encoding: 'utf8' });


  console.info('Dropping temporary DB...');

  execSync(`dropdb${connOpts} ${tmpdb}`);


  console.info('Done.');
})();

