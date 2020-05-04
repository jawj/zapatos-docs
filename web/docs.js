// animated heading

window.addEventListener('load', function () {
  Array.prototype.slice.call(document.querySelectorAll('h1 .extra-vowels')).forEach(function (vowel) {
    console.log(vowel);
    Object.assign(vowel.style, { top: '0px', opacity: 1 });
  });
});

// tocbot

tocbot.init({
  tocSelector: '#toc',
  contentSelector: '#content',
  headingSelector: 'h1, h2, h3, h4',
  includeHtml: true,
});

// SQL/result sections

var
  sqlstuff = Array.prototype.slice.call(document.getElementsByClassName('sqlstuff')),
  showMsg = '▸ Show generated SQL, results',
  hideMsg = '▾ Hide generated SQL, results';

sqlstuff.forEach(function (s) {
  s.style.display = 'none';
  s.insertAdjacentHTML('beforebegin', `<p><a class="sqltoggle" href="#">${showMsg}</a></p>`);
});

document.addEventListener('click', function (e) {
  var target = e.target;

  if (target.className === 'sqltoggle') {
    e.preventDefault();
    var sqlstuff = target.parentElement.nextElementSibling;

    if (sqlstuff.style.display === 'block') {
      sqlstuff.style.display = 'none';
      target.innerText = showMsg;

    } else {
      sqlstuff.style.display = 'block';
      target.innerText = hideMsg;
    }
  }
});

// TS sections / monaco

require.config({ paths: { 'vs': './monaco/vs' } });

var
  runnables = Array.prototype.slice.call(document.getElementsByClassName('runnable'));

runnables.forEach(function (runnable) {
  runnable.insertAdjacentHTML('afterbegin',
    '<a class="openmonaco" href="#" title="See this in embedded VS Code">Explore types »</a>');
});

document.body.insertAdjacentHTML('afterbegin',
  '<div id="monaco-overlay"><div id="ts-editor"></div><a id="closemonaco" href="#">×</a></div>');

document.addEventListener('click', function (e) {
  var target = e.target;

  if (target.className === 'openmonaco') {
    e.preventDefault();
    var
      codeElement = target.nextElementSibling,
      code = codeElement.innerText.trim();

    if (!window.monaco) require(['vs/editor/editor.main'], function () {
      var
        ts = monaco.languages.typescript,
        tsDefs = ts.typescriptDefaults;

      tsDefs.setCompilerOptions({
        strict: true,
        target: ts.ScriptTarget.ES2017,
      });
      for (var file in zapatosBundle) tsDefs.addExtraLib(zapatosBundle[file], `file:///${file}`);

      var
        editor = document.getElementById('ts-editor'),
        commonOpts = {
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontFamily: 'source-code-pro',
          fontSize: 15,
          theme: 'vs-dark',
          automaticLayout: true,  // resize with host <div>
        },
        uri = monaco.Uri.parse(`file:///main.ts`),
        model = monaco.editor.createModel('/* nothing */', 'typescript', uri),
        opts = Object.assign({ model: model }, commonOpts);

      window.activeMonacoEditor = monaco.editor.create(editor, opts);
      openMonaco(code);
    });
    else openMonaco(code);

  } else if (target.id === 'closemonaco') {
    e.preventDefault();

    var overlay = document.getElementById('monaco-overlay');
    overlay.style.display = 'none';
  }
});

function openMonaco(code) {
  var
    overlay = document.getElementById('monaco-overlay'),
    editor = window.activeMonacoEditor;

  if (!code.match(/^\s*import\b/m)) code =
    `import * as db from './zapatos/src';\nimport * as s from './zapatos/schema';\nimport { pool } from './pgPool';\n\n` + code;

  overlay.style.display = 'block';
  editor.setValue(code);
  editor.layout();
}
