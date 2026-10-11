/**
 * navigation.js — Fase 2
 * Motor de navegación agnóstico de la obra. No sabe nada de "9no Inning"
 * específicamente: lee catalogo.json, resuelve qué obra corresponde,
 * carga su grafo y expone los nodos por id. Sirve igual para 1 obra
 * que para un catálogo completo — solo cambia cuántas entradas tiene
 * catalogo.json.
 *
 * Formato de hash para deep-linking: #/<obraId>/<nodeId>
 *   #/9no-inning            -> obra 9no-inning, nodo inicial
 *   #/9no-inning/T-A1        -> obra 9no-inning, directo al nodo T-A1
 */
const Navigation = (function () {
  let catalogo = null;
  let obraActual = null;   // entrada del catálogo
  let grafoActual = null;  // JSON de la obra cargada
  let nodesById = {};

  async function cargarCatalogo() {
    const res = await fetch('data/catalogo.json');
    catalogo = await res.json();
    return catalogo;
  }

  function obraPorId(obraId) {
    return catalogo.obras.find((o) => o.id === obraId);
  }

  function obraPorDefecto() {
    return catalogo.obras.find((o) => o.estado === 'publicado') || catalogo.obras[0];
  }

  async function cargarObra(obraId) {
    const entrada = obraId ? obraPorId(obraId) : obraPorDefecto();
    if (!entrada) {
      throw new Error(obraId
        ? `La obra "${obraId}" no está en el catálogo.`
        : 'El catálogo no tiene ninguna obra publicada.');
    }
    const res = await fetch(entrada.configPath);
    grafoActual = await res.json();

    nodesById = {};
    grafoActual.nodes.forEach((n) => { nodesById[n.id] = n; });

    obraActual = entrada;
    return { entrada, grafo: grafoActual };
  }

  function obtenerNodo(nodeId) {
    return nodesById[nodeId] || null;
  }

  function nodoInicial() {
    return grafoActual.startNode;
  }

  /** Lee el hash actual de la URL y lo descompone en { obraId, nodeId }. */
  function leerHash() {
    const hash = location.hash.replace(/^#\/?/, ''); // quita "#/" o "#"
    if (!hash) return { obraId: null, nodeId: null };
    const [obraId, nodeId] = hash.split('/').filter(Boolean);
    return { obraId: obraId || null, nodeId: nodeId || null };
  }

  /**
   * Actualiza el hash para reflejar dónde está el espectador, sin disparar
   * un evento 'hashchange' (usa replaceState) — así no hay riesgo de que
   * la propia app reaccione a su propio cambio de URL en bucle.
   */
  function fijarHash(nodeId) {
    if (!obraActual) return;
    const nuevoHash = `#/${obraActual.id}/${nodeId}`;
    history.replaceState(null, '', nuevoHash);
  }

  return {
    cargarCatalogo,
    cargarObra,
    obtenerNodo,
    nodoInicial,
    leerHash,
    fijarHash,
    get catalogo() { return catalogo; },
    get obraActual() { return obraActual; },
  };
})();
