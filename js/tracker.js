/**
 * tracker.js — Fase 2
 * Registra el recorrido y las decisiones de la sesión. Vive en localStorage
 * por ahora (sin backend); el shape del objeto es el mismo que espera leer
 * KPI Factory el día que esto se conecte a un endpoint real.
 */
const Tracker = (function () {
  let sesion = null;
  let umbralMostradoEn = null;

  function iniciar(obraId) {
    sesion = {
      obraId,
      sesionId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      recorrido: [],
      decisiones: [],
      hojaFinal: null,
      completado: false,
    };
  }

  function registrarNodo(nodeId) {
    sesion.recorrido.push(nodeId);
  }

  function umbralMostrado() {
    umbralMostradoEn = performance.now();
  }

  function registrarDecision(umbralId, letra) {
    const tiempoDecisionMs = Math.round(performance.now() - (umbralMostradoEn || performance.now()));
    sesion.decisiones.push({ umbral: umbralId, elegido: letra, tiempoDecisionMs });
  }

  function registrarHojaFinal(tipo) {
    sesion.hojaFinal = tipo;
    sesion.completado = true;
    guardar();
  }

  function guardar() {
    if (!sesion) return;
    try {
      localStorage.setItem(`kine:${sesion.obraId}:${sesion.sesionId}`, JSON.stringify(sesion));
    } catch (e) { /* almacenamiento no disponible: no bloquear la experiencia */ }
  }

  function recorridoActual() {
    return sesion ? sesion.recorrido : [];
  }

  return { iniciar, registrarNodo, umbralMostrado, registrarDecision, registrarHojaFinal, recorridoActual };
})();
