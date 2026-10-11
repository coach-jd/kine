/**
 * preload.js — Fase 3
 * Precalienta en segundo plano los videos que probablemente se necesiten
 * a continuación, usando <video preload="auto"> ocultos: el navegador
 * descarga y cachea los bytes, así que cuando Player los reproduce de
 * verdad, arrancan desde caché en vez de esperar red.
 *
 * No decide QUÉ precargar (eso lo decide app.js según el grafo) — solo
 * ofrece warm()/warmMany() y limpiar() para no acumular elementos ocultos
 * sin límite a lo largo de una sesión larga.
 */
const Preload = (function () {
  const pool = {}; // src -> <video> oculto precalentándolo

  function warm(src) {
    if (!src || pool[src]) return;
    const v = document.createElement('video');
    v.preload = 'auto';
    v.muted = true;
    v.playsInline = true;
    v.setAttribute('aria-hidden', 'true');
    v.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;';
    v.src = src;
    // load() es explícito: algunos navegadores no arrancan la descarga
    // solo por setear .src si el elemento no está "activado" por gesto previo.
    v.load();
    document.body.appendChild(v);
    pool[src] = v;
  }

  function warmMany(srcs) {
    (srcs || []).filter(Boolean).forEach(warm);
  }

  /** Libera del pool todo lo que no esté en la lista de "a conservar". */
  function limpiar(conservar) {
    const setConservar = new Set(conservar || []);
    Object.keys(pool).forEach((src) => {
      if (!setConservar.has(src)) {
        pool[src].removeAttribute('src');
        pool[src].load(); // corta cualquier descarga en curso
        pool[src].remove();
        delete pool[src];
      }
    });
  }

  function estaPrecalentado(src) {
    return Boolean(pool[src]);
  }

  return { warm, warmMany, limpiar, estaPrecalentado };
})();
