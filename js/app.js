/**
 * app.js — Catálogo (3 obras)
 * La pantalla principal ya no es una sola obra: es un catálogo tipo Netflix
 * (data/catalogo.json). Tocar un afiche entra directo a esa obra — el propio
 * toque es el gesto que habilita el autoplay muteado, así que no hace falta
 * pantalla intermedia de "Comenzar". Esa pantalla intermedia se conserva
 * solo para el caso de un link compartido (#/obra/nodo), donde sí hace
 * falta un gesto explícito antes de reproducir.
 * Al llegar a una Hoja, la acción principal pasa a ser "Volver al catálogo".
 */
(function () {
  let nodoAlComenzar = null; // si llegan por un link compartido, arrancan ahí

  // --- elementos del DOM ---
  const pantallaCatalogo = document.getElementById('pantallaCatalogo');
  const catalogoGrid = document.getElementById('catalogoGrid');
  const pantallaInicio = document.getElementById('pantallaInicio');
  const obraTituloEl = document.getElementById('obraTitulo');
  const obraSubEl = document.getElementById('obraSub');
  const btnComenzar = document.getElementById('btnComenzar');
  const btnVolverCatalogoInicio = document.getElementById('btnVolverCatalogoInicio');
  const btnMute = document.getElementById('btnMute');
  const btnVolverCatalogo = document.getElementById('btnVolverCatalogo');
  const videoMain = document.getElementById('videoMain');
  const videoLoop = document.getElementById('videoLoop');
  const overlay = document.getElementById('overlayTrilema');
  const umbralIdEl = document.getElementById('umbralId');
  const umbralTituloEl = document.getElementById('umbralTitulo');
  const umbralPreguntaEl = document.getElementById('umbralPregunta');
  const trilemaCards = document.getElementById('trilemaCards');
  const pantallaCierre = document.getElementById('pantallaCierre');
  const cierreTipoEl = document.getElementById('cierreTipo');
  const cierreResumenEl = document.getElementById('cierreResumen');
  const btnVolverCatalogoCierre = document.getElementById('btnVolverCatalogoCierre');
  const btnReintentar = document.getElementById('btnReintentar');
  const btnCompartir = document.getElementById('btnCompartir');
  const btnVerCreditosCierre = document.getElementById('btnVerCreditosCierre');
  const traza = document.getElementById('trazaRecorrido');
  const btnInstalar = document.getElementById('btnInstalar');
  const iosInstalarHint = document.getElementById('iosInstalarHint');
  const btnCerrarIosHint = document.getElementById('btnCerrarIosHint');
  const btnAbrirEstadisticas = document.getElementById('btnAbrirEstadisticas');
  const btnVerEstadisticasCierre = document.getElementById('btnVerEstadisticasCierre');
  const panelEstadisticas = document.getElementById('panelEstadisticas');
  const peObraTituloEl = document.getElementById('peObraTitulo');
  const peBodyEl = document.getElementById('peBody');
  const btnCerrarEstadisticas = document.getElementById('btnCerrarEstadisticas');
  const btnExportarDatos = document.getElementById('btnExportarDatos');
  const btnLimpiarDatos = document.getElementById('btnLimpiarDatos');
  const panelCreditos = document.getElementById('panelCreditos');
  const credObraTituloEl = document.getElementById('credObraTitulo');
  const credBodyEl = document.getElementById('credBody');
  const btnCerrarCreditos = document.getElementById('btnCerrarCreditos');

  let muted = true;
  let focusIndexSwipe = 0;

  // ============================================================
  // CATÁLOGO
  // ============================================================

  function renderCatalogo() {
    catalogoGrid.innerHTML = '';
    Navigation.catalogo.obras.forEach((obra) => {
      const card = document.createElement('div');
      card.className = 'poster-card';
      card.innerHTML = `
        <div class="poster tema-${obra.posterTema}" tabindex="0" role="button" aria-label="Ver ${obra.titulo}">
          <span class="poster-icon">🎬</span>
          <button class="poster-info" aria-label="Créditos de ${obra.titulo}" type="button">ⓘ</button>
          <div class="poster-title">${obra.titulo}</div>
          <div class="poster-generos">${obra.generos.join(' · ')}</div>
        </div>`;

      const posterEl = card.querySelector('.poster');
      const infoBtn = card.querySelector('.poster-info');

      posterEl.addEventListener('click', (e) => {
        if (e.target.closest('.poster-info')) return;
        entrarAObra(obra.id);
      });
      posterEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); entrarAObra(obra.id); }
      });
      infoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirCreditos(obra.id);
      });

      catalogoGrid.appendChild(card);
    });
  }

  function mostrarCatalogo() {
    renderCatalogo();
    pantallaCatalogo.hidden = false;
    requestAnimationFrame(() => pantallaCatalogo.classList.add('visible'));
    history.replaceState(null, '', location.pathname + location.search);
  }

  function ocultarCatalogo() {
    pantallaCatalogo.classList.remove('visible');
    setTimeout(() => { pantallaCatalogo.hidden = true; }, 250);
  }

  async function entrarAObra(obraId) {
    ocultarCatalogo();
    const { entrada } = await Navigation.cargarObra(obraId);
    muted = true;
    Player.setMuted(true);
    btnMute.textContent = '🔇';
    Tracker.iniciar(entrada.id);
    irANodo(Navigation.nodoInicial());
  }

  function volverAlCatalogo() {
    pantallaCierre.classList.remove('visible');
    overlay.classList.remove('visible');
    pantallaInicio.setAttribute('hidden', '');
    videoMain.pause();
    videoLoop.pause();
    mostrarCatalogo();
  }

  btnVolverCatalogo.addEventListener('click', volverAlCatalogo);
  btnVolverCatalogoCierre.addEventListener('click', volverAlCatalogo);
  btnVolverCatalogoInicio.addEventListener('click', volverAlCatalogo);

  // ============================================================
  // REPRODUCCIÓN (motor común a todas las obras)
  // ============================================================

  function irANodo(nodeId) {
    const nodo = Navigation.obtenerNodo(nodeId);
    if (!nodo) {
      console.error('Nodo no encontrado en esta obra:', nodeId);
      return;
    }

    Tracker.registrarNodo(nodeId);
    Navigation.fijarHash(nodeId);
    traza.textContent = Tracker.recorridoActual().join(' → ');

    Player.playMain(nodo.videoSrc, () => onVideoPrincipalTerminado(nodo));

    // Mientras se ve el nodo principal, precalentamos su propio loop
    // (el Umbral): si el nodo tiene Trilema, ese loop se va a necesitar
    // en cuanto termine el video.
    if (nodo.loopSrc) Preload.warm(nodo.loopSrc);
  }

  function onVideoPrincipalTerminado(nodo) {
    if (nodo.trilema && nodo.trilema.opciones && nodo.trilema.opciones.length > 0) {
      mostrarUmbral(nodo);
    } else if (nodo.hoja) {
      mostrarCierre(nodo);
    } else {
      console.warn('Nodo sin trilema ni hoja — extremo del grafo no definido:', nodo.id);
    }
  }

  function mostrarUmbral(nodo) {
    const t = nodo.trilema;
    umbralIdEl.textContent = t.id.replace('U', '');
    umbralTituloEl.textContent = t.titulo;
    umbralPreguntaEl.textContent = t.pregunta;

    trilemaCards.innerHTML = '';
    focusIndexSwipe = 0;
    t.opciones.forEach((op) => {
      const card = document.createElement('button');
      card.className = 'trilema-card';
      card.setAttribute('aria-label', `Opción ${op.letra}: ${op.label}`);
      card.innerHTML = `
        <span class="card-letra">${op.letra}</span>
        <span>
          <span class="card-label">${op.label}</span>
          <span class="card-desc">${op.descripcion}</span>
        </span>`;
      card.addEventListener('click', () => elegirOpcion(op, card, t));
      trilemaCards.appendChild(card);
    });
    trilemaCards.children[0]?.classList.add('focused');

    Player.playLoop(nodo.loopSrc);
    overlay.classList.add('visible');
    Tracker.umbralMostrado();

    const srcsOpciones = t.opciones
      .map((op) => Navigation.obtenerNodo(op.target))
      .filter(Boolean)
      .map((n) => n.videoSrc);
    Preload.warmMany(srcsOpciones);
  }

  function elegirOpcion(opcion, cardEl, trilema) {
    Tracker.registrarDecision(trilema.id, opcion.letra);

    document.querySelectorAll('.trilema-card').forEach((c) => c.disabled = true);
    cardEl.classList.add('chosen');

    const nodoElegido = Navigation.obtenerNodo(opcion.target);
    if (nodoElegido) Preload.limpiar([nodoElegido.videoSrc]);

    setTimeout(() => {
      overlay.classList.remove('visible');
      irANodo(opcion.target);
    }, 260);
  }

  function mostrarCierre(nodo) {
    const h = nodo.hoja;
    Tracker.registrarHojaFinal(h.tipo);

    cierreTipoEl.textContent = h.tipo;
    cierreTipoEl.className = 'cierre-tipo ' + tonoParaHoja(h.tipo);
    cierreResumenEl.textContent = h.resumen;
    pantallaCierre.classList.add('visible');
  }

  function tonoParaHoja(tipo) {
    if (tipo === 'Meta alcanzada') return 'tono-verde';
    if (tipo === 'Meta perdida') return 'tono-rojo';
    if (tipo === 'Meta Inalcanzable') return 'tono-gris';
    return 'tono-azul'; // Defendiendo la Meta
  }

  function reiniciar() {
    pantallaCierre.classList.remove('visible');
    Tracker.iniciar(Navigation.obraActual.id);
    irANodo(Navigation.nodoInicial());
  }

  async function compartirCamino() {
    const url = location.href;
    const texto = `Elegí mi camino en "${Navigation.obraActual.titulo}" — mirá a dónde llegué.`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Kine', text: texto, url }); } catch (e) { /* el usuario canceló */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        btnCompartir.textContent = 'Link copiado ✓';
        setTimeout(() => { btnCompartir.textContent = 'Compartir este camino'; }, 1800);
      } catch (e) { /* clipboard no disponible en este contexto */ }
    }
  }

  btnComenzar.addEventListener('click', () => {
    pantallaInicio.setAttribute('hidden', '');
    Player.setMuted(true);
    Tracker.iniciar(Navigation.obraActual.id);
    irANodo(nodoAlComenzar || Navigation.nodoInicial());
  });

  btnMute.addEventListener('click', () => {
    muted = !muted;
    Player.setMuted(muted);
    btnMute.textContent = muted ? '🔇' : '🔊';
  });

  btnReintentar.addEventListener('click', reiniciar);
  btnCompartir.addEventListener('click', compartirCamino);

  // --- swipe horizontal para recorrer las opciones antes de confirmar ---
  let swipeStartX = null;
  trilemaCards.addEventListener('pointerdown', (e) => { swipeStartX = e.clientX; });
  trilemaCards.addEventListener('pointerup', (e) => {
    if (swipeStartX === null) return;
    const dx = e.clientX - swipeStartX;
    swipeStartX = null;

    const cards = [...trilemaCards.querySelectorAll('.trilema-card')];
    if (cards.length === 0 || Math.abs(dx) < 40) return;

    cards[focusIndexSwipe]?.classList.remove('focused');
    focusIndexSwipe = dx < 0
      ? Math.min(focusIndexSwipe + 1, cards.length - 1)
      : Math.max(focusIndexSwipe - 1, 0);
    cards[focusIndexSwipe]?.classList.add('focused');
  });

  // ============================================================
  // CRÉDITOS
  // ============================================================

  function filaCredito(label, value) {
    if (value === undefined || value === null || value === '') return '';
    return `<div class="pe-stat-row"><span class="k">${label}</span><span class="v">${value}</span></div>`;
  }

  async function abrirCreditos(obraId) {
    const entrada = Navigation.catalogo.obras.find((o) => o.id === obraId);
    if (!entrada) return;
    const res = await fetch(entrada.configPath);
    const grafo = await res.json();
    const c = grafo.creditos || {};

    credObraTituloEl.textContent = entrada.titulo;
    credBodyEl.innerHTML = `
      <p class="creditos-sinopsis">${c.sinopsis || 'Sin sinopsis disponible.'}</p>
      <div class="pe-section-title">Ficha técnica</div>
      ${filaCredito('Género', entrada.generos.join(' · '))}
      ${filaCredito('Dirección cinematográfica', '')}
      <p class="creditos-detalle">${c.direccionCinematografica || '—'}</p>
      ${filaCredito('Desarrollo narrativo', c.desarrolloNarrativo)}
      ${filaCredito('Duración estimada', c.duracionEstimadaMin ? c.duracionEstimadaMin + ' min' : null)}
      <div class="pe-section-title">Certificación de Auditor</div>
      ${filaCredito('ICT · Índice de Calidad Trilemática', c.certificacion?.ict)}
      ${filaCredito('IRD · Índice de Responsabilidad Dramática', c.certificacion?.ird)}
      ${filaCredito('IEN · Índice de Exploración Narrativa', c.certificacion?.ien)}
      <div class="pe-stat-row"><span class="k">Sello</span><span class="v">Un Polimetraje®</span></div>
    `;

    panelCreditos.hidden = false;
    requestAnimationFrame(() => panelCreditos.classList.add('visible'));
  }

  function cerrarCreditos() {
    panelCreditos.classList.remove('visible');
    setTimeout(() => { panelCreditos.hidden = true; }, 250);
  }

  btnCerrarCreditos.addEventListener('click', cerrarCreditos);
  btnVerCreditosCierre.addEventListener('click', () => abrirCreditos(Navigation.obraActual.id));

  // ============================================================
  // PANEL DE ESTADÍSTICAS
  // ============================================================

  function celdaBarra(label, value, max) {
    const pct = Math.round((value / (max || 1)) * 100);
    return `<div class="pe-bar-row">
      <div class="pe-bar-label"><span>${label}</span><span>${value}</span></div>
      <div class="pe-bar-track"><div class="pe-bar-fill" style="width:${pct}%"></div></div>
    </div>`;
  }

  function renderEstadisticas() {
    const obraId = Navigation.obraActual.id;
    peObraTituloEl.textContent = Navigation.obraActual.titulo;
    const datos = Analytics.agregar(obraId);

    if (datos.totalSesiones === 0) {
      peBodyEl.innerHTML = '<div class="pe-empty">Todavía no hay partidas jugadas en este dispositivo.</div>';
      return;
    }

    let html = '';
    html += `<div class="pe-stat-row"><span class="k">Partidas iniciadas</span><span class="v">${datos.totalSesiones}</span></div>`;
    html += `<div class="pe-stat-row"><span class="k">Partidas completadas</span><span class="v">${datos.totalCompletas}</span></div>`;

    html += '<div class="pe-section-title">Nodos más visitados</div>';
    const nodosOrdenados = Object.entries(datos.visitasPorNodo).sort((a, b) => b[1] - a[1]);
    const maxVisitas = nodosOrdenados[0]?.[1] || 1;
    nodosOrdenados.forEach(([nodo, count]) => { html += celdaBarra(nodo, count, maxVisitas); });

    if (datos.resumenUmbrales.length > 0) {
      html += '<div class="pe-section-title">Decisiones por Umbral</div>';
      datos.resumenUmbrales.forEach((u) => {
        const totalDecisiones = Object.values(u.conteos).reduce((a, b) => a + b, 0);
        html += `<div class="pe-stat-row"><span class="k">${u.umbral} · tiempo promedio de decisión</span><span class="v">${(u.tiempoPromedioMs / 1000).toFixed(1)}s</span></div>`;
        Object.entries(u.conteos).sort((a, b) => b[1] - a[1]).forEach(([letra, count]) => {
          html += celdaBarra(`Opción ${letra}`, count, totalDecisiones);
        });
      });
    }

    html += '<div class="pe-section-title">Desenlaces alcanzados</div>';
    const hojasOrdenadas = Object.entries(datos.porHoja).sort((a, b) => b[1] - a[1]);
    if (hojasOrdenadas.length === 0) {
      html += '<div class="pe-empty">Ninguna partida llegó a un desenlace todavía.</div>';
    } else {
      const maxHoja = hojasOrdenadas[0][1];
      hojasOrdenadas.forEach(([tipo, count]) => { html += celdaBarra(tipo, count, maxHoja); });
    }

    peBodyEl.innerHTML = html;
  }

  function abrirEstadisticas() {
    renderEstadisticas();
    panelEstadisticas.hidden = false;
    requestAnimationFrame(() => panelEstadisticas.classList.add('visible'));
  }

  function cerrarEstadisticas() {
    panelEstadisticas.classList.remove('visible');
    setTimeout(() => { panelEstadisticas.hidden = true; }, 250);
  }

  btnAbrirEstadisticas.addEventListener('click', abrirEstadisticas);
  btnVerEstadisticasCierre.addEventListener('click', abrirEstadisticas);
  btnCerrarEstadisticas.addEventListener('click', cerrarEstadisticas);
  btnExportarDatos.addEventListener('click', () => Analytics.exportarJSON(Navigation.obraActual.id));
  btnLimpiarDatos.addEventListener('click', () => {
    Analytics.limpiar(Navigation.obraActual.id);
    renderEstadisticas();
  });

  // ============================================================
  // INSTALACIÓN COMO PWA
  // ============================================================

  let eventoInstalacion = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    eventoInstalacion = e;
    btnInstalar.hidden = false;
  });

  btnInstalar.addEventListener('click', async () => {
    if (!eventoInstalacion) return;
    eventoInstalacion.prompt();
    await eventoInstalacion.userChoice;
    eventoInstalacion = null;
    btnInstalar.hidden = true;
  });

  window.addEventListener('appinstalled', () => { btnInstalar.hidden = true; });

  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const yaEsStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (esIOS && !yaEsStandalone && !localStorage.getItem('kine:ios-install-hint-visto')) {
    iosInstalarHint.hidden = false;
  }
  btnCerrarIosHint.addEventListener('click', () => {
    iosInstalarHint.hidden = true;
    try { localStorage.setItem('kine:ios-install-hint-visto', '1'); } catch (e) { /* sin storage disponible */ }
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js')
        .catch((err) => console.warn('No se pudo registrar el Service Worker:', err));
    });
  }

  // ============================================================
  // ARRANQUE
  // ============================================================
  (async function bootstrap() {
    Player.init(videoMain, videoLoop);
    await Navigation.cargarCatalogo();
    const { obraId, nodeId } = Navigation.leerHash();

    if (obraId && nodeId) {
      // Se llegó por un link compartido: se necesita un gesto explícito
      // antes de poder reproducir con autoplay.
      try {
        const { entrada } = await Navigation.cargarObra(obraId);
        obraTituloEl.textContent = entrada.titulo;
        obraSubEl.textContent = `Retomando un camino compartido de "${entrada.titulo}".`;
        nodoAlComenzar = Navigation.obtenerNodo(nodeId) ? nodeId : null;
        btnComenzar.disabled = false;
        pantallaInicio.removeAttribute('hidden');
      } catch (err) {
        obraTituloEl.textContent = 'No se pudo cargar';
        obraSubEl.textContent = err.message;
        pantallaInicio.removeAttribute('hidden');
      }
    } else {
      mostrarCatalogo();
    }
  })();
})();
