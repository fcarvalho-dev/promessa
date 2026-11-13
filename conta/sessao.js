'use strict';
/* PROMESSA · sessão compartilhada — use em qualquer tela (menu, carreira, cartas, perfil).
 * Centraliza: quem está logado, se é convidado, apelido customizado, saldo e save na nuvem.
 * Carrega depois de conta/vendor/supabase.js e conta/config.js. Expõe window.Promessa. */
(function () {
  var CFG = window.PROMESSA_CARTAS || {
    SUPABASE_URL: 'https://qtdycffnwqblysfgvmck.supabase.co',
    SUPABASE_KEY: 'sb_publishable_7FbcotsG3ThADGIyoSMFsg_m6R9ySxY'
  };
  var CHAVE_APELIDO = 'promessa_apelido';

  if (!window.supabase || !window.supabase.createClient) {
    console.error('[Promessa] supabase.js não carregou antes de sessao.js');
    return;
  }

  var sb = window.PROMESSA_SB || window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  window.PROMESSA_SB = sb;

  function ehConvidado() {
    try {
      if (localStorage.getItem('promessa_conta_local')) return false;
      return localStorage.getItem('promessa_convidado') === '1' || localStorage.getItem('promessa_modo_convidado') === '1';
    } catch (e) { return false; }
  }

  function entrarConvidado() {
    try {
      localStorage.setItem('promessa_convidado', '1');
      localStorage.setItem('promessa_modo_convidado', '1');
    } catch (e) { console.warn('[sessao]', e); }
  }

  function sairConvidado() {
    try {
      localStorage.removeItem('promessa_convidado');
      localStorage.removeItem('promessa_modo_convidado');
    } catch (e) { console.warn('[sessao]', e); }
  }

  async function sessao() {
    try {
      var r = await sb.auth.getSession();
      return (r && r.data && r.data.session) || null;
    } catch (e) { return null; }
  }

  function contaLocal() {
    try {
      var raw = localStorage.getItem('promessa_conta_local');
      if (raw) return JSON.parse(raw);
    } catch (e) { console.warn('[sessao]', e); }
    return null;
  }

  var _usrPromise = null;
  async function usuario() {
    if (_usrPromise) return _usrPromise;
    _usrPromise = (async function () {
      try {
        var s = await sessao();
        if (s && s.user) return s.user;
        var r = await sb.auth.getUser();
        if (r && r.data && r.data.user) return r.data.user;
      } catch (e) { console.warn('[sessao]', e); }
      var cl = contaLocal();
      if (cl) {
        return {
          id: cl.id,
          email: cl.email,
          user_metadata: { apelido: cl.nick, full_name: cl.nick, nick: cl.nick }
        };
      }
      return null;
    })();
    return _usrPromise;
  }

  async function logado() { return !!(await usuario()); }

  async function perfil() {
    var u = await usuario();
    if (!u) return null;
    try {
      var r = await sb.from('profiles').select('*').eq('id', u.id).maybeSingle();
      return (r && r.data) || null;
    } catch (e) { return null; }
  }

  function obterApelido(u, p) {
    // 1. Se estiver logado, prioridade maxima e a nuvem (metadata / profiles)
    if (u) {
      if (p && (p.apelido || p.nick)) {
        var pNick = String(p.apelido || p.nick).trim();
        if (pNick) { try { localStorage.setItem(CHAVE_APELIDO + '_' + u.id, pNick); localStorage.setItem(CHAVE_APELIDO, pNick); } catch (e) { console.warn('[sessao]', e); } return pNick; }
      }
      if (u.user_metadata && (u.user_metadata.apelido || u.user_metadata.nick || u.user_metadata.apelido_desejado)) {
        var mNick = String(u.user_metadata.apelido || u.user_metadata.nick || u.user_metadata.apelido_desejado).trim();
        if (mNick) { try { localStorage.setItem(CHAVE_APELIDO + '_' + u.id, mNick); localStorage.setItem(CHAVE_APELIDO, mNick); } catch (e) { console.warn('[sessao]', e); } return mNick; }
      }
      try {
        var porId = localStorage.getItem(CHAVE_APELIDO + '_' + u.id);
        if (porId && porId.trim()) return porId.trim();
      } catch (e) { console.warn('[sessao]', e); }
      if (u.email) return String(u.email).split('@')[0];
    }
    // 2. Convidado / offline: usa o localStorage local
    try {
      var geral = localStorage.getItem(CHAVE_APELIDO);
      if (geral && geral.trim()) return geral.trim();
    } catch (e) { console.warn('[sessao]', e); }
    return 'Convidado';
  }

  async function salvarApelido(novo) {
    var limpo = String(novo || '').replace(/\s+/g, ' ').trim().slice(0, 24);
    if (limpo.length < 2) throw new Error('O apelido precisa ter pelo menos 2 caracteres.');
    var u = null;
    try { u = await usuario(); } catch (e) { console.warn('[sessao]', e); }
    try {
      localStorage.setItem(CHAVE_APELIDO, limpo);
      if (u && u.id) localStorage.setItem(CHAVE_APELIDO + '_' + u.id, limpo);
    } catch (e) { console.warn('[sessao]', e); }
    if (u) {
      try { await sb.auth.updateUser({ data: { nick: limpo, apelido: limpo } }); } catch (e) { console.warn('[Promessa] updateUser apelido:', e); }
      try { await sb.from('profiles').update({ apelido: limpo }).eq('id', u.id); } catch (e) { console.warn('[sessao]', e); }
    }
    try { window.dispatchEvent(new CustomEvent('promessa:apelido', { detail: limpo })); } catch (e) { console.warn('[sessao]', e); }
    return limpo;
  }

  async function saldo() {
    var u = await usuario();
    if (!u) {
      var sConv = localStorage.getItem('promessa_saldo_convidado') || localStorage.getItem('promessa_saldo');
      return sConv != null ? (Number(sConv) || 0) : 1000;
    }
    // conta logada: o saldo e so o do servidor. Antes, saldo 0 caia num fallback que mostrava 1000 inventado.
    var rpc = await sb.rpc('meu_saldo');
    if (rpc.error) throw rpc.error;
    return Number(rpc.data) || 0;
  }

  async function sair() {
    _usrPromise = null;
    sairConvidado();
    try {
      localStorage.removeItem('promessa_conta_local');
      localStorage.removeItem(CHAVE_APELIDO);
      await sb.auth.signOut();
    } catch (e) { console.warn('[sessao]', e); }
    var base = location.pathname.indexOf('/conta/') >= 0 || location.pathname.indexOf('/cartas/') >= 0 ? '../' : '';
    location.href = base + 'conta/login.html';
  }

  function irParaLogin(next) {
    var base = location.pathname.indexOf('/conta/') >= 0 || location.pathname.indexOf('/cartas/') >= 0 ? '../' : '';
    var n = next || location.pathname.replace(/^\//, '');
    location.href = base + 'conta/login.html?next=' + encodeURIComponent(n);
  }

  async function exigirLoginOuConvidado() {
    var s = await sessao();
    if (s && s.user) { _usrPromise = null;
    sairConvidado(); return { modo: 'logado', user: s.user }; }
    var cl = contaLocal();
    if (cl) { _usrPromise = null;
    sairConvidado(); return { modo: 'logado', user: { id: cl.id, email: cl.email, user_metadata: { apelido: cl.nick } } }; }
    if (ehConvidado()) return { modo: 'convidado', user: null };
    var base = location.pathname.indexOf('/conta/') >= 0 || location.pathname.indexOf('/cartas/') >= 0 ? '../' : '';
    var volta = encodeURIComponent(location.pathname + location.search);
    location.replace(base + 'conta/login.html?next=' + volta);
    return { modo: 'redirecionando', user: null };
  }

  /* saves_carreira.slot é integer (1..9 por conta); a carreira usa ids aleatórios ('s' + base36).
     Sem conversão o RPC falhava calado e nenhum save ia para a nuvem (tabela vazia em 03/11).
     Cada saveId ganha um número fixo, guardado neste aparelho; número que já vem certo passa direto. */
  var CHAVE_SLOTS = 'promessa-slots-nuvem';
  function slotNum(slot) {
    if (typeof slot === 'number' && slot >= 1 && slot <= 9) return Math.floor(slot);
    if (/^[1-9]$/.test(String(slot))) return parseInt(slot, 10);
    var id = String(slot || 'principal').slice(0, 64), mapa = {};
    try { mapa = JSON.parse(localStorage.getItem(CHAVE_SLOTS) || '{}') || {}; } catch (e) { console.warn('[sessao] mapa de slots ilegível', e); mapa = {}; }
    if (mapa[id] >= 1 && mapa[id] <= 9) return mapa[id];
    var usados = Object.keys(mapa).map(function (k) { return mapa[k]; }), n = 1;
    while (n <= 9 && usados.indexOf(n) >= 0) n++;
    if (n > 9) return null;   // nuvem cheia: nunca sobrescrever o slot de outra carreira
    mapa[id] = n;
    try { localStorage.setItem(CHAVE_SLOTS, JSON.stringify(mapa)); } catch (e) { console.warn('[sessao] não gravei o mapa de slots', e); }
    return n;
  }

  async function salvarCarreira(slot, dados, meta) {
    if (!(await logado())) return { ok: false, motivo: ehConvidado() ? 'convidado' : 'deslogado' };
    meta = meta || {};
    var n = slotNum(slot);
    if (!n) return { ok: false, motivo: 'cheio' };
    var r = await sb.rpc('salva_carreira', {
      p_slot: n, p_dados: dados,
      p_rotulo: meta.rotulo || null, p_clube: meta.clube || null,
      p_overall: meta.overall || null, p_temporada: meta.temporada || null, p_trofeus: meta.trofeus || 0
    });
    if (r.error) return { ok: false, motivo: 'erro', erro: r.error.message };
    return { ok: true, save: r.data };
  }

  async function listarSaves() {
    if (!(await logado())) return [];
    var r = await sb.from('saves_carreira')
      .select('id,slot,rotulo,clube,overall,temporada,trofeus,atualizado_em,save_id:dados->>saveId')
      .order('atualizado_em', { ascending: false });
    if (r && r.error) throw new Error('listar saves: ' + r.error.message);
    return (r && r.data) || [];
  }

  async function carregarSave(slot) {
    if (!(await logado())) return null;
    var n = slotNum(slot);
    if (!n) return null;
    var r = await sb.from('saves_carreira').select('dados').eq('slot', n).maybeSingle();
    if (r && r.error) throw new Error('carregar save: ' + r.error.message);
    return (r && r.data) ? r.data.dados : null;
  }

  async function apagarSave(slot) {
    if (!(await logado())) return false;
    var mapa = {}, id = String(slot);
    try { mapa = JSON.parse(localStorage.getItem(CHAVE_SLOTS) || '{}') || {}; } catch (e) { console.warn('[sessao] mapa de slots ilegível', e); }
    var n = mapa[id] || (/^[1-9]$/.test(id) ? parseInt(id, 10) : null);
    if (!n) return true;   // nunca foi para a nuvem
    var r = await sb.from('saves_carreira').delete().eq('slot', n);
    if (r.error) { console.warn('[sessao] apagar save na nuvem:', r.error.message); return false; }
    delete mapa[id];
    try { localStorage.setItem(CHAVE_SLOTS, JSON.stringify(mapa)); } catch (e) { console.warn('[sessao] mapa de slots', e); }
    return true;
  }

  window.Promessa = {
    sb: sb,
    sessao: sessao,
    usuario: usuario,
    logado: logado,
    perfil: perfil,
    obterApelido: obterApelido,
    salvarApelido: salvarApelido,
    saldo: saldo,
    sair: sair,
    irParaLogin: irParaLogin,
    entrarConvidado: entrarConvidado,
    sairConvidado: sairConvidado,
    ehConvidado: ehConvidado,
    exigirLoginOuConvidado: exigirLoginOuConvidado,
    salvarCarreira: salvarCarreira,
    listarSaves: listarSaves,
    carregarSave: carregarSave,
    apagarSave: apagarSave,
    /* a nuvem é a fonte dos números de slot: refaz o mapa local a partir dela antes de enviar */
    mapearSlots: function (linhas) {
      var mapa = {}, antigo = {};
      try { antigo = JSON.parse(localStorage.getItem(CHAVE_SLOTS) || '{}') || {}; } catch (e) { console.warn('[sessao] mapa de slots ilegível', e); }
      (linhas || []).forEach(function (l) { if (l && l.save_id && l.slot >= 1 && l.slot <= 9) mapa[String(l.save_id).slice(0, 64)] = l.slot; });
      var usados = Object.keys(mapa).map(function (k) { return mapa[k]; });
      Object.keys(antigo).forEach(function (k) { if (!mapa[k] && usados.indexOf(antigo[k]) < 0) { mapa[k] = antigo[k]; usados.push(antigo[k]); } });
      try { localStorage.setItem(CHAVE_SLOTS, JSON.stringify(mapa)); } catch (e) { console.warn('[sessao] mapa de slots', e); }
    }
  };
})();
