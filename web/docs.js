// tocbot

tocbot.init({
  tocSelector: '#toc',
  contentSelector: '#content',
  headingSelector: 'h1, h2, h3, h4',
});

// SQL/result sections

var
  sqlstuff = document.getElementsByClassName('sqlstuff'),
  showMsg = '▸ Show SQL, results',
  hideMsg = '▾ Hide SQL, results';

Array.prototype.slice.call(sqlstuff).forEach(function (s) {
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

// monaco

require.config({ paths: { 'vs': './monaco/vs' } });
require(['vs/editor/editor.main'], function () {
  return;
  var
    ts = monaco.languages.typescript,
    tsDefs = ts.typescriptDefaults;

  tsDefs.setCompilerOptions({
    strict: true,
    target: ts.ScriptTarget.ES2017,
  });
  for (var file in zapatosBundle) tsDefs.addExtraLib(zapatosBundle[file], `file:///${file}`);

  const
    commonOpts = {
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      scrollbar: {
        vertical: 'hidden',
        horizontal: 'hidden',
      },
      fontFamily: 'source-code-pro',
      fontSize: 15,
      lineNumbers: 'off',
    },
    runnables = document.getElementsByClassName('runnable');

  let i = 1;
  for (var runnable of runnables) {
    var
      uri = monaco.Uri.parse(`file:///main.${i++}.ts`),
      js = runnable.innerText.trim(),
      model = monaco.editor.createModel(js, 'typescript', uri),
      opts = { model, ...commonOpts };

    runnable.innerText = '';
    runnable.style.height = String(js.split('\n').length * 24) + 'px';
    monaco.editor.create(runnable, opts);
  }
});