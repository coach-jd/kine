/**
 * player.js — Fase 1
 * Maneja los dos <video> superpuestos y el cross-fade entre ellos.
 * Estados: 'playing-main' | 'looping-choice' | 'transitioning' | 'ended'
 */
const Player = (function () {
  let videoA, videoB;
  let active = null; // referencia al <video> actualmente visible
  let state = 'idle';
  let onEndedCallback = null;

  function init(elMain, elLoop) {
    videoA = elMain;
    videoB = elLoop;
    active = videoA;

    videoA.addEventListener('ended', handleEnded);
    videoB.addEventListener('ended', handleEnded);
  }

  function handleEnded() {
    if (state === 'playing-main' && onEndedCallback) {
      const cb = onEndedCallback;
      onEndedCallback = null;
      cb();
    }
  }

  function otherVideo() {
    return active === videoA ? videoB : videoA;
  }

  /**
   * Reproduce un video a pantalla completa (nodo principal o rama elegida).
   * Hace cross-fade desde lo que esté visible actualmente.
   */
  function playMain(src, onEnded) {
    state = 'transitioning';
    const incoming = otherVideo();
    incoming.loop = false;
    incoming.src = src;
    incoming.currentTime = 0;

    incoming.play().then(() => {
      incoming.classList.add('visible');
      active.classList.remove('visible');
      active = incoming;
      state = 'playing-main';
      onEndedCallback = onEnded || null;
    }).catch((err) => {
      console.warn('No se pudo reproducir', src, err);
    });
  }

  /**
   * Cambia al clip en bucle (el Umbral) mientras el usuario decide.
   */
  function playLoop(src) {
    state = 'transitioning';
    const incoming = otherVideo();
    incoming.loop = true;
    incoming.src = src;
    incoming.currentTime = 0;

    incoming.play().then(() => {
      incoming.classList.add('visible');
      active.classList.remove('visible');
      active = incoming;
      state = 'looping-choice';
    }).catch((err) => {
      console.warn('No se pudo reproducir el loop', src, err);
    });
  }

  function setMuted(muted) {
    videoA.muted = muted;
    videoB.muted = muted;
  }

  function getState() {
    return state;
  }

  return { init, playMain, playLoop, setMuted, getState };
})();
