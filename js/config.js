const CONFIG = {
  supabaseUrl: "https://bcltcegokxujqxwbhato.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbHRjZWdva3h1anF4d2JoYXRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MDg1NDQsImV4cCI6MjEwMjE4NDU0NH0.g9FWyPVizyGkGL7mWs8WMbBeNlvgNJTSQAGfE4ZgHxY",
  cloudinaryCloud: "kpy7nies",
  cloudinaryPreset: "imoveis-unsigned",
  cloudinaryBase: "https://res.cloudinary.com"
};

function otimizarImagem(url, largura) {
  if (!url) return "";
  const cloud = CONFIG.cloudinaryCloud;
  if (cloud && cloud.indexOf("SEU-CLOUD") === -1 && typeof url === "string" && url.indexOf(cloud) !== -1 && url.indexOf("/image/upload/") !== -1) {
    if (url.indexOf("/image/upload/f_auto") !== -1) return url;
    const trans = "f_auto,q_auto" + (largura ? ",w_" + largura : "");
    return url.replace("/image/upload/", "/image/upload/" + trans + "/");
  }
  return url;
}

function precoFormatado(v) {
  return Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
