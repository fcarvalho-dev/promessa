'use strict';

/* ULTIMATE PROMESSA — abertura de pacote com efeito 3D holográfico e inspeção de carta.

 *

 * O resultado vem pronto do servidor (meu_abre_pack): o sorteio acontece lá,

 * com chance publicada, antes de qualquer animação. A cena aqui só apresenta.

 * Fake rare: só nos pacotes premium, em 35% das revelações, a cena sobe como

 * se viesse algo mais raro e então mostra a carta real. Não muda a carta.

 */

(function () {

  var ORDEM = ['bronze', 'prata', 'ouro', 'safira', 'diamante', 'mitica'];

  var LBLS = ['RIT', 'FIN', 'PAS', 'DRI', 'DEF', 'FIS'];

  var LIGA_NOME = { ENG: 'Premier League', ENG2: 'Championship', ESP: 'LaLiga', ESP2: 'LaLiga 2', ITA: 'Serie A', BRA: 'Brasileirão', BRA2: 'Série B', BRA3: 'Série C', GER: 'Bundesliga', FRA: 'Ligue 1', POR: 'Liga Portugal', NED: 'Eredivisie', KSA: 'Saudi Pro League', USA: 'MLS', ARG: 'Liga Argentina', TUR: 'Süper Lig', MEX: 'Liga MX', BEL: 'Pro League', RUS: 'Premier Russa', GRE: 'Super League', SCO: 'Premiership' };

  var CHAVE_ANIM = 'ultimate_pular_animacao';

  var S = { U: null, E: null, porId: {}, drop: null, usuario: null, saldo: 0, pacote: null, cartas: [], ordenadas: [], i: 0, ocupado: false, fase: 'pacote', inspecao: null, erro: null, msg: null };

  var esc = function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };

  var num = function (n) { return Number(n || 0).toLocaleString('pt-BR'); };

  var espera = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  var rarDB = function (r) { return r === 'mythic' ? 'mitica' : r; };

  var lsGet = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };

  var app = function () { return document.getElementById('app'); };



  function rv(r) {

    var d = (S.U && S.U.raridades && S.U.raridades[r]) || {};

    return { rotulo: d.rotulo || r, cor: d.cor || '#00FF87', cor2: d.cor2 || '#04140B', brilho: d.brilho == null ? 0.35 : d.brilho, moldura: d.moldura || 'simples', efeito: d.efeito || 'nenhum' };

  }

  function pcIco() { return '<img class="pcimg" src="../' + esc((S.U && S.U.moeda && S.U.moeda.icone) || 'assets/moeda/promecoin.svg') + '" alt="">'; }

  async function json(u) { var r = await fetch(u, { cache: 'no-store' }); if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); }



  async function carrega() {

    try {

      var b = await Promise.all([

        json('../dados/ultimate.json?v=20261022e'),

        json('../dados/economia.json?v=20261022e'),

        json('../dados/drops/_drops.json?v=20261022e')

      ]);

      S.U = b[0]; S.E = b[1]; S.dropsDef = b[2];

      var idPac = new URLSearchParams(location.search).get('pacote') || '';

      var dropDoPacote = (S.E.pacotes[idPac] || {}).drop_id || S.U.drop_ativo || 'drop0';

      var dropMeta = b[2].find(function (x) { return x.id === dropDoPacote; }) || b[2][0];

      var arqDrop = (dropMeta && dropMeta.arquivo) || 'drop0.json';



      // Carrega estritamente o catálogo do drop do pacote (e drop0 caso diferente)

      var arqs = [arqDrop];

      if (arqDrop !== 'drop0.json' && arqs.indexOf('drop0.json') < 0) arqs.push('drop0.json');



      var cats = await Promise.all(arqs.map(function (a) {

        return json('../dados/drops/' + a + '?v=20261022e').catch(function () { return null; });

      }));

      cats.forEach(function (cat) {

        if (!cat) return;

        cat.cartas.forEach(function (c) {

          c._drop = cat.nome;

          c._dropId = cat.id;

          S.porId[c.id] = c;

        });

        if (cat.id === dropDoPacote || (!S.drop && cat.id === S.U.drop_ativo)) S.drop = cat;

      });

      if (!S.drop && cats[0]) S.drop = cats[0];

    } catch (e) { S.erro = 'Não deu para carregar o pacote.'; console.error('[abrir]', e); return; }

    var id = new URLSearchParams(location.search).get('pacote') || '';

    if (!/^[a-z0-9_]{2,24}$/.test(id) || !S.E.pacotes[id] || ((S.U.pacotes_visual || {})[id] || {}).ativo === false) { S.erro = 'Pacote indisponível.'; return; }

    S.pacote = id;

    var pr = new URLSearchParams(location.search).get('presente') || '';

    if (/^[0-9a-f-]{36}$/.test(pr)) S.presente = pr;

    var P = window.Promessa;
    if (P) {
      try { S.usuario = await P.usuario(); } catch (e) { console.warn('[abrir] sessão:', e); }
      if (S.usuario) { try { S.saldo = await P.saldo(); } catch (e) { console.warn('[abrir] saldo:', e); } }
    }
    if (!S.usuario || (P && P.ehConvidado && P.ehConvidado())) {
      location.replace('../conta/login.html?next=' + encodeURIComponent('cartas/abrir.html' + location.search) + '&motivo=ultimate_requer_conta');
      return;
    }
  }

  function topo() {

    var P = window.Promessa; var nome = (P && P.obterApelido) ? P.obterApelido(S.usuario, null) : (S.usuario ? ((S.usuario.user_metadata && (S.usuario.user_metadata.nick || S.usuario.user_metadata.apelido)) || (S.usuario.email || 'Jogador').split('@')[0]) : 'Convidado');

    var partes = String((S.U && S.U.nome) || 'ULTIMATE PROMESSA').split(' ');

    return '<header class="topo"><a class="marca" href="index.html#pacotes"><img src="../' + esc((S.U && S.U.logo) || 'assets/logo_goat_oficial.jpg') + '" alt="">'

      + '<span class="wm">' + (partes.length > 1 ? '<small>' + esc(partes.slice(0, -1).join(' ')) + '</small>' : '') + '<b>' + esc(partes[partes.length - 1]) + '</b></span></a>'

      + '<a class="voltar" href="index.html#pacotes"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>Pacotes</a>'

      + '<div class="mei"><span class="moeda">' + pcIco() + '<b>' + num(S.saldo) + '</b><small>' + esc((S.U && S.U.moeda && S.U.moeda.nome) || 'PROMECOINS') + '</small></span>'

      + '<a class="perfil' + (S.usuario ? '' : ' conv') + '" href="../conta/perfil.html"><span class="av">' + esc(nome.charAt(0).toUpperCase()) + '</span><span>' + esc(nome) + '</span></a></div></header>';

  }



  function envelope(cls) {

    var x = S.E.pacotes[S.pacote], v = (S.U.pacotes_visual || {})[S.pacote] || {};

    return UPCarta.pacote({ cor: v.cor, imagem: v.imagem, arte: v.arte, logo: '../assets/favicon.png', nomeJogo: S.U.nome, cartas: x.cartas, nome: x.nome, cls: cls });

  }



  function cartaHTML(c) {

    return UPCarta.frente(c, rv(c.raridade), { base: '../', rodape: 'MINT ' + String(c.mint || 0).padStart(3, '0') + ' / ' + num(c.tiragem) });

  }



  function daCarta(db) {
    if (!db || !db.jogador_id) return null;
    var f = S.porId[db.jogador_id];
    if (!f || !f.nome) return null; // Varredura: descarta cartas fora do Evento 0
    var ligasOficiais = ['ENG', 'ESP', 'ITA', 'BRA'];
    if (f.liga && ligasOficiais.indexOf(f.liga) < 0) return null;
    var nome = f.nome;
    var rar = rarDB(db.raridade);
    var tirDef = { mitica: 25, diamante: 100, safira: 250, ouro: 500, prata: 1500, bronze: 5000 }[rar] || 1500;

    var clube = (window.UPCarta && UPCarta.clubePt) ? UPCarta.clubePt(f.clube, db.jogador_id) : (f.clube || '');

    var nacPt = (window.UPCarta && UPCarta.paisPt) ? UPCarta.paisPt(f.bandeira, f.nac_pt || f.nac, f.pais) : (f.nac_pt || f.nac || f.pais || '');

    return { uid: db.id, id: db.jogador_id, n: f.n || 0, nome: f.nome || String(db.jogador_id || '').split('|').pop(), clube: clube, liga: f.liga || '',

      pais: f.pais || '', nac: f.nac || f.pais || '', nac_pt: nacPt,

      bandeira: f.bandeira || '', escudo: f.escudo || String(db.jogador_id || '').split('|')[0] || '',

      ovr: db.ovr_snapshot || f.ovr || 0, pos: f.pos || 'MEI', pos5: f.pos5 || f.pos || 'MEI', idade: f.idade, pe: f.pe, ea: f.ea, foto: f.foto, delta: f.delta,

      raridade: rar, idolo: f.idolo, promessa: !!f.promessa, edicao: f.edicao, drop: f._drop, tiragem: f.tiragem || tirDef, mint: db.mint };

  }



  function corStat(val) {

    val = Number(val) || 0;

    if (val >= 85) return '#00FF87';

    if (val >= 75) return '#E8B84B';

    if (val >= 65) return '#4DA3FF';

    return 'rgba(242,247,244,.55)';

  }



  function modalCartaHTML() {

    var c = S.inspecao;

    if (!c) return '';

    var v = rv(c.raridade), E = S.E;

    var mini = (window.UPCarta && UPCarta.garanteMiniOveralls) ? UPCarta.garanteMiniOveralls(c) : { L: LBLS, st: [70, 70, 70, 70, 70, 70] };

    var band = (window.UPCarta && UPCarta.bandeiraSlug) ? UPCarta.bandeiraSlug(c) : (c.bandeira || '');

    var escSlug = (window.UPCarta && UPCarta.escudoSlug) ? UPCarta.escudoSlug(c) : (c.escudo || '');

    var posExt = (window.UPCarta && UPCarta.posNome) ? UPCarta.posNome(c.pos) : (c.pos || '—');

    var peExt = (window.UPCarta && UPCarta.peNome) ? UPCarta.peNome(c.pe) : (c.pe || '—');

    var nacNome = c.nac_pt || c.nac || c.pais || '—';

    var ligaNome = LIGA_NOME[c.liga] || c.liga || '—';

    var valorResgate = (E && E.resgate_por_raridade && E.resgate_por_raridade[c.raridade]) || 0;



    var badges = '<span class="det-tag" style="--tc:' + esc(v.cor) + '"><span class="pt" style="background:' + esc(v.cor) + '"></span>' + esc(v.rotulo) + '</span>';

    if (c.promessa) badges += '<span class="det-tag det-tag-prom">★ Promessa Sub-21 · OVR 80+</span>';

    if (c.idolo) badges += '<span class="det-tag det-tag-ouro">Ídolo Oficial</span>';

    if (c.edicao === 'natal') badges += '<span class="det-tag det-tag-natal">Edição Natal & Virada</span>';

    else if (c.edicao === 'raizes') badges += '<span class="det-tag det-tag-raizes">Edição Raízes</span>';



    var statsHTML = '<div class="pan chanfro det-atrib"><h3>Atributos de Jogo<span>OVR ' + esc(c.ovr) + '</span></h3>'

      + '<div class="det-stats-grid">' + mini.st.map(function (val, idx) {

        var sig = mini.L[idx] || '';

        var nCompleto = (window.UPCarta && UPCarta.statNome) ? UPCarta.statNome(sig) : sig;

        var cor = corStat(val);

        var pctBar = Math.max(15, Math.min(100, Number(val) || 50));

        return '<div class="det-st-item">'

          + '<div class="det-st-top"><span class="det-st-sig">' + esc(sig) + ' <small>' + esc(nCompleto) + '</small></span>'

          + '<b class="det-st-val" style="color:' + cor + '">' + (val == null ? '—' : esc(val)) + '</b></div>'

          + '<div class="det-st-bar"><i style="width:' + pctBar + '%;background:' + cor + '"></i></div>'

          + '</div>';

      }).join('') + '</div></div>';



    var motivoEspecial = c.promessa ? 'Jovem até 21 anos e OVR 80+' : c.idolo ? 'Ídolo Histórico da Liga' : null;



    return '<div class="veu" data-fechar-inspecao></div>'

      + '<div class="modal-carta chanfro" role="dialog" aria-modal="true" aria-label="Inspeção da carta">'

      + '<header class="modal-carta-topo"><span>Inspeção 3D Holográfica</span>'

      + '<button class="icobt" data-fechar-inspecao aria-label="Fechar"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.4" fill="none"/></svg></button></header>'

      + '<div class="det" style="--rc:' + esc(v.cor) + '">'

      + '<div class="det-esq"><div class="det-palco">' + cartaHTML(c) + '<div class="det-dica">✦ Passe o mouse ou arraste na carta · Efeito 3D Holo</div></div>' + statsHTML + '</div>'

      + '<div class="det-dir">'

      + '<div class="pan chanfro det-head"><div class="det-head-top">'

      + '<div class="det-ovr-badge" style="--rc:' + esc(v.cor) + '"><b>' + esc(c.ovr) + '</b><span>' + esc(c.pos || 'MEI') + '</span></div>'

      + '<div class="det-head-txt"><h2>' + esc(c.nome) + '</h2><p>' + esc([c.clube, nacNome].filter(Boolean).join(' · ')) + '</p></div></div>'

      + '<div class="det-badges">' + badges + '</div></div>'

      + '<div class="pan chanfro det-ficha"><h3>Ficha do Atleta</h3>'

      + '<div class="l"><span class="k">Clube</span><span class="v">' + (escSlug ? '<img class="det-ico-esc" src="../assets/escudos/' + esc(escSlug) + '.png" alt="">' : '') + esc(c.clube || '—') + '</span></div>'

      + '<div class="l"><span class="k">Nacionalidade</span><span class="v">' + (band ? '<img class="det-ico-band" src="../flags/' + esc(band) + '.png" alt="">' : '') + esc(nacNome) + '</span></div>'

      + '<div class="l"><span class="k">Liga</span><span class="v">' + esc(ligaNome) + '</span></div>'

      + '<div class="l"><span class="k">Posição</span><span class="v"><span class="det-pos-chip">' + esc(c.pos || '—') + '</span> ' + esc(posExt) + '</span></div>'

      + '<div class="l"><span class="k">Idade</span><span class="v">' + (c.idade ? esc(c.idade) + ' anos' : '—') + '</span></div>'

      + '<div class="l"><span class="k">Pé dominante</span><span class="v">' + esc(peExt) + '</span></div></div>'

      + '<div class="pan chanfro det-edicao"><h3>Edição & Coleção</h3>'

      + '<div class="l"><span class="k">Raridade</span><span class="v" style="color:' + esc(v.cor) + '"><span class="pt" style="background:' + esc(v.cor) + '"></span>' + esc(v.rotulo) + '</span></div>'

      + (motivoEspecial ? '<div class="l"><span class="k">Destaque</span><span class="v">' + esc(motivoEspecial) + '</span></div>' : '')

      + '<div class="l"><span class="k">Numeração (Mint)</span><span class="v"><span class="det-mint-pill' + (c.mint && c.mint <= 10 ? ' top' : '') + '">#' + String(c.mint || 0).padStart(3, '0') + '</span> de ' + num(c.tiragem) + '</span></div>'

      + '<div class="l"><span class="k">Valor de resgate</span><span class="v ouro">' + pcIco() + num(valorResgate) + '</span></div></div>'

      + '</div></div></div>';

  }



  /* ---------------- telas ---------------- */

  function telaPacote() {

    var x = S.E.pacotes[S.pacote], v = (S.U.pacotes_visual || {})[S.pacote] || {};

    var u = S.usuario;

    var chaveP = 'promessa_meus_pacotes' + (u && u.id ? '_' + u.id : '');

    var meusP = {};

    try { meusP = JSON.parse(localStorage.getItem(chaveP) || '{}') || {}; } catch (e) { console.warn('[abrir]', e); }

    var qtdInv = meusP[S.pacote] || 0;

    var temNoInv = qtdInv > 0;

    var ehDiario = S.pacote === 'p_diario';

    var pode = (temNoInv || S.presente || (!!S.usuario && !ehDiario && S.saldo >= x.preco));

    var motivo = !S.usuario ? 'Entre para abrir' : (!pode ? (ehDiario ? 'Resgate o pacote diário primeiro' : 'Saldo insuficiente (' + num(x.preco) + ')') : '');

    return '<main class="palco" style="--c:' + esc(v.cor || '#E8B84B') + '">'

      + '<div class="tit"><small>' + (S.presente ? 'Presente de boas-vindas' : '') + '</small><h1>' + esc(x.nome) + '</h1></div>'

      + envelope('grande')

      + '<div class="info"><span><b>' + x.cartas + '</b> cartas</span>' + (x.garantido ? '<span><b>' + esc(x.garantido.rotulo) + '</b></span>' : '') + '</div>'

      + (S.msg ? '<div class="aviso chanfro" role="status" style="max-width:520px">' + esc(S.msg) + '</div>' : '')

      + '<div class="acoes">' + (S.usuario

          ? '<button class="btn btn-ouro" id="btAbrir"' + (pode ? '' : ' disabled') + '>' + (pode ? (temNoInv || S.pacote === 'p_diario' ? 'Abrir pacote (' + qtdInv + ' disp.)' : S.presente ? 'Abrir grátis' : '<span class="preco">Abrir por ' + pcIco() + num(x.preco) + '</span>') : esc(motivo)) + '</button>'

          : ((window.Promessa && window.Promessa.ehConvidado() && (temNoInv || S.pacote === 'p_diario' || S.presente))

              ? '<button class="btn btn-ouro" id="btAbrir">Abrir pacote (Convidado)</button>'

              : '<a class="btn btn-ouro" href="../conta/login.html?next=' + encodeURIComponent('cartas/abrir.html?pacote=' + S.pacote) + '">Entrar</a>'))

      + '<a class="btn btn-sec" href="index.html#pacotes">Voltar</a></div></main>';

  }



  function telaCena() {

    return '<main class="palco"><div class="cena" id="cena" role="button" tabindex="0" aria-label="Revelar ou avançar carta"></div>'

      + '<div class="contador" id="contador"></div><div class="dica" id="dica"></div>'

      + '<div class="acoes"><button class="btn btn-ouro sm" id="btProx">Revelar carta</button><button class="btn btn-sec sm" id="btPular">Revelar todas</button></div></main>';

  }



  function telaResultado() {

    var cont = {};

    S.cartas.forEach(function (c) { cont[c.raridade] = (cont[c.raridade] || 0) + 1; });

    S.ordenadas = S.cartas.slice().sort(function (a, b) { return ORDEM.indexOf(b.raridade) - ORDEM.indexOf(a.raridade) || b.ovr - a.ovr; });

    var x = S.E.pacotes[S.pacote];

    var chaveP = 'promessa_meus_pacotes' + (S.usuario && S.usuario.id ? '_' + S.usuario.id : '');

    var meusP = {};

    try { meusP = JSON.parse(localStorage.getItem(chaveP) || '{}') || {}; } catch (e) { console.warn('[abrir]', e); }

    var temOutro = (meusP[S.pacote] || 0) > 0;

    var ehDiario = S.pacote === 'p_diario';

    var pode = ehDiario ? temOutro : (S.saldo >= x.preco);

    var btOutroHTML = (ehDiario && !temOutro)

      ? '<a class="btn btn-ouro" href="index.html#pacotes">Loja de Pacotes</a>'

      : '<button class="btn btn-ouro" id="btDeNovo"' + (pode ? '' : ' disabled') + '>' + (pode ? (ehDiario ? 'Abrir outro (' + meusP[S.pacote] + ' disp.)' : '<span class="preco">Abrir outro por ' + pcIco() + num(x.preco) + '</span>') : 'Saldo insuficiente') + '</button>';



    return '<main class="palco"><section class="resultado"><div class="tit"><small>Você tirou</small><h1>' + S.cartas.length + ' cartas</h1>'

      + '<p class="res-sub">✦ Passe o mouse sobre as cartas para o efeito 3D holográfico ou clique em uma carta para ver a ficha completa</p></div>'

      + '<div class="resumo">' + UPCarta.grupos(ORDEM.slice().reverse().filter(function (r) { return cont[r]; }), rv).map(function (g) {

          var n = 0; g.ids.forEach(function (r) { n += cont[r]; });

          return '<span><span class="pt" style="background:' + esc(g.cor) + '"></span>' + n + ' ' + esc(g.rotulo) + '</span>'; }).join('') + '</div>'

      + '<div class="cartas">' + S.ordenadas.map(function (c, idx) {

          return '<div class="res-card-wrap" data-inspecionar="' + idx + '" title="Clique para ver a ficha completa">' + cartaHTML(c) + '</div>';

        }).join('') + '</div>'

      + '<div class="acoes">' + btOutroHTML

      + '<a class="btn btn-sec" href="index.html#colecao">Ver coleção</a></div></section></main>'

      + modalCartaHTML();

  }



  function pinta() {

    if (S.erro) { app().innerHTML = (S.U ? topo() : '') + '<main class="palco"><div class="aviso chanfro">' + esc(S.erro) + '</div><a class="btn btn-sec" href="index.html#pacotes">Voltar</a></main>'; return; }

    app().innerHTML = topo() + (S.fase === 'cena' ? telaCena() : S.fase === 'fim' ? telaResultado() : telaPacote());

  }



  /* ---------------- abrir ---------------- */

  async function abrir() {

    if (S.ocupado) return;

    S.ocupado = true; S.msg = null; S.inspecao = null;

    var bt = document.getElementById('btAbrir') || document.getElementById('btDeNovo');

    if (bt) { bt.disabled = true; bt.textContent = 'Abrindo…'; }

    try {

      var u = S.usuario;

      var chaveP = 'promessa_meus_pacotes' + (u && u.id ? '_' + u.id : '');

      var meusP = {};

      try { meusP = JSON.parse(localStorage.getItem(chaveP) || '{}') || {}; } catch (e) { console.warn('[abrir]', e); }

      var temNoInv = (meusP[S.pacote] || 0) > 0;

      var gratis = (S.fase === 'pacote' && S.presente) || temNoInv || S.pacote === 'p_diario';



      var r = null;

      var usouFallback = false;



      if (S.presente) {

        try { r = await window.Promessa.sb.rpc('meu_abre_presente', { p_id: S.presente }); } catch (e) { r = { error: e }; }

      } else if (temNoInv || S.pacote === 'p_diario') {

        // Pacote JÁ no inventário: consome 1 pacote e emite cartas SEM cobrar moedas (servidor).
        try { r = await window.Promessa.sb.rpc('meu_abre_pack_inventario', { p_pack: S.pacote }); } catch (e) { r = { error: e }; }

      } else if (!temNoInv && S.pacote !== 'p_diario') {

        // COMPRA na loja: meu_abre_pack deduz o custo no servidor.
        try { r = await window.Promessa.sb.rpc('meu_abre_pack', { p_pack: S.pacote }); } catch (e) { r = { error: e }; }

      }



      // conta logada nunca usa o sorteio local: ele ignorava o OVR na raridade e as cartas nao eram salvas
      if (S.usuario && (!r || r.error || !r.data || !r.data.length)) {
        throw new Error((r && r.error && r.error.message) || 'Não deu para abrir este pacote agora. Seu saldo não foi alterado.');
      }
      if (r && r.data && r.data.length && !r.error) {

        S.cartas = (r.data || []).map(daCarta);

      } else {

        // Determina o pool de cartas exclusivo do drop ativo / drop do pacote

        var targetDrop = (S.E.pacotes[S.pacote] || {}).drop_id || S.U.drop_ativo || 'drop0';

        var dropMeta = (S.dropsDef || []).find(function (d) { return d.id === targetDrop; });

        var ligasPermitidas = (dropMeta && Array.isArray(dropMeta.ligas) && dropMeta.ligas.length > 0)

          ? dropMeta.ligas

          : ['ENG', 'ESP', 'ITA', 'BRA'];



        var pool = [];

        if (S.drop && Array.isArray(S.drop.cartas) && S.drop.cartas.length > 0) {

          pool = S.drop.cartas;

        } else {

          pool = Object.values(S.porId);

        }



        // Filtro estrito: no Drop 0 e pacotes regulares, apenas as 4 ligas oficiais (Premier League, LaLiga, Serie A, Brasileirão)

        if (targetDrop === 'drop0' || !S.E.pacotes[S.pacote] || !S.E.pacotes[S.pacote].exclusivo) {

          var filtradas = pool.filter(function (c) {

            return c && ligasPermitidas.indexOf(c.liga) >= 0;

          });

          if (filtradas.length > 0) pool = filtradas;

        }



        if (!pool.length) throw new Error('Catálogo de cartas carregando. Tente novamente.');

        var sorteadas = [];

        var packOdds = (S.E.pacotes[S.pacote] && S.E.pacotes[S.pacote].odds) || { bronze: 68, prata: 25, ouro: 6, safira: 1 };

        var numCartas = (S.E.pacotes[S.pacote] && S.E.pacotes[S.pacote].cartas) || (S.pacote === 'p_diario' ? 5 : 3);

        for (var n = 0; n < numCartas; n++) {

          var pick = pool[Math.floor(Math.random() * pool.length)];

          var randR = Math.random() * 100, soma = 0, rar = 'bronze';

          for (var rk in packOdds) {

            soma += packOdds[rk];

            if (randR <= soma) { rar = rk; break; }

          }

          sorteadas.push({

            id: 'c_' + Date.now() + '_' + n,

            jogador_id: pick.id,

            raridade: rar,

            ovr_snapshot: pick.ovr || 72,

            mint: Math.floor(Math.random() * 200) + 1

          });

        }

        S.cartas = sorteadas.map(daCarta);

        usouFallback = true;

        // sorteio local so existe para convidado (fica no navegador); conta logada ja saiu com erro acima
        try {
          var keysToSave = ["promessa_cartas_convidado"];
          if (S.usuario && S.usuario.id) {
            keysToSave.push("promessa_cartas_convidado_" + S.usuario.id);
            keysToSave.push("promessa_cartas_usuario_" + S.usuario.id);
          }
          keysToSave.forEach(function (k) {
            var invLocal = JSON.parse(localStorage.getItem(k) || "[]") || [];
            sorteadas.forEach(function (c) { invLocal.unshift(c); });
            var seen = {};
            var unicos = [];
            invLocal.forEach(function (item) {
              var idItem = item.id || (item.jogador_id + "_" + (item.mint || 0));
              if (!seen[idItem]) { seen[idItem] = true; unicos.push(item); }
            });
            localStorage.setItem(k, JSON.stringify(unicos.slice(0, 2000)));
          });
        } catch (e) { console.warn("[abrir] salva local:", e); }

      }



      if (temNoInv) {

        meusP[S.pacote] = Math.max(0, (meusP[S.pacote] || 1) - 1);

        try { localStorage.setItem(chaveP, JSON.stringify(meusP)); } catch (e) { console.warn('[abrir]', e); }

        // O consumo no servidor já é feito por meu_abre_pack_inventario (atômico); não repetir aqui.

      }



      if (gratis && S.presente) { S.presente = null; try { history.replaceState(null, '', '?pacote=' + S.pacote); } catch (e) { console.warn('[abrir]', e); } }

      if (!S.cartas.length) throw new Error('O pacote veio vazio. Seu saldo não foi alterado.');

      try { S.saldo = await window.Promessa.saldo(); } catch (e) { if (!gratis && !usouFallback) S.saldo -= S.E.pacotes[S.pacote].preco; }

      try { if (window.PromessaSom) window.PromessaSom.tocar('pack_open'); } catch (e) { console.warn('[abrir]', e); }

      S.i = 0; S.fase = 'cena'; S.virada = false; S.animando = true; pinta();

      if (lsGet(CHAVE_ANIM) === '1') { await revelaTodas(); return; }

      var cont = document.getElementById('contador'), dica = document.getElementById('dica'), btProx = document.getElementById('btProx');

      if (cont) cont.textContent = 'Carta 1 de ' + S.cartas.length;

      if (btProx) btProx.textContent = 'Revelar carta';

      if (dica) dica.textContent = '✦ Toque na carta para revelar';

      await revela(S.cartas[0], false);

      S.animando = false;

    } catch (e) {

      console.error('[abrir] meu_abre_pack:', e);

      S.fase = 'pacote'; S.msg = (e && e.message) ? String(e.message) : 'Não deu para abrir agora. Tente de novo.';

      pinta();

    } finally { S.ocupado = false; }

  }



  async function virarCarta() {

    if (S.virada || S.animando) return;

    var cena = document.getElementById('cena'); if (!cena) return;

    var slot = cena.querySelector('.slot'), selo = cena.querySelector('.selo');

    if (!slot) return;

    S.animando = true;

    var c = S.cartas[S.i];

    var v = rv(c.raridade);

    slot.classList.add('vira');

    if (selo) { selo.textContent = v.rotulo; selo.classList.add('on'); }

    try { if (window.PromessaSom) window.PromessaSom.tocar('pack_reveal'); } catch (e) { console.warn('[abrir]', e); }

    if (c.raridade === 'diamante' || c.raridade === 'mitica') { soltaConfete(); try { if (window.PromessaUI) window.PromessaUI.vibrar([60, 40, 90]); } catch (eV) { console.warn('[vibrar]', eV); } }

    S.virada = true;

    S.animando = false;

    var dica = document.getElementById('dica'), btProx = document.getElementById('btProx');

    if (dica) dica.textContent = (S.i + 1 < S.cartas.length) ? '✦ Toque na carta para ir à próxima' : '✦ Toque para ver o resumo de todas';

    if (btProx) btProx.textContent = (S.i + 1 < S.cartas.length) ? 'Próxima carta' : 'Ver todas';

  }



  async function proxima() {

    if (S.animando) return;

    if (S.fase !== 'cena') return;

    if (!S.virada) {

      await virarCarta();

      return;

    }

    S.i++;

    if (S.i >= S.cartas.length) { revelaTodas(); return; }

    var cont = document.getElementById('contador'), dica = document.getElementById('dica'), btProx = document.getElementById('btProx');

    if (cont) cont.textContent = 'Carta ' + (S.i + 1) + ' de ' + S.cartas.length;

    if (dica) dica.textContent = '✦ Toque na carta para revelar';

    if (btProx) btProx.textContent = 'Revelar carta';

    S.animando = true;

    await revela(S.cartas[S.i], false);

    S.animando = false;

  }



  async function revelaTodas() {

    S.i = S.cartas.length; S.fase = 'fim'; pinta();

    if (S.cartas.some(function (c) { return c.raridade === 'diamante' || c.raridade === 'mitica'; })) soltaConfete();

  }



  /* a cena: tremor, aura subindo pelas cores, flash, carta nasce virada de costas */

  async function revela(c, rapido) {

    var cena = document.getElementById('cena'); if (!cena) return;

    var tier = Math.max(0, ORDEM.indexOf(c.raridade));

    var premium = S.pacote !== 'base';

    var fake = premium && !rapido && Math.random() < 0.35;

    var tierCena = fake ? Math.max(tier, 3) : tier;

    var v = rv(c.raridade), alvo = fake ? rv(ORDEM[Math.min(5, Math.max(tier + 1, 3))]).cor : v.cor;

    cena.style.setProperty('--alvo', alvo);

    ['bronze', 'prata', 'ouro', 'safira'].forEach(function (r, k) { cena.style.setProperty('--a' + (k + 1), rv(r).cor); });

    cena.innerHTML = '<div class="aura"></div><div class="flash"></div>' + envelope('') + '<div class="selo">' + esc(fake ? '???' : v.rotulo) + '</div><div class="slot"><div class="flip"><div class="f-v">' + UPCarta.verso(fake ? ORDEM[Math.min(5, Math.max(tier + 1, 3))] : c.raridade, fake ? rv(ORDEM[Math.min(5, Math.max(tier + 1, 3))]) : v, { base: '../', nome: S.U.nome }) + '</div><div class="f-f">' + cartaHTML(c) + '</div></div></div>';

    var q = function (s) { return cena.querySelector(s); };

    var env = q('.envelope'), aura = q('.aura'), flash = q('.flash'), slot = q('.slot'), selo = q('.selo');

    var T = rapido ? 0.25 : 1;

    env.classList.add(tierCena >= 2 ? 'vibraForte' : 'vibra');

    await espera((tierCena >= 2 ? 900 : 550) * T);

    if (tierCena >= 2) {

      aura.style.setProperty('--dur', ((tierCena >= 4 ? 1.6 : 1.3) * T) + 's');

      aura.classList.add('sobe');

      await espera((tierCena >= 4 ? 1500 : 1200) * T);

    }

    flash.classList.add('on'); env.classList.add('some');

    await espera(320 * T);

    env.style.visibility = 'hidden';

    cena.style.setProperty('--alvo', v.cor);

    slot.classList.add('nasce');

    S.virada = false;

    var dica = document.getElementById('dica'), btProx = document.getElementById('btProx');

    if (dica) dica.textContent = '✦ Toque na carta para revelar';

    if (btProx) btProx.textContent = 'Revelar carta';

    if (rapido) {

      await espera(250);

      await virarCarta();

    }

  }



  /* ---------------- confete (só as mais raras) ---------------- */

  var cv = document.getElementById('confete'), ctx = cv.getContext('2d'), confs = [], confOn = false;

  function tam() { cv.width = innerWidth; cv.height = innerHeight; } tam(); addEventListener('resize', tam);

  function soltaConfete() {

    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    cv.style.display = 'block';

    var cores = [rv('diamante').cor, '#E8B84B', '#FFFFFF', rv('mitica').cor, '#00FF87'];

    for (var k = 0; k < 220; k++) confs.push({ x: innerWidth / 2 + (Math.random() - .5) * 220, y: innerHeight * .42, vx: (Math.random() - .5) * 15, vy: -Math.random() * 15 - 4, g: .32, s: 5 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - .5) * .3, vida: 1, cor: cores[k % cores.length] });

    if (!confOn) { confOn = true; requestAnimationFrame(passo); }

  }

  function passo() {

    ctx.clearRect(0, 0, cv.width, cv.height); var vivos = 0;

    confs.forEach(function (p) {

      if (p.vida <= 0) return; vivos++;

      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vida -= .006;

      ctx.save(); ctx.globalAlpha = Math.max(0, p.vida); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.cor; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 1.6); ctx.restore();

    });

    if (vivos) requestAnimationFrame(passo); else { confOn = false; confs = []; ctx.clearRect(0, 0, cv.width, cv.height); cv.style.display = 'none'; }

  }



  /* ---------------- eventos ---------------- */

  document.addEventListener('click', function (ev) {

    var t = ev.target;

    if (t.closest('[data-fechar-inspecao]')) { S.inspecao = null; pinta(); return; }

    var insp = t.closest('[data-inspecionar]');

    if (insp) {

      if (window.UPCarta && UPCarta.foiArrasto && UPCarta.foiArrasto()) return;

      var idx = Number(insp.dataset.inspecionar);

      S.inspecao = (S.ordenadas && S.ordenadas[idx]) || null;

      pinta();

      return;

    }

    if (t.closest('#btAbrir') || t.closest('#btDeNovo')) { abrir(); return; }

    if (t.closest('#btProx')) { proxima(); return; }

    if (t.closest('#btPular')) { revelaTodas(); return; }

    if (t.closest('#cena')) {

      if (window.UPCarta && UPCarta.foiArrasto && UPCarta.foiArrasto()) return;

      proxima();

    }

  });

  document.addEventListener('keydown', function (ev) {

    if (ev.key === 'Escape' && S.inspecao) { S.inspecao = null; pinta(); return; }

    if (S.fase === 'cena' && (ev.key === ' ' || ev.key === 'Enter')) { ev.preventDefault(); proxima(); }

  });

  document.addEventListener('error', function (ev) { var el = ev.target; if (!el || el.tagName !== 'IMG') return; var p = el.parentElement; if (p && p.classList.contains('upc-foto') && window.UPCarta && UPCarta.silh) { p.innerHTML = UPCarta.silh; return; } el.remove(); }, true);



  carrega().then(pinta);

})();

