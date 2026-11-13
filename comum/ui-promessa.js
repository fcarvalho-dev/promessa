/**
 * ui-promessa.js - mecânicas de site comuns ao PROMESSA inteiro (menu, carreira, JxJ, Ultimate, conta, Online).
 * Sem dependências, sem handler inline (CSP script-src 'self'). Tudo respeita prefers-reduced-motion e o modo economia.
 * Pop-up: mostrarModal/fecharModal (Esc, X, fundo, arrastar para baixo no celular).
 * Online: instalarSite/atualizarSelo/avisoDesfazer/dicas (as 6 originais).
 * Novas: esqueleto, trocarTela, contar/animarNumeros, festejar, vibrar, atalhos, puxarAtualizar,
 *        economia, lembrar/recordar, tour, notificar.
 */
const movel = () => window.matchMedia('(max-width: 900px)').matches;
const semMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || economia();

/* ---------- armazenamento por usuário (falha silenciosa é aceitável: só conveniência) ---------- */
let UID = 'anon';
export function definirUsuario(id) { UID = typeof id === 'string' && id ? id : 'anon'; }
const chave = (k) => `pm:${UID}:${k}`;
export function lembrar(k, v) { try { localStorage.setItem(chave(k), JSON.stringify(v)); } catch (e) { console.warn('[ui] lembrar', k, e); } }
export function recordar(k, padrao = null) {
  try { const s = localStorage.getItem(chave(k)); return s == null ? padrao : JSON.parse(s); }
  catch (e) { console.warn('[ui] recordar', k, e); return padrao; }
}

/* ---------- modo economia de dados ---------- */
export function economia() {
  const forcado = (() => { try { return localStorage.getItem('pm:economia'); } catch { return null; } })();
  if (forcado === '1') return true; if (forcado === '0') return false;
  const c = navigator.connection; return !!(c && (c.saveData || /2g/.test(c.effectiveType || '')));
}
export function definirEconomia(on) {
  try { localStorage.setItem('pm:economia', on ? '1' : '0'); } catch (e) { console.warn('[ui] economia', e); }
  document.documentElement.classList.toggle('pm-economia', !!on);
}
document.documentElement.classList.toggle('pm-economia', economia());

/* ---------- pop-up ---------- */
let aberto = false;
export function mostrarModal(html) {
  let el = document.getElementById('modal');
  if (!el) { el = document.createElement('div'); el.id = 'modal'; document.body.appendChild(el); }
  el.innerHTML = `<div class="md-fundo" data-a="fecharModal"></div><div class="md-caixa" role="dialog" aria-modal="true"><div class="md-alca" aria-hidden="true"></div>${html}<button class="md-x" type="button" data-a="fecharModal" aria-label="Fechar">&times;</button></div>`;
  aberto = true;
  const f = el.querySelector('input, select, .bt.n'); if (f && !movel()) f.focus();
}
export function fecharModal() { const el = document.getElementById('modal'); if (el) el.remove(); aberto = false; }
export const modalAberto = () => aberto;
function fecharAvisando() { fecharModal(); document.dispatchEvent(new CustomEvent('modal-fechado')); }
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && aberto) fecharAvisando(); });
document.addEventListener('click', (ev) => { if (ev.target.closest && ev.target.closest('#modal [data-a="fecharModal"]')) fecharAvisando(); });
/* arrastar para baixo fecha (celular): só a partir da alça/topo, ou com a caixa sem rolagem */
(() => {
  let y0 = null, cx = null;
  document.addEventListener('touchstart', (ev) => {
    const c = ev.target.closest && ev.target.closest('#modal .md-caixa');
    if (!c || !movel() || ev.target.closest('input, select, textarea') || c.scrollTop > 0) { y0 = null; return; }
    y0 = ev.touches[0].clientY; cx = c; c.style.transition = 'none';
  }, { passive: true });
  document.addEventListener('touchmove', (ev) => { if (y0 == null) return; const dy = Math.max(0, ev.touches[0].clientY - y0); cx.style.transform = `translateY(${dy}px)`; }, { passive: true });
  document.addEventListener('touchend', (ev) => {
    if (y0 == null) return; const dy = ev.changedTouches[0].clientY - y0; y0 = null;
    cx.style.transition = ''; if (dy > 90) fecharAvisando(); else cx.style.transform = '';
  }, { passive: true });
})();

/* ---------- toast + desfazer ---------- */
export function toast(txt, erro = false) {
  const t = document.createElement('div'); t.className = 'pm-toast' + (erro ? ' erro' : ''); t.setAttribute('role', 'status'); t.textContent = txt;
  document.body.appendChild(t); setTimeout(() => t.remove(), 3200);
}
export function avisoDesfazer(texto, fn) {
  document.querySelectorAll('.toast-desfazer').forEach((x) => x.remove());
  const t = document.createElement('div'); t.className = 'toast pm-toast toast-desfazer';
  t.innerHTML = '<span></span><button type="button" class="bt">Desfazer</button>';
  t.querySelector('span').textContent = texto;
  t.querySelector('button').onclick = () => { t.remove(); try { fn(); } catch (e) { console.error('[desfazer]', e); } };
  document.body.appendChild(t); setTimeout(() => t.remove(), 5000);
}

/* ---------- dicas (data-dica) ---------- */
let dicaEl = null;
function mostrarDica(alvo) {
  esconderDica();
  dicaEl = document.createElement('div'); dicaEl.className = 'dica-balao'; dicaEl.setAttribute('role', 'tooltip'); dicaEl.textContent = alvo.dataset.dica;
  document.body.appendChild(dicaEl);
  const r = alvo.getBoundingClientRect(); const w = dicaEl.offsetWidth, h = dicaEl.offsetHeight;
  const left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left + r.width / 2 - w / 2));
  const top = r.top - h - 8 > 8 ? r.top - h - 8 : r.bottom + 8;
  dicaEl.style.left = left + 'px'; dicaEl.style.top = (top + window.scrollY) + 'px';
}
function esconderDica() { if (dicaEl) { dicaEl.remove(); dicaEl = null; } }
document.addEventListener('click', (ev) => {
  const d = ev.target.closest && ev.target.closest('[data-dica]');
  if (d && !d.closest('[data-a]')) { mostrarDica(d); return; } if (!d) esconderDica();
});
document.addEventListener('mouseover', (ev) => { const d = ev.target.closest && ev.target.closest('[data-dica]'); if (d && !movel()) mostrarDica(d); });
document.addEventListener('mouseout', (ev) => { if (ev.target.closest && ev.target.closest('[data-dica]') && !movel()) esconderDica(); });

/* ---------- abas por gesto + selo de avisos ---------- */
let CFG = null;
/** cfg: { abas, palco, lado?, topo?, chaveAba?, aoAtualizar? } - seletores CSS. */
export function instalarSite(cfg) {
  CFG = cfg;
  let x0 = null, y0 = null;
  document.addEventListener('touchstart', (ev) => {
    const t = ev.target;
    if (!movel() || !t.closest || !t.closest(cfg.palco) || t.closest('.tr-campo, .pm-sem-gesto, input, select, textarea, #modal')) { x0 = null; return; }
    x0 = ev.touches[0].clientX; y0 = ev.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', (ev) => {
    if (x0 == null) return;
    const dx = ev.changedTouches[0].clientX - x0, dy = ev.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) < 70 || Math.abs(dy) > 45) return;
    trocarAba(dx < 0 ? 1 : -1);
  }, { passive: true });
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest || !ev.target.closest('#seloAvisos') || !cfg.lado) return;
    const lado = document.querySelector(cfg.lado); mostrarModal(`<div class="md-avisos">${lado ? lado.innerHTML : ''}</div>`);
  });
  window.addEventListener('resize', atualizarSelo);
  atalhos({ ArrowRight: () => trocarAba(1), ArrowLeft: () => trocarAba(-1) });
  for (let n = 1; n <= 9; n++) atalhos({ [String(n)]: () => { const b = document.querySelectorAll(cfg.abas + ' [data-a="aba"]')[n - 1]; if (b) trocarTela(() => b.click()); } });
  if (cfg.aoAtualizar) puxarAtualizar(cfg.aoAtualizar);
  instalarNav();
}
function trocarAba(passo) {
  if (!CFG || aberto) return;
  const bts = [...document.querySelectorAll(CFG.abas + ' [data-a="aba"]')];
  const i = bts.findIndex((b) => b.getAttribute('aria-selected') === 'true');
  const prox = bts[i + passo];
  if (prox) { trocarTela(() => prox.click()); prox.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); window.scrollTo({ top: 0 }); }
}
export function atualizarSelo() {
  if (!CFG || !CFG.lado || !CFG.topo) return;
  const lado = document.querySelector(CFG.lado); const topo = document.querySelector(CFG.topo);
  if (!lado || !topo) return;
  const n = lado.querySelectorAll('.aviso').length;
  let b = document.getElementById('seloAvisos');
  if (!b) { b = document.createElement('button'); b.id = 'seloAvisos'; b.type = 'button'; b.className = 'selo-avisos'; b.setAttribute('aria-label', 'Avisos'); }
  b.innerHTML = 'Avisos' + (n ? `<span class="cont">${n}</span>` : '');
  if (!topo.contains(b)) topo.appendChild(b);
}

/* ---------- 1. esqueleto de carregamento ---------- */
export function esqueleto(el, linhas = 4) {
  if (!el) return;
  el.innerHTML = `<div class="pm-esq" aria-busy="true" aria-label="Carregando">${'<div class="pm-esq-l"></div>'.repeat(linhas)}</div>`;
}

/* ---------- 2. transição entre telas ---------- */
export function trocarTela(fn) {
  if (semMovimento() || !document.startViewTransition) { fn(); return; }
  try {
    const vt = document.startViewTransition(fn);
    /* transição interrompida (troca rápida, aba oculta) não é erro: o fn roda de qualquer jeito */
    const ok = (e) => { if (!e || e.name !== 'AbortError' && e.name !== 'InvalidStateError') console.warn('[ui] transição', e); };
    vt.ready.catch(ok); vt.finished.catch(ok); vt.updateCallbackDone.catch((e) => console.error('[ui] troca de tela', e));
  } catch (e) { console.warn('[ui] transição', e); fn(); }
}

/* ---------- 3. números animados ---------- */
const fmt = new Intl.NumberFormat('pt-BR');
export function contar(el, para, ms = 600) {
  if (!el || !Number.isFinite(para)) return;
  const de = Number(el.dataset.contarAtual ?? para); el.dataset.contarAtual = String(para);
  if (semMovimento() || de === para) { el.textContent = fmt.format(para); return; }
  const t0 = performance.now();
  const passo = (t) => { const p = Math.min(1, (t - t0) / ms); const v = Math.round(de + (para - de) * (1 - (1 - p) ** 3)); el.textContent = fmt.format(v); if (p < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}
/** Anima todo [data-contar="N"] dentro de raiz, partindo do último valor visto naquela chave (data-contar-id). */
const vistos = new Map();
export function animarNumeros(raiz = document) {
  raiz.querySelectorAll('[data-contar]').forEach((el) => {
    const v = Number(el.dataset.contar); if (!Number.isFinite(v)) return;
    const id = el.dataset.contarId; if (id && vistos.has(id)) el.dataset.contarAtual = String(vistos.get(id));
    contar(el, v); if (id) vistos.set(id, v);
  });
}

/* ---------- 4. confetes/brilho (canvas, sem emoji) ---------- */
export function festejar(intensidade = 1) {
  if (semMovimento()) return;
  const cv = document.createElement('canvas'); cv.className = 'pm-confete'; cv.width = innerWidth; cv.height = innerHeight;
  document.body.appendChild(cv); const g = cv.getContext('2d'); if (!g) { cv.remove(); return; }
  const cores = ['#E8B84B', '#00FF87', '#ffffff', '#f5d27a'];
  const n = Math.round(90 * Math.max(0.3, Math.min(2, intensidade)));
  const ps = Array.from({ length: n }, () => ({ x: innerWidth / 2, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 12 - 4, r: Math.random() * 6 + 3, a: Math.random() * 6, c: cores[(Math.random() * cores.length) | 0] }));
  const t0 = performance.now();
  const frame = (t) => {
    const dt = t - t0; g.clearRect(0, 0, cv.width, cv.height);
    for (const p of ps) { p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += 0.2; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.globalAlpha = Math.max(0, 1 - dt / 1800); g.fillStyle = p.c; g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); g.restore(); }
    if (dt < 1800) requestAnimationFrame(frame); else cv.remove();
  };
  requestAnimationFrame(frame); vibrar([30, 40, 30]);
}

/* ---------- 5. vibração ---------- */
export function vibrar(padrao = 25) {
  if (economia() || recordar('semVibrar', false)) return;
  try { if (navigator.vibrate) navigator.vibrate(padrao); } catch (e) { console.warn('[ui] vibrar', e); }
}

/* ---------- 6. atalhos de teclado (PC) ---------- */
const mapa = new Map();
export function atalhos(defs) { for (const [k, fn] of Object.entries(defs)) mapa.set(k, fn); }
document.addEventListener('keydown', (ev) => {
  if (ev.ctrlKey || ev.metaKey || ev.altKey || aberto) return;
  const t = ev.target; if (t && (t.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName))) return;
  const fn = mapa.get(ev.key); if (!fn) return;
  ev.preventDefault(); try { fn(ev); } catch (e) { console.error('[ui] atalho', ev.key, e); }
});

/* ---------- 7. puxar para atualizar ---------- */
let puxarInstalado = false;
export function puxarAtualizar(fn) {
  if (puxarInstalado) return; puxarInstalado = true;
  let y0 = null; const ind = document.createElement('div'); ind.className = 'pm-puxar'; ind.textContent = 'Solte para atualizar';
  document.addEventListener('touchstart', (ev) => { y0 = window.scrollY <= 0 && !aberto && !ev.target.closest('.tr-campo, .pm-sem-gesto') ? ev.touches[0].clientY : null; }, { passive: true });
  document.addEventListener('touchmove', (ev) => {
    if (y0 == null) return; const dy = ev.touches[0].clientY - y0;
    if (dy > 20) { if (!ind.isConnected) document.body.appendChild(ind); ind.classList.toggle('pronto', dy > 110); ind.style.opacity = String(Math.min(1, dy / 110)); }
  }, { passive: true });
  document.addEventListener('touchend', async () => {
    if (y0 == null) return; y0 = null; const ok = ind.classList.contains('pronto'); ind.remove(); ind.classList.remove('pronto');
    if (!ok) return; vibrar(15);
    try { await fn(); } catch (e) { console.error('[ui] atualizar', e); toast('Não foi possível atualizar', true); }
  }, { passive: true });
}

/* ---------- 8. destaques na primeira vez ---------- */
/** passos: [{ alvo: seletor, texto }]. Mostra uma vez por usuário e chave. */
export function tour(id, passos) {
  if (recordar('tour:' + id, false) || !Array.isArray(passos) || !passos.length) return;
  let i = 0; const cx = document.createElement('div'); cx.className = 'pm-tour'; document.body.appendChild(cx);
  const fim = () => { cx.remove(); document.querySelectorAll('.pm-tour-alvo').forEach((x) => x.classList.remove('pm-tour-alvo')); lembrar('tour:' + id, true); };
  const mostra = () => {
    document.querySelectorAll('.pm-tour-alvo').forEach((x) => x.classList.remove('pm-tour-alvo'));
    const p = passos[i]; const alvo = p && document.querySelector(p.alvo);
    if (!p) { fim(); return; } if (!alvo) { i++; mostra(); return; }
    alvo.classList.add('pm-tour-alvo'); alvo.scrollIntoView({ block: 'center', behavior: semMovimento() ? 'auto' : 'smooth' });
    cx.innerHTML = '<p></p><div class="md-bts"><button type="button" class="bt" data-t="pular">Pular</button><button type="button" class="bt n" data-t="prox"></button></div>';
    cx.querySelector('p').textContent = p.texto; cx.querySelector('[data-t="prox"]').textContent = i === passos.length - 1 ? 'Entendi' : `Próximo (${i + 1}/${passos.length})`;
  };
  cx.addEventListener('click', (ev) => { const b = ev.target.closest('[data-t]'); if (!b) return; if (b.dataset.t === 'pular') fim(); else { i++; mostra(); } });
  mostra();
}

/* ---------- 9. notificação do navegador ---------- */
/** Pedir permissão só a partir de um clique do usuário. */
export async function pedirNotificacoes() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true; if (Notification.permission === 'denied') return false;
  try { return (await Notification.requestPermission()) === 'granted'; } catch (e) { console.warn('[ui] notificação', e); return false; }
}
/** Só notifica com a aba em segundo plano; tag evita repetir o mesmo aviso. */
export function notificar(titulo, corpo, tag) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return;
  try { const n = new Notification(titulo, { body: corpo, tag, icon: '/favicon.png' }); n.onclick = () => { window.focus(); n.close(); }; }
  catch (e) { console.warn('[ui] notificar', e); }
}

/* ------------------------------------------------ navegação das abas (todas as telas de cargo)
 * As telas continuam gerando os botões [data-a="aba"] em #abas; aqui só se reorganiza:
 * celular = barra fixa embaixo (4 abas + "Mais"); PC = menu lateral que pode encolher para ícones. */
const IC = {
  patrocinio: '<path d="M4 11.6V5a1 1 0 0 1 1-1h6.6a1 1 0 0 1 .7.3l7.4 7.4a1 1 0 0 1 0 1.4l-6.6 6.6a1 1 0 0 1-1.4 0L4.3 12.3a1 1 0 0 1-.3-.7z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
  estadio: '<ellipse cx="12" cy="8.5" rx="8" ry="3"/><path d="M4 8.5v6.5c0 1.7 3.6 3 8 3s8-1.3 8-3V8.5M8 11.2v6.4M16 11.2v6.4"/>',
  financas: '<path d="M4 20h16M6.5 16.5V12M11 16.5V7M15.5 16.5v-6M20 4l-4 3.5-3-2L8 9"/>',
  orcamento: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>',
  elenco: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5c.6-3.1 2.8-5.2 5.5-5.2s4.9 2.1 5.5 5.2M16 4.9a3.2 3.2 0 0 1 0 6.2M17.6 14.6c1.6.8 2.6 2.5 2.9 4.9"/>',
  torcida: '<path d="M5 21V4M5 4.5h10.5l-2.2 4 2.2 4H5"/>',
  relatorio: '<path d="M7 3h7l5 5v11.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19.5v-15A1.5 1.5 0 0 1 7.5 3z"/><path d="M14 3v5h5M9.5 13h5M9.5 16.5h3"/>',
  contratos: '<path d="M4 20.5h6M15 4.5l4.5 4.5L10 18.5H5.5V14z"/>',
  prancheta: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14M3 9.5h3v5H3M21 9.5h-3v5h3"/><circle cx="12" cy="12" r="2.2"/>',
  instrucoes: '<path d="M4 18c3-1 4.5-4 7-6s5-2.5 8-6"/><path d="M15 6h4v4"/><circle cx="5" cy="7" r="1.6"/><path d="M15.5 15.5l3 3M18.5 15.5l-3 3"/>',
  treino: '<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5V10M10 3h4M18.2 6.8l1.3-1.3"/>',
  vestiario: '<path d="M8.5 4L4 7l2 3.5 2-1V20h8V9.5l2 1L20 7l-4.5-3c-.6 1.5-1.9 2.4-3.5 2.4S9.1 5.5 8.5 4z"/>',
  adversario: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22"/>',
  enfermaria: '<path d="M9.5 4h5v5.5H20v5h-5.5V20h-5v-5.5H4v-5h5.5z"/>',
  prevencao: '<path d="M12 3l7 2.8v5.4c0 4.4-2.9 7.9-7 9.8-4.1-1.9-7-5.4-7-9.8V5.8z"/><path d="M9 12l2.2 2.2L15.5 10"/>',
  departamento: '<rect x="3.5" y="7.5" width="17" height="12.5" rx="2"/><path d="M9 7.5V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5v2M12 11v5.5M9.2 13.8h5.6"/>',
  plantel: '<path d="M3 12h4l2.5-6 4 12 2.5-6H21"/>',
  cargas: '<path d="M2.5 9.5v5M5.5 7v10M18.5 7v10M21.5 9.5v5M5.5 12h13"/>',
  programas: '<path d="M4 19.5h16"/><path d="M6.5 16V12M11 16V8.5M15.5 16V5"/><path d="M14 6.5l1.5-1.5 1.5 1.5"/>',
  historico: '<path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4v4.5H8M12 8v4.2l2.8 1.8"/>',
  mercado: '<path d="M4 8h14.5M15 4.5L18.5 8 15 11.5M20 16H5.5M9 12.5L5.5 16 9 19.5"/>',
  tabela: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9.5h18M3 14.8h18M9 9.5V20"/>',
  mais: '<circle cx="5.5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18.5" cy="12" r="1.4"/>',
  recolher: '<path d="M14.5 6.5L9 12l5.5 5.5M20 5v14"/>',
  _: '<circle cx="12" cy="12" r="7.5"/>',
};
const icone = (k) => `<svg class="nav-ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${IC[k] || IC._}</svg>`;
let navObs = null;
function montarNav() {
  const nav = CFG && CFG.abas && document.querySelector(CFG.abas); if (!nav) return;
  const pr = nav.closest('.pr'); if (!pr) return;
  pr.classList.add('nav2');
  pr.classList.toggle('nav-mini', !movel() && !!recordar('nav:mini', false));
  const bts = [...nav.querySelectorAll('[data-a="aba"]')];
  for (const b of bts) {
    if (b.querySelector('.nav-ic')) continue;
    const rot = document.createElement('span'); rot.className = 'nav-rot';
    while (b.firstChild) rot.appendChild(b.firstChild);   // preserva contadores (.cont)
    b.title = rot.textContent.trim();
    b.insertAdjacentHTML('afterbegin', icone(b.dataset.v)); b.appendChild(rot);
  }
  nav.querySelectorAll('.nav-mais, .nav-recolher').forEach((x) => x.remove());
  bts.forEach((b) => b.classList.remove('nav-extra'));
  if (movel() && bts.length > 5) {
    const sel = bts.findIndex((b) => b.getAttribute('aria-selected') === 'true');
    const vis = new Set([0, 1, 2, 3]); if (sel >= 4) { vis.delete(3); vis.add(sel); }
    const extras = bts.filter((b, i) => !vis.has(i));
    extras.forEach((b) => b.classList.add('nav-extra'));
    const m = document.createElement('button'); m.type = 'button'; m.className = 'nav-mais'; m.setAttribute('aria-label', 'Mais abas');
    m.innerHTML = icone('mais') + '<span class="nav-rot">Mais</span>' + (extras.some((b) => b.querySelector('.cont')) ? '<i class="nav-ponto"></i>' : '');
    nav.appendChild(m);
  } else if (!movel()) {
    const r = document.createElement('button'); r.type = 'button'; r.className = 'nav-recolher';
    r.setAttribute('aria-label', pr.classList.contains('nav-mini') ? 'Expandir menu' : 'Recolher menu');
    r.innerHTML = icone('recolher') + '<span class="nav-rot">Recolher</span>';
    nav.appendChild(r);
  }
  if (navObs) navObs.takeRecords();   // as mudanças acima não disparam nova montagem
}
function instalarNav() {
  const nav = CFG && CFG.abas && document.querySelector(CFG.abas); if (!nav || navObs) return;
  navObs = new MutationObserver(montarNav);
  navObs.observe(nav, { childList: true });
  montarNav();
  let t = null; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(montarNav, 120); });
  document.addEventListener('click', (ev) => {
    const alvo = ev.target.closest && ev.target.closest('.nav-mais, .nav-recolher, [data-nav-ir]');
    if (!alvo) return;
    if (alvo.classList.contains('nav-recolher')) { lembrar('nav:mini', !recordar('nav:mini', false)); montarNav(); return; }
    if (alvo.classList.contains('nav-mais')) {
      const extras = [...nav.querySelectorAll('.nav-extra')];
      mostrarModal(`<h2>Mais</h2><div class="nav-lista">${extras.map((b) => `<button type="button" data-nav-ir="${String(b.dataset.v).replace(/[^a-z0-9_-]/gi, '')}">${icone(b.dataset.v)}<span>${b.querySelector('.nav-rot').innerHTML}</span></button>`).join('')}</div>`);
      return;
    }
    const b = nav.querySelector(`[data-a="aba"][data-v="${alvo.dataset.navIr}"]`);
    fecharModal(); if (b) trocarTela(() => b.click());
  });
}
