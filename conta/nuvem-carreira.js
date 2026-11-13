/* Save da carreira na nuvem (04/11/2026).
   Convidado: só local (IndexedDB via PromessaArquivo). Com sessão: cada gravação local sobe para
   saves_carreira (debounce) e, ao abrir o jogo, o que estiver mais novo na nuvem desce para o aparelho.
   Conflito: vence o mais recente (quando local x atualizado_em da nuvem). */
(function () {
  'use strict';
  var ESPERA_MS = 15000;                 // o jogo grava a cada ~1 min; agrupa rajadas
  var LIMITE_BYTES = 4 * 1024 * 1024;    // espelha o CHECK da tabela
  var FOLGA_MS = 2000;                   // relógio do aparelho x servidor
  var CHAVE_SLOTS = 'promessa-slots-nuvem';
  var timers = {}, descendo = false, pronto = null;

  function P() { return window.Promessa; }
  function lerJSON(k, padrao) {
    try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? padrao : v; }
    catch (e) { console.warn('[nuvem] ' + k + ' ilegível', e); return padrao; }
  }
  function indice() { var l = lerJSON('futx-saves', []); return Array.isArray(l) ? l.filter(function (s) { return s && s.id; }) : []; }
  function idValido(id) { return typeof id === 'string' && /^[\w-]{1,64}$/.test(id); }

  async function logado() {
    var p = P();
    if (!p || !p.sb) return false;
    try { var s = await p.sessao(); return !!(s && s.user); }   // conta local/convidado não sobe
    catch (e) { console.warn('[nuvem] sessão indisponível', e); return false; }
  }

  async function subir(id) {
    var A = window.PromessaArquivo;
    if (!A || !idValido(id) || !(await logado())) return;
    try {
      var valor = await A.get(id);
      if (!valor || !valor.carreira) return;
      var ent = indice().find(function (s) { return s.id === id; }) || {};
      var dados = { v: 1, saveId: id, quando: ent.quando || Date.now(), indice: ent, contrato: valor.contrato || null, carreira: valor.carreira };
      var tam = new Blob([JSON.stringify(dados)]).size;
      if (tam > LIMITE_BYTES) { console.warn('[nuvem] save ' + id + ' com ' + tam + ' bytes passa do limite; fica só local'); return; }
      var r = await P().salvarCarreira(id, dados, {
        rotulo: String(ent.nome || '').trim().slice(0, 80) || null,
        clube: ent.time ? String(ent.time).slice(0, 80) : null,
        overall: Number(ent.ovr) || null,
        temporada: ent.ano != null ? String(ent.ano).slice(0, 12) : null,
        trofeus: Number(ent.titulos) || 0
      });
      if (!r.ok) console.warn('[nuvem] save ' + id + ' não subiu:', r.motivo, r.erro || '');
    } catch (e) { console.error('[nuvem] subir ' + id + ':', e); }
  }
  function agendar(id) {
    if (descendo || !idValido(id)) return;
    clearTimeout(timers[id]);
    timers[id] = setTimeout(function () { delete timers[id]; subir(id); }, ESPERA_MS);
  }
  function subirPendentes() {
    Object.keys(timers).forEach(function (id) { clearTimeout(timers[id]); delete timers[id]; subir(id); });
  }

  async function sincronizar() {
    var A = window.PromessaArquivo;
    if (!(await logado())) return;
    var mapaAntes = lerJSON(CHAVE_SLOTS, {}) || {};
    var nuvem = await P().listarSaves();
    P().mapearSlots(nuvem);
    var locais = {}; indice().forEach(function (s) { locais[s.id] = s; });
    var ativa = (lerJSON('futx-carreira', null) || {}).saveId, mudouAtiva = false;
    var naNuvem = {};
    for (var i = 0; i < nuvem.length; i++) {
      var l = nuvem[i], id = l.save_id;
      if (!idValido(id)) continue;
      naNuvem[id] = true;
      var tNuvem = Date.parse(l.atualizado_em) || 0, loc = locais[id];
      if (loc && (Number(loc.quando) || 0) + FOLGA_MS >= tNuvem) {
        if ((Number(loc.quando) || 0) > tNuvem + FOLGA_MS) agendar(id);   // aparelho mais novo
        continue;
      }
      var d = await P().carregarSave(id);
      if (!d || !d.carreira || d.saveId !== id) continue;
      descendo = true;
      try {
        await A.put(id, { contrato: d.contrato || null, carreira: d.carreira });
        var lista = indice().filter(function (s) { return s.id !== id; });
        lista.unshift(Object.assign({}, d.indice || {}, { id: id, quando: tNuvem }));
        localStorage.setItem('futx-saves', JSON.stringify(lista.slice(0, 5)));
        if (id === ativa) {
          localStorage.setItem('futx-carreira', JSON.stringify(d.carreira));
          if (d.contrato) localStorage.setItem('futx-fluxo-contrato', JSON.stringify(d.contrato));
          mudouAtiva = true;
        }
      } finally { descendo = false; }
    }
    /* sobe o que só existe aqui; id que já esteve na nuvem e sumiu foi excluído em outro aparelho: não ressuscita */
    Object.keys(locais).forEach(function (id) { if (!naNuvem[id] && !mapaAntes[id]) agendar(id); });
    /* a carreira ativa já estava em memória com a versão velha: recarrega uma vez, senão ela regrava por cima */
    if (mudouAtiva && !sessionStorage.getItem('promessa-nuvem-recarregou')) {
      sessionStorage.setItem('promessa-nuvem-recarregou', '1');
      location.reload();
    }
  }

  function ligar(A) {
    if (A.__nuvem) return;
    A.__nuvem = true;
    var put = A.put, del = A.del;
    A.put = function (id, valor) {
      var r = put.apply(A, arguments);
      Promise.resolve(r).then(function () { agendar(id); }, function () {});
      return r;
    };
    A.del = function (id) {
      var r = del.apply(A, arguments);
      clearTimeout(timers[id]); delete timers[id];
      logado().then(function (ok) { if (ok) return P().apagarSave(id); })
        .catch(function (e) { console.warn('[nuvem] apagar ' + id + ':', e); });
      return r;
    };
    pronto = (A.migrar ? Promise.resolve(A.migrar()) : Promise.resolve())
      .then(sincronizar)
      .catch(function (e) { console.error('[nuvem] sincronizar:', e); });
  }

  /* PromessaArquivo nasce dentro do dc-import, que carrega depois */
  var tentativas = 0;
  (function espera() {
    if (window.PromessaArquivo) return ligar(window.PromessaArquivo);
    if (++tentativas < 120) setTimeout(espera, 500);
  })();
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') subirPendentes(); });
  window.addEventListener('pagehide', subirPendentes);
  window.PromessaNuvem = Object.freeze({ sincronizar: function () { return pronto || sincronizar(); }, subirAgora: subirPendentes });
})();
