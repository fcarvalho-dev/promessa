'use strict';
/**
 * PROMESSA · Motor de Efeitos Sonoros Procedurais (Web Audio API)
 * Funciona em qualquer navegador sem precisar baixar arquivos externos.
 * Expõe: window.PromessaSom = { tocar, ligado, ligar }
 */
(function () {
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null;

  function ligado() {
    try { return localStorage.getItem('futx-som') !== '0'; }
    catch (e) { return true; }
  }

  function ligar(v) {
    try { localStorage.setItem('futx-som', v ? '1' : '0'); }
    catch (e) {}
  }

  function obterCtx() {
    if (!AC || !ligado()) return null;
    try {
      if (!ctx || ctx.state === 'closed') ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume().catch(function () {});
      return ctx;
    } catch (e) { return null; }
  }

  function tocar(tipo) {
    if (!ligado()) return;
    var c = obterCtx();
    if (!c) return;
    var t = c.currentTime;

    try {
      // 1. Clique / Toque de Interface
      if (tipo === 'clique' || tipo === 'hover_soft') {
        var o = c.createOscillator();
        var g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(620, t);
        o.frequency.exponentialRampToValueAtTime(840, t + 0.035);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.04, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.045);
        return;
      }

      // 2. Apito de Juiz (Fim / Início de Jogo)
      if (tipo === 'apito') {
        [2800, 2860].forEach(function (freq) {
          var o = c.createOscillator();
          var g = c.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, t);
          o.frequency.setValueAtTime(freq + 40, t + 0.08);
          o.frequency.setValueAtTime(freq, t + 0.16);
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.07, t + 0.18);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
          o.connect(g); g.connect(c.destination);
          o.start(t); o.stop(t + 0.3);
        });
        return;
      }

      // 3. Chute na Bola (Impacto Encorpado)
      if (tipo === 'chute') {
        var o = c.createOscillator();
        var g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(140, t);
        o.frequency.exponentialRampToValueAtTime(38, t + 0.09);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.11);
        return;
      }

      // 4. Gol / Explosão de Alegria
      if (tipo === 'gol') {
        [523.25, 659.25, 783.99, 1046.50].forEach(function (freq, i) {
          var o = c.createOscillator();
          var g = c.createGain();
          o.type = 'triangle';
          var delay = i * 0.06;
          o.frequency.setValueAtTime(freq, t + delay);
          o.frequency.exponentialRampToValueAtTime(freq * 1.05, t + delay + 0.3);
          g.gain.setValueAtTime(0.0001, t + delay);
          g.gain.exponentialRampToValueAtTime(0.07, t + delay + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.45);
          o.connect(g); g.connect(c.destination);
          o.start(t + delay); o.stop(t + delay + 0.48);
        });
        return;
      }

      // 5. Na Trave (Impacto Metálico)
      if (tipo === 'trave') {
        var o = c.createOscillator();
        var g = c.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(880, t);
        o.frequency.exponentialRampToValueAtTime(440, t + 0.15);
        g.gain.setValueAtTime(0.09, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.24);
        return;
      }

      // 6. Subiu de Nível / Conquista
      if (tipo === 'nivel_up' || tipo === 'conquista') {
        [440, 554.37, 659.25, 880].forEach(function (freq, i) {
          var o = c.createOscillator();
          var g = c.createGain();
          o.type = 'sine';
          var delay = i * 0.07;
          o.frequency.setValueAtTime(freq, t + delay);
          g.gain.setValueAtTime(0.0001, t + delay);
          g.gain.exponentialRampToValueAtTime(0.08, t + delay + 0.03);
          g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.35);
          o.connect(g); g.connect(c.destination);
          o.start(t + delay); o.stop(t + delay + 0.38);
        });
        return;
      }

      // 7. Abertura de Pack / Revelação de Carta
      if (tipo === 'pack_open' || tipo === 'carta') {
        [329.63, 440, 554.37, 659.25, 880, 1108.73].forEach(function (freq, i) {
          var o = c.createOscillator();
          var g = c.createGain();
          o.type = 'triangle';
          var delay = i * 0.045;
          o.frequency.setValueAtTime(freq, t + delay);
          g.gain.setValueAtTime(0.0001, t + delay);
          g.gain.exponentialRampToValueAtTime(0.06, t + delay + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.28);
          o.connect(g); g.connect(c.destination);
          o.start(t + delay); o.stop(t + delay + 0.3);
        });
        return;
      }

      // 8. Erro / Bloqueio
      if (tipo === 'erro') {
        var o = c.createOscillator();
        var g = c.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(180, t);
        o.frequency.exponentialRampToValueAtTime(95, t + 0.12);
        g.gain.setValueAtTime(0.06, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.16);
        return;
      }

      // 9. Sucesso / Confirmação
      if (tipo === 'sucesso' || tipo === 'confirm') {
        var o = c.createOscillator();
        var g = c.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(523.25, t);
        o.frequency.exponentialRampToValueAtTime(783.99, t + 0.08);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.07, t + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.connect(g); g.connect(c.destination);
        o.start(t); o.stop(t + 0.2);
        return;
      }
    } catch (e) {}
  }

  // Desbloqueia contexto no primeiro clique do usuário no documento
  function desbloquear() {
    try {
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(function () {});
      else if (!ctx && AC) ctx = new AC();
    } catch (e) {}
    ['click', 'keydown', 'touchstart'].forEach(function (ev) {
      window.removeEventListener(ev, desbloquear);
    });
  }
  ['click', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, desbloquear, { once: true, passive: true });
  });

  window.PromessaSom = { tocar: tocar, ligado: ligado, ligar: ligar };
})();
