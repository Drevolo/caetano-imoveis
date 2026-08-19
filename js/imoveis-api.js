(function () {
  'use strict';

  var migradasCache = null;
  var CACHE_KEY = 'imoveis_data';
  var CACHE_FOTOS_KEY = 'fotos_migradas';
  var CACHE_TTL = 10 * 60 * 1000; // 10 minutos
  var CACHE_FOTOS_TTL = 24 * 60 * 60 * 1000; // 24 horas

  function dadosLocais() {
    return Array.isArray(window.IMOVEIS) ? window.IMOVEIS : [];
  }

  async function carregarMigradas() {
    if (migradasCache) return migradasCache;
    // Tenta cache local primeiro
    var cached = Cache.get(CACHE_FOTOS_KEY);
    if (cached) { migradasCache = cached; return migradasCache; }
    var res = await fetch('js/fotos-migradas.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    migradasCache = await res.json();
    Cache.set(CACHE_FOTOS_KEY, migradasCache, CACHE_FOTOS_TTL);
    return migradasCache;
  }

  // Fallback offline: aplica as galerias migradas (Cloudinary) sobre a base local,
  // para o site continuar exibindo todas as fotos mesmo sem o banco.
  async function dadosLocaisComFotos() {
    var lista = dadosLocais();
    if (!lista.length) return lista;
    try {
      var fotos = await carregarMigradas();
      var novas = lista.map(function (i) {
        var f = fotos[i.id];
        if (Array.isArray(f) && f.length) {
          return Object.assign({}, i, { imagem: f[0], fotos: f });
        }
        return i;
      });
      window.IMOVEIS = novas;
      return novas;
    } catch (e) {
      return lista;
    }
  }

  function configOk() {
    return typeof CONFIG !== 'undefined' &&
      CONFIG.supabaseUrl && CONFIG.supabaseUrl.indexOf("SEU-PROJETO") === -1 &&
      CONFIG.supabaseAnonKey && CONFIG.supabaseAnonKey.indexOf("SUA-ANON") === -1;
  }

  function getClient() {
    if (!window.supabase || !configOk()) return null;
    if (!window.__supabaseClient) {
      window.__supabaseClient = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
    }
    return window.__supabaseClient;
  }

  // Busca imóveis do Supabase
  async function fetchDoBanco(client) {
    var result = await client
      .from('imoveis')
      .select('*')
      .eq('disponivel', true)
      .order('id', { ascending: true });
    if (result.error) throw result.error;
    return result.data || [];
  }

  // Stale-while-revalidate: retorna dados do cache imediatamente,
  // busca atualização em background e atualiza o cache + UI quando chegar.
  async function carregarImoveis() {
    var client = getClient();
    if (!client) return dadosLocaisComFotos();

    // 1. Tenta pegar do cache
    var dadosCache = Cache.get(CACHE_KEY);

    // 2. Se tem cache, retorna imediatamente e revalida em background
    if (dadosCache && dadosCache.length) {
      window.IMOVEIS = dadosCache;
      // Revalida em background (fire-and-forget)
      fetchDoBanco(client).then(function (novosDados) {
        if (novosDados && novosDados.length) {
          window.IMOVEIS = novosDados;
          Cache.set(CACHE_KEY, novosDados, CACHE_TTL);
          // Dispara evento para a UI re-renderizar se necessário
          window.dispatchEvent(new CustomEvent('imoveis-updated', { detail: novosDados }));
        }
      }).catch(function () { /* mantém cache silenciosamente */ });
      return dadosCache;
    }

    // 3. Sem cache: busca do servidor
    try {
      var data = await fetchDoBanco(client);
      if (data && data.length) {
        window.IMOVEIS = data;
        Cache.set(CACHE_KEY, data, CACHE_TTL);
        return data;
      }
      return dadosLocaisComFotos();
    } catch (e) {
      return dadosLocaisComFotos();
    }
  }

  // Invalida o cache (chamar após CRUD no admin)
  function invalidarCacheImoveis() {
    Cache.remove(CACHE_KEY);
  }

  window.carregarImoveis = carregarImoveis;
  window.invalidarCacheImoveis = invalidarCacheImoveis;
})();
