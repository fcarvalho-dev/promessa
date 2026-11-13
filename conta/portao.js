'use strict';
/* PROMESSA · portão de conta + HUD de perfil no topo.
 * 1. Checa modo manutenção — se ativo, vai para manutencao.html.
 * 2. Quem tem sessão exibe a HUD oficial com apelido.
 * 3. Quem escolheu convidado joga e salva no navegador.
 * 4. Quem não tem sessão e não é convidado vai para conta/login.html.
 */
(function () {
  // 1. Checagem imediata de modo manutenção (compartilhada e otimizada)
  try {
    if (!window.__manutencaoPromise) {
      var prefix = location.pathname.indexOf('/cartas/') !== -1 ? '../' : (location.pathname.indexOf('/conta/') !== -1 ? '../' : '');
      window.__manutencaoPromise = fetch(prefix + 'dados/manutencao.json?t=' + Math.floor(Date.now() / 15000), { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (m) {
          if (m && m.ativa && !location.pathname.endsWith('manutencao.html') && !location.pathname.endsWith('editor.html')) {
            location.replace(prefix + 'manutencao.html');
          }
          return m;
        }).catch(function () { return null; });
    }
  } catch (e) { console.warn('[portao]', e); }

  function hud(info) {
    if (!document.getElementById('promessa-hud-css')) {
      var css = document.createElement('style');
      css.id = 'promessa-hud-css';
      css.textContent = [
        '#promessa-hud-wrap{position:fixed;top:12px;right:68px;z-index:9990;display:flex;align-items:center;gap:6px}',
        'html.ih-tema #promessa-hud-wrap,html.ih-aberto #promessa-hud-wrap{display:none!important}',
        '#promessa-hud-perfil,#promessa-hud-entrar{display:inline-flex;align-items:center;gap:10px;height:40px;padding:0 14px 0 5px;',
        'text-decoration:none;color:#F2F7F4;background:rgba(6,16,10,.9);border:1px solid rgba(0,255,135,.32);backdrop-filter:blur(8px);',
        "font-family:'Rajdhani','Segoe UI',system-ui,sans-serif;clip-path:polygon(0 0,calc(100% - 9px) 0,100% 9px,100% 100%,9px 100%,0 calc(100% - 9px));",
        'transition:border-color .2s,background .2s;box-shadow:0 8px 22px rgba(0,0,0,.55)}',
        '#promessa-hud-perfil:hover{border-color:rgba(0,255,135,.75);background:rgba(8,24,14,.96)}',
        '#promessa-hud-perfil.conv{border-color:rgba(232,184,75,.42)}#promessa-hud-perfil.conv:hover{border-color:rgba(232,184,75,.85)}',
        '#promessa-hud-perfil .av{width:30px;height:30px;display:grid;place-items:center;flex:none;font:700 17px/1 Teko,sans-serif;color:#03140b;background:#00FF87;',
        'clip-path:polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))}',
        '#promessa-hud-perfil.conv .av{background:#E8B84B;color:#231704}',
        '#promessa-hud-perfil .tx{display:flex;flex-direction:column;line-height:1.05;min-width:0}',
        '#promessa-hud-perfil b{font:700 17px/1 Teko,sans-serif;letter-spacing:.8px;text-transform:uppercase;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '#promessa-hud-perfil small{font-size:9.5px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:rgba(242,247,244,.6)}',
        '#promessa-hud-perfil.conv small{color:#E8B84B}',
        '#promessa-hud-entrar{padding:0 12px;font:700 15px/1 Teko,sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:#04110A;background:#00FF87;border-color:#00FF87}',
        '#promessa-hud-entrar:hover{filter:brightness(1.08)}',
        '@media (max-width:760px){#promessa-hud-wrap{top:10px;right:56px}#promessa-hud-perfil{height:36px;padding:0 10px 0 4px;gap:7px}#promessa-hud-perfil .av{width:26px;height:26px;font-size:15px}#promessa-hud-perfil b{font-size:15px;max-width:95px}#promessa-hud-perfil small{font-size:8.5px}#promessa-hud-entrar{height:36px;padding:0 10px;font-size:14px}}'
      ].join('');
      document.head.appendChild(css);
    }

    var wrap = document.getElementById('promessa-hud-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'promessa-hud-wrap';
      (document.body || document.documentElement).appendChild(wrap);
    }

    wrap.innerHTML = '';
    var el = document.createElement('a');
    el.id = 'promessa-hud-perfil';
    el.className = info.convidado ? 'conv' : '';
    el.href = 'conta/perfil.html';
    el.title = info.convidado ? 'Editar apelido ou ver perfil de convidado' : 'Meu perfil (' + info.nome + ')';
    var av = document.createElement('span'); av.className = 'av'; av.textContent = info.inicial;
    var tx = document.createElement('span'); tx.className = 'tx';
    var b = document.createElement('b'); b.textContent = info.nome;
    var sm = document.createElement('small'); sm.textContent = info.convidado ? 'Convidado · Perfil' : 'Ver perfil';
    tx.appendChild(b); tx.appendChild(sm); el.appendChild(av); el.appendChild(tx);
    wrap.appendChild(el);

    if (info.convidado) {
      var btLogin = document.createElement('a');
      btLogin.id = 'promessa-hud-entrar';
      btLogin.href = 'conta/login.html?next=' + encodeURIComponent('index.html');
      btLogin.title = 'Entrar ou criar sua conta oficial';
      btLogin.textContent = 'Entrar';
      wrap.appendChild(btLogin);
    }

    var posiciona = function () {
      var emCarreira = document.documentElement.classList.contains('ih-tema') || document.documentElement.classList.contains('ih-aberto');
      if (emCarreira) { wrap.style.display = 'none'; return; }
      wrap.style.display = 'flex';
      var g = document.querySelector('.pm-btn-config');
      var r = g && g.getBoundingClientRect();
      if (r && r.width > 0 && r.top >= 0 && r.top < 120) {
        wrap.style.top = Math.max(6, Math.round(r.top + (r.height - 40) / 2)) + 'px';
        wrap.style.right = Math.max(54, Math.round(window.innerWidth - r.left + 10)) + 'px';
      }
    };
    posiciona();
    if (!window.__promessaHudBound) {
      window.__promessaHudBound = true;
      window.addEventListener('resize', posiciona);
      setInterval(posiciona, 800);
    }
  }

  async function portao() {
    var P = window.Promessa;
    if (!P) { return; }

    var u = null;
    try { u = await P.usuario(); } catch (e) { console.warn('[portao] sessão indisponível:', e); }

    // 1. Usuário logado: exibe HUD oficial
    if (u) {
      var apelido = (P.obterApelido ? P.obterApelido(u, null) : null)
        || (u.user_metadata && (u.user_metadata.nick || u.user_metadata.apelido))
        || (u.email ? u.email.split('@')[0] : 'Jogador');
      hud({ nome: apelido, inicial: apelido.charAt(0).toUpperCase(), convidado: false });
      return;
    }

    // 2. Convidado ativo: joga normalmente com save local
    if (P.ehConvidado()) {
      var apConv = (P.obterApelido ? P.obterApelido(null, null) : null) || 'Convidado';
      hud({ nome: apConv, inicial: (apConv.charAt(0) || 'C').toUpperCase(), convidado: true });
      return;
    }

    // 3. Sem conta: carreira e JxJ não exigem login, entra como convidado (save só local).
    //    Ultimate e Online checam a conta na própria entrada.
    P.entrarConvidado();
    hud({ nome: 'Convidado', inicial: 'C', convidado: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', portao);
  else portao();

  window.addEventListener('promessa:apelido', portao);
  window.addEventListener('storage', portao);
  window.addEventListener('pageshow', portao);
  window.addEventListener('focus', portao);
})();
