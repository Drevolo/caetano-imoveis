(function () {
  'use strict';

  var KEY = 'caetano_favoritos';

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch (e) { return []; }
  }

  function write(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function toggle(id) {
    var list = read();
    var idx = list.indexOf(id);
    if (idx > -1) list.splice(idx, 1);
    else list.push(id);
    write(list);
    return list;
  }

  window.Favoritos = { read: read, write: write, toggle: toggle };
})();
