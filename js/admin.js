(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const TIPOS = {
    Residencial: ["Apartamento", "Casa", "Casa em Condomínio", "Cobertura", "Kitnet", "Sobrado"],
    Comercial: ["Galpão", "Loja", "Ponto Comercial", "Prédio", "Sala"],
    Rural: ["Chácara", "Fazenda", "Rancho", "Sítio"],
    Terreno: ["Área", "Lote", "Terreno"]
  };

  const estado = {
    session: null,
    imoveis: [],
    editando: null,   // objeto em edição (null = novo)
    editId: null,     // id que será usado (novo = próximo id)
    fotos: [],        // URLs atuais das fotos do formulário
    videos: []        // URLs atuais dos vídeos do formulário
  };

  let client = null;

  function configOk() {
    return typeof CONFIG !== 'undefined' &&
      CONFIG.supabaseUrl && CONFIG.supabaseUrl.indexOf("SEU-PROJETO") === -1 &&
      CONFIG.supabaseAnonKey && CONFIG.supabaseAnonKey.indexOf("SUA-ANON") === -1;
  }

  function msg(el, texto, tipo) {
    el.textContent = texto;
    el.className = 'admin-msg show ' + (tipo || 'info');
  }
  function limparMsg(el) { el.className = 'admin-msg'; el.textContent = ''; }

  /* ============ AUTH ============ */
  async function checkSession() {
    if (!configOk()) {
      msg($('#login-msg'), 'Configure o Supabase no arquivo js/config.js (URL e anon key) para usar o admin.', 'err');
      return;
    }
    client = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
    const { data } = await client.auth.getSession();
    if (data.session) {
      estado.session = data.session;
      mostrarPainel();
    } else {
      mostrarLogin();
    }
  }

  function mostrarLogin() {
    $('#admin-login').style.display = 'block';
    $('#admin-panel').style.display = 'none';
    $('#admin-form').style.display = 'none';
    $('#admin-logout').style.display = 'none';
  }

  function mostrarPainel() {
    $('#admin-login').style.display = 'none';
    $('#admin-panel').style.display = 'block';
    $('#admin-form').style.display = 'none';
    $('#admin-logout').style.display = 'inline-block';
    carregarLista();
  }

  async function login(email, senha) {
    const box = $('#login-msg');
    limparMsg(box);
    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      estado.session = data.session;
      mostrarPainel();
    } catch (e) {
      msg(box, e.message || 'Não foi possível entrar. Verifique e-mail e senha.', 'err');
    }
  }

  async function logout() {
    await client.auth.signOut();
    estado.session = null;
    mostrarLogin();
  }

  /* ============ LISTA ============ */
  async function carregarLista() {
    const { data, error } = await client.from('imoveis').select('*').order('id', { ascending: true });
    if (error) {
      msg($('#admin-msg'), 'Erro ao carregar imóveis: ' + error.message, 'err');
      return;
    }
    estado.imoveis = data || [];
    renderLista();
  }

  function renderLista() {
    const q = ($('#admin-busca').value || '').toLowerCase().trim();
    const lista = estado.imoveis.filter(i => !q || (i.titulo || '').toLowerCase().indexOf(q) !== -1);
    const box = $('#admin-list');

    if (!lista.length) {
      box.innerHTML = '<p style="color:#6b7274">Nenhum imóvel encontrado. Clique em "Novo imóvel" ou importe a base local.</p>';
      return;
    }

    box.innerHTML = lista.map(i => `
      <div class="al-item">
        <img src="${escapeHtml(otimizarImagem(i.imagem, 320))}" alt="${escapeHtml(i.titulo)}" onerror="this.style.display='none'" />
        <div class="al-info">
          <h4>${escapeHtml(i.titulo)} <span class="al-badge ${i.disponivel === false ? 'off' : 'on'}">${i.disponivel === false ? 'Indisponível' : escapeHtml(i.status)}</span></h4>
          <p>#${i.id} · ${escapeHtml(i.tipo)}${i.bairro ? ' · ' + escapeHtml(i.bairro) : ''} · ${escapeHtml(i.cidade)} · R$ ${precoFormatado(i.preco)}${i.status === 'Aluguel' ? '/mês' : ''}</p>
        </div>
        <div class="al-actions">
          <button data-edit="${i.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>
          <button data-toggle="${i.id}" title="${i.disponivel === false ? 'Publicar' : 'Tirar do ar'}"><i class="fa-solid ${i.disponivel === false ? 'fa-circle-check' : 'fa-eye-slash'}"></i></button>
          <button class="del" data-del="${i.id}" title="Excluir"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  }

  /* ============ FORMULÁRIO ============ */
  function abrirForm(imovel) {
    limparMsg($('#admin-msg'));
    $('#admin-panel').style.display = 'none';
    $('#admin-form').style.display = 'block';
    $('#form-title').innerHTML = imovel
      ? '<i class="fa-solid fa-pen-to-square"></i> Editar imóvel #' + imovel.id
      : '<i class="fa-solid fa-plus"></i> Novo imóvel';

    estado.editando = imovel;
    estado.editId = imovel ? imovel.id : proximoId();
    estado.fotos = imovel && Array.isArray(imovel.fotos) ? imovel.fotos.slice() : (imovel && imovel.imagem ? [imovel.imagem] : []);
    estado.videos = imovel && Array.isArray(imovel.videos) ? imovel.videos.slice() : [];

    $('#f-titulo').value = imovel ? imovel.titulo || '' : '';
    $('#f-referencia').value = imovel ? imovel.referencia || '' : (imovel ? '' : 'CI-' + String(estado.editId).padStart(3, '0'));
    $('#f-status').value = imovel ? imovel.status || 'Aluguel' : 'Aluguel';
    $('#f-categoria').value = imovel ? imovel.categoria || '' : '';
    preencherTipos();
    $('#f-tipo').value = imovel ? imovel.tipo || '' : '';
    $('#f-cidade').value = imovel ? imovel.cidade || '' : 'Goianésia';
    $('#f-bairro').value = imovel ? imovel.bairro || '' : '';
    $('#f-localizacao').value = imovel ? imovel.localizacao || '' : '';
    $('#f-preco').value = imovel && imovel.preco != null ? imovel.preco : '';
    $('#f-condominio').value = imovel && imovel.condominio != null ? imovel.condominio : '';
    $('#f-iptu').value = imovel && imovel.iptu != null ? imovel.iptu : '';
    $('#f-area').value = imovel && imovel.area ? imovel.area : '';
    $('#f-quartos').value = imovel && imovel.quartos != null ? imovel.quartos : 0;
    $('#f-suites').value = imovel && imovel.suites != null ? imovel.suites : 0;
    $('#f-banheiros').value = imovel && imovel.banheiros != null ? imovel.banheiros : 0;
    $('#f-garagem').value = imovel && imovel.garagem != null ? imovel.garagem : 0;
    $('#f-data').value = imovel && imovel.data ? imovel.data : '';
    $('#f-mobiliado').checked = !!(imovel && imovel.mobiliado);
    $('#f-destaque').checked = !!(imovel && imovel.destaque);
    $('#f-disponivel').checked = imovel ? imovel.disponivel !== false : true;
    $('#f-descricao').value = imovel ? imovel.descricao || '' : '';
    $('#f-fotos').value = '';
    $('#f-videos').value = '';
    renderFotos();
    renderVideos();
    atualizarPreview();

    window.scrollTo({ top: 0 });
  }

  function fecharForm() {
    $('#admin-form').style.display = 'none';
    $('#admin-panel').style.display = 'block';
    estado.editando = null;
    estado.editId = null;
    estado.fotos = [];
    estado.videos = [];
  }

  function proximoId() {
    const ids = estado.imoveis.map(i => i.id || 0);
    const local = (window.IMOVEIS || []).map(i => i.id || 0);
    const max = Math.max(0, ...ids, ...local);
    return max + 1;
  }

  function preencherTipos() {
    const sel = $('#f-tipo');
    const cat = $('#f-categoria').value;
    const opcoes = TIPOS[cat] || [];
    sel.innerHTML = '<option value="">' + (opcoes.length ? 'Selecione o tipo...' : 'Escolha uma categoria primeiro') + '</option>' +
      opcoes.map(t => `<option value="${t}">${t}</option>`).join('');
  }

  function atualizarPreview() {
    const box = $('#admin-preview-card');
    const imovel = {
      titulo: $('#f-titulo').value || 'Título do imóvel',
      status: $('#f-status').value,
      localizacao: $('#f-localizacao').value || '',
      bairro: $('#f-bairro').value || '',
      cidade: $('#f-cidade').value || '',
      preco: Number($('#f-preco').value) || 0,
      quartos: Number($('#f-quartos').value) || 0,
      suites: Number($('#f-suites').value) || 0,
      banheiros: Number($('#f-banheiros').value) || 0,
      garagem: Number($('#f-garagem').value) || 0,
      area: Number($('#f-area').value) || 0,
      imagem: estado.fotos[0] || ''
    };
    const price = precoFormatado(imovel.preco);
    box.innerHTML = `
      <article class="property-card">
        <div class="property-thumb">
          ${imovel.imagem
            ? `<img src="${escapeHtml(otimizarImagem(imovel.imagem, 640))}" alt="" style="height:200px;object-fit:cover;width:100%;" />`
            : '<div style="height:200px;background:#eee;display:flex;align-items:center;justify-content:center;color:#999;"><i class="fa-solid fa-image"></i> Sem foto</div>'}
          <div class="property-badges"><span class="badge">${escapeHtml(imovel.status)}</span></div>
        </div>
        <div class="property-body">
          <div class="property-price"><small>R$</small> ${price}${imovel.status === 'Aluguel' ? '<small> /mês</small>' : ''}</div>
          <h3 class="property-title">${escapeHtml(imovel.titulo)}</h3>
          <div class="property-location"><i class="fa-solid fa-location-dot"></i>${escapeHtml(imovel.localizacao)}${imovel.bairro ? ', ' + escapeHtml(imovel.bairro) : ''} - ${escapeHtml(imovel.cidade)}</div>
          <div class="property-amenities">
            ${imovel.quartos ? `<span><i class="fa-solid fa-bed"></i> ${imovel.quartos}</span>` : ''}
            ${imovel.suites ? `<span><i class="fa-solid fa-door-open"></i> ${imovel.suites}</span>` : ''}
            ${imovel.banheiros ? `<span><i class="fa-solid fa-bath"></i> ${imovel.banheiros}</span>` : ''}
            ${imovel.garagem ? `<span><i class="fa-solid fa-car"></i> ${imovel.garagem}</span>` : ''}
            ${imovel.area ? `<span><i class="fa-solid fa-ruler-combined"></i> ${imovel.area} m²</span>` : ''}
          </div>
        </div>
      </article>
    `;
  }

  /* ============ FOTOS ============ */
  function renderFotos() {
    const box = $('#foto-thumbs');
    if (!estado.fotos.length) {
      box.innerHTML = '<p style="color:#6b7274;font-size:0.85rem;">Nenhuma foto ainda.</p>';
      return;
    }
    box.innerHTML = estado.fotos.map((url, i) => `
      <div class="foto-thumb">
        <img src="${otimizarImagem(url, 320)}" alt="Foto ${i + 1}" onerror="this.src='https://via.placeholder.com/96x70/f7f8f9/b28e4a?text=Erro'" />
        <button type="button" data-rem-foto="${i}" title="Remover"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `).join('');
  }

  // Comprime a foto no navegador (máx. 1920px, JPEG ~82%) para reduzir
  // o upload. Corrige a orientação de fotos de celular via createImageBitmap.
  async function comprimirImagem(file) {
    if (file.type === 'image/gif' || (file.size || 0) < 200 * 1024) return file;
    try {
      let bmp;
      try {
        bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      } catch (e) {
        bmp = await createImageBitmap(file);
      }
      const MAX = 1920;
      let { width, height } = bmp;
      if (width > MAX || height > MAX) {
        const escala = Math.min(MAX / width, MAX / height);
        width = Math.round(width * escala);
        height = Math.round(height * escala);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(bmp, 0, 0, width, height);
      bmp.close();
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.82));
      if (!blob) return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
    } catch (e) {
      return file;
    }
  }

  async function enviarFotos(arquivos) {
    if (!CONFIG.cloudinaryCloud || CONFIG.cloudinaryCloud.indexOf('SEU-CLOUD') !== -1 || !CONFIG.cloudinaryPreset) {
      throw new Error('Configure o Cloudinary em js/config.js (cloud name e upload preset).');
    }
    const urls = [];
    for (const arquivo of arquivos) {
      const a = await comprimirImagem(arquivo);
      const fd = new FormData();
      fd.append('file', a);
      fd.append('upload_preset', CONFIG.cloudinaryPreset);
      fd.append('folder', 'imoveis/' + estado.editId);
      const res = await fetch('https://api.cloudinary.com/v1_1/' + CONFIG.cloudinaryCloud + '/image/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (j.error) throw new Error(j.error.message || 'Falha no upload da imagem.');
      urls.push(j.secure_url);
    }
    return urls;
  }

  /* ============ VÍDEOS ============ */
  function renderVideos() {
    const box = $('#video-thumbs');
    if (!estado.videos.length) {
      box.innerHTML = '<p style="color:#6b7274;font-size:0.85rem;">Nenhum vídeo ainda.</p>';
      return;
    }
    box.innerHTML = estado.videos.map((url, i) => `
      <div class="foto-thumb video-thumb" title="${escapeHtml(url)}">
        <i class="fa-solid fa-play"></i><span>Vídeo ${i + 1}</span>
        <button type="button" data-rem-video="${i}" title="Remover"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `).join('');
  }

  // Envia o vídeo para o Cloudinary. Em uploads unsigned o parâmetro
  // "eager" não é permitido, então salvamos a URL original do vídeo; a
  // compressão acontece na entrega (f_mp4,q_auto,w_1280 - ver otimizarVideo).
  // Se o preset estiver configurado com eager transformation, a resposta
  // traz a versão comprimida em j.eager e ela é usada.
  async function enviarVideos(arquivos) {
    if (!CONFIG.cloudinaryCloud || CONFIG.cloudinaryCloud.indexOf('SEU-CLOUD') !== -1 || !CONFIG.cloudinaryPreset) {
      throw new Error('Configure o Cloudinary em js/config.js (cloud name e upload preset).');
    }
    const urls = [];
    for (const arquivo of arquivos) {
      const fd = new FormData();
      fd.append('file', arquivo);
      fd.append('upload_preset', CONFIG.cloudinaryPreset);
      fd.append('folder', 'imoveis/' + estado.editId);
      const res = await fetch('https://api.cloudinary.com/v1_1/' + CONFIG.cloudinaryCloud + '/video/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (j.error) throw new Error(j.error.message || 'Falha no upload do vídeo.');
      const eager = (Array.isArray(j.eager) && j.eager[0] && j.eager[0].secure_url) ? j.eager[0].secure_url : j.secure_url;
      urls.push(eager);
    }
    return urls;
  }

  // Busca os vídeos da pasta /videos do site (video-01.mp4, video-02.mp4...)
  // e os envia para o Cloudinary, anexando ao imóvel em edição.
  async function enviarVideosPasta() {
    const box = $('#admin-msg');
    limparMsg(box);
    if (!configOk()) { msg(box, 'Configure o Supabase em js/config.js antes.', 'err'); return; }
    const arquivos = [];
    for (let i = 1; i <= 25; i++) {
      const nome = 'video-' + String(i).padStart(2, '0');
      let achou = null;
      for (const ext of ['mp4', 'webm', 'mov']) {
        try {
          const res = await fetch('videos/' + nome + '.' + ext, { method: 'HEAD' });
          if (res.ok) { achou = nome + '.' + ext; break; }
        } catch (e) { /* tenta a próxima extensão */ }
      }
      if (!achou) break;
      arquivos.push(achou);
    }
    if (!arquivos.length) {
      msg(box, 'Nenhum vídeo encontrado na pasta /videos. Coloque o arquivo como video-01.mp4 (ou .webm/.mov), publique no GitHub e tente novamente.', 'err');
      return;
    }
    if (!confirm('Enviar ' + arquivos.length + ' vídeo(s) da pasta /videos para o Cloudinary e anexar a este imóvel?')) return;
    try {
      msg(box, 'Enviando ' + arquivos.length + ' vídeo(s)... pode levar alguns minutos.', 'info');
      const urls = [];
      for (const nome of arquivos) {
        const res = await fetch('videos/' + nome);
        if (!res.ok) throw new Error('Falha ao baixar videos/' + nome + ' (HTTP ' + res.status + ')');
        const blob = await res.blob();
        const fd = new FormData();
        fd.append('file', blob, nome);
        fd.append('upload_preset', CONFIG.cloudinaryPreset);
        fd.append('folder', 'imoveis/' + estado.editId);
        const up = await fetch('https://api.cloudinary.com/v1_1/' + CONFIG.cloudinaryCloud + '/video/upload', { method: 'POST', body: fd });
        const j = await up.json();
        if (j.error) throw new Error(j.error.message || 'Falha no upload do vídeo.');
        const eager = (Array.isArray(j.eager) && j.eager[0] && j.eager[0].secure_url) ? j.eager[0].secure_url : j.secure_url;
        urls.push(eager);
      }
      estado.videos = estado.videos.concat(urls);
      renderVideos();
      msg(box, urls.length + ' vídeo(s) enviado(s) com sucesso.', 'ok');
    } catch (e) {
      msg(box, 'Erro ao enviar vídeos da pasta: ' + e.message, 'err');
    }
  }

  /* ============ VALIDAÇÃO ============ */
  function validar() {
    const req = {
      título: $('#f-titulo').value.trim(),
      categoria: $('#f-categoria').value,
      tipo: $('#f-tipo').value,
      cidade: $('#f-cidade').value.trim(),
      descrição: $('#f-descricao').value.trim()
    };
    for (const campo in req) {
      if (!req[campo]) { msg($('#admin-msg'), 'Preencha o campo "' + campo + '".', 'err'); return false; }
    }
    const preco = Number($('#f-preco').value);
    if (!preco || preco <= 0) { msg($('#admin-msg'), 'Informe um preço maior que zero.', 'err'); return false; }
    if (!estado.fotos.length) { msg($('#admin-msg'), 'Adicione ao menos uma foto.', 'err'); return false; }
    return true;
  }

  /* ============ SALVAR ============ */
  async function salvar(e) {
    e.preventDefault();
    limparMsg($('#admin-msg'));
    if (!validar()) return;

    const btn = $('#btn-salvar');
    btn.disabled = true;
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Salvando...';

    try {
      const registro = {
        id: estado.editId,
        referencia: $('#f-referencia').value.trim() || 'CI-' + String(estado.editId).padStart(3, '0'),
        titulo: $('#f-titulo').value.trim(),
        categoria: $('#f-categoria').value,
        tipo: $('#f-tipo').value,
        status: $('#f-status').value,
        bairro: $('#f-bairro').value.trim(),
        localizacao: $('#f-localizacao').value.trim(),
        cidade: $('#f-cidade').value.trim(),
        preco: Number($('#f-preco').value),
        condominio: $('#f-condominio').value ? Number($('#f-condominio').value) : null,
        iptu: $('#f-iptu').value ? Number($('#f-iptu').value) : null,
        area: Number($('#f-area').value) || 0,
        quartos: Number($('#f-quartos').value) || 0,
        suites: Number($('#f-suites').value) || 0,
        banheiros: Number($('#f-banheiros').value) || 0,
        garagem: Number($('#f-garagem').value) || 0,
        data: $('#f-data').value || '',
        mobiliado: $('#f-mobiliado').checked,
        destaque: $('#f-destaque').checked,
        disponivel: $('#f-disponivel').checked,
        descricao: $('#f-descricao').value.trim(),
        fotos: estado.fotos,
        videos: estado.videos,
        imagem: estado.fotos[0],
        updated_at: new Date().toISOString()
      };

      const { error } = await client.from('imoveis').upsert(registro, { onConflict: 'id' });
      if (error) throw error;

      msg($('#admin-msg'), 'Imóvel salvo e publicado no site! ' + (estado.editando ? 'Edição concluída.' : 'Novo imóvel criado.'), 'ok');
      fecharForm();
      await carregarLista();
    } catch (erro) {
      msg($('#admin-msg'), 'Erro ao salvar: ' + erro.message, 'err');
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }

  /* ============ AÇÕES DA LISTA ============ */
  async function alternarDisponivel(id) {
    const item = estado.imoveis.find(i => i.id === id);
    if (!item) return;
    const novo = item.disponivel === false;
    const { error } = await client.from('imoveis').update({ disponivel: novo, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { msg($('#admin-msg'), 'Erro: ' + error.message, 'err'); return; }
    await carregarLista();
  }

  async function excluir(id) {
    if (!confirm('Excluir definitivamente o imóvel #' + id + '? Essa ação não pode ser desfeita.')) return;
    const { error } = await client.from('imoveis').delete().eq('id', id);
    if (error) { msg($('#admin-msg'), 'Erro ao excluir: ' + error.message, 'err'); return; }
    msg($('#admin-msg'), 'Imóvel #' + id + ' excluído.', 'ok');
    await carregarLista();
  }

  /* ============ IMPORTAR BASE LOCAL ============ */
  async function importarBaseLocal() {
    const box = $('#admin-msg');
    limparMsg(box);
    if (!configOk()) { msg(box, 'Configure o Supabase em js/config.js antes de importar.', 'err'); return; }
    const local = (window.IMOVEIS || []).slice();
    if (!local.length) { msg(box, 'Não há imóveis locais em js/imoveis.js para importar.', 'err'); return; }
    if (!confirm('Importar ' + local.length + ' imóveis do js/imoveis.js para o banco? As galerias Cloudinary já existentes serão preservadas.')) return;
    try {
      msg(box, 'Importando ' + local.length + ' imóveis...', 'info');

      // Preserva as galerias Cloudinary já no banco: o js/imoveis.js contém apenas
      // fotos locais (images/...), e reimportá-lo não deve desfazer a migração.
      const { data: existentes } = await client.from('imoveis').select('id, imagem, fotos');
      const mapa = {};
      (existentes || []).forEach(r => { mapa[r.id] = r; });

      const importar = local.map(i => {
        const db = mapa[i.id];
        const temCloudinary = db && Array.isArray(db.fotos) && db.fotos.length &&
          String(db.fotos[0]).indexOf(CONFIG.cloudinaryCloud) !== -1;
        const base = Object.assign({}, i, temCloudinary ? { imagem: db.imagem, fotos: db.fotos } : {});
        if (db && Array.isArray(db.videos) && db.videos.length) base.videos = db.videos.slice();
        return base;
      });

      const { error } = await client.from('imoveis').upsert(importar, { onConflict: 'id' });
      if (error) throw error;
      msg(box, local.length + ' imóveis importados/atualizados no Supabase com sucesso!', 'ok');
      await carregarLista();
    } catch (e) {
      msg(box, 'Erro ao importar: ' + e.message, 'err');
    }
  }

  /* ============ MIGRAR FOTOS PARA CLOUDINARY ============ */
  async function migrarFotos() {
    const box = $('#admin-msg');
    limparMsg(box);
    if (!configOk()) { msg(box, 'Configure o Supabase em js/config.js antes de migrar.', 'err'); return; }
    const alvos = estado.imoveis.filter(i => i.imagem && String(i.imagem).indexOf('images/') === 0);
    if (!alvos.length) { msg(box, 'Nenhum imóvel com fotos locais (images/...) para migrar.', 'info'); return; }
    if (!confirm('Migrar as fotos de ' + alvos.length + ' imóveis para o Cloudinary? Isso pode demorar alguns minutos.')) return;

    const total = alvos.length;
    let ok = 0, falhas = 0;
    try {
      for (let idx = 0; idx < total; idx++) {
        const imovel = alvos[idx];
        const caminhos = (Array.isArray(imovel.fotos) && imovel.fotos.length ? imovel.fotos : [imovel.imagem])
          .filter(p => String(p).indexOf('images/') === 0);
        const urls = [];
        for (const caminho of caminhos) {
          try {
            const res = await fetch(caminho);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const blob = await res.blob();
            const fd = new FormData();
            fd.append('file', blob, caminho.split('/').pop());
            fd.append('upload_preset', CONFIG.cloudinaryPreset);
            fd.append('folder', 'imoveis/' + imovel.id);
            const up = await fetch('https://api.cloudinary.com/v1_1/' + CONFIG.cloudinaryCloud + '/image/upload', { method: 'POST', body: fd });
            const j = await up.json();
            if (j.error) throw new Error(j.error.message);
            urls.push(j.secure_url);
          } catch (e) {
            falhas++;
            console.warn('Falha em ' + caminho, e);
          }
        }
        if (urls.length) {
          const { error } = await client.from('imoveis')
            .update({ imagem: urls[0], fotos: urls, updated_at: new Date().toISOString() })
            .eq('id', imovel.id);
          if (error) { falhas++; console.warn('Erro ao atualizar #' + imovel.id, error); }
          else ok++;
        }
        msg(box, 'Migrando fotos... ' + (idx + 1) + ' de ' + total + ' imóveis', 'info');
      }
      msg(box, 'Migração concluída: ' + ok + ' imóveis com fotos no Cloudinary' + (falhas ? ', ' + falhas + ' erros (veja o console).' : '.'), ok ? 'ok' : 'err');
      await carregarLista();
    } catch (e) {
      msg(box, 'Erro durante a migração: ' + e.message, 'err');
    }
  }

  /* ============ APLICAR FOTOS MIGRADAS (CLOUDINARY) ============ */
  async function aplicarFotosMigradas() {
    const box = $('#admin-msg');
    limparMsg(box);
    if (!configOk()) { msg(box, 'Configure o Supabase em js/config.js antes.', 'err'); return; }
    try {
      const res = await fetch('js/fotos-migradas.json');
      if (!res.ok) throw new Error('Falha ao baixar js/fotos-migradas.json (HTTP ' + res.status + ').');
      const FOTOS = await res.json();
      const ids = Object.keys(FOTOS).map(Number).sort((a, b) => a - b);
      if (!ids.length) { msg(box, 'Arquivo de fotos migradas vazio.', 'err'); return; }
      if (!confirm('Aplicar ' + ids.length + ' galerias migradas (Cloudinary) ao banco? Sobrescreve imagem e fotos de cada imóvel.')) return;

      let ok = 0, falhas = 0;
      for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const fotos = FOTOS[id] || [];
        if (!fotos.length) continue;
        const { error } = await client.from('imoveis')
          .update({ imagem: fotos[0], fotos, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) { falhas++; console.warn('Falha ao atualizar #' + id, error); }
        else ok++;
        if (i % 10 === 0 || i === ids.length - 1) msg(box, 'Aplicando fotos... ' + (i + 1) + ' de ' + ids.length, 'info');
      }
      msg(box, 'Fotos aplicadas: ' + ok + ' imóveis atualizados' + (falhas ? ', ' + falhas + ' falhas (veja o console).' : ' com sucesso!'), ok ? 'ok' : 'err');
      await carregarLista();
    } catch (e) {
      msg(box, 'Erro ao aplicar fotos: ' + e.message, 'err');
    }
  }

  /* ============ EVENTOS ============ */
  $('#login-form').addEventListener('submit', e => {
    e.preventDefault();
    login($('#login-email').value.trim(), $('#login-password').value);
  });

  $('#admin-logout').addEventListener('click', logout);

  $('#btn-novo').addEventListener('click', () => abrirForm(null));
  $('#btn-cancelar').addEventListener('click', fecharForm);
  $('#btn-importar').addEventListener('click', importarBaseLocal);
  $('#btn-migrar').addEventListener('click', migrarFotos);
  $('#btn-aplicar-fotos').addEventListener('click', aplicarFotosMigradas);

  $('#admin-busca').addEventListener('input', renderLista);

  $('#f-categoria').addEventListener('change', preencherTipos);
  $('#f-tipo').addEventListener('change', atualizarPreview);

  $$('#imovel-form input, #imovel-form select, #imovel-form textarea').forEach(el => {
    const evento = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(evento, atualizarPreview);
  });

  $('#imovel-form').addEventListener('submit', salvar);

  $('#f-fotos').addEventListener('change', async e => {
    const arquivos = Array.from(e.target.files || []);
    if (!arquivos.length) return;
    const box = $('#admin-msg');
    limparMsg(box);
    try {
      msg(box, 'Comprimindo e enviando fotos para o Cloudinary...', 'info');
      const urls = await enviarFotos(arquivos);
      estado.fotos = estado.fotos.concat(urls);
      renderFotos();
      atualizarPreview();
      e.target.value = '';
      msg(box, urls.length + ' foto(s) enviada(s) com sucesso.', 'ok');
    } catch (erro) {
      msg(box, 'Erro no upload: ' + erro.message, 'err');
    }
  });

  $('#foto-thumbs').addEventListener('click', e => {
    const btn = e.target.closest('[data-rem-foto]');
    if (!btn) return;
    estado.fotos.splice(Number(btn.dataset.remFoto), 1);
    renderFotos();
    atualizarPreview();
  });

  $('#f-videos').addEventListener('change', async e => {
    const arquivos = Array.from(e.target.files || []);
    if (!arquivos.length) return;
    const box = $('#admin-msg');
    limparMsg(box);
    try {
      msg(box, 'Enviando vídeo(s) para o Cloudinary... A compressão pode levar alguns minutos.', 'info');
      const urls = await enviarVideos(arquivos);
      estado.videos = estado.videos.concat(urls);
      renderVideos();
      e.target.value = '';
      msg(box, urls.length + ' vídeo(s) enviado(s) e comprimido(s) com sucesso.', 'ok');
    } catch (erro) {
      msg(box, 'Erro no upload do vídeo: ' + erro.message, 'err');
    }
  });

  $('#video-thumbs').addEventListener('click', e => {
    const btn = e.target.closest('[data-rem-video]');
    if (!btn) return;
    estado.videos.splice(Number(btn.dataset.remVideo), 1);
    renderVideos();
  });

  $('#btn-videos-pasta').addEventListener('click', enviarVideosPasta);

  $('#admin-list').addEventListener('click', e => {
    const ed = e.target.closest('[data-edit]');
    if (ed) {
      const imovel = estado.imoveis.find(i => i.id === Number(ed.dataset.edit));
      if (imovel) abrirForm(imovel);
      return;
    }
    const tg = e.target.closest('[data-toggle]');
    if (tg) { alternarDisponivel(Number(tg.dataset.toggle)); return; }
    const del = e.target.closest('[data-del]');
    if (del) { excluir(Number(del.dataset.del)); }
  });

  /* ============ INIT ============ */
  checkSession();
})();
