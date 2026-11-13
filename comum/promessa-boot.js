/**
 * promessa-boot.js - liga as mecânicas de comum/ui-promessa.js nas telas clássicas do PROMESSA
 * (menu + carreira, JxJ, Ultimate, abertura de pacote, conta). Carregar como <script type="module">.
 * As telas não importam nada: usam window.PromessaUI e atributos data-pm-*.
 */
import * as UI from './ui-promessa.js';

window.PromessaUI = { ...UI };  /* namespace de módulo é congelado: cópia para poder estender */
const ls = (k) => { try { return localStorage.getItem(k); } catch { return null; } };

/* economia de dados: o ajuste antigo do menu (futx-eco) vale para o jogo inteiro */
if (ls('futx-eco') === '1') UI.definirEconomia(true);
window.addEventListener('storage', (e) => { if (e.key === 'futx-eco') UI.definirEconomia(e.newValue === '1'); });

/* vibração curta em ações importantes: botões marcados com data-pm-vibrar ou classes de ação principal */
const ALVO_VIBRAR = '[data-pm-vibrar], .ih-btn.pri, .pm-btn, .av-cta, .btn-pri, .bt-pri';
document.addEventListener('click', (ev) => {
  if (ls('futx-vibrar') === '0') return;
  const b = ev.target instanceof Element ? ev.target.closest(ALVO_VIBRAR) : null;
  if (b && !b.disabled) UI.vibrar(12);
}, { capture: true, passive: true });

/* conquista: qualquer tela dispara window.dispatchEvent(new CustomEvent('promessa:conquista', { detail: { nivel } })) */
window.addEventListener('promessa:conquista', (e) => {
  const nivel = Math.max(0.5, Math.min(3, Number(e.detail && e.detail.nivel) || 1));
  UI.festejar(nivel); UI.vibrar([60, 40, 90]);
});

/* atalhos de teclado no PC: elementos com data-pm-atalho="tecla" recebem o clique */
document.addEventListener('keydown', (ev) => {
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  const t = ev.target;
  if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  const tecla = ev.key === ' ' ? 'espaco' : ev.key.toLowerCase();
  const alvo = [...document.querySelectorAll('[data-pm-atalho]')]
    .find((el) => el.getAttribute('data-pm-atalho').split(',').includes(tecla) && el.offsetParent !== null && !el.disabled);
  if (alvo) { ev.preventDefault(); alvo.click(); }
});

/* instalar como app (PWA): desligado por decisão de F (02/11); o código antigo está no histórico */

/* lembrar posição: elementos com data-pm-lembrar="chave" guardam o valor (select) ou o data-a do botão ativo */
document.addEventListener('change', (ev) => {
  const el = ev.target instanceof Element ? ev.target.closest('select[data-pm-lembrar]') : null;
  if (el) UI.lembrar('campo:' + el.getAttribute('data-pm-lembrar'), el.value);
});
export function restaurarCampos(raiz = document) {
  raiz.querySelectorAll('select[data-pm-lembrar]').forEach((el) => {
    const v = UI.recordar('campo:' + el.getAttribute('data-pm-lembrar'));
    if (v != null && [...el.options].some((o) => o.value === v) && el.value !== v) { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); }
  });
}
window.PromessaUI.restaurarCampos = restaurarCampos;
