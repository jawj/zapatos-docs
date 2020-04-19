// tocbot

tocbot.init({
  tocSelector: '#toc',
  contentSelector: '#content',
  headingSelector: 'h1, h2, h3, h4',
});


// monaco

require.config({ paths: { 'vs': './monaco/vs' } });
require(['vs/editor/editor.main'], function () {

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