/**
 * analytics.js — Fase 6
 * Lee y agrega las sesiones que Tracker fue guardando en localStorage
 * (una por partida jugada, bajo la clave "kine:<obraId>:<sesionId>").
 * No inventa una fuente de datos nueva — es exactamente el mismo shape
 * que Tracker ya produce pensando en KPI Factory; acá solo se agrega
 * localmente porque todavía no hay backend al que enviarlo.
 */
const Analytics = (function () {
  function leerSesiones(obraId) {
    const prefijo = `kine:${obraId}:`;
    const sesiones = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefijo)) {
        try {
          sesiones.push(JSON.parse(localStorage.getItem(key)));
        } catch (e) { /* entrada corrupta, se ignora */ }
      }
    }
    return sesiones;
  }

  function agregar(obraId) {
    const sesiones = leerSesiones(obraId);
    const completas = sesiones.filter((s) => s.completado);

    // popularidad de nodos: cuántas sesiones pasaron por cada uno
    const visitasPorNodo = {};
    sesiones.forEach((s) => {
      (s.recorrido || []).forEach((nodo) => {
        visitasPorNodo[nodo] = (visitasPorNodo[nodo] || 0) + 1;
      });
    });

    // por Umbral: qué letra se elige más, y tiempo de decisión promedio
    const porUmbral = {};
    sesiones.forEach((s) => {
      (s.decisiones || []).forEach((d) => {
        if (!porUmbral[d.umbral]) porUmbral[d.umbral] = { conteos: {}, tiempos: [] };
        porUmbral[d.umbral].conteos[d.elegido] = (porUmbral[d.umbral].conteos[d.elegido] || 0) + 1;
        porUmbral[d.umbral].tiempos.push(d.tiempoDecisionMs);
      });
    });
    const resumenUmbrales = Object.entries(porUmbral).map(([umbral, datos]) => {
      const promedio = datos.tiempos.reduce((a, b) => a + b, 0) / (datos.tiempos.length || 1);
      return { umbral, conteos: datos.conteos, tiempoPromedioMs: Math.round(promedio) };
    }).sort((a, b) => a.umbral.localeCompare(b.umbral));

    // distribución de desenlaces alcanzados
    const porHoja = {};
    completas.forEach((s) => {
      if (s.hojaFinal) porHoja[s.hojaFinal] = (porHoja[s.hojaFinal] || 0) + 1;
    });

    return {
      totalSesiones: sesiones.length,
      totalCompletas: completas.length,
      visitasPorNodo,
      resumenUmbrales,
      porHoja,
      sesiones, // se incluyen crudas para exportar
    };
  }

  function exportarJSON(obraId) {
    const datos = agregar(obraId);
    const blob = new Blob([JSON.stringify(datos.sesiones, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kine-sesiones-${obraId}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function limpiar(obraId) {
    const prefijo = `kine:${obraId}:`;
    const claves = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefijo)) claves.push(key);
    }
    claves.forEach((k) => localStorage.removeItem(k));
    return claves.length;
  }

  return { agregar, exportarJSON, limpiar };
})();
