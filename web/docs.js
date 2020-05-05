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
  showSQLMsg = '▸ Show generated SQL, results',
  hideSQLMsg = '▾ Hide generated SQL, results';

sqlstuff.forEach(function (s) {
  s.style.display = 'none';
  s.insertAdjacentHTML('beforebegin', '<p><a class="sqltoggle" href="#">' + showSQLMsg + '</a></p>');
});

document.addEventListener('click', function (e) {
  var target = e.target;

  if (target.className === 'sqltoggle') {
    e.preventDefault();
    var sqlstuff = target.parentElement.nextElementSibling;

    if (sqlstuff.style.display === 'block') {
      sqlstuff.style.display = 'none';
      target.innerText = showSQLMsg;

    } else {
      sqlstuff.style.display = 'block';
      target.innerText = hideSQLMsg;
    }
  }
});

// TS sections / monaco

require.config({ paths: { 'vs': './monaco/vs' } });

var
  runnables = Array.prototype.slice.call(document.getElementsByClassName('runnable'))
    .filter(r => !r.className.match(/\bnorun\b/)),
  showImportsMsg = '▸ Show imports',
  hideImportsMsg = '▾ Hide imports';

runnables.forEach(function (runnable) {
  runnable.insertAdjacentHTML('afterbegin',
    '<a class="openmonaco" href="#" title="See this in embedded VS Code">Explore types »</a>' +
    '<a class="toggleimports" href="#">' + showImportsMsg + '</a>');
});

document.body.insertAdjacentHTML('afterbegin',
  '<div id="monaco-overlay"><div id="ts-editor"></div><a id="closemonaco" href="#">×</a></div>');

document.addEventListener('click', function (e) {
  var target = e.target;

  if (target.className === 'openmonaco') {
    e.preventDefault();
    var
      importsElement = target.nextElementSibling.nextElementSibling,
      codeElement = target.nextElementSibling.nextElementSibling.nextElementSibling,
      code = importsElement.innerText.trim() + '\n\n' +
        '(async () => {  // no support for top-level await in Monaco 0.20, TS 3.7\n' +
        codeElement.innerText.trim().replace(/^/gm, '  ') +
        '\n})();';

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

    else openMonaco(code); // without waiting

  } else if (target.id === 'closemonaco') {
    e.preventDefault();

    var overlay = document.getElementById('monaco-overlay');
    overlay.style.display = 'none';

  } else if (target.className === 'toggleimports') {
    e.preventDefault();

    var importsDiv = target.parentElement.children[2];
    if (importsDiv.style.display === 'block') {
      importsDiv.style.display = 'none';
      target.innerText = showImportsMsg;

    } else {
      importsDiv.style.display = 'block';
      target.innerText = hideImportsMsg;
    }
  }
});

function openMonaco(code) {
  var
    overlay = document.getElementById('monaco-overlay'),
    editor = window.activeMonacoEditor;

  overlay.style.display = 'block';
  editor.setValue(code);
  editor.layout();
}

// wrap code nicely

var codes = Array.prototype.slice.call(document.querySelectorAll('pre code'));
codes.forEach(function (code) {
  var
    lines = code.innerHTML.trim().split('\n'),
    tagStack = [],

    // here, we're closing any open spans at the end of a line, and reopening them on the next line ...
    mangledLines = lines.map(function (line) {
      var
        re = /<[/]?span[^>]*>/g,
        openingSpans = tagStack.join('');
      while (m = re.exec(line)) {
        if (m[0] == '</span>') tagStack.pop();
        else tagStack.push(m[0]);
      }
      var closingSpans = '';
      for (var i = 0; i < tagStack.length; i++) closingSpans += '</span>';

      // ... so that we can then wrap the line in a new span that causes it to wrap with indent
      var wrapIndent = line.replace(/<[^<]+>/g, '').match(/^\s*/)[0].length + 4;

      return '<span class="line">' +
        '<span class="indent-line" style="padding-left: ' + wrapIndent + 'ch; text-indent: -' + wrapIndent + 'ch;">' +
        openingSpans + line + closingSpans +
        '</span></span>';
    });

  code.innerHTML = mangledLines.join('\n');
});
