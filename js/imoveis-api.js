(function () {
  'use strict';

  var migradasCache = null;

  function dadosLocais() {
    return Array.isArray(window.IMOVEIS) ? window.IMOVEIS : [];
  }

  async function carregarMigradas() {
    if (migradasCache) return migradasCache;
    const res = await fetch('js/fotos-migradas.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    migradasCache = await res.json();
    return migradasCache;
  }

  // Fallback offline: aplica as galerias migradas (Cloudinary) sobre a base local,
  // para o site continuar exibindo todas as fotos mesmo sem o banco.
  async function dadosLocaisComFotos() {
    const lista = dadosLocais();
    if (!lista.length) return lista;
    try {
      const fotos = await carregarMigradas();
      const novas = lista.map(function (i) {
        const f = fotos[i.id];
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

  async function carregarImoveis() {
    const client = getClient();
    if (!client) return dadosLocaisComFotos();
    try {
      const { data, error } = await client
        .from('imoveis')
        .select('*')
        .eq('disponivel', true)
        .order('id', { ascending: true });
      if (error) throw error;
      if (data && data.length) {
        window.IMOVEIS = data;
        return data;
      }
      return dadosLocaisComFotos();
    } catch (e) {
      return dadosLocaisComFotos();
    }
  }

  window.carregarImoveis = carregarImoveis;
})();
