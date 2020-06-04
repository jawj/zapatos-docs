"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var generate_1 = require("zapatos/dist/generate");
var MarkdownIt = require("markdown-it");
var child_process_1 = require("child_process");
var hljs = require("highlight.js");
var jsdom_1 = require("jsdom");
void (function () { return __awaiter(void 0, void 0, void 0, function () {
    var tmpdb, dbEnv, zapCfg, recurseNodes, all, rawSrc, src, md, htmlContent, html, dom, document, maxIdLength, content, headings, headingMap, links, runnableTags, pgFmtArgs, formatSQL;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                tmpdb = "zapatos_docs_" + new Date().toISOString().replace(/\D+/g, '');
                dbEnv = __assign(__assign({}, process.env), { ZDBNAME: tmpdb });
                console.info("Creating temporary DB (" + tmpdb + ") ...");
                child_process_1.execSync("createdb " + tmpdb);
                child_process_1.execSync("psql " + tmpdb + " < schema.sql");
                console.info('Running Zapatos ...');
                zapCfg = {
                    "db": { "connectionString": "postgresql://localhost/" + tmpdb },
                    "srcMode": "copy",
                    "outDir": "./build-src",
                    "schemas": {
                        "public": {
                            "include": "*",
                            "exclude": [
                                "geography_columns",
                                "geometry_columns",
                                "raster_columns",
                                "raster_overviews",
                                "spatial_ref_sys"
                            ]
                        }
                    }
                };
                return [4 /*yield*/, generate_1.generate(zapCfg)];
            case 1:
                _a.sent();
                console.info('Copying Monaco editor ...');
                child_process_1.execSync("cp -r ./node_modules/monaco-editor/min ./web/monaco");
                console.info('Bundling Zapatos source for Monaco ...');
                recurseNodes = function (node) {
                    return fs.statSync(node).isFile() ? [node] :
                        fs.readdirSync(node).reduce(function (memo, n) {
                            return memo.concat(recurseNodes(path.join(node, n)));
                        }, []);
                };
                all = recurseNodes('./build-src/zapatos').reduce(function (memo, p) {
                    var localPath = p.replace(/^build-src[/]/, '');
                    memo[localPath] = fs.readFileSync(p, { encoding: 'utf8' });
                    return memo;
                }, {});
                Object.assign(all, {
                    // stubs for key pg types
                    'pg.ts': "\n      export class Pool {}\n      export class PoolClient {}\n      export class QueryResult {\n        rows: any;\n      }",
                    // pretend pg.Pool
                    'pgPool.ts': "\n      import * as pg from 'pg';\n      export default new pg.Pool();",
                    // workaround for Monaco Editor not finding index.ts inside folders:
                    'zapatos/src.ts': "\n      export * from './src/index';",
                });
                fs.writeFileSync('./web/zapatos-bundle.js', "const zapatosBundle = " + JSON.stringify(all) + ";");
                console.info('Adding source code links ...');
                rawSrc = fs.readFileSync('./src/index.md', { encoding: 'utf8' }), src = rawSrc.replace(/^=>\s*(\S+)\s*(.*)$/gm, function (_dummy, srcFileName, targetLine) {
                    var _a;
                    var srcPath = "./build-src/zapatos/src/" + srcFileName, srcFile = fs.readFileSync(srcPath, { encoding: 'utf8' }), targetRegEx = new RegExp('^[\t ]*' + targetLine.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '[\t ]*$', 'm'), foundAtIndex = (_a = srcFile.match(targetRegEx)) === null || _a === void 0 ? void 0 : _a.index;
                    if (foundAtIndex === undefined)
                        throw new Error("\"" + targetLine + "\" not found in " + srcPath);
                    var lineNo = srcFile.slice(0, foundAtIndex + 1).split('\n').length;
                    return "<div style=\"height: 1px; clear: both;\"></div><div class=\"src-link\"><a href=\"https://github.com/jawj/zapatos/blob/master/src/" + srcFileName + "#L" + lineNo + "\">Source code \u00BB</a></div>";
                });
                console.info('Transforming Markdown and highlighting code blocks...');
                md = new MarkdownIt({
                    html: true,
                    linkify: true,
                    typographer: true,
                    highlight: function (str, langPlusOptions) {
                        var _a = langPlusOptions.split(':'), lang = _a[0], options = _a.slice(1);
                        if (lang && hljs.getLanguage(lang)) {
                            try {
                                return "<pre class=\"language-" + lang + options.map(function (o) { return ' ' + o; }) + "\"><code>" + hljs.highlight(lang, str).value + "</code></pre>";
                            }
                            catch (err) {
                                console.error('Highlighting error', err);
                            }
                        }
                        return '';
                    }
                }), htmlContent = md.render(src), html = "<!DOCTYPE html>\n    <html lang=\"en\">\n      <head>\n        <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n        <meta name=\"google-site-verification\" content=\"tN1ANkxDkpFanVNXNfGs0pOFnDVAZH6tkBCRW2fkV8I\" />\n        <!-- tocbot -->\n        <script src=\"https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.11.1/tocbot.min.js\"></script>\n        <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.11.1/tocbot.css\">\n        <!-- highlighting -->\n        <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.1/styles/xcode.min.css\">\n        <!-- monaco editor -->\n        <script src=\"monaco/vs/loader.js\"></script>\n        <script src=\"zapatos-bundle.js\"></script>\n        <!-- fonts -->\n        <link rel=\"stylesheet\" href=\"https://use.typekit.net/mdb7zvi.css\">\n        <!-- octocat -->\n        <style>.github-corner:hover .octo-arm{animation:octocat-wave 560ms ease-in-out}@keyframes octocat-wave{0%,100%{transform:rotate(0)}20%,60%{transform:rotate(-25deg)}40%,80%{transform:rotate(10deg)}}@media (max-width:500px){.github-corner:hover .octo-arm{animation:none}.github-corner .octo-arm{animation:octocat-wave 560ms ease-in-out}}</style>\n        <!-- custom -->\n        <link rel=\"stylesheet\" href=\"docs.css\">\n      </head>\n      <body>\n        <!-- http://tholman.com/github-corners/ -->\n        <a href=\"https://github.com/jawj/zapatos\" class=\"github-corner\" aria-label=\"View source on GitHub\"><svg width=\"80\" height=\"80\" viewBox=\"0 0 250 250\" style=\"fill:#aaa; color:#fff; position: fixed; z-index: 150; top: 0; border: 0; right: 0;\" aria-hidden=\"true\"><path d=\"M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z\"></path><path d=\"M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2\" fill=\"currentColor\" style=\"transform-origin: 130px 106px;\" class=\"octo-arm\"></path><path d=\"M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z\" fill=\"currentColor\" class=\"octo-body\"></path></svg></a>\n\n        <div id=\"outer-toc\">\n          <div id=\"toc\"></div>\n          <div style=\"padding: 15px 20px;\"><a href=\"https://github.com/jawj/zapatos\">GitHub \u00BB</a></div>\n        </div>\n        <div id=\"content\">" + htmlContent + "</div>\n        <script src=\"docs.js\"></script>\n      </body>\n    </html>\n  ";
                dom = new jsdom_1.JSDOM(html), document = dom.window.document;
                console.info('Adding title ...');
                document.head.insertAdjacentHTML('beforeend', "<title>" + document.querySelector('h1').textContent + "</title>");
                console.info('Adding id attributes to headings...');
                maxIdLength = 64, content = document.querySelector('#content'), headings = content.querySelectorAll('h1, h2, h3, h4, h5'), headingMap = {};
                headings.forEach(function (heading) {
                    var id = heading.id ? heading.id : heading.textContent
                        .trim().toLowerCase()
                        .split(/\s+/).join('-')
                        .replace(/[^-_a-z0-9]+/g, '');
                    if (id.length > maxIdLength)
                        id = id.substring(0, id.lastIndexOf('-', maxIdLength));
                    headingMap[id] = headingMap[id] === undefined ? 0 : ++headingMap[id];
                    if (headingMap[id])
                        id += '-' + headingMap[id];
                    heading.id = id;
                });
                console.log('Checking internal links ...');
                links = content.querySelectorAll('a');
                links.forEach(function (link) {
                    var href = link.getAttribute('href');
                    if ((href === null || href === void 0 ? void 0 : href.charAt(0)) !== '#')
                        return;
                    if (!(content === null || content === void 0 ? void 0 : content.querySelector(href)))
                        console.error(" => No link target \"" + href + "\"");
                });
                console.info('Collecting TypeScript scripts ..');
                runnableTags = Array.from(content.querySelectorAll('.language-typescript'))
                    .filter(function (ts) { return !ts.className.match(/\bnorun\b/); });
                runnableTags.forEach(function (runnableTag, i) {
                    var ts = runnableTag.textContent, instrumentedTs = "\n        import * as xyz from './zapatos/src';\n        xyz.setConfig({\n          queryListener: (x: any) => {\n            console.log('%%text%:' + x.text + '%%');\n            if (x.values.length) {\n              console.log('%%values%:[' + x.values.map((v: any) => JSON.stringify(v)).join(', ') + ']%%');\n            }\n          },\n          resultListener: (x: any) => {\n            if (x != null && !(Array.isArray(x) && x.length === 0)) {\n              console.log('%%result%:' + JSON.stringify(x, null, 2) + '%%');\n            }\n          },\n          transactionListener: (x: any) => {\n            console.log('%%transaction%:' + x + '%%');\n          },\n        });\n        " + ((ts === null || ts === void 0 ? void 0 : ts.match(/^\s*import\b/m)) ? '' : "\n          import * as db from './zapatos/src';\n          import * as s from './zapatos/schema';\n          import pool from './pgPool';\n        ") + "\n\n        try {\n        /* original script begins */\n        " + ts + "\n        /* original script ends */\n        } catch(e) {\n          console.log('error: ' + e.message);\n          console.error('  -> error: ' + e.message);\n        }\n\n        await pool.end();\n      ";
                    fs.writeFileSync("./build-src/tsblock-" + i + ".ts", instrumentedTs, { encoding: 'utf8' });
                });
                console.info('Compiling TypeScript script blocks ..');
                try {
                    child_process_1.execSync('tsc', { cwd: './build-src', encoding: 'utf8' });
                }
                catch (err) {
                    console.error(err);
                    process.exit(1);
                }
                pgFmtArgs = '--spaces 2 --wrap-after 30 --format text --keyword-case 0 --type-case 0', formatSQL = function (sql) {
                    try {
                        return child_process_1.execSync("perl ./lib/pgFormatter/pg_format " + pgFmtArgs, {
                            encoding: 'utf8',
                            input: sql,
                        });
                    }
                    catch (err) { // https://github.com/darold/pgFormatter/issues/183
                        return sql.trim();
                    }
                };
                runnableTags.forEach(function (runnableTag, i) {
                    console.info("- Running script block " + i + " ...");
                    var stdout = child_process_1.execSync("node --harmony-top-level-await --experimental-specifier-resolution=node tsblock-" + i + ".js", { cwd: './build-src', encoding: 'utf8', env: dbEnv }), parts = stdout.split(/%{2,}/);
                    if (!runnableTag.className.match(/\bnoresult\b/)) {
                        var output = '<div class="sqlstuff">\n';
                        for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                            var part = parts_1[_i];
                            var _a = part.split('%:'), type = _a[0], str = _a[1];
                            if (type === 'text') {
                                var fmtSql = formatSQL(str), highlightSql = hljs.highlight('sql', fmtSql).value.trim();
                                output += "<pre class=\"sqltext\"><code>" + highlightSql + "</code></pre>\n";
                            }
                            else if (type === 'values') {
                                var highlightValues = hljs.highlight('json', str).value;
                                output += "<pre class=\"sqlvalues\"><code>" + highlightValues + "</code></pre>\n";
                            }
                            else if (type === 'result') {
                                var highlightResult = hljs.highlight('json', str).value;
                                output += "<pre class=\"sqlresult\"><code>" + highlightResult + "</code></pre>\n";
                            }
                            else if (type === 'transaction') {
                                output += "<pre class=\"transactionlog\"><code>" + str + "</code></pre>\n";
                            }
                            else { // console output
                                var logs = type.trim();
                                if (logs)
                                    output += "<pre class=\"console\"><code>" + logs + "</code></pre>\n";
                            }
                        }
                        output += '</div>';
                        runnableTag.insertAdjacentHTML('afterend', output);
                    }
                    var script = runnableTag.textContent;
                    runnableTag.insertAdjacentHTML('afterbegin', '<code class="imports">' +
                        ((script === null || script === void 0 ? void 0 : script.match(/\bdb[.]/)) ?
                            "<span class=\"hljs-keyword\">import</span> * <span class=\"hljs-keyword\">as</span> db <span class=\"hljs-keyword\">from</span> <span class=\"hljs-string\">'./zapatos/src'</span>;\n" : '') +
                        ((script === null || script === void 0 ? void 0 : script.match(/\bs[.]/)) ?
                            "<span class=\"hljs-keyword\">import</span> * <span class=\"hljs-keyword\">as</span> s <span class=\"hljs-keyword\">from</span> <span class=\"hljs-string\">'./zapatos/schema'</span>;\n" : '') +
                        ((script === null || script === void 0 ? void 0 : script.match(/\bpool\b/)) ?
                            "<span class=\"hljs-keyword\">import</span> pool <span class=\"hljs-keyword\">from</span> <span class=\"hljs-string\">'./pgPool'</span>;\n" : '') +
                        '</code>');
                    runnableTag.className += ' runnable';
                });
                console.info("Wrapping code for nicely indented line breaks ...");
                Array.from(content.querySelectorAll('pre code')).forEach(function (code) {
                    var lines = code.innerHTML.trim().split('\n'), tagStack = [], 
                    // here, we're closing any open spans at the end of a line, and reopening them on the next line ...
                    mangledLines = lines.map(function (line) {
                        var re = /<[/]?span[^>]*>/g, openingSpans = tagStack.join('');
                        var m;
                        while (m = re.exec(line)) {
                            if (m[0] == '</span>')
                                tagStack.pop();
                            else
                                tagStack.push(m[0]);
                        }
                        var closingSpans = '';
                        for (var i = 0; i < tagStack.length; i++)
                            closingSpans += '</span>';
                        // ... so that we can then wrap the line in a new span that causes it to wrap with indent
                        var wrapIndent = line.replace(/<[^<]+>/g, '').match(/^\s*/)[0].length + 4;
                        return '<span class="indent-line" style="padding-left: ' + wrapIndent + 'ch; text-indent: -' + wrapIndent + 'ch;">' +
                            openingSpans + line + closingSpans +
                            '</span>';
                    });
                    code.innerHTML = mangledLines.join('\n');
                });
                console.info("Writing HTML ...");
                fs.writeFileSync('./web/index.html', dom.serialize(), { encoding: 'utf8' });
                console.info('Dropping temporary DB...');
                child_process_1.execSync("dropdb " + tmpdb);
                return [2 /*return*/];
        }
    });
}); })();
