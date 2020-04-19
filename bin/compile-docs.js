"use strict";
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
var MarkdownIt = require("markdown-it");
var child_process_1 = require("child_process");
var hljs = require("highlight.js");
var jsdom_1 = require("jsdom");
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var recurseNodes, all, md, src, htmlContent, html, dom, document, maxIdLength, content, headings, headingMap, runnableTags, pgFmtArgs, formatSQL;
    return __generator(this, function (_a) {
        // --- Monaco editor and Zapatos file bundle for it ---
        console.info('Copying Monaco editor ...');
        child_process_1.execSync("cp -r ./node_modules/monaco-editor/min ./web/monaco");
        console.info('Bundling zapatos source for Monaco ...');
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
            'pg.ts': "\n      export interface Pool {}\n      export interface PoolClient {}\n      export interface QueryResult {\n        rows: any;\n      }",
            // pretend pg.Pool
            'pgPool.ts': "\n      import * as pg from 'pg';\n      export let pool: pg.Pool;",
            // workaround for Monaco Editor not finding index.ts inside folders:
            'zapatos/src.ts': "\n      export * from './src/index';",
        });
        fs.writeFileSync('./web/zapatos-bundle.js', "const zapatosBundle = " + JSON.stringify(all) + ";");
        // --- transform and highlight Markdown ---
        console.info('Transforming Markdown ...');
        md = new MarkdownIt({
            html: true,
            linkify: true,
            typographer: true,
            highlight: function (str, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return "<pre class=\"language-" + lang + "\"><code>" + hljs.highlight(lang, str).value + "</code></pre>";
                    }
                    catch (err) {
                        console.log('Highlighting error', err);
                    }
                }
                return '';
            }
        }), src = fs.readFileSync('./src/index.md', { encoding: 'utf8' }), htmlContent = md.render(src), html = "<!DOCTYPE html>\n    <html>\n      <head>\n        <!-- tocbot -->\n        <script src=\"https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.11.1/tocbot.min.js\"></script>\n        <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/tocbot/4.11.1/tocbot.css\">\n        <!-- highlighting -->\n        <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.18.1/styles/default.min.css\">\n        <!-- monaco editor -->\n        <script src=\"monaco/vs/loader.js\"></script>\n        <script src=\"zapatos-bundle.js\"></script>\n        <!-- custom -->\n        <link rel=\"stylesheet\" href=\"https://use.typekit.net/mdb7zvi.css\">\n        <link rel=\"stylesheet\" href=\"docs.css\">\n      </head>\n      <body>\n        <div id=\"toc\"></div>\n        <div id=\"content\">" + htmlContent + "</div>\n        <script src=\"docs.js\"></script>\n      </body>\n    </html>\n  ";
        dom = new jsdom_1.JSDOM(html), document = dom.window.document;
        console.info('Adding id attributes to headings...');
        maxIdLength = 32, content = document.querySelector('#content'), headings = content.querySelectorAll('h1, h2, h3, h4'), headingMap = {};
        headings.forEach(function (heading, i) {
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
        console.info('Collecting TypeScript scripts ..');
        runnableTags = Array.from(content.querySelectorAll('.language-typescript'))
            .filter(function (ts) { var _a; return (_a = ts.textContent) === null || _a === void 0 ? void 0 : _a.match(/^\s*import\b/m); });
        runnableTags.forEach(function (runnableTag, i) {
            var ts = runnableTag.textContent, instrumentedTs = "\n        import * as xyz from './zapatos/src';\n        xyz.setConfig({\n          queryListener: (x: any) => {\n            console.log('<<<text>>>' + x.text + ';');\n            if (x.values.length) console.log('<<<values>>>' + JSON.stringify(x.values, null, 2));\n          },\n          resultListener: (x: any) => {\n            console.log('<<<result>>>' + JSON.stringify(x, null, 2));\n          }\n        });\n        /* original script begins */\n\n        " + ts + "\n\n        /* original script ends */\n        pool.end();\n      ";
            fs.writeFileSync("./build-src/tsblock-" + i + ".ts", instrumentedTs, { encoding: 'utf8' });
        });
        console.info('Compiling TypeScript script blocks ..');
        try {
            child_process_1.execSync('tsc', { cwd: './build-src', encoding: 'utf8' });
        }
        catch (err) {
            console.error(err);
        }
        pgFmtArgs = '--spaces 2 --wrap-after 30 --format text --keyword-case 0 --type-case 0', formatSQL = function (sql) {
            return child_process_1.execSync("perl ./lib/pgFormatter/pg_format " + pgFmtArgs, {
                encoding: 'utf8',
                input: sql,
            });
        };
        runnableTags.forEach(function (runnableTag, i) {
            console.info("Running script block " + i + " ..");
            var stdout = child_process_1.execSync("node --harmony-top-level-await --experimental-specifier-resolution=node tsblock-" + i + ".js", { cwd: './build-src', encoding: 'utf8' }), parts = stdout.split('<<<');
            var output = '<div class="sqlstuff">\n';
            for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                var part = parts_1[_i];
                var _a = part.split('>>>'), type = _a[0], str = _a[1];
                if (type === 'text') {
                    var fmtSql = formatSQL(str), highlightSql = hljs.highlight('sql', fmtSql).value.trim().replace(/\n/g, '<br>');
                    output += "<pre class=\"sqltext\"><code>" + highlightSql + "</code></pre>\n";
                }
                else if (type === 'values') {
                    var highlightValues = hljs.highlight('json', str).value.replace(/\n/g, '<br>');
                    output += "<pre class=\"sqlvalues\"><code>" + highlightValues + "</code></pre>\n";
                }
                else if (type === 'result') {
                    var highlightResult = hljs.highlight('json', str).value.replace(/\n/g, '<br>');
                    output += "<pre class=\"sqlresult\"><code>" + highlightResult + "</code></pre>\n";
                }
            }
            output += '</div>';
            runnableTag.className += ' runnable';
            runnableTag.insertAdjacentHTML('afterend', output);
        });
        fs.writeFileSync('./web/index.html', dom.serialize(), { encoding: 'utf8' });
        return [2 /*return*/];
    });
}); })();
