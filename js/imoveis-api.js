(function () {
  'use strict';

  function dadosLocais() {
    return Array.isArray(window.IMOVEIS) ? window.IMOVEIS : [];
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
    if (!client) return dadosLocais();
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
      return dadosLocais();
    } catch (e) {
      return dadosLocais();
    }
  }

  window.carregarImoveis = carregarImoveis;
})();
