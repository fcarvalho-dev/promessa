'use strict';
/* PROMESSA · Cartas — tela principal (partido "Painel").
 *
 * Lê os dados reais do jogo: dados/drops/_drops.json, dados/drops/drop0.json
 * e dados/economia.json. Nenhum número aqui é inventado no front — se a
 * chance de um pacote muda no editor, muda aqui sem tocar neste arquivo.
 *
 * O saldo vem do Supabase quando há sessão; sem sessão a tela abre em modo
 * vitrine: mostra o catálogo e explica por que não dá para comprar.
 */
(function () {
  var ORDEM = ['bronze', 'prata', 'ouro', 'safira', 'diamante', 'mitica'];
  var LBLS = ['RIT', 'FIN', 'PAS', 'DRI', 'DEF', 'FIS'];
  var LIGA_NOME = { ENG: 'Premier League', ESP: 'LaLiga', ITA: 'Serie A', BRA: 'Brasileirão' };

  var S = {
    aba: 'inicio', drops: [], drop: null, econ: null,
    usuario: null, convidado: false, saldo: 0,
    inventario: [],
    filtro: { rar: '', liga: '', q: '' }, sel: null, erro: null
  };

  var esc = function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; };
  var num = function (n) { return Number(n || 0).toLocaleString('pt-BR'); };
  var ico = function (n) { return "--ico:url('../icones/" + n + ".svg')"; };
  var pct = function (v) { return (v < 1 ? v.toFixed(2) : v.toFixed(1)).replace('.', ',') + '%'; };

  async function json(u) {
    var r = await fetch(u);
    if (!r.ok) throw new Error(u + ' respondeu ' + r.status);
    return r.json();
  }

  async function carrega() {
    try {
      var res = await Promise.all([
        json('../dados/drops/_drops.json'),
        json('../dados/drops/drop0.json'),
        json('../dados/economia.json')
      ]);
      S.drops = res[0]; S.drop = res[1]; S.econ = res[2];
    } catch (e) {
      S.erro = 'Não deu para carregar o catálogo: ' + e.message;
      console.error('[cartas]', e);
      return;
    }
    var P = window.Promessa;
    if (P) {
      try { S.usuario = await P.usuario(); } catch (e) { console.warn('[cartas] sessão:', e); }
      S.convidado = !S.usuario && P.ehConvidado();
      if (S.usuario) { try { S.saldo = await P.saldo(); } catch (e) { console.warn('[cartas] saldo:', e); } }
    }
  }

  function hudTopo() {
    var nome = S.usuario
      ? ((S.usuario.user_metadata && (S.usuario.user_metadata.nick || S.usuario.user_metadata.apelido))
         || (S.usuario.email || 'Jogador').split('@')[0])
      : 'Convidado';
    return '<header class="topo">'
      + '<div><div class="marca">PROMESSA</div><div class="marca-sub">Cartas</div></div>'
      + '<div class="mei">'
      + '<a class="pil ouro" href="#" data-aba="missoes" title="Moedas do jogo"><small>Moedas</small> ' + num(S.saldo) + '</a>'
      + '<a class="perfil' + (S.usuario ? '' : ' conv') + '" href="../conta/perfil.html">'
      + '<span class="av">' + esc(nome.charAt(0).toUpperCase()) + '</span><span>' + esc(nome) + '</span></a>'
      + '<button class="icobt" id="btCfg" title="Regras, termos e privacidade" style="' + ico('apito') + '"><i></i></button>'
      + '</div></header>';
  }

  function navLateral() {
    var its = [
      ['inicio', 'campo', 'Início', false],
      ['pacotes', 'camisa', 'Pacotes', false],
      ['colecao', 'medalha', 'Coleção', false],
      ['mercado', 'troca', 'Mercado', false],
      ['missoes', 'trofeu2', 'Missões', true]
    ];
    return '<nav class="lado">' + its.map(function (i) {
      return '<button data-aba="' + i[0] + '"' + (S.aba === i[0] ? ' aria-current="page"' : '')
        + ' style="' + ico(i[1]) + '"><i></i>' + i[2] + (i[3] ? '<span class="bol"></span>' : '') + '</button>';
    }).join('') + '</nav>';
  }

  function bannerEvento() {
    var d = S.drop, r = d.resumo, lendas = [];
    ['BRA', 'ENG', 'ESP'].forEach(function (lg) {
      var c = d.cartas.filter(function (x) { return x.liga === lg && x.idolo === 'liga'; })[0];
      if (c) lendas.push(c);
    });
    var dias = Math.max(0, Math.ceil((new Date(d.fecha) - new Date()) / 86400000));
    return '<section class="evento chanfro">'
      + '<img class="fundo" src="../assets/banner_drop0.jpg" alt="" onerror="this.remove()">'
      + '<div class="ec"><div>'
      + '<span class="eyb">Evento de estreia</span><h1>Drop <em>0</em></h1>'
      + '<p>' + esc(d.descricao) + ' ' + num(r.cartas) + ' cartas e ' + num(r.exemplares_total)
      + ' exemplares no total — quando a tiragem acaba, só pelo mercado.</p>'
      + '<div class="lendas">' + lendas.map(function (c) {
          return '<span class="lenda"><b>' + c.ovr + '</b><span>' + esc(c.nome)
            + '<small>' + esc(LIGA_NOME[c.liga] || c.liga) + '</small></span></span>';
        }).join('') + '</div></div>'
      + '<div class="prazo">termina em<b>' + dias + '</b>dias</div></div></section>';
  }

  function blocoRaridades() {
    var r = S.drop.resumo;
    return '<div class="pan chanfro"><h3>O que tem no Drop 0</h3>'
      + ORDEM.filter(function (k) { return r.por_raridade[k]; }).reverse().map(function (k) {
          return '<div class="l"><span class="pt" style="background:var(--r-' + k + ')"></span>' + k
            + '<span class="v">' + num(r.por_raridade[k])
            + ' <span class="dim" style="font-weight:600">· ' + num(r.exemplares[k]) + ' ex.</span></span></div>';
        }).join('') + '</div>';
  }

  function cartaHTML(c, mint) {
    var ea = c.ea || {};
    var st = [ea.rit, ea.fin, ea.pas, ea.dri, ea.def, ea.fis];
    return '<div class="carta ' + c.raridade + '">'
      + '<div class="c-top"><span class="c-marca">PROMESSA</span><span class="c-serie">DROP 0 · 2026/27</span></div>'
      + '<div class="c-hero"><div class="c-ovr"><b>' + c.ovr + '</b><span class="c-pos">' + esc(c.pos || '') + '</span></div>'
      + '<div><span class="c-rar">' + c.raridade + '</span></div></div>'
      + '<div class="c-camisa"><span class="tag">MANTO OFICIAL</span><span class="num">' + (c.n % 100) + '</span></div>'
      + '<div class="c-nome"><b>' + esc(c.nome) + '</b><span>' + esc(c.clube) + '</span></div>'
      + '<div class="c-stats">' + st.map(function (v, i) {
          return '<div><b>' + (v == null ? '—' : v) + '</b><span>' + LBLS[i] + '</span></div>';
        }).join('') + '</div>'
      + '<div class="c-pe"><span>' + (c.pe ? 'PÉ ' + String(c.pe).toUpperCase() : '') + '</span>'
      + '<span>MINT ' + (mint || '—') + ' / ' + num(c.tiragem) + '</span></div></div>';
  }

  function listaPacotes() {
    var p = S.econ.pacotes;
    return '<div class="pacotes">' + Object.keys(p).map(function (k) {
      var x = p[k], prem = k !== 'base';
      var odds = ORDEM.filter(function (r) { return x.odds[r]; }).reverse()
        .map(function (r) { return r + ' ' + pct(x.odds[r]); }).join(' · ');
      var pode = !!S.usuario && S.saldo >= x.preco;
      return '<div class="pct' + (prem ? ' premium' : '') + '">'
        + '<i class="pct-ico" style="' + ico(k === 'base' ? 'camisa' : (k === 'elite' ? 'trofeu' : 'podio')) + '"></i>'
        + '<div><div class="pct-n">' + esc(x.nome) + '</div>'
        + '<div class="pct-d">' + x.cartas + ' cartas' + (x.garantido ? ' · ' + esc(x.garantido.rotulo) : '') + '</div>'
        + '<div class="pct-ch">' + odds + '</div></div>'
        + '<div class="pct-dir"><span class="pct-p">' + num(x.preco) + '</span>'
        + '<button class="btn ' + (prem ? 'btn-ouro' : 'btn-pri') + ' chanfro sm" data-abrir="' + k + '"'
        + (pode ? '' : ' disabled') + '>Abrir</button></div></div>';
    }).join('') + '</div>'
      + '<p class="dim" style="font-size:11.5px;margin-top:10px">As chances acima são as do sorteio. '
      + 'A animação de abertura é apresentação e não altera o resultado.</p>';
  }

  function blocoColecaoResumo() {
    var r = S.drop.resumo, tenho = {};
    S.inventario.forEach(function (c) { tenho[c.raridade] = (tenho[c.raridade] || 0) + 1; });
    return '<div class="pan chanfro"><h3>Sua coleção</h3>'
      + ORDEM.filter(function (k) { return r.por_raridade[k]; }).reverse().map(function (k) {
          var t = tenho[k] || 0, de = r.por_raridade[k];
          return '<div class="l" style="display:block"><div style="display:flex;align-items:center">'
            + '<span class="pt" style="background:var(--r-' + k + ')"></span>' + k
            + '<span class="v">' + t + ' / ' + num(de) + '</span></div>'
            + '<div class="barra"><i style="width:' + (de ? Math.min(100, 100 * t / de) : 0) + '%;background:var(--r-' + k + ')"></i></div></div>';
        }).join('') + '</div>';
  }

  function filtrados() {
    var f = S.filtro, q = f.q.trim().toLowerCase();
    return S.drop.cartas.filter(function (c) {
      if (f.rar && c.raridade !== f.rar) return false;
      if (f.liga && c.liga !== f.liga) return false;
      if (q && c.nome.toLowerCase().indexOf(q) < 0 && c.clube.toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }

  function barraFiltro() {
    var f = S.filtro;
    var bot = function (v, r) { return '<button data-rar="' + v + '" aria-pressed="' + (f.rar === v) + '">' + r + '</button>'; };
    var bl = function (v, r) { return '<button data-liga="' + v + '" aria-pressed="' + (f.liga === v) + '">' + r + '</button>'; };
    return '<div class="pills">' + bot('', 'Todas')
      + ORDEM.filter(function (k) { return S.drop.resumo.por_raridade[k]; }).reverse().map(function (k) { return bot(k, k); }).join('')
      + '</div><div class="pills">' + bl('', 'Todas as ligas')
      + ['BRA', 'ENG', 'ESP', 'ITA'].map(function (k) { return bl(k, LIGA_NOME[k]); }).join('')
      + '<input class="busca" id="q" placeholder="Buscar jogador ou clube" value="' + esc(f.q) + '"></div>';
  }

  function precoRef(c) { return Math.round((S.econ.resgate_por_raridade[c.raridade] || 10) * 3); }

  function tabelaCartas(lista, modo) {
    if (!lista.length) return '<div class="vazio">Nada encontrado com esses filtros.</div>';
    return '<div class="rolagem"><table class="tab"><thead><tr>'
      + '<th>OVR</th><th>Carta</th><th>Pos</th><th>Raridade</th><th>Liga</th><th>Tiragem</th>'
      + (modo === 'mercado' ? '<th>Preço</th>' : '') + '</tr></thead><tbody>'
      + lista.slice(0, 300).map(function (c) {
          return '<tr data-n="' + c.n + '"' + (S.sel && S.sel.n === c.n ? ' aria-selected="true"' : '') + '>'
            + '<td class="o" style="color:var(--r-' + c.raridade + ')">' + c.ovr + '</td>'
            + '<td class="n">' + esc(c.nome) + '<small>' + esc(c.clube) + '</small></td>'
            + '<td class="r dim">' + esc(c.pos || '') + '</td>'
            + '<td class="r"><span class="pt" style="background:var(--r-' + c.raridade + ')"></span>' + c.raridade + '</td>'
            + '<td class="r dim">' + esc(LIGA_NOME[c.liga] || c.liga) + '</td>'
            + '<td class="r dim">' + num(c.tiragem) + '</td>'
            + (modo === 'mercado' ? '<td class="v">' + num(precoRef(c)) + '</td>' : '') + '</tr>';
        }).join('') + '</tbody></table></div>'
      + (lista.length > 300 ? '<p class="dim" style="font-size:11.5px;margin-top:8px">Mostrando 300 de '
          + num(lista.length) + '. Use os filtros.</p>' : '');
  }

  function painelDetalhe() {
    if (!S.sel) return '<div class="pan chanfro"><h3>Detalhe</h3>'
      + '<p class="dim" style="font-size:12.5px;margin:0">Clique numa carta da lista para ver a ficha completa.</p></div>';
    var c = S.sel;
    return '<div class="det">' + cartaHTML(c, '000')
      + '<div><div class="pan chanfro"><h3>Ficha</h3>'
      + '<div class="l">Clube<span class="v">' + esc(c.clube) + '</span></div>'
      + '<div class="l">Liga<span class="v">' + esc(LIGA_NOME[c.liga] || c.liga) + '</span></div>'
      + '<div class="l">Posição<span class="v">' + esc(c.pos || '—') + '</span></div>'
      + '<div class="l">Idade<span class="v">' + (c.idade || '—') + '</span></div>'
      + '<div class="l">Pé dominante<span class="v">' + esc(c.pe || '—') + '</span></div>'
      + '<div class="l">Overall<span class="v">' + c.ovr + '</span></div></div>'
      + '<div class="pan chanfro"><h3>Edição</h3>'
      + '<div class="l">Raridade<span class="v" style="color:var(--r-' + c.raridade + ')">' + c.raridade + '</span></div>'
      + (c.raridade !== c.raridade_global ? '<div class="l">Subiu por<span class="v">Ídolo da liga</span></div>' : '')
      + '<div class="l">Tiragem<span class="v">' + num(c.tiragem) + '</span></div>'
      + '<div class="l">Drop<span class="v">' + esc(S.drop.nome) + '</span></div>'
      + '<div class="l">Resgate se repetida<span class="v ouro">' + num(S.econ.resgate_por_raridade[c.raridade]) + '</span></div>'
      + '<div class="l">Preço sugerido<span class="v ouro">' + num(precoRef(c)) + '</span></div></div>'
      + '<div style="display:flex;gap:9px;flex-wrap:wrap">'
      + '<button class="btn btn-pri chanfro sm" disabled>Anunciar</button>'
      + '<button class="btn btn-sec chanfro sm" disabled>Comprar</button></div>'
      + '<p class="dim" style="font-size:11.5px;margin-top:8px">Comprar e anunciar ficam ativos quando o drop for liberado.</p>'
      + '</div></div>';
  }

  function telaInicio() {
    return '<div class="cabe"><h2>Início</h2><span class="c">' + esc(S.drop.nome) + '</span></div>'
      + bannerEvento()
      + '<div class="cols"><div><div class="cabe"><h2 style="font-size:22px">Pacotes em cartaz</h2></div>'
      + listaPacotes() + '</div><div>' + blocoRaridades() + blocoColecaoResumo() + '</div></div>';
  }
  function telaPacotes() {
    return '<div class="cabe"><h2>Pacotes</h2><span class="c">moeda do jogo</span></div>'
      + '<div class="cols"><div>' + listaPacotes() + '</div><div>' + blocoRaridades() + '</div></div>';
  }
  function telaColecao() {
    if (!S.usuario) {
      return '<div class="cabe"><h2>Coleção</h2><span class="c">sem conta</span></div>'
        + '<div class="pan chanfro" style="border-color:rgba(232,184,75,.45);background:rgba(232,184,75,.07)">'
        + '<p style="margin:0;font-size:13.5px;line-height:1.55">Você está '
        + (S.convidado ? 'como convidado' : 'sem conta') + '. Cartas, moedas e mercado precisam de conta — '
        + 'como convidado não há onde guardar o que você tirar. '
        + '<a href="../conta/login.html?next=' + encodeURIComponent('cartas/index.html')
        + '" style="color:var(--ouro)">Criar conta ou entrar</a>.</p></div>'
        + '<div class="cabe" style="margin-top:16px"><h2 style="font-size:22px">Catálogo do Drop 0</h2>'
        + '<span class="c">vitrine</span></div>' + barraFiltro()
        + '<div class="cols"><div>' + tabelaCartas(filtrados()) + '</div><div>' + painelDetalhe() + '</div></div>';
    }
    return '<div class="cabe"><h2>Coleção</h2><span class="c">' + num(S.inventario.length)
      + ' de ' + num(S.drop.resumo.cartas) + '</span></div>'
      + (S.inventario.length
          ? barraFiltro() + '<div class="cols"><div>' + tabelaCartas(S.inventario) + '</div><div>' + painelDetalhe() + '</div></div>'
          : '<div class="vazio">Sua coleção está vazia. Abra um pacote para começar.</div>');
  }
  function telaMercado() {
    return '<div class="cabe"><h2>Mercado</h2><span class="c">moeda do jogo</span></div>'
      + '<div class="pan chanfro" style="margin-bottom:14px"><p style="margin:0;font-size:12.5px;color:var(--dim);line-height:1.5">'
      + 'Compra e venda entre contas do PROMESSA, só com a moeda do jogo. A taxa de '
      + S.econ.mercado.taxa_percent + '% é queimada a cada venda — é o que impede a moeda de inflacionar. '
      + 'O mercado abre junto com o drop.</p></div>'
      + barraFiltro() + '<div class="cols"><div>' + tabelaCartas(filtrados(), 'mercado')
      + '</div><div>' + painelDetalhe() + '</div></div>';
  }
  function telaMissoes() {
    var g = S.econ.ganhos;
    var dia = g.filter(function (x) { return x.ciclo === 'dia'; });
    var outros = g.filter(function (x) { return x.ciclo !== 'dia'; });
    var icones = { login: 'cronometro', partida: 'chuteira', vitoria: 'apito', temporada: 'medalha', semanal: 'trofeu' };
    var linha = function (m) {
      return '<div class="mis"><i class="ic" style="' + ico(icones[m.id] || 'bola') + '"></i>'
        + '<div><b>' + esc(m.rotulo) + '</b><span>'
        + (m.ciclo === 'dia' ? 'todo dia' : m.ciclo === 'semana' ? 'toda semana' : 'quando acontecer')
        + '</span></div><div class="pg">+ ' + num(m.moedas) + '</div></div>';
    };
    var porDia = dia.reduce(function (a, b) { return a + b.moedas; }, 0);
    var sem = porDia * 7 + 800;
    return '<div class="cabe"><h2>Missões</h2><span class="c">como ganhar moedas</span></div>'
      + '<div class="cols"><div>'
      + '<div class="cabe" style="margin-bottom:8px"><h2 style="font-size:20px">Todo dia</h2></div>' + dia.map(linha).join('')
      + '<div class="cabe" style="margin:16px 0 8px"><h2 style="font-size:20px">Semanal e marcos</h2></div>' + outros.map(linha).join('')
      + '</div><div><div class="pan chanfro"><h3>Quanto isso rende</h3>'
      + '<div class="l">Por dia<span class="v ouro">~' + num(porDia) + '</span></div>'
      + '<div class="l">Por semana<span class="v ouro">~' + num(sem) + '</span></div>'
      + '<div class="l">Pacotes base/semana<span class="v">' + Math.floor(sem / S.econ.pacotes.base.preco) + '</span></div>'
      + '<div class="l">Pacotes elite/semana<span class="v">' + Math.floor(sem / S.econ.pacotes.elite.preco) + '</span></div></div>'
      + '<div class="pan chanfro"><h3>Resgate de repetida</h3>'
      + ORDEM.filter(function (k) { return S.econ.resgate_por_raridade[k]; }).reverse().map(function (k) {
          return '<div class="l"><span class="pt" style="background:var(--r-' + k + ')"></span>' + k
            + '<span class="v ouro">' + num(S.econ.resgate_por_raridade[k]) + '</span></div>';
        }).join('') + '</div></div></div>'
      + '<p class="dim" style="font-size:11.5px;margin-top:12px">Não existe compra de moeda com dinheiro real. '
      + 'Tudo aqui se ganha jogando.</p>';
  }

  var TELAS = { inicio: telaInicio, pacotes: telaPacotes, colecao: telaColecao, mercado: telaMercado, missoes: telaMissoes };

  function pinta() {
    var raiz = document.getElementById('app');
    if (S.erro) {
      raiz.innerHTML = hudTopo() + '<div class="conteudo"><div class="pan chanfro">'
        + '<h3>Não foi possível abrir</h3><p style="margin:0">' + esc(S.erro) + '</p></div></div>';
      return;
    }
    raiz.innerHTML = hudTopo() + '<div class="casca">' + navLateral()
      + '<main class="conteudo">' + (TELAS[S.aba] || telaInicio)() + '</main></div>';
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-aba]');
    if (b) { ev.preventDefault(); S.aba = b.dataset.aba; S.sel = null; pinta(); return; }
    var r = ev.target.closest('[data-rar]');
    if (r) { S.filtro.rar = r.dataset.rar; pinta(); return; }
    var lg = ev.target.closest('[data-liga]');
    if (lg) { S.filtro.liga = lg.dataset.liga; pinta(); return; }
    var tr = ev.target.closest('tr[data-n]');
    if (tr) {
      var n = Number(tr.dataset.n);
      S.sel = S.drop.cartas.filter(function (c) { return c.n === n; })[0] || null;
      pinta(); return;
    }
    var ab = ev.target.closest('[data-abrir]');
    if (ab) { location.href = 'abrir.html?pacote=' + encodeURIComponent(ab.dataset.abrir); return; }
    if (ev.target.closest('#btCfg')) { location.href = '../conta/regras.html'; }
  });
  document.addEventListener('input', function (ev) {
    if (ev.target.id !== 'q') return;
    S.filtro.q = ev.target.value;
    clearTimeout(window.__tq);
    window.__tq = setTimeout(function () {
      var v = S.filtro.q; pinta();
      var c = document.getElementById('q');
      if (c) { c.focus(); c.setSelectionRange(v.length, v.length); }
    }, 220);
  });

  carrega().then(pinta);
})();
