#!/usr/bin/env node
// ============================================================
// Caetano Imóveis - Build Script
// Concatena CSS, injeta header/footer nos HTMLs, minifica.
// Uso:
//   node build.js              → build normal
//   node build.js --minify     → build com minificação
//   node build.js --watch      → rebuild automático ao salvar
// ============================================================

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = ROOT;
const DIST = path.join(ROOT, 'dist');
const MINIFY = process.argv.includes('--minify');
const WATCH = process.argv.includes('--watch');

function log(msg) { console.log(`\x1b[36m[build]\x1b[0m ${msg}`); }
function warn(msg) { console.log(`\x1b[33m[build]\x1b[0m ${msg}`); }
function err(msg) { console.error(`\x1b[31m[build]\x1b[0m ${msg}`); }

// ============ UTILS ============

function read(rel) {
  return fs.readFileSync(path.join(SRC, rel), 'utf8');
}

function writeRel(rel, content) {
  const dest = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
}

function writeDist(rel, content) {
  const dest = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
}

// ============ CSS ============

function buildCSS() {
  log('Concatenando CSS...');
  const parts = [
    'css/base.css',
    'css/components.css',
    'css/responsive.css'
  ];
  let css = '';
  for (const p of parts) {
    try {
      css += `/* === ${p} === */\n` + read(p) + '\n\n';
    } catch (e) {
      warn(`Arquivo CSS não encontrado: ${p} (pulando)`);
    }
  }

  // Fallback: se os módulos não existem, usa o style.css original
  if (!css.trim()) {
    warn('Módulos CSS não encontrados, usando css/style.css como fallback');
    css = read('css/style.css');
  }

  writeDist('css/style.css', css);
  log(`CSS → dist/css/style.css (${(Buffer.byteLength(css) / 1024).toFixed(1)} KB)`);

  if (MINIFY) {
    try {
      const CleanCSS = require('clean-css-cli');
      const min = new CleanCSS({ level: 2 }).minify(css);
      writeDist('css/style.min.css', min.styles);
      log(`CSS minificado → dist/css/style.min.css (${(Buffer.byteLength(min.styles) / 1024).toFixed(1)} KB)`);
    } catch (e) {
      warn('clean-css-cli não disponível, pulando minificação de CSS');
    }
  }
}

// ============ JS ============

async function buildJS() {
  log('Verificando JS...');
  const jsFiles = [
    'config.js', 'favoritos.js', 'imoveis.js', 'imoveis-api.js',
    'cards.js', 'lightbox.js', 'header.js', 'header-templates.js',
    'footer-templates.js', 'main.js', 'detalhe.js', 'admin.js'
  ];
  for (const f of jsFiles) {
    try {
      const content = read('js/' + f);
      writeDist('js/' + f, content);
    } catch (e) {
      warn(`Arquivo JS não encontrado: js/${f}`);
    }
  }
  log('JS copiado para dist/');

  // Copia fotos-migradas.json
  try {
    const json = read('js/fotos-migradas.json');
    writeDist('js/fotos-migradas.json', json);
    log('fotos-migradas.json copiado');
  } catch (e) { /* ok */ }

  if (MINIFY) {
    try {
      const terser = require('terser');
      log('Minificando JS...');
      // Não minifica imoveis.js (dados) nem config.js (precisa ser editável)
      const skipMin = ['imoveis.js', 'config.js', 'fotos-migradas.json'];
      for (const f of jsFiles) {
        if (skipMin.includes(f)) continue;
        try {
          const code = read('js/' + f);
          const result = await terser.minify(code, { compress: { drop_console: false } });
          if (result.code) writeDist('js/' + f.replace('.js', '.min.js'), result.code);
        } catch (e) { /* skip individual files */ }
      }
      log('JS minificado');
    } catch (e) {
      warn('terser não disponível, pulando minificação de JS');
    }
  }
}

// ============ HTML ============

function buildHTML() {
  log('Gerando HTMLs...');

  function evalTemplate(file, exportName, page) {
    const code = read(file);
    const fakeWindow = {};
    const fn = new Function('window', code);
    fn(fakeWindow);
    if (!fakeWindow[exportName]) {
      warn(`Export '${exportName}' não encontrado em ${file}`);
      return '';
    }
    return fakeWindow[exportName].html(page);
  }

  const templates = {
    index: {
      header: evalTemplate('js/header-templates.js', 'HeaderTemplates', 'index'),
      footer: evalTemplate('js/footer-templates.js', 'FooterTemplates', 'index')
    },
    imovel: {
      header: evalTemplate('js/header-templates.js', 'HeaderTemplates', 'imovel'),
      footer: evalTemplate('js/footer-templates.js', 'FooterTemplates', 'imovel')
    }
  };

  function injectHeader(html, page) {
    const tpl = templates[page];
    return html.replace('<!--HEADER_TEMPLATE-->', (tpl && tpl.header) || '<!-- Header template não encontrado -->');
  }
  function injectFooter(html, page) {
    const tpl = templates[page];
    return html.replace('<!--FOOTER_TEMPLATE-->', (tpl && tpl.footer) || '<!-- Footer template não encontrado -->');
  }

  // --- INDEX.HTML ---
  let index = read('index.html');
  index = injectHeader(index, 'index');
  index = injectFooter(index, 'index');
  writeDist('index.html', index);
  log('  → dist/index.html');

  // --- IMOVEL.HTML ---
  let imovel = read('imovel.html');
  imovel = injectHeader(imovel, 'imovel');
  imovel = injectFooter(imovel, 'imovel');
  writeDist('imovel.html', imovel);
  log('  → dist/imovel.html');

  // --- ADMIN.HTML ---
  let admin = read('admin.html');
  writeDist('admin.html', admin);
  log('  → dist/admin.html');

  if (MINIFY) {
    try {
      const minify = require('html-minifier-terser').minify;
      for (const f of ['index.html', 'imovel.html', 'admin.html']) {
        const html = read(path.join('dist', f));
        const result = minify(html, {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true
        });
        writeDist(f, result);
      }
      log('HTML minificado');
    } catch (e) {
      warn('html-minifier-terser não disponível, pulando minificação de HTML');
    }
  }
}

// ============ ESTATICO ============

function copyStatic() {
  log('Copiando arquivos estáticos...');

  // Imagens (favicon)
  const imgDir = path.join(SRC, 'images');
  if (fs.existsSync(imgDir)) {
    copyDirRecursive('images', 'images');
  }

  // Videos placeholder
  const vidDir = path.join(SRC, 'videos');
  if (fs.existsSync(vidDir)) {
    copyDirRecursive('videos', 'videos');
  }

  log('Arquivos estáticos copiados');
}

function copyDirRecursive(srcRel, destRel) {
  const srcPath = path.join(SRC, srcRel);
  const destPath = path.join(DIST, destRel);
  if (!fs.existsSync(srcPath)) return;
  fs.mkdirSync(destPath, { recursive: true });
  for (const entry of fs.readdirSync(srcPath, { withFileTypes: true })) {
    const srcEntry = path.join(srcPath, entry.name);
    const destEntry = path.join(destPath, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(path.join(srcRel, entry.name), path.join(destRel, entry.name));
    } else {
      fs.copyFileSync(srcEntry, destEntry);
    }
  }
}

// ============ BUILD ============

async function build() {
  const start = Date.now();
  log('Iniciando build...');

  // Limpa dist
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }

  buildCSS();
  await buildJS();
  buildHTML();
  copyStatic();

  const elapsed = Date.now() - start;
  log(`Build concluído em ${elapsed}ms${MINIFY ? ' (minificado)' : ''}`);
}

// ============ WATCH ============

function watch() {
  log('Watching... (Ctrl+C para parar)');
  let timeout;
  const rebuild = () => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      try { await build(); } catch (e) { err(e.message); }
    }, 200);
  };

  const watchDirs = ['css', 'js', 'sql', 'images', 'videos'];
  for (const dir of watchDirs) {
    const full = path.join(SRC, dir);
    if (fs.existsSync(full)) {
      fs.watch(full, { recursive: true }, rebuild);
    }
  }
  fs.watch(path.join(SRC, 'index.html'), rebuild);
  fs.watch(path.join(SRC, 'imovel.html'), rebuild);
  fs.watch(path.join(SRC, 'admin.html'), rebuild);
  fs.watch(path.join(SRC, 'build.js'), rebuild);

  build();
}

// ============ MAIN ============

if (WATCH) {
  watch();
} else {
  build().catch(e => { err(e.message); process.exit(1); });
}
