'use strict';

/* ULTIMATE PROMESSA — tela principal.

 *

 * Tudo que é visual ou número vem de arquivo, editável pelo editor:

 *   dados/ultimate.json   nome, moeda, design por raridade, visual dos pacotes, banners

 *   dados/economia.json   preço, chances, resgate, missões, taxa do mercado

 *   dados/drops/*.json    catálogo de cada drop

 * O que é do jogador (saldo, cartas, anúncios) vem do Supabase, sempre

 * filtrado pela RLS: o front nunca decide o que o usuário pode ver.

 *

 * Mercado: SÓ entre jogadores. A empresa não vende carta avulsa; o único

 * produto oficial é o pacote.

 */

(function () {

  var ORDEM = ['bronze', 'prata', 'ouro', 'safira', 'diamante', 'mitica'];

  var LBLS = ['RIT', 'FIN', 'PAS', 'DRI', 'DEF', 'FIS'];

  var LIGA_NOME = { ENG: 'Premier League', ENG2: 'Championship', ESP: 'LaLiga', ESP2: 'LaLiga 2', ITA: 'Serie A', BRA: 'Brasileirão', BRA2: 'Série B', BRA3: 'Série C', GER: 'Bundesliga', FRA: 'Ligue 1', POR: 'Liga Portugal', NED: 'Eredivisie', KSA: 'Saudi Pro League', USA: 'MLS', ARG: 'Liga Argentina', TUR: 'Süper Lig', MEX: 'Liga MX', BEL: 'Pro League', RUS: 'Premier Russa', GRE: 'Super League', SCO: 'Premiership' };

    var ABAS = [
    ['inicio', 'campo', 'Início'],
    ['pacotes', 'camisa', 'Pacotes'],
    ['colecao', 'medalha', 'Coleção'],
    ['album', 'trofeu2', 'Álbum'],
    ['mercado', 'troca', 'Mercado'],
    ['desafios', 'troca', 'Desafios'],
    ['missoes', 'trofeu2', 'Missões'],
    ['online', 'campo', 'Online'],
    ['presentes', 'medalha', 'Presentes'],];

  var CHAVE_ANIM = 'ultimate_pular_animacao';



  var S = {

    aba: (location.hash || '').slice(1) || 'inicio',

    U: null, E: null, drops: [], drop: null, porId: {},

    usuario: null, convidado: false, saldo: 0,

    inventario: [], anuncios: [], meusAnuncios: [], quadro: null, estoque: null,

    merc: 'venda', filtro: { rar: '', liga: '', q: '', ordem: 'ovr', est: '' },

    sel: null, comunicados: [], comunicadoAtivo: null, banner: 0, cfg: false, erro: null, msg: null

  };

  if (!ABAS.some(function (a) { return a[0] === S.aba; })) S.aba = 'inicio';



  /* ---------------- utilidades ---------------- */

  var esc = function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };

  var num = function (n) { return Number(n || 0).toLocaleString('pt-BR'); };

  var ico = function (n) { return "--ico:url('../icones/" + n + ".svg')"; };

  var pct = function (v) { return (v < 1 ? v.toFixed(2) : v.toFixed(1)).replace('.', ',') + '%'; };

  var rarDB = function (r) { return r === 'mythic' ? 'mitica' : r; };

  var lsGet = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };

  var lsSet = function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage bloqueado: só perde a preferência */ } };

  var SVG = {

    cfg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.4 13a7.6 7.6 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.4 7.4 0 0 0-1.7-1L15 3.5h-4l-.4 2.5a7.4 7.4 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.4 7.4 0 0 0 1.7 1l.4 2.5h4l.4-2.5a7.4 7.4 0 0 0 1.7-1l2.4 1 2-3.4zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>',

    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>',

    voltar: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6"/></svg>'

  };



  function rarVis(r) {

    var d = (S.U && S.U.raridades && S.U.raridades[r]) || {};

    return { rotulo: d.rotulo || r, cor: d.cor || '#00FF87', cor2: d.cor2 || '#04140B', brilho: d.brilho == null ? 0.35 : d.brilho,

             moldura: d.moldura || 'simples', efeito: d.efeito || 'nenhum', secreta: !!d.secreta };

  }

  function moeda() { return (S.U && S.U.moeda) || { nome: 'PROMECOINS', sigla: 'PC' }; }

  function pcIco() { return '<img class="pcimg" src="../' + esc(moeda().icone || 'assets/moeda/promecoin.svg') + '" alt="">'; }



  async function json(u) {

    var r = await fetch(u, { cache: 'no-store' });

    if (!r.ok) throw new Error(u + ' respondeu ' + r.status);

    return r.json();

  }



  /* ---------------- carga ---------------- */

  async function carrega() {

  try {

    var man = await json('../dados/manutencao.json?t=' + Date.now()).catch(function() { return null; });

    if (man && man.ativa) { location.replace('../manutencao.html'); return; }

  } catch (e) { console.warn('[ultimate]', e); }



    try {

      var base = await Promise.all([json('../dados/ultimate.json?v=20261022d'), json('../dados/economia.json?v=20261022d'), json('../dados/drops/_drops.json?v=20261022d')]);

      S.U = base[0]; S.E = base[1]; S.drops = base[2];

      var ativo = S.drops.filter(function (d) { return d.id === S.U.drop_ativo; })[0] || S.drops[0];

      if (!ativo || !ativo.arquivo) throw new Error('nenhum evento com catálogo');

      /* fichas de todos os drops liberados / ativos */

      var noAr = S.drops.filter(function (d) { return d.arquivo && (d.liberado || d.id === S.U.drop_ativo); });

      var arqs = noAr.map(function (d) { return d.arquivo; });

      if (!arqs.length && ativo && ativo.arquivo) arqs.push(ativo.arquivo);

      var cats = await Promise.all(arqs.map(function (a) { return json('../dados/drops/' + a + '?v=20261022e').catch(function () { return null; }); }));

      cats.forEach(function (cat) {

        if (!cat) return;

        cat.cartas.forEach(function (c) { c._drop = cat.nome; S.porId[c.id] = c; });

        if (cat.id === ativo.id) S.drop = cat;

      });

      if (!S.drop) throw new Error('catálogo do drop ativo não carregou');

    } catch (e) {

      S.erro = 'Não deu para carregar o Ultimate: ' + e.message;

      console.error('[ultimate] carga:', e);

      return;

    }

    var P = window.Promessa;
    if (P) {
      try { S.usuario = await P.usuario(); } catch (e) { console.warn('[ultimate] usuário:', e); }
    }
    if (!S.usuario || (P && P.ehConvidado && P.ehConvidado())) {
      location.replace('../conta/login.html?next=' + encodeURIComponent('cartas/index.html') + '&motivo=ultimate_requer_conta');
      return;
    }
    
    // Comunicados oficiais: vem SO do servidor (meus_comunicados), ja filtrados por destinatario e nao lidos
    try {
      ['promessa_comunicados_ativos', 'promessa_comunicado_visto_comunicado_estreia_drop0'].forEach(function (k) { localStorage.removeItem(k); });
      var rc = await window.Promessa.sb.rpc('meus_comunicados');
      if (rc.error) throw rc.error;
      S.comunicados = Array.isArray(rc.data) ? rc.data : [];
      S.comunicadoAtivo = S.comunicados[0] || null;
    } catch (e) { console.warn('[ultimate] comunicados:', e); S.comunicados = []; S.comunicadoAtivo = null; }
    await Promise.all([carregaMercado(), S.usuario ? carregaConta() : carregaContaConvidado()]);

  }



  function carregaContaConvidado() {
    try {
      var keys = ["promessa_cartas_convidado", "promessa_cartas_usuario"];
      var list = [];
      keys.forEach(function (k) {
        var raw = localStorage.getItem(k);
        if (raw) {
          try {
            var parsed = JSON.parse(raw) || [];
            list = list.concat(parsed);
          } catch (e) { console.warn('[ultimate]', e); }
        }
      });
      var seen = {};
      var unicos = [];
      list.forEach(function (item) {
        var cardObj = daCarta(item);
        var chave = cardObj.uid || (cardObj.id + "_" + (cardObj.mint || 0) + "_" + cardObj.raridade);
        if (!seen[chave]) {
          seen[chave] = true;
          unicos.push(cardObj);
        }
      });
      var ligasValidas = ["ENG", "ESP", "ITA", "BRA"];
      S.inventario = unicos.filter(function (c) {
        return c && (!c.liga || ligasValidas.indexOf(c.liga) >= 0);
      }).sort(function (a, b) { return (b.ovr || 0) - (a.ovr || 0); });
      var s = localStorage.getItem("promessa_saldo_convidado") || localStorage.getItem("promessa_saldo");
      S.saldo = s != null ? Number(s) : 1000;
    } catch (e) { console.warn("[ultimate] convidado:", e); }
  }

  async function carregaConta() {
    var P = window.Promessa, sb = P.sb;
    try { var lg = await sb.rpc("minha_login_diario"); if (lg.error) throw lg.error; } catch (e) { console.warn("[ultimate] login diário:", e); }
    await carregaIntervaloResgate();
    try { S.saldo = await P.saldo(); } catch (e) { console.warn("[ultimate] saldo:", e); }
    var cartasNuvem = [];
    try {
      var r = await sb.from("cards").select("id,jogador_id,raridade,ovr_snapshot,mint,em_venda,destravada_em,obtida_em")
        .eq("dono_id", S.usuario.id).order("ovr_snapshot", { ascending: false }).limit(3000);
      if (r.error) throw r.error;
      cartasNuvem = (r.data || []).filter(function (c) {
        if (!c) return false;
        var cid = String(c.jogador_id || c.id || '');
        return !cid.startsWith('c_rew_');
      }).map(daCarta);
    } catch (e) { console.warn("[ultimate] inventário:", e); }
    try { var pg = await sb.rpc("meus_presentes"); if (pg.error) throw pg.error; S.presentes = pg.data || []; }
    catch (e) { console.warn("[ultimate] presentes:", e); S.presentes = []; }
    try { var q = await sb.rpc("meu_quadro_missoes"); if (q.error) throw q.error; S.quadro = q.data || []; }
    catch (e) { console.warn("[ultimate] missões:", e); S.quadro = null; }

    var cartasLocais = [];
    // conta logada: a colecao e SO a do servidor. Cartas guardadas no navegador vinham do sorteio local
    // (raridade sem relacao com o OVR, mint inventado, nunca salvas) - sao apagadas aqui.
    try {
      ["promessa_cartas_convidado_" + S.usuario.id, "promessa_cartas_usuario_" + S.usuario.id, "promessa_cartas_convidado", "promessa_cartas_usuario"]
        .forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) { console.warn("[ultimate] limpa cartas locais:", e); }

    var seen = {};
    var unificadas = [];
    cartasNuvem.concat(cartasLocais).forEach(function (c) {
      var chave = c.uid || (c.id + "_" + (c.mint || 0) + "_" + c.raridade);
      if (!seen[chave]) {
        seen[chave] = true;
        unificadas.push(c);
      }
    });
    var ligasValidas = ["ENG", "ESP", "ITA", "BRA"];
    S.inventario = unificadas.filter(function (c) {
      return c && (!c.liga || ligasValidas.indexOf(c.liga) >= 0);
    }).sort(function (a, b) { return (b.ovr || 0) - (a.ovr || 0); });

    if (S.usuario) {

      try { await sincronizarInventarioNuvem(); } catch (e) { console.warn('[ultimate]', e); }

      try {

        var pr = await sb.from('profiles').select('ultimo_resgate_8h').eq('id', S.usuario.id).maybeSingle();

        if (pr && pr.data && pr.data.ultimo_resgate_8h) {

          var tDb = new Date(pr.data.ultimo_resgate_8h).getTime();

          if (tDb && !isNaN(tDb)) {

            localStorage.setItem(chaveResgate(), String(tDb));

            localStorage.setItem('promessa_ultimo_resgate_8h', String(tDb));

          }

        }

      } catch (e) { console.warn('[ultimate] profiles ultimo_resgate_8h:', e); }



      var uid = S.usuario.id;

      var bvKey = 'promessa_boas_vindas_' + uid;

      var pKey = 'promessa_meus_pacotes_' + uid;

      var sKey = 'promessa_saldo_' + uid;

      var p = {};

      try { p = JSON.parse(localStorage.getItem(pKey) || '{}') || {}; } catch (e) { console.warn('[ultimate]', e); }



      if (!localStorage.getItem(bvKey)) {

        localStorage.setItem(bvKey, '1');

        // presente de boas-vindas real e emitido no servidor (meus_presentes); nada de pacote local



        S.msg = 'Boas-vindas ao Ultimate! Seus prêmios já estão na sua conta.';

      }



      var loginKey = 'promessa_login_dia_' + uid;

      var hojeStr = new Date().toISOString().slice(0, 10);

      if (localStorage.getItem(loginKey) !== hojeStr) {

        localStorage.setItem(loginKey, hojeStr);

        if (!S.msg) S.msg = 'Bônus de login diário creditado na sua conta.';

      }

    }

  }



  async function carregaMercado() {

    var P = window.Promessa; if (!P) return;

    try {

      // anúncios abertos com apelido do vendedor e tempos (o servidor já devolve as cartas vencidas aos donos)
      var r = await P.sb.rpc('mercado_anuncios');
      if (r.error) throw r.error;
      var agora = Date.now();
      var todos = (r.data || []).filter(function (t) { return t.card && new Date(t.expira_em).getTime() > agora; }).map(function (t) {
        var c = daCarta(t.card); if (!c) return null;
        c.trade = t.id; c.preco = t.preco; c.expira = t.expira_em; c.criado = t.criado_em; c.retirar = t.retirar_em; c.vendedor = t.vendedor; c.meu = !!t.meu;
        return c;
      }).filter(Boolean);
      // o seu anúncio aparece para todos, inclusive para você (marcado como seu)
      S.anuncios = todos;
      S.meusAnuncios = todos.filter(function (c) { return c.meu; });
    } catch (e) { console.warn('[ultimate] mercado:', e); }

    /* o que ainda pode sair de cada raridade: a API devolve no máximo 1000 linhas por vez */

    try {

      var est = {}, de = 0, lote = 1000;

      for (var pag = 0; pag < 10; pag++) {

        var q = await P.sb.from('emissao').select('raridade,tiragem_max,emitidas').eq('liberado', true).range(de, de + lote - 1);

        if (q.error) throw q.error;

        (q.data || []).forEach(function (x) { var k = rarDB(x.raridade); est[k] = (est[k] || 0) + Math.max(0, x.tiragem_max - x.emitidas); });

        if (!q.data || q.data.length < lote) break;

        de += lote;

      }

      S.estoque = est;

    } catch (e) { console.warn('[ultimate] estoque:', e); }

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

    return {

      uid: db.id, id: db.jogador_id, n: f.n || 0, nome: nome, clube: clube, liga: f.liga || '',

      pais: f.pais || '', nac: f.nac || f.pais || '', nac_pt: nacPt,

      bandeira: f.bandeira || '', escudo: f.escudo || String(db.jogador_id || '').split('|')[0] || '',

      ovr: db.ovr_snapshot || f.ovr || 0, pos: f.pos || 'MEI', pos5: f.pos5 || f.pos || 'MEI', idade: f.idade, pe: f.pe, ea: f.ea,

      foto: f.foto, delta: f.delta,

      raridade: rar, raridade_global: f.raridade_global || rar, idolo: f.idolo, promessa: !!f.promessa, edicao: f.edicao, drop: f._drop,

      tiragem: f.tiragem || tirDef, mint: db.mint, em_venda: !!db.em_venda, destravada_em: db.destravada_em

    };

  }



  /* ---------------- peças ---------------- */

  function topo() {

    var P = window.Promessa;

    var nome = (P && P.obterApelido)

      ? P.obterApelido(S.usuario, null)

      : (S.usuario

          ? ((S.usuario.user_metadata && (S.usuario.user_metadata.nick || S.usuario.user_metadata.apelido)) || (S.usuario.email || 'Jogador').split('@')[0])

          : 'Convidado');

    var partes = String((S.U && S.U.nome) || 'ULTIMATE PROMESSA').split(' ');

    var pre = partes.length > 1 ? partes.slice(0, -1).join(' ') : '';

    var pos = partes[partes.length - 1];

    return '<header class="topo">'

      + '<a class="marca" href="index.html#inicio" data-aba="inicio" aria-label="' + esc(S.U ? S.U.nome : 'Ultimate Promessa') + ' — início">'

      + '<img src="../assets/logo_goat_oficial.jpg" alt="">'

      + '<span class="wm">' + (pre ? '<small>' + esc(pre) + '</small>' : '') + '<b>' + esc(pos) + '</b></span></a>'

      + '<a class="voltar" href="../index.html">' + SVG.voltar + 'Menu</a>'

      + '<div class="mei">'

      + '<button class="moeda" data-aba="missoes" title="' + esc(moeda().nome) + ' — ganhe jogando">' + pcIco()

      + '<b data-contar="' + Math.round(Number(S.saldo) || 0) + '" data-contar-id="ult-saldo">' + num(S.saldo) + '</b><small>' + esc(moeda().nome) + '</small></button>'

      + '<a class="perfil' + (S.usuario ? '' : ' conv') + '" href="../conta/perfil.html" title="Perfil">'

      + '<span class="av">' + esc(nome.charAt(0).toUpperCase()) + '</span><span>' + esc(nome) + '</span></a>'

      + '<button class="icobt" id="btCfg" aria-label="Configurações">' + SVG.cfg + '</button>'

      + '</div></header>';

  }



  function lado() {

    return '<nav class="lado" aria-label="Seções">' + ABAS.map(function (a) {

      var bol = a[0] === 'missoes' && !!S.usuario;

      return '<button data-aba="' + a[0] + '"' + (S.aba === a[0] ? ' aria-current="page"' : '') + ' style="' + ico(a[1]) + '"><i></i>'

        + a[2] + (bol ? '<span class="bol"></span>' : '') + '</button>';

    }).join('') + '</nav>';

  }



  function banners() {

    var L = ((S.U && S.U.banners) || []).filter(function (b) { return b.ativo; })

      .sort(function (a, b) { return (a.ordem || 0) - (b.ordem || 0); });

    if (!L.length) return '';

    var i = S.banner % L.length, b = L[i];

    var dias = S.drop && S.drop.fecha ? Math.max(0, Math.ceil((new Date(S.drop.fecha) - new Date()) / 86400000)) : null;

    var tit = esc(b.titulo || (S.drop && S.drop.nome) || 'Drop de Estreia');

    if (b.destaque && b.titulo && b.titulo.indexOf(b.destaque) >= 0) tit = esc(b.titulo).replace(esc(b.destaque), '<em>' + esc(b.destaque) + '</em>');

    return '<section class="banner chanfro">'

      + '<div class="bc">' + (b.eyebrow ? '<span class="eyb">' + esc(b.eyebrow) + '</span>' : '') + (tit ? '<h1>' + tit + '</h1>' : '')

      + (b.texto ? '<p>' + esc(b.texto) + '</p>' : '')

      + '<div class="acoes">' + (b.acao ? '<button class="btn btn-ouro" data-aba="' + esc(b.acao) + '">' + esc(b.rotulo_acao || 'Ver') + '</button>' : '')

      + (dias != null && i === 0 ? '<span class="prazo"><b>' + dias + '</b>dias</span>' : '') + '</div></div>'

      + '<div class="arte">' + (b.imagem ? '<img src="../' + esc(b.imagem) + '" alt="">' : '') + '</div>'

      + (L.length > 1 ? '<div class="pontos">' + L.map(function (_, k) {

          return '<button data-banner="' + k + '" aria-label="Destaque ' + (k + 1) + '" aria-pressed="' + (k === i) + '"></button>';

        }).join('') + '</div>' : '')

      + '</section>';

  }



  function cartaHTML(c) {

    var rod = c.mint ? 'MINT ' + String(c.mint).padStart(3, '0') + ' / ' + num(c.tiragem) : 'TIRAGEM ' + num(c.tiragem);

    return UPCarta.frente(c, rarVis(c.raridade), { base: '../', rodape: esc(rod) });

  }





  /* ---------------- PACOTE DIÁRIO 8 HORAS & INVENTÁRIO DE PACOTES ---------------- */

  var INTERVALO_8H = 8 * 60 * 60 * 1000; // padrão; o servidor manda o valor configurado no editor (resgate_tempo_config)
  async function carregaIntervaloResgate() {
    try {
      var r = await window.Promessa.sb.rpc('resgate_tempo_config');
      if (r.error) throw r.error;
      var h = Number(r.data && r.data.horas);
      if (h >= 1 && h <= 168) INTERVALO_8H = h * 60 * 60 * 1000;
    } catch (e) { console.warn('[resgate] intervalo (usando 8 h):', e); }
  }



  function chaveResgate() {

    var u = S.usuario;

    return 'promessa_ultimo_resgate_8h' + (u && u.id ? '_' + u.id : '');

  }



  function chaveMeusPacks() {

    var u = S.usuario;

    return 'promessa_meus_pacotes' + (u && u.id ? '_' + u.id : '');

  }



  function obterUltimoResgate() {

    var max = 0;

    try {

      var u = S.usuario;

      var fontes = [

        u && u.user_metadata ? u.user_metadata.ultimo_resgate_8h : null,

        localStorage.getItem(chaveResgate()),

        localStorage.getItem('promessa_ultimo_resgate_8h')

      ];

      fontes.forEach(function (v) { var n = Number(v); if (n && !isNaN(n) && n > max) max = n; });

    } catch (e) { console.warn('[ultimate]', e); }

    return max;

  }



  function obterMeusPacotes() {
    var packs = {};
    try {
      var raw = localStorage.getItem(chaveMeusPacks());
      if (!raw) raw = localStorage.getItem('promessa_meus_pacotes');
      if (raw) packs = JSON.parse(raw) || {};
    } catch (e) { console.warn('[ultimate]', e); }

    // Varredura estrita: apenas pacotes oficiais do Evento 0
    var permitidos = ['p_diario', 'p_comum', 'p_rara', 'p_epica', 'p_lendaria', 'p_mitica'];
    var limpos = {};
    for (var k in packs) {
      if (permitidos.indexOf(k) >= 0 && Number(packs[k]) > 0) {
        limpos[k] = Number(packs[k]);
      }
    }
    packs = limpos;

    if (S.presentes && S.presentes.length) {
      S.presentes.forEach(function (g) {
        var pid = g.pack_id || 'p_comum';
        if (permitidos.indexOf(pid) >= 0) {
          packs[pid] = (packs[pid] || 0) + 1;
        }
      });
    }
    return packs;
  }

  function salvarMeusPacotes(packs) {

    try {

      localStorage.setItem(chaveMeusPacks(), JSON.stringify(packs));

      localStorage.setItem('promessa_meus_pacotes', JSON.stringify(packs));

    } catch (e) { console.warn('[ultimate]', e); }

  }



  function adicionarPacotes(tipo, qtd) {

    var p = obterMeusPacotes();

    p[tipo] = (p[tipo] || 0) + (qtd || 1);

    salvarMeusPacotes(p);

  }



  function resgateDisponivel() {

    var ult = obterUltimoResgate();

    if (!ult) return true;

    return (Date.now() - ult) >= INTERVALO_8H;

  }



  function tempoRestante8h() {

    var ult = obterUltimoResgate();

    if (!ult) return 0;

    var resto = INTERVALO_8H - (Date.now() - ult);

    return Math.max(0, resto);

  }



  function formataTempoRestante(ms) {

    var totSeg = Math.floor(ms / 1000);

    var h = Math.floor(totSeg / 3600);

    var m = Math.floor((totSeg % 3600) / 60);

    var s = totSeg % 60;

    return (h < 10 ? '0' : '') + h + 'h ' + (m < 10 ? '0' : '') + m + 'm ' + (s < 10 ? '0' : '') + s + 's';

  }



  async function sincronizarInventarioNuvem() {

    if (!S.usuario || !window.Promessa || !window.Promessa.sb) return;

    try {

      var r = await window.Promessa.sb.rpc('meus_pacotes_inventario');

      // conta logada: o inventario e o do servidor (substitui; mesclar mantinha pacotes que o servidor nunca emitiu)
      if (r && !r.error && r.data && typeof r.data === 'object') { salvarMeusPacotes(r.data); }

    } catch (e) { console.warn('[inventario] sinc nuvem:', e); }

  }



  async function executarResgateDiario() {

    // Se localmente ainda não passou o tempo de 8h:

    if (!resgateDisponivel()) {

      var restoLocal = tempoRestante8h();

      pinta();

      return;

    }



    var agora = Date.now();

    var ok = false;



    // Usuário autenticado: validação segura no Supabase

    if (S.usuario && window.Promessa && window.Promessa.sb) {

      try {

        var r = await window.Promessa.sb.rpc('meu_resgate_8h');

        if (r && r.data) {

          if (r.data.sucesso) {

            ok = true;

            localStorage.setItem(chaveResgate(), String(agora));

            localStorage.setItem('promessa_ultimo_resgate_8h', String(agora));

            adicionarPacotes('p_diario', 1);

            try { if (window.PromessaSom) window.PromessaSom.tocar('pack_open'); } catch (e) { console.warn('[ultimate]', e); }

            pinta();

            return;

          } else {

            // Servidor informou tempo de recarga ativo

            var restoSeg = r.data.segundos_restantes;

            var restoMs = (restoSeg != null ? restoSeg * 1000 : (r.data.proximo_em ? Math.max(0, new Date(r.data.proximo_em).getTime() - Date.now()) : (8 * 3600 * 1000)));

            var tAnchor = Date.now() - (INTERVALO_8H - restoMs);

            localStorage.setItem(chaveResgate(), String(tAnchor));

            localStorage.setItem('promessa_ultimo_resgate_8h', String(tAnchor));



            try { await sincronizarInventarioNuvem(); } catch (e) { console.warn('[ultimate]', e); }

            pinta();

            return;

          }

        }

      } catch (e) {

        console.warn('[resgate] rpc meu_resgate_8h:', e);

      }

    }



    // Modo convidado / offline

    if (!ok && !S.usuario) {

      try {

        localStorage.setItem(chaveResgate(), String(agora));

        localStorage.setItem('promessa_ultimo_resgate_8h', String(agora));

      } catch (e) { console.warn('[ultimate]', e); }

      adicionarPacotes('p_diario', 1);

      try { if (window.PromessaSom) window.PromessaSom.tocar('pack_open'); } catch (e) { console.warn('[ultimate]', e); }

      pinta();

    }

  }



  /* Cronômetro global a cada segundo para atualizar todos os contadores da página */

  setInterval(function () {

    var timers = document.querySelectorAll('.pack-cooldown-timer, #pack-cooldown-timer, #pack-cooldown-timer-inicio');

    if (timers && timers.length > 0) {

      var resto = tempoRestante8h();

      if (resto <= 0) {

        pinta();

      } else {

        var str = formataTempoRestante(resto);

        timers.forEach(function (el) { el.textContent = str; });

      }

    }

  }, 1000);



  function pacotesAtivos() {

    var vis = (S.U && S.U.pacotes_visual) || {};

    return Object.keys(S.E.pacotes).filter(function (k) { return !vis[k] || vis[k].ativo !== false; })

      .sort(function (a, b) {

        if (a === 'p_diario') return -1;

        if (b === 'p_diario') return 1;

        var oa = (vis[a] && vis[a].ordem != null) ? vis[a].ordem : 9;

        var ob = (vis[b] && vis[b].ordem != null) ? vis[b].ordem : 9;

        return oa - ob;

      });

  }



  function oddsGrupo(od) {

    return UPCarta.grupos(ORDEM.filter(function (r) { return od[r] && !rarVis(r).secreta; }).reverse(), rarVis).map(function (g) {

      var p = 0, esg = true;

      g.ids.forEach(function (r) { p += od[r]; if (!(S.estoque && S.estoque[r] === 0)) esg = false; });

      return { rotulo: g.rotulo, cor: g.cor, p: p, esg: esg };

    });

  }

  function envPacote(k, cls) {

    var x = S.E.pacotes[k], v = (S.U.pacotes_visual || {})[k] || {};

    var logoPack = '../assets/favicon.png';

    return UPCarta.pacote({ cor: v.cor, imagem: v.imagem, arte: v.arte, logo: logoPack, nomeJogo: S.U.nome, cartas: x.cartas, nome: x.nome, cls: cls });

  }

  function botaoAbrir(k) {

    if (k === 'p_diario') {

      if (!resgateDisponivel()) {

        return '<div class="rod rod-resgate" style="justify-content:center;padding-top:6px;width:100%">'

          + '<div style="width:100%;text-align:center;padding:11px 8px;background:rgba(205,127,50,0.12);border:1px solid rgba(205,127,50,0.45);border-radius:10px">'

          + '<span style="font-size:10px;font-weight:900;letter-spacing:1.5px;color:rgba(255,255,255,0.7);display:block;text-transform:uppercase;margin-bottom:3px">PRÓXIMO RESGATE EM</span>'

          + '<b id="pack-cooldown-timer" class="pack-cooldown-timer" style="font-family:var(--f-num, monospace);font-size:16px;color:#00FF87;letter-spacing:1.5px;display:block">' + formataTempoRestante(tempoRestante8h()) + '</b>'

          + '</div></div>';

      }

      return '<div class="rod rod-resgate" style="justify-content:center;padding-top:6px;width:100%">'

        + '<button class="btn btn-ouro sm btn-resgate-pack" style="width:100%;font-weight:900;letter-spacing:1.5px;padding:12px;font-size:13px;background:linear-gradient(135deg, #00FF87 0%, #00B060 100%);color:#06140d;border:none;border-radius:10px;cursor:pointer" data-resgate-8h="1">RESGATAR</button>'

        + '</div>';

    }



    // Demais pacotes da loja: botão COMPRAR se tiver moedas suficientes, senão FALTAM X

    var x = S.E.pacotes[k];

    var saldoAtual = Number(S.saldo || 0);

    var pode = saldoAtual >= x.preco;

    var motivo = !pode ? 'Faltam ' + num(x.preco - saldoAtual) : '';

    return '<div class="rod"><span class="preco">' + pcIco() + num(x.preco) + '</span>'

      + '<button class="btn ' + (k === 'base' ? 'btn-pri' : 'btn-ouro') + ' sm" data-abrir="' + esc(k) + '"' + (pode ? '' : ' disabled title="' + esc(motivo) + '"') + '>'

      + (pode ? 'COMPRAR' : esc(motivo)) + '</button></div>';

  }

  function pacoteHTML(k) {

    var x = S.E.pacotes[k], v = (S.U.pacotes_visual || {})[k] || {};

    var oddsFiltradas = oddsGrupo(x.odds).filter(function (g) { return g.p > 0; });

    return '<article class="pct" style="--c:' + esc(v.cor || '#00FF87') + '">'

      + (v.rotulo_destaque ? '<span class="selo">' + esc(v.rotulo_destaque) + '</span>' : '')

      + envPacote(k)

      + '<div class="pct-n">' + esc(x.nome) + '</div>'

      + '<div class="pct-d">' + x.cartas + ' cartas' + (x.garantido ? ' · ' + esc(x.garantido.rotulo) : '') + '</div>'

      + '<div class="odds">' + oddsFiltradas.map(function (g) {

          return '<div class="odd' + (g.esg ? ' esg' : '') + '"><span class="chip"><span class="pt" style="background:' + esc(g.cor) + '"></span>' + esc(g.rotulo) + '</span>'

            + '<span class="t"><i style="width:' + Math.max(1.5, Math.min(100, g.p)) + '%;background:' + esc(g.cor) + '"></i></span>'

            + '<span class="v">' + (g.esg ? 'esgotado' : pct(g.p)) + '</span></div>';

        }).join('') + '</div>'

      + (x.garantido ? '<p class="garantia">Última carta: ' + oddsGrupo(x.garantido.odds).map(function (g) { return esc(g.rotulo) + ' ' + pct(g.p); }).join(' · ') + '</p>' : '')

      + botaoAbrir(k) + '</article>';

  }

  function pacoteMini(k) {

    var x = S.E.pacotes[k], v = (S.U.pacotes_visual || {})[k] || {};

    return '<article class="pct mini" style="--c:' + esc(v.cor || '#00FF87') + '">'

      + (v.rotulo_destaque ? '<span class="selo">' + esc(v.rotulo_destaque) + '</span>' : '')

      + envPacote(k)

      + '<div class="pct-n">' + esc(x.nome) + '</div>'

      + '<div class="pct-d">' + x.cartas + ' cartas' + (x.garantido ? ' · ' + esc(x.garantido.rotulo) : '') + '</div>'

      + botaoAbrir(k) + '</article>';

  }



  function presenteHTML() {

    if (!S.usuario || !S.presentes || !S.presentes.length) return '';

    var g = S.presentes[0], x = S.E.pacotes[g.pack_id]; if (!x) return '';

    return '<div class="presente chanfro"><span><small>Presente de boas-vindas</small><b>' + esc(x.nome) + ' grátis</b></span>'

      + '<a class="btn btn-ouro sm" href="abrir.html?pacote=' + encodeURIComponent(g.pack_id) + '&presente=' + encodeURIComponent(g.id) + '">Abrir agora</a></div>';

  }

  function pacotesHTML(lim) {

    var ks = pacotesAtivos(); if (lim) ks = ks.slice(0, lim);

    return presenteHTML() + '<div class="pacotes">' + ks.map(pacoteHTML).join('') + '</div>';

  }



  function resumoColecao() {

    var r = S.drop.resumo, tenho = {}, ids = {};

    S.inventario.forEach(function (c) { var k = c.id + '|' + c.raridade; if (!ids[k]) { ids[k] = 1; tenho[c.raridade] = (tenho[c.raridade] || 0) + 1; } });

    return '<div class="pan chanfro"><h3>Sua coleção · ' + esc(S.drop.nome) + '</h3>'

      + UPCarta.grupos(ORDEM.filter(function (k) { return r.por_raridade[k]; }).reverse(), rarVis).map(function (g) {

          var t = 0, de = 0; g.ids.forEach(function (k) { t += tenho[k] || 0; de += r.por_raridade[k]; });

          return '<div class="l" style="display:block"><div style="display:flex;align-items:center;gap:9px">'

            + '<span class="pt" style="background:' + esc(g.cor) + '"></span>' + esc(g.rotulo)

            + '<span class="v" style="margin-left:auto">' + num(t) + ' / ' + num(de) + '</span></div>'

            + '<div class="barra"><i style="width:' + (de ? Math.min(100, 100 * t / de) : 0) + '%;background:' + esc(g.cor) + '"></i></div></div>';

        }).join('') + '</div>';

  }



  function resumoDrop() {

    var r = S.drop.resumo;

    return '<div class="pan chanfro"><h3>No evento atual</h3>'

      + UPCarta.grupos(ORDEM.filter(function (k) { return r.por_raridade[k]; }).reverse(), rarVis).map(function (g) {

          var a = 0, e = 0; g.ids.forEach(function (k) { a += r.por_raridade[k]; e += r.exemplares[k] || 0; });

          return '<div class="l"><span class="pt" style="background:' + esc(g.cor) + '"></span>' + esc(g.rotulo)

            + '<span class="v">' + num(a) + ' <span class="dim" style="font-weight:600">· ' + num(e) + ' ex.</span></span></div>';

        }).join('') + '</div>';

  }



  /* ---------------- listas ---------------- */

  function filtra(lista) {

    var f = S.filtro, q = f.q.trim().toLowerCase();

    var out = lista.filter(function (c) {

      if (f.rar && f.rar.split(',').indexOf(c.raridade) < 0) return false;

      if (f.liga && c.liga !== f.liga) return false;
      if (S.aba === 'colecao' && f.est) {
        var trav = cartaTravada(c);
        if (f.est === 'livre' && (trav || c.em_venda)) return false;
        if (f.est === 'travada' && !trav) return false;
        if (f.est === 'venda' && !c.em_venda) return false;
      }

      if (q && (c.nome + ' ' + c.clube).toLowerCase().indexOf(q) < 0) return false;

      return true;

    });

    var by = {

      ovr: function (a, b) { return b.ovr - a.ovr; },

      nome: function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); },

      preco: function (a, b) { return (a.preco || 0) - (b.preco || 0); },

      raridade: function (a, b) { return ORDEM.indexOf(b.raridade) - ORDEM.indexOf(a.raridade) || b.ovr - a.ovr; }

    }[f.ordem] || null;

    return by ? out.slice().sort(by) : out;

  }



  function filtros(comPreco) {

    var f = S.filtro;

    var br = function (v, r, cor) { return '<button data-rar="' + v + '" aria-pressed="' + (f.rar === v) + '">' + (cor ? '<span class="pt" style="background:' + esc(cor) + '"></span>' : '') + esc(r) + '</button>'; };

    var bl = function (v, r) { return '<button data-liga="' + v + '" aria-pressed="' + (f.liga === v) + '">' + esc(r) + '</button>'; };

    return '<div class="pills">' + br('', 'Todas')

      + UPCarta.grupos(ORDEM.filter(function (k) { return S.drop.resumo.por_raridade[k]; }).reverse(), rarVis).map(function (g) { return br(g.ids.join(','), g.rotulo, g.cor); }).join('')

      + '</div><div class="pills">' + bl('', 'Todas as ligas') + (S.drop.ligas || []).map(function (k) { return bl(k, LIGA_NOME[k] || k); }).join('')

      + (S.aba === 'colecao' ? '</div><div class="pills">' + [['', 'Todas'], ['livre', 'Livres para vender'], ['travada', 'Bloqueadas'], ['venda', 'À venda']].map(function (o) {
          return '<button data-est="' + o[0] + '" aria-pressed="' + ((f.est || '') === o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') : '')
      + '</div><div class="pills"><input class="busca" id="q" type="search" placeholder="Buscar jogador ou clube" value="' + esc(f.q) + '" aria-label="Buscar">'

      + '<select class="sel" id="ordem" aria-label="Ordenar"><option value="ovr"' + (f.ordem === 'ovr' ? ' selected' : '') + '>Maior overall</option>'

      + '<option value="raridade"' + (f.ordem === 'raridade' ? ' selected' : '') + '>Raridade</option>'

      + '<option value="nome"' + (f.ordem === 'nome' ? ' selected' : '') + '>Nome</option>'

      + (comPreco ? '<option value="preco"' + (f.ordem === 'preco' ? ' selected' : '') + '>Menor preço</option>' : '') + '</select></div>';

  }



  /* cópias da mesma carta (mesmo jogador e raridade) que o usuário tem */

  function copias(c) { var k = c.id + '|' + c.raridade, n = 0; S.inventario.forEach(function (x) { if (x.id + '|' + x.raridade === k) n++; }); return n; }

  function fmtDataHora(iso) { return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  function tempoRestante(iso) {
    var ms = new Date(iso).getTime() - Date.now(); if (!(ms > 0)) return 'encerrando';
    var m = Math.floor(ms / 60000), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + mm + 'min' : mm + 'min';
  }
  function infoAnuncio(c) {
    return '<div class="anun-info"><div><span>Vendedor</span><b>' + esc(c.meu ? 'Você' : (c.vendedor || 'Jogador')) + '</b></div>'
      + '<div><span>Preço</span><b>' + pcIco() + num(c.preco) + '</b></div>'
      + (c.criado ? '<div><span>Anunciado em</span><b>' + esc(fmtDataHora(c.criado)) + '</b></div>' : '')
      + (c.expira ? '<div><span>Sai do mercado em</span><b>' + esc(tempoRestante(c.expira)) + ' <small>(' + esc(fmtDataHora(c.expira)) + ')</small></b></div>' : '')
      + '</div>';
  }
  // Coleção: uma linha por jogador+raridade (o ×N mostra as cópias); representa pela cópia livre de menor mint
  function umaPorJogador(lista) {
    var melhor = {}, ordem = [];
    lista.forEach(function (c) {
      var k = c.id + '|' + c.raridade, a = melhor[k];
      if (!a) { melhor[k] = c; ordem.push(k); return; }
      var livre = function (x) { return !x.em_venda && !cartaTravada(x); };
      if ((livre(c) && !livre(a)) || (livre(c) === livre(a) && (c.mint || 1e9) < (a.mint || 1e9))) melhor[k] = c;
    });
    return ordem.map(function (k) { return melhor[k]; });
  }
  // a lista ocupa só o espaço que sobra na tela (a página não rola; quem rola é a lista)
  function ajustaRolagem() {
    if (window.innerWidth <= 1180) return;
    document.querySelectorAll('.rolagem').forEach(function (el) {
      var topo = el.getBoundingClientRect().top + window.scrollY;
      var h = Math.floor(window.innerHeight - topo - 16);
      el.style.maxHeight = Math.max(300, h) + 'px';
    });
  }
  window.addEventListener('resize', function () { ajustaRolagem(); });
  function cartaTravada(c) { return !!(c && c.destravada_em && new Date(c.destravada_em) > new Date()); }
  // etiqueta na lista: carta anunciada no mercado
  function vendaLinha(c) {
    if (!c || !c.em_venda) return '';
    return '<svg class="tag-lin" viewBox="0 0 16 16" role="img" aria-label="Anunciada no mercado"><title>Anunciada no mercado</title>'
      + '<path d="M1.5 8.2V2.6a1.1 1.1 0 0 1 1.1-1.1h5.6l6.3 6.3a1.1 1.1 0 0 1 0 1.6l-4.7 4.7a1.1 1.1 0 0 1-1.6 0z" fill="currentColor"/><circle cx="4.9" cy="4.9" r="1.3" fill="#061009"/></svg>';
  }
  // cadeado na lista: carta ainda presa para vender/trocar (destravada_em no futuro)
  function cadeadoLinha(c) {
    if (!c || !c.destravada_em || !(new Date(c.destravada_em) > new Date())) return '';
    var q = new Date(c.destravada_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    return '<svg class="cad-lin" viewBox="0 0 16 16" role="img" aria-label="Bloqueada para venda e troca até ' + esc(q) + '"><title>Bloqueada para venda e troca até ' + esc(q) + '</title>'
      + '<path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="3" y="7" width="10" height="7.5" rx="1.6" fill="currentColor"/></svg>';
  }
  function tabela(lista, modo) {

    if (!lista.length) return '<div class="vazio"><b>Nada aqui</b>Nenhuma carta com esses filtros.</div>';

    var pre = modo === 'mercado' || modo === 'meus';

    return '<div class="rolagem"><table class="tab"><thead><tr><th>OVR</th><th>Carta</th><th class="oc">Pos</th><th>Raridade</th><th class="oc">Liga</th>'

      + '<th class="oc">' + (modo === 'catalogo' ? 'Tiragem' : 'Mint') + '</th>' + (pre ? '<th>Preço</th>' : '') + '</tr></thead><tbody>'

      + lista.slice(0, 400).map(function (c) {

          var v = rarVis(c.raridade), chave = c.uid || ('c' + c.n);

          return '<tr data-k="' + esc(chave) + '"' + (S.sel && (S.sel.uid || ('c' + S.sel.n)) === chave ? ' aria-selected="true"' : '') + '>'

            + '<td class="o" style="color:' + esc(v.cor) + '">' + c.ovr + '</td>'

            + '<td class="n">' + esc(c.nome) + (modo === 'colecao' && copias(c) > 1 ? ' <span class="rep">×' + copias(c) + '</span>' : '') + '<small>' + esc([c.clube, c.nac_pt || c.nac || c.pais].filter(Boolean).join(' · ')) + (c.em_venda && modo === 'colecao' ? ' · à venda' : '') + ((modo === 'mercado' || modo === 'meus') && c.expira ? ' · ' + (c.meu ? 'seu anúncio' : 'por ' + esc(c.vendedor || 'Jogador')) + ' · sai em ' + esc(tempoRestante(c.expira)) : '') + '</small></td>'

            + '<td class="r dim oc">' + vendaLinha(c) + cadeadoLinha(c) + esc(c.pos) + '</td>'

            + '<td class="r"><span class="chip"><span class="pt" style="background:' + esc(v.cor) + '"></span>' + esc(v.rotulo) + '</span></td>'

            + '<td class="r dim oc">' + esc(LIGA_NOME[c.liga] || c.liga) + '</td>'

            + '<td class="r dim oc">' + (modo === 'catalogo' ? num(c.tiragem) : (c.mint ? String(c.mint).padStart(3, '0') : '—')) + '</td>'

            + (pre ? '<td class="v">' + num(c.preco) + '</td>' : '') + '</tr>';

        }).join('') + '</tbody></table></div>'

      + (lista.length > 400 ? '<p class="nota">Mostrando 400 de ' + num(lista.length) + '. Refine os filtros.</p>' : '');

  }



  function faixa(r) { var f = (S.E.mercado && S.E.mercado.faixa_preco && S.E.mercado.faixa_preco[r]) || [1, 1e9]; return { min: f[0], max: f[1] }; }

  function corStat(val) {

    val = Number(val) || 0;

    if (val >= 85) return '#00FF87';

    if (val >= 75) return '#E8B84B';

    if (val >= 65) return '#4DA3FF';

    return 'rgba(242,247,244,.55)';

  }

  function formataDataCurta(iso) {

    try {

      var d = new Date(iso);

      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

        + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    } catch (e) { return String(iso || ''); }

  }

  function vendaHTML(c) {

    var f = faixa(c.raridade), sug = Math.max(f.min, Math.min(f.max, Math.round((S.E.resgate_por_raridade[c.raridade] || 10) * 3)));

    var tx = (S.E.mercado && S.E.mercado.taxa_percent) || 5;

    return '<div class="pan chanfro det-venda"><h3>Anunciar no mercado</h3>'

      + '<div class="det-venda-row"><input class="busca" id="precoVenda" type="number" min="' + f.min + '" max="' + f.max + '" step="1" inputmode="numeric" value="' + sug + '" data-taxa="' + tx + '">'

      + '<button class="btn btn-ouro sm" data-anunciar="' + esc(c.uid) + '">Anunciar</button></div>'

      + '<p class="nota" id="liquido" data-faixa="' + num(f.min) + ' a ' + num(f.max) + '">Você recebe ' + num(sug - Math.ceil(sug * tx / 100)) + ' · faixa ' + num(f.min) + ' a ' + num(f.max) + '</p></div>';

  }

  function detalhe(modo) {

    if (!S.sel) {

      return '<div class="pan chanfro det-vazio"><h3>Inspeção da carta</h3>'

        + '<p class="dim" style="margin:0;font-size:13.5px;line-height:1.5">Clique em qualquer carta na lista ao lado para visualizar a arte em 3D holográfico, atributos completos e dados da edição.</p></div>';

    }

    var c = S.sel, v = rarVis(c.raridade), E = S.E;

    var travada = c.destravada_em && new Date(c.destravada_em) > new Date();

    var mini = (window.UPCarta && UPCarta.garanteMiniOveralls) ? UPCarta.garanteMiniOveralls(c) : { L: LBLS, st: [70, 70, 70, 70, 70, 70] };

    var band = (window.UPCarta && UPCarta.bandeiraSlug) ? UPCarta.bandeiraSlug(c) : (c.bandeira || '');

    var escSlug = (window.UPCarta && UPCarta.escudoSlug) ? UPCarta.escudoSlug(c) : (c.escudo || '');

    var posExt = (window.UPCarta && UPCarta.posNome) ? UPCarta.posNome(c.pos) : (c.pos || '—');

    var peExt = (window.UPCarta && UPCarta.peNome) ? UPCarta.peNome(c.pe) : (c.pe || '—');

    var nacNome = c.nac_pt || c.nac || c.pais || '—';

    var ligaNome = LIGA_NOME[c.liga] || c.liga || '—';

    var nCopias = (modo === 'colecao' && c.uid) ? copias(c) : 0;

    var valorResgate = (E && E.resgate_por_raridade && E.resgate_por_raridade[c.raridade]) || 0;



    var badges = '<span class="det-tag" style="--tc:' + esc(v.cor) + '"><span class="pt" style="background:' + esc(v.cor) + '"></span>' + esc(v.rotulo) + '</span>';

    if (c.promessa) badges += '<span class="det-tag det-tag-prom">★ Promessa Sub-21 · OVR 80+</span>';

    if (c.idolo) badges += '<span class="det-tag det-tag-ouro">Ídolo Oficial</span>';

    if (c.edicao === 'natal') badges += '<span class="det-tag det-tag-natal">Edição Natal & Virada</span>';

    else if (c.edicao === 'raizes') badges += '<span class="det-tag det-tag-raizes">Edição Raízes</span>';

    if (c.delta) {

      var up = Number(c.delta) > 0;

      badges += '<span class="det-tag ' + (up ? 'det-tag-up' : 'det-tag-dn') + '">' + (up ? '▲ +' : '▼ ') + Math.abs(Number(c.delta)) + ' OVR</span>';

    }



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



    var acoes = '';

    if (modo === 'mercado' && c.trade && !c.meu) {

      var pode = !!S.usuario && S.saldo >= c.preco;

      acoes = infoAnuncio(c) + '<div class="det-acoes"><button class="btn btn-ouro det-btn-full" data-comprar="' + esc(c.trade) + '"' + (pode ? '' : ' disabled') + '>'

        + (S.usuario ? (pode ? (S.confCompra === c.trade ? '<span>Confirmar compra por</span>' : '<span>Comprar por</span>') + ' <span class="det-btn-val">' + pcIco() + num(c.preco) + '</span>' : 'Saldo insuficiente (' + num(c.preco) + ')') : 'Entre na conta para comprar') + '</button>'
        + (S.confCompra === c.trade ? '<p class="muted" style="margin:6px 0 0;font-size:12px">Toque de novo para confirmar. A compra não pode ser desfeita.</p>' : '') + '</div>';

    } else if ((modo === 'meus' || modo === 'mercado') && c.trade) {

      var minRet = Number((S.E && S.E.mercado && S.E.mercado.min_minutos_retirar) || 60);
      var libera = c.retirar ? new Date(c.retirar) : (c.criado ? new Date(new Date(c.criado).getTime() + minRet * 60000) : null);
      var fmtH = function (d) { return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); };
      var cedo = libera && libera > new Date();
      acoes = infoAnuncio(c) + '<div class="det-acoes">'
        + (c.expira ? '<p class="muted" style="margin:0 0 8px;font-size:12px">Se não vender até ' + esc(fmtH(new Date(c.expira))) + ', volta sozinha para a sua coleção.</p>' : '')
        + '<button class="btn btn-sec det-btn-full" data-cancelar="' + esc(c.trade) + '"' + (cedo ? ' disabled' : '') + '>'
        + (cedo ? 'Pode retirar a partir de ' + esc(fmtH(libera)) : 'Retirar anúncio do mercado') + '</button></div>';

    } else if (modo === 'colecao' && c.uid) {

      var blocoMerc = c.em_venda

        ? '<div class="det-status-box anunciado">' + CADEADO + '<div><b>Anunciada no mercado</b><span>Esta carta está ativa em seus anúncios de venda.</span></div></div>'

        : travada

          ? '<div class="det-status-box travada">' + CADEADO + '<div><b>Bloqueio temporário de venda</b><span>Liberada em ' + esc(formataDataCurta(c.destravada_em)) + '</span></div></div>'

          : vendaHTML(c);

      var btResgate = !c.em_venda

        ? '<button class="btn btn-sec det-btn-full" data-desfazer="' + esc(c.uid) + '"><span>Resgatar carta por</span> <span class="det-btn-val">' + pcIco() + num(valorResgate) + '</span></button>'

        : '';

      acoes = '<div class="det-acoes">' + blocoMerc + btResgate + '</div>';

    }



    var motivoEspecial = c.promessa

      ? 'Jovem até 21 anos e OVR 80+'

      : c.idolo

        ? 'Ídolo Histórico da Liga'

        : c.edicao === 'natal'

          ? 'Especial Natal & Virada'

          : c.edicao === 'raizes'

            ? 'Especial Raízes'

            : null;



    return '<div class="det" style="--rc:' + esc(v.cor) + '">'

      + '<div class="det-esq">'

      + '<div class="det-palco">' + cartaHTML(c)

      + '<div class="det-dica">✦ Passe o mouse ou arraste na carta · Efeito 3D Holo</div></div>'

      + statsHTML

      + '</div>'

      + '<div class="det-dir">'

      + '<div class="pan chanfro det-head">'

      + '<div class="det-head-top">'

      + '<div class="det-ovr-badge" style="--rc:' + esc(v.cor) + '"><b>' + esc(c.ovr) + '</b><span>' + esc(c.pos || 'MEI') + '</span></div>'

      + '<div class="det-head-txt"><h2>' + esc(c.nome) + '</h2><p>' + esc([c.clube, nacNome].filter(Boolean).join(' · ')) + '</p></div>'

      + '</div>'

      + '<div class="det-badges">' + badges + '</div>'

      + '</div>'

      + '<div class="pan chanfro det-ficha"><h3>Ficha do Atleta</h3>'

      + '<div class="l"><span class="k">Clube</span><span class="v">' + (escSlug ? '<img class="det-ico-esc" src="../assets/escudos/' + esc(escSlug) + '.png" alt="">' : '') + esc(c.clube || '—') + '</span></div>'

      + '<div class="l"><span class="k">Nacionalidade</span><span class="v">' + (band ? '<img class="det-ico-band" src="../flags/' + esc(band) + '.png" alt="">' : '') + esc(nacNome) + '</span></div>'

      + '<div class="l"><span class="k">Liga</span><span class="v">' + esc(ligaNome) + '</span></div>'

      + '<div class="l"><span class="k">Posição</span><span class="v"><span class="det-pos-chip">' + esc(c.pos || '—') + '</span> ' + esc(posExt) + '</span></div>'

      + '<div class="l"><span class="k">Idade</span><span class="v">' + (c.idade ? esc(c.idade) + ' anos' : '—') + '</span></div>'

      + '<div class="l"><span class="k">Pé dominante</span><span class="v">' + esc(peExt) + '</span></div>'

      + '</div>'

      + '<div class="pan chanfro det-edicao"><h3>Edição & Coleção</h3>'

      + '<div class="l"><span class="k">Raridade</span><span class="v" style="color:' + esc(v.cor) + '"><span class="pt" style="background:' + esc(v.cor) + '"></span>' + esc(v.rotulo) + '</span></div>'

      + (motivoEspecial ? '<div class="l"><span class="k">Destaque</span><span class="v det-v-dest">' + esc(motivoEspecial) + '</span></div>' : '')

      + '<div class="l"><span class="k">' + (c.mint ? 'Numeração (Mint)' : 'Tiragem máxima') + '</span><span class="v">'

      + (c.mint ? '<span class="det-mint-pill' + (c.mint <= 10 ? ' top' : '') + '">#' + String(c.mint).padStart(3, '0') + '</span> de ' + num(c.tiragem) : num(c.tiragem) + ' ex.') + '</span></div>'

      + (c.drop ? '<div class="l"><span class="k">Coleção</span><span class="v">' + esc(c.drop) + '</span></div>' : '')

      + (modo === 'colecao' && c.uid ? '<div class="l"><span class="k">Suas cópias</span><span class="v">' + num(nCopias) + (nCopias > 1 ? ' cópias <span class="rep">Repetida</span>' : ' cópia (Única)') + '</span></div>' : '')

      + '<div class="l"><span class="k">Valor de resgate</span><span class="v ouro">' + pcIco() + num(valorResgate) + '</span></div>'

      + (c.preco ? '<div class="l"><span class="k">Preço anunciado</span><span class="v ouro">' + pcIco() + num(c.preco) + '</span></div>' : '')

      + '</div>'

      + acoes

      + '</div></div>';

  }



  /* ---------------- telas ---------------- */



  function telaInicio() {

    var packs = obterMeusPacotes();

    var packKeys = Object.keys(packs).filter(function (k) { return packs[k] > 0; });



    var inventarioHtml = '';

    if (packKeys.length) {

      inventarioHtml = '<section class="ini-seus-packs" style="margin-top:20px">'

        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:10px">'

        + '<h2 style="font-family:var(--fd, Teko, sans-serif);font-size:24px;letter-spacing:1.5px;color:var(--ouro);text-transform:uppercase;margin:0">Seus Pacotes no Inventário</h2>'

        + '<a class="btn btn-sec sm" data-aba="pacotes" style="font-size:11px">Loja de Pacotes →</a>'

        + '</div>'

        + '<div class="seus-packs-grid" style="display:flex;gap:14px;justify-content:flex-start;flex-wrap:wrap">'

        + packKeys.map(function (k) {

          var x = S.E.pacotes[k] || { nome: k, cartas: 3 };

          var v = (S.U.pacotes_visual || {})[k] || {};

          var qtd = packs[k];

          var logoPack = '../assets/favicon.png';

          return '<div class="meu-pack-card chanfro" style="max-width:210px;width:100%;padding:12px;display:flex;flex-direction:column;align-items:center;gap:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(232,184,75,0.3);border-radius:16px">'

            + '<span class="qtd-badge" style="font-weight:900;letter-spacing:1.5px;padding:3px 12px;background:rgba(232,184,75,0.18);border:1px solid rgba(232,184,75,0.5);color:var(--ouro);border-radius:99px;font-size:11px">' + qtd + ' DISPONÍVEL' + (qtd > 1 ? 'S' : '') + '</span>'

            + '<div class="pack-wrap" onclick="location.href=\'abrir.html?pacote=' + encodeURIComponent(k) + '\'">'

            + UPCarta.pacote({ cor: v.cor || '#CD7F32', imagem: v.imagem || (k === 'p_diario' ? 'assets/cartas/pacote_diario.png' : ''), arte: v.arte || 'diario', logo: logoPack, nomeJogo: S.U.nome, cartas: x.cartas || 3, nome: x.nome || 'Pacote' })

            + '</div>'

            + '<b style="font-family:var(--fd, Teko, sans-serif);font-size:20px;letter-spacing:1px;text-transform:uppercase;color:#fff;margin-top:8px">' + esc(x.nome || 'Pacote') + '</b>'

            + '<a class="btn btn-ouro sm" style="width:100%;font-weight:900;letter-spacing:1px;text-align:center;padding:9px 0" href="abrir.html?pacote=' + encodeURIComponent(k) + '">ABRIR AGORA ▶</a>'

            + '</div>';

        }).join('')

        + '</div></section>';

    } else {

      inventarioHtml = '<section class="ini-seus-packs" style="margin-top:20px">'

        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:10px">'

        + '<h2 style="font-family:var(--fd, Teko, sans-serif);font-size:24px;letter-spacing:1.5px;color:var(--ouro);text-transform:uppercase;margin:0">Seus Pacotes no Inventário</h2>'

        + '<a class="btn btn-sec sm" data-aba="pacotes" style="font-size:11px">Loja de Pacotes →</a>'

        + '</div>'

        + '<div class="vazio chanfro" style="text-align:center;padding:36px 16px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.12);border-radius:14px">'

        + '<p style="color:rgba(255,255,255,0.6);margin-bottom:14px">Você não possui pacotes no inventário no momento.</p>'

        + '<button class="btn btn-ouro sm" data-aba="pacotes">Obter Pacotes na Loja</button>'

        + '</div></section>';

    }



    return banners() + inventarioHtml;

  }



  function telaPacotes() {

    return '<div class="cabe"><div><span class="eyb">' + esc(S.drop.nome) + '</span><h1>Pacotes</h1></div></div>'

      + '<div class="grade"><div>' + pacotesHTML() + '</div><aside>' + resumoDrop() + '</aside></div>';

  }



  function avisoConta() {

    return '<div class="aviso chanfro" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><span style="flex:1;min-width:200px">Entre na sua conta para abrir pacotes, colecionar e negociar.</span>'

      + '<a class="btn btn-ouro sm" href="../conta/login.html?next=' + encodeURIComponent('cartas/index.html') + '">Entrar</a></div>';

  }



  function telaColecao() {
    var cab = '<div class="cabe"><div><span class="eyb">Suas cartas</span><h1>Coleção</h1></div>'
      + '<span class="c">' + num(S.inventario.length) + ' cartas</span></div>';
    if (!S.inventario.length) {
      return cab + '<div class="vazio"><b>Coleção vazia</b>Abra um pacote na loja ou no resgate diário para tirar suas primeiras cartas.'
        + '<div style="margin-top:14px"><button class="btn btn-ouro" data-aba="pacotes">Ver pacotes</button></div></div>';
    }
    var avisoConv = (!S.usuario)
      ? '<div class="aviso chanfro" style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><span>✦ Modo Convidado: suas cartas estão salvas neste navegador. <a href="../conta/cadastro.html" style="color:var(--ouro);text-decoration:underline">Crie uma conta gratuita</a> para salvar na nuvem e negociar no mercado.</span><a class="btn btn-ouro sm" href="../conta/cadastro.html">Criar conta</a></div>'
      : '';
    var filtrada = umaPorJogador(filtra(S.inventario));
    if (S.sel && !filtrada.some(function (c) { return c.uid === S.sel.uid; })) {
      // carta escolhida virou outra cópia do mesmo jogador: mantém o jogador selecionado
      var mesma = filtrada.filter(function (c) { return c.id === S.sel.id && c.raridade === S.sel.raridade; })[0];
      S.sel = mesma || null;
    }
    if (!S.sel && filtrada.length && window.innerWidth > 1180) S.sel = filtrada[0];
    return cab + avisoConv + '<div class="grade com-det"><div>' + filtros() + tabela(filtrada, "colecao") + '</div><aside>' + detalhe("colecao") + '</aside></div>';
  }

  function telaMercado() {
    var MERC = ['venda', 'meus', 'hist'];
    if (MERC.indexOf(S.merc) < 0) S.merc = 'venda';
    var todos = S.anuncios || [], meus = S.meusAnuncios || [];
    var abas = [['venda', 'À venda', todos.length], ['meus', 'Meus anúncios', meus.length], ['hist', 'Histórico', null]];
    var E = (S.E && S.E.mercado) || {};
    var regras = '<p class="muted merc-regras">Taxa de ' + num(E.taxa_percent || 5) + '% sobre a venda · anúncio fica até ' + num(Math.round((E.max_horas_anuncio || 168) / 24)) + ' dias e depois volta para a coleção · '
      + 'retirar só depois de ' + num(E.min_minutos_retirar || 60) + ' min · para vender, escolha a carta na Coleção.</p>';
    var cab = '<div class="cabe"><div><span class="eyb">Entre jogadores</span><h1>Mercado</h1></div></div>'
      + '<div class="merc-abas" role="tablist">' + abas.map(function (a) {
          return '<button type="button" role="tab" data-merc="' + a[0] + '" aria-selected="' + (S.merc === a[0]) + '">' + esc(a[1]) + (a[2] != null ? ' <span>' + num(a[2]) + '</span>' : '') + '</button>';
        }).join('') + '</div>'
      + (!S.usuario ? avisoConta() : '');
    var vazio = function (t, d) { return '<div class="vazio"><b>' + esc(t) + '</b>' + esc(d) + '</div>'; };
    if (S.merc === 'hist') return cab + telaHistMercado();
    var lista = S.merc === 'meus' ? meus : todos;
    if (!lista.length) return cab + regras + (S.merc === 'meus' ? vazio('Você não tem anúncios', 'Para vender, abra a carta na Coleção e anuncie.') : vazio('Nenhuma carta à venda agora', 'Novos anúncios aparecem aqui.'));
    return cab + regras + filtros(true) + tabela(filtra(lista), S.merc === 'meus' ? 'meus' : 'mercado') + mercFocoHTML();
  }
  // carta do anúncio em foco no meio da tela, com tudo da venda
  function mercFocoHTML() {
    var c = S.mercFoco; if (!c) return '';
    var lista = (S.merc === 'meus' ? S.meusAnuncios : S.anuncios) || [];
    c = lista.filter(function (x) { return x.trade === c.trade; })[0];
    if (!c) { S.mercFoco = null; document.documentElement.classList.remove('sem-rolar'); return ''; }
    var acoes;
    if (c.meu) {
      var libera = c.retirar ? new Date(c.retirar) : null, cedo = libera && libera > new Date();
      acoes = '<button class="btn btn-sec det-btn-full" data-cancelar="' + esc(c.trade) + '"' + (cedo ? ' disabled' : '') + '>'
        + (cedo ? 'Pode retirar a partir de ' + esc(fmtDataHora(libera)) : 'Retirar anúncio do mercado') + '</button>'
        + '<p class="muted" style="margin:6px 0 0;font-size:12px">Se não vender até ' + esc(fmtDataHora(c.expira)) + ', a carta volta sozinha para a sua coleção.</p>';
    } else {
      var pode = !!S.usuario && S.saldo >= c.preco, conf = S.confCompra === c.trade;
      acoes = '<button class="btn btn-ouro det-btn-full" data-comprar="' + esc(c.trade) + '"' + (pode ? '' : ' disabled') + '>'
        + (S.usuario ? (pode ? '<span>' + (conf ? 'Confirmar compra por' : 'Comprar por') + '</span> <span class="det-btn-val">' + pcIco() + num(c.preco) + '</span>' : 'Saldo insuficiente (' + num(c.preco) + ')') : 'Entre na conta para comprar') + '</button>'
        + (conf ? '<p class="muted" style="margin:6px 0 0;font-size:12px">Toque de novo para confirmar. A compra não pode ser desfeita.</p>' : '');
    }
    var v = rarVis(c.raridade);
    return '<div class="alb-foco merc-foco" role="dialog" aria-modal="true" aria-label="' + esc(c.nome) + '">'
      + '<div class="alb-foco-fundo" data-merc-fecha="1"></div>'
      + '<div class="alb-foco-caixa merc-foco-caixa">'
      + '<button type="button" class="alb-foco-x" data-merc-fecha="1" aria-label="Fechar">×</button>'
      + '<div class="alb-foco-carta det-palco" style="--rc:' + esc(v.cor) + '">' + cartaHTML(c) + '</div>'
      + '<div class="merc-foco-lado"><h2>' + esc(c.nome) + '</h2><p class="muted" style="margin:0 0 10px">' + esc([c.clube, c.nac_pt || c.nac, v.rotulo, 'OVR ' + c.ovr].filter(Boolean).join(' · ')) + '</p>'
      + infoAnuncio(c) + acoes + '</div>'
      + '</div></div>';
  }
  async function carregaHistMercado() {
    S.histMerc = 'carregando';
    try { var r = await window.Promessa.sb.rpc('meu_historico_mercado'); if (r.error) throw r.error; S.histMerc = r.data || []; }
    catch (e) { console.warn('[ultimate] histórico mercado:', e); S.histMerc = 'erro'; }
    if (S.aba === 'mercado' && S.merc === 'hist') pinta();
  }
  function telaHistMercado() {
    if (!S.usuario) return '';
    if (S.histMerc == null) carregaHistMercado();
    if (S.histMerc === 'carregando' || S.histMerc == null) return '<div class="pm-esq" aria-busy="true" aria-label="Carregando"><div class="pm-esq-l"></div><div class="pm-esq-l"></div><div class="pm-esq-l"></div><div class="pm-esq-l"></div></div>';
    if (S.histMerc === 'erro') return '<div class="vazio"><b>Histórico indisponível agora</b>Tente de novo em instantes.</div>';
    if (!S.histMerc.length) return '<div class="vazio"><b>Sem movimentação ainda</b>Suas compras, vendas e anúncios encerrados aparecem aqui.</div>';
    var ROT = { concluida: { venda: 'Vendida', compra: 'Comprada' }, cancelada: { venda: 'Retirada' }, expirada: { venda: 'Venceu e voltou' } };
    return '<div class="merc-hist">' + S.histMerc.map(function (h) {
      var f = S.porId[h.jogador_id] || {}, rot = (ROT[h.estado] || {})[h.papel] || h.estado;
      var ganho = h.estado === 'concluida' ? (h.papel === 'venda' ? '+' : '−') + num(h.preco) : num(h.preco);
      return '<div class="mh-l"><b class="o">' + esc(h.ovr) + '</b><span class="n">' + esc(f.nome || String(h.jogador_id).split('|').pop())
        + '<small>' + esc(rot) + (h.outro ? (h.papel === 'venda' ? ' para ' : ' de ') + esc(h.outro) : '') + ' · ' + esc(fmtDataHora(h.quando)) + '</small></span>'
        + '<span class="v ' + (h.estado === 'concluida' ? (h.papel === 'venda' ? 'pos' : 'neg') : '') + '">' + pcIco() + ganho + '</span></div>';
    }).join('') + '</div>';
  }
  function missoesBase() {

    if (S.quadro) return S.quadro;

    var d = new Date().getDay(), out = [];

    for (var k = 0; k < 7; k++) for (var n = 0; n < 4; n++)

      out.push({ id: 'trancada-' + k + '-' + n, periodo: 'diario', dia_semana: k, hoje: false, resgatado: false, progresso: 0, dia_atual: d });

    return out;

  }



  function linhaMissao(m) {

    var icones = { abrir_pacotes: 'camisa', abrir_premium: 'trofeu', anunciar: 'troca', vender: 'troca', comprar: 'troca', resgatar: 'medalha', tirar_ouro: 'trofeu2', bonus: 'medalha' };

    var ok = m.progresso >= m.meta;

    var acao = !S.usuario ? '' : m.resgatado ? '<span class="prog">Resgatada</span>'

      : ok ? '<button class="btn btn-ouro sm" data-resgatar="' + esc(m.id) + '">Resgatar</button>'

      : '<span class="prog">' + num(m.progresso) + ' / ' + num(m.meta) + '</span><span class="barra"><i style="width:' + Math.round(100 * m.progresso / m.meta) + '%;background:var(--ouro)"></i></span>';

    return '<div class="mis' + (m.resgatado ? ' feita' : ok ? ' ok' : '') + '"><span class="ic"><i style="' + ico(icones[m.tipo] || 'bola') + '"></i></span>'

      + '<div><b>' + esc(m.descricao) + '</b><span>' + (m.periodo === 'semanal' ? 'Esta semana' : m.periodo === 'unico' ? 'Uma vez' : 'Hoje') + '</span></div>'

      + '<div class="acao"><span class="pg">' + pcIco() + '+' + num(m.recompensa) + '</span>' + acao + '</div></div>';

  }

  function missoesHoje(L) { return L.filter(function (m) { return m.periodo === 'diario' && m.hoje && m.tipo !== 'login' && m.descricao; }); }



  function resumoMissoes() {

    var hoje = missoesHoje(missoesBase());

    return '<div class="pan chanfro"><h3>Missões de hoje</h3>' + (hoje.length ? hoje.map(function (m) {

      return '<div class="l">' + esc(m.descricao) + '<span class="v ouro">' + (m.resgatado ? 'feita' : '+' + num(m.recompensa)) + '</span></div>';

    }).join('') : '<div class="l dim">Entre na conta para ver as missões de hoje.</div>')

      + '<div style="margin-top:10px"><button class="btn btn-sec sm" data-aba="missoes">Ver a semana</button></div></div>';

  }



  var CADEADO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 10V7a5 5 0 0 1 10 0v3h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V7a3 3 0 0 0-6 0z"/></svg>';

  function telaMissoes() {

    var L = missoesBase(), dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    var d = L.length ? L[0].dia_atual : new Date().getDay();

    var hoje = missoesHoje(L);

    var semana = L.filter(function (m) { return m.periodo === 'semanal'; });

    var unico = L.filter(function (m) { return m.periodo === 'unico' && !m.resgatado; });

    var quadro = '<div class="semana">' + dias.map(function (nome, k) {

      var ms = L.filter(function (m) { return m.periodo === 'diario' && m.dia_semana === k && m.tipo !== 'login'; });

      var aberto = k === d && S.usuario;

      return '<div class="dia' + (k === d ? ' hoje' : k < d ? ' passou' : ' futuro') + '"><h4>' + esc(nome.slice(0, 3)) + '</h4>'

        + (aberto ? ms.map(function (m) { return '<div class="m' + (m.resgatado ? ' feita' : '') + '">' + esc(m.descricao) + '<b>' + pcIco() + num(m.recompensa) + '</b></div>'; }).join('')

          : '<div class="tranca">' + CADEADO + '<span>' + (k < d ? 'Encerrado' : k === d ? 'Entre para ver' : 'Libera ' + esc(nome.toLowerCase())) + '</span>'

            + (k < d && ms.length && S.usuario ? '<small>' + ms.filter(function (m) { return m.resgatado; }).length + ' / ' + ms.length + ' feitas</small>' : '') + '</div>')

        + '</div>';

    }).join('') + '</div>';

    return '<div class="cabe"><div><span class="eyb">Ganhe ' + esc(moeda().nome) + '</span><h1>Missões</h1></div>'

      + '<span class="c">' + esc(dias[d] || '') + ' · novas missões todo domingo</span></div>'

      + (!S.usuario ? avisoConta() : '')

      + quadro

      + '<div class="grade"><div>'

      + (unico.length ? '<div class="cabe"><h2 class="p">Boas-vindas</h2></div>' + unico.map(linhaMissao).join('') : '')

      + (hoje.length ? '<div class="cabe"><h2 class="p">Hoje</h2></div>' + hoje.map(linhaMissao).join('') : '')

      + (semana.length ? '<div class="cabe" style="margin-top:18px"><h2 class="p">Da semana</h2></div>' + semana.map(linhaMissao).join('') : '') + '</div>'

      + '<aside><div class="pan chanfro"><h3>Todo dia</h3><div class="l">Entrar no jogo<span class="v ouro">+' + num(S.E.login_diario || 50) + '</span></div></div>'

      + '<div class="pan chanfro"><h3>Resgate de carta repetida</h3>'

      + UPCarta.grupos(ORDEM.filter(function (k) { return S.E.resgate_por_raridade[k] && !rarVis(k).secreta; }).reverse(), rarVis).map(function (g) {

          var vals = g.ids.map(function (k) { return S.E.resgate_por_raridade[k]; });

          var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);

          return '<div class="l"><span class="pt" style="background:' + esc(g.cor) + '"></span>' + esc(g.rotulo) + '<span class="v ouro">' + num(mn) + (mx !== mn ? '–' + num(mx) : '') + '</span></div>';

        }).join('') + '</div></aside></div>';

  }



  function gaveta() {

    if (!S.cfg) return '';

    var pular = lsGet(CHAVE_ANIM) === '1';

    return '<div class="veu" data-fechar-cfg></div><aside class="gaveta" role="dialog" aria-modal="true" aria-label="Configurações">'

      + '<header><h2>Configurações</h2><button class="icobt" data-fechar-cfg aria-label="Fechar">' + SVG.x + '</button></header><div class="gc">'

      + '<div class="grupo"><h3>Jogo</h3><label class="item">Pular animação ao abrir pacote<input type="checkbox" id="optAnim"' + (pular ? ' checked' : '') + '></label></div>'

      + '<div class="grupo"><h3>Conta</h3><a class="item" href="../conta/perfil.html">Meu perfil<span class="v">' + (S.usuario ? 'conectado' : 'convidado') + '</span></a>'

      + (S.usuario ? '<button class="item per" id="btSair">Sair da conta</button>' : '<a class="item" href="../conta/login.html?next=' + encodeURIComponent('cartas/index.html') + '">Criar conta ou entrar</a>') + '</div>'

      + '<div class="grupo"><h3>Regras e documentos</h3><a class="item" href="../conta/regras.html">Como funciona cada modo</a>'

      + '<a class="item" href="../conta/termos.html">Termos de uso</a><a class="item" href="../conta/privacidade.html">Política de privacidade</a></div>'

      + '<div class="grupo"><h3>Sobre</h3><div class="item" style="cursor:default">' + esc(S.U.nome) + '<span class="v">' + esc(S.drop.nome) + '</span></div></div>'

      + '</div></aside>';

  }



  
  function itensComunicado(c) {
    return (c && Array.isArray(c.itens) ? c.itens : []).map(function (x) {
      var q = Number(x.qtd) || 1;
      if (x.tipo === 'carta') {
        var o = daCarta({ id: 'previa', jogador_id: x.jogador, raridade: x.raridade, ovr_snapshot: x.ovr || 0, mint: 0 }) || {};
        return { cab: x.ovr ? String(x.ovr) : '', rot: (q > 1 ? q + 'x ' : '') + 'Carta', nome: o.nome || String(x.jogador).split('|').pop(), det: (o.clube ? o.clube + ' · ' : '') + (rarVis(x.raridade).rotulo || x.raridade) };
      }
      if (x.tipo === 'pacote') return { cab: q + 'x', rot: 'Pacote', nome: x.pack_nome || x.pack, det: '' };
      if (x.tipo === 'moedas') return { cab: '', rot: 'Moedas', nome: q.toLocaleString('pt-BR') + ' ' + ((S.U && S.U.moeda && S.U.moeda.nome) || 'PROMECOINS'), det: '' };
      return null;
    }).filter(Boolean);
  }

  function modalComunicadoHTML(c) {
    if (!c) return '';
    var itens = itensComunicado(c);
    var prev = itens.map(function (i) {
      return '<div class="com-prev"><b class="com-ovr">' + esc(i.cab) + '</b><div><small>' + esc(i.rot) + '</small><h3>' + esc(i.nome) + '</h3>' + (i.det ? '<p>' + esc(i.det) + '</p>' : '') + '</div></div>';
    }).join('');
    var temPremio = itens.length > 0;
    return '<div class="veu" style="z-index:99999;backdrop-filter:blur(10px)"></div>'
      + '<div id="modalComunicado" class="modal-carta chanfro" role="dialog" aria-modal="true" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:100000;max-width:520px;width:calc(100% - 32px);max-height:90vh;overflow-y:auto;padding:24px;text-align:center">'
      + '<h2 style="font-size:30px;letter-spacing:1px;color:#fff;text-transform:uppercase;line-height:1;margin-bottom:12px">' + esc(c.titulo) + '</h2>'
      + '<p style="font-size:14px;color:rgba(255,255,255,0.8);line-height:1.6;margin-bottom:8px;white-space:pre-line">' + esc(c.mensagem) + '</p>'
      + prev
      + (S.msgCom ? '<p class="aviso" role="status" style="margin-top:10px">' + esc(S.msgCom) + '</p>' : '')
      + '<button class="btn btn-ouro" data-ler-comunicado="' + esc(c.id) + '"' + (S.lendoCom ? ' disabled' : '') + ' style="width:100%;margin-top:18px;padding:14px;font-size:15px;font-weight:900;letter-spacing:1px">'
      + (S.lendoCom ? 'Enviando...' : (temPremio ? 'Resgatar' : 'OK')) + '</button>'
      + '</div>';
  }

  
  /* Online: partida contra outro jogador com as próprias cartas (motor do JxJ em ../jxj.html?ult=1).
     Ranking do mês só por vitórias; nada de PROMECOINS em jogo. */
  async function carregaRanking() {
    if (!window.Promessa || !window.Promessa.sb) return;
    S.ranking = 'carregando';
    try {
      var r = await window.Promessa.sb.rpc('ult_ranking_top', {});
      if (r.error) throw r.error;
      S.ranking = r.data || [];
    } catch (e) { console.warn('[ultimate] ranking:', e); S.ranking = 'erro'; }
    if (S.aba === 'online') pinta();
  }

  function telaOnline() {
    if (S.ranking == null) carregaRanking();
    var lista = Array.isArray(S.ranking) ? S.ranking : [];
    var eu = lista.find(function (x) { return x.eu; });
    var mes = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    var tabela = S.ranking === 'carregando' || S.ranking == null ? '<div class="pm-esq" aria-busy="true" aria-label="Carregando"><div class="pm-esq-l"></div><div class="pm-esq-l"></div><div class="pm-esq-l"></div><div class="pm-esq-l"></div></div>'
      : S.ranking === 'erro' ? '<p class="muted" style="padding:12px">Ranking indisponível agora.</p>'
      : !lista.length ? '<div class="vazio" style="padding:24px 12px"><b>Ninguém pontuou ainda</b>A primeira vitória do mês abre o ranking.</div>'
      : '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="text-align:left;color:var(--ouro);font-size:11px;letter-spacing:1px;text-transform:uppercase">'
        + '<th style="padding:8px">#</th><th style="padding:8px">Jogador</th><th style="padding:8px;text-align:right">V</th><th style="padding:8px;text-align:right">E</th><th style="padding:8px;text-align:right">D</th></tr></thead><tbody>'
        + lista.map(function (x) {
            return '<tr style="border-top:1px solid rgba(255,255,255,.08)' + (x.eu ? ';background:rgba(232,184,75,.12)' : '') + '"><td style="padding:8px">' + esc(String(x.pos)) + '</td><td style="padding:8px">' + esc(x.apelido)
              + '</td><td style="padding:8px;text-align:right;font-weight:800">' + esc(String(x.vitorias)) + '</td><td style="padding:8px;text-align:right">' + esc(String(x.empates)) + '</td><td style="padding:8px;text-align:right">' + esc(String(x.derrotas)) + '</td></tr>';
          }).join('') + '</tbody></table></div>';
    return '<div class="cabe"><div><span class="eyb">Jogador contra jogador</span><h1>Online</h1></div></div>'
      + '<div class="pan chanfro" style="padding:20px;margin-bottom:16px;max-width:850px">'
      + '<p style="margin:0 0 14px;color:rgba(255,255,255,.8);line-height:1.5">Monte o time com as suas cartas e enfrente outro jogador: desafie um amigo por código ou entre na fila. Mesmo motor do JxJ, sempre online.</p>'
      + (eu ? '<p style="margin:0 0 14px;font-weight:700">Você em ' + esc(mes) + ': ' + esc(String(eu.pos)) + 'º · ' + esc(String(eu.vitorias)) + ' V · ' + esc(String(eu.empates)) + ' E · ' + esc(String(eu.derrotas)) + ' D</p>' : '')
      + '<a class="btn btn-ouro" href="../jxj.html?ult=1">Jogar online</a></div>'
      + '<div class="pan chanfro" style="padding:12px;max-width:850px"><h2 style="font-size:20px;margin:6px 8px 10px">Ranking de ' + esc(mes) + '</h2>' + tabela
      + '<p class="muted" style="padding:8px;font-size:12px">Conta vitória confirmada pelos dois jogadores. Contas com menos de 3 dias, partidas curtas e a mesma dupla mais de uma vez por dia não pontuam. Decisão nos pênaltis conta como empate.</p></div>';
  }

  /* ÁLBUM: todos os jogadores de todos os eventos (dados/drops), como cartas.
     Prêmio por time (evento+liga+clube com 11+ cartas) e por liga, calculado e pago no servidor
     (meu_album_estado / meu_resgata_album). Evento ainda não liberado aparece, mas não paga. */
  var ALB_ETAPAS = { time: [[25, 0.15], [50, 0.20], [75, 0.25], [100, 0.40]], liga: [[50, 0.20], [75, 0.30], [100, 0.50]] };
  function albF() { return S.albF || (S.albF = { liga: '', clube: '', ver: 'todos', q: '' }); }
  function albLib(drop) { var d = (S.drops || []).filter(function (x) { return x.id === drop; })[0]; return !!(d && d.liberado); }
  async function carregaAlbum() {
    S.alb = 'carregando';
    try {
      var tarefas = [S.albCartas ? null : json('../dados/album.json?v=20261025e')];
      if (window.Promessa && window.Promessa.sb && S.usuario) tarefas.push(window.Promessa.sb.rpc('meu_album_estado'));
      var res = await Promise.all(tarefas);
      if (res[0]) {
        S.albLigas = res[0].ligas || {};
        S.albCartas = (res[0].c || []).map(function (x) { return { id: x[0], liga: x[1], clube: x[2], drop: x[3], pos: x[4], raridade: x[5] }; });
      }
      if (!S.albCartas) throw new Error('índice do álbum não carregou');
      S.albCartas.forEach(function (c) { c.lib = albLib(c.drop); });
      var est = { tenho: {}, grupos: {} };
      if (res[1]) {
        if (res[1].error) throw res[1].error;
        var d = res[1].data || {};
        (d.tenho || []).forEach(function (id) { est.tenho[id] = 1; });
        (d.grupos || []).forEach(function (g) { est.grupos[g.chave] = g; });
      }
      S.alb = est;
    } catch (e) { console.warn('[ultimate] álbum:', e); S.alb = 'erro'; }
    if (S.aba === 'album') pinta();
  }
  function albChave(liga, clube) { return clube == null ? 'L|' + liga : 'T|' + liga + '|' + String(clube).replace(/\|/g, '/'); }
  function albProx(g) {
    if (!g) return null;
    var feitas = g.etapas || [];
    return (ALB_ETAPAS[g.tipo] || []).filter(function (e) { return feitas.indexOf(e[0]) < 0; })[0] || null;
  }
  function albPode(g) { var e = albProx(g); return !!e && g.tenho * 100 >= e[0] * g.total; }
  function albPremioTxt(g) {
    if (!g) return '';
    var e = albProx(g);
    if (!e) return 'Prêmio completo';
    return 'Aos ' + e[0] + '%: ' + num(Math.round(g.premio * e[1])) + ' ' + esc(moeda().nome);
  }
  function albBtnResg(g) { return albPode(g) ? '<button type="button" class="btn btn-ouro sm" data-resg-album="' + esc(g.chave) + '"' + (S.resgAlbum ? ' disabled' : '') + '>Resgatar</button>' : ''; }
  function albBarra(pct, cheio) { return '<span class="alb-barra"><i style="width:' + Math.max(0, Math.min(100, pct)) + '%' + (cheio ? ';background:var(--ouro)' : '') + '"></i></span>'; }
  function albNomeLiga(l) { return (S.albLigas && S.albLigas[l]) || LIGA_NOME[l] || l; }
  function albNomeClube(c) { return (window.UPCarta && UPCarta.clubePt) ? UPCarta.clubePt(c.clube, c.id) : c.clube; }
  function albMinhas() {
    var m = {};
    (S.inventario || []).forEach(function (c) { m[c.id] = (m[c.id] || 0) + 1; });
    return m;
  }
  function albCartaHTML(c, tem, conta, lib) {
    if (tem) {
      var cc = Object.assign({}, c, { raridade: rarDB(c.raridade), clube: albNomeClube(c), nac_pt: (window.UPCarta && UPCarta.paisPt) ? UPCarta.paisPt(c.bandeira, c.nac_pt || c.nac, c.pais) : c.nac_pt });
      return '<button type="button" class="alb-c alb-ok" data-alb-ver="' + esc(c.id) + '" aria-label="Ver ' + esc(c.nome) + '">' + UPCarta.frente(cc, rarVis(cc.raridade), { base: '../', rodape: conta ? '' : 'FORA DA CONTAGEM' }) + '</button>';
    }
    var r = rarDB(c.raridade);
    return '<div class="alb-c alb-bloq" aria-label="Carta bloqueada">' + UPCarta.verso(r, rarVis(r), { base: '../' }) + '<span class="alb-pos">' + esc(posNomeCurto(c.pos)) + '</span>' + (lib === false ? '<span class="alb-breve">EM BREVE</span>' : '') + '</div>';
  }
  // carta em foco: a cópia da coleção com raridade mais alta (e menor mint) daquele jogador
  function albCartaMinha(id) {
    return (S.inventario || []).filter(function (c) { return c.id === id; })
      .sort(function (a, b) { return (rarIdx(b.raridade) - rarIdx(a.raridade)) || ((a.mint || 0) - (b.mint || 0)); })[0] || null;
  }
  function albFocoHTML() {
    var V = S.albVer; if (!V) return '';
    var c = albCartaMinha(V.id); if (!c) return '';
    S.sel = c;
    return '<div class="alb-foco' + (V.info ? ' com-info' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(c.nome) + '">'
      + '<div class="alb-foco-fundo" data-alb-fecha="1"></div>'
      + '<div class="alb-foco-caixa">'
      + '<button type="button" class="alb-foco-x" data-alb-fecha="1" aria-label="Fechar">×</button>'
      + (V.info
          ? '<div class="alb-foco-info">' + detalhe('album') + '</div>'
          : '<div class="alb-foco-carta det-palco" style="--rc:' + esc(rarVis(c.raridade).cor) + '">' + cartaHTML(c) + '</div>')
      + '<button type="button" class="btn btn-sec sm alb-foco-btn" data-alb-info="1">' + (V.info ? 'Voltar para a carta' : 'Ver informações') + '</button>'
      + '</div></div>';
  }
  // anima a carta saindo da posição dela na grade até o centro
  function albFocoAnima(origem) {
    var alvo = document.querySelector('.alb-foco-carta .upc');
    if (!alvo || !origem) return;
    var d = alvo.getBoundingClientRect();
    if (!d.width) return;
    var dx = (origem.left + origem.width / 2) - (d.left + d.width / 2), dy = (origem.top + origem.height / 2) - (d.top + d.height / 2), k = origem.width / d.width;
    alvo.style.transition = 'none';
    alvo.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + k + ')';
    void alvo.offsetWidth; // força o reflow: a partir daqui a transição sai do ponto de origem
    alvo.style.transition = 'transform .38s cubic-bezier(.2,.8,.2,1)';
    alvo.style.transform = '';
    setTimeout(function () { alvo.style.transition = ''; }, 420);
  }
  function albFocoFecha() { S.albVer = null; S.sel = null; document.documentElement.classList.remove('sem-rolar'); pinta(); }
  function posNomeCurto(p) { return String(p || '').toUpperCase().slice(0, 3) || '?'; }
  function telaAlbum() { return telaAlbumBase() + albFocoHTML(); }
  function telaAlbumBase() {
    var f = albF();
    if (S.alb == null) carregaAlbum();
    var cabe = '<div class="cabe"><div><span class="eyb">Colecione por liga e por time</span><h1>Álbum</h1></div></div>';
    if (S.alb === 'carregando' || S.alb == null) return cabe + '<div class="pm-esq" aria-busy="true" aria-label="Carregando"><div class="pm-esq-l"></div><div class="pm-esq-l"></div><div class="pm-esq-l"></div><div class="pm-esq-l"></div></div>';
    if (S.alb === 'erro') return cabe + '<div class="vazio" style="padding:24px 12px"><b>Álbum indisponível agora</b>Tente de novo em instantes.</div>';
    var est = S.alb, minhas = albMinhas();
    var ligas = {}; S.albCartas.forEach(function (c) { (ligas[c.liga] = ligas[c.liga] || []).push(c); });
    var libs = function (l) { return l.filter(function (c) { return c.lib; }); };
    var conta = function (l) { return l.filter(function (c) { return c.lib && est.tenho[c.id]; }).length; };
    var ordemLigas = Object.keys(ligas).sort(function (a, b) { return (libs(ligas[b]).length - libs(ligas[a]).length) || (ligas[b].length - ligas[a].length); });
    var linha = function (l, tot, ten, g) {
      var futuras = l.length - tot;
      if (!tot) return 'Em breve · ' + num(l.length) + ' cartas';
      return num(ten) + '/' + num(tot) + (futuras ? ' · +' + num(futuras) + ' em breve' : '') + (g ? ' · ' + albPremioTxt(g) : '');
    };
    var regras = '<p class="muted alb-aviso">Time completo paga aos 25, 50, 75 e 100%. Liga completa paga aos 50, 75 e 100%. Conta carta na coleção e fora do mercado; carta comprada conta depois de 48 h. Prêmio a partir de 7 dias de conta. Carta de evento ainda não lançado aparece bloqueada e entra na conta quando ele abrir.</p>';
    if (!f.liga) {
      return cabe + '<div class="alb-ligas">' + ordemLigas.map(function (l) {
        var tot = libs(ligas[l]).length, ten = conta(ligas[l]), pct = tot ? Math.floor(100 * ten / tot) : 0, g = est.grupos[albChave(l)];
        return '<button type="button" class="alb-liga' + (tot ? '' : ' breve') + '" data-alb-liga="' + esc(l) + '">'
          + '<span class="n">' + esc(albNomeLiga(l)) + '</span><span class="p">' + (tot ? pct + '%' : '') + '</span>' + albBarra(pct, tot && pct >= 100)
          + '<span class="s">' + linha(ligas[l], tot, ten, g) + '</span></button>';
      }).join('') + '</div>' + regras;
    }
    var naLiga = ligas[f.liga] || [];
    var gL = est.grupos[albChave(f.liga)];
    var clubes = {}; naLiga.forEach(function (c) { (clubes[c.clube] = clubes[c.clube] || []).push(c); });
    var nomesCl = Object.keys(clubes).sort(function (a, b) { return albNomeClube(clubes[a][0]).localeCompare(albNomeClube(clubes[b][0]), 'pt'); });
    var filtros = '<div class="alb-filtros">'
      + '<label><span>Liga</span><select id="albLiga">' + ordemLigas.map(function (l) { return '<option value="' + esc(l) + '"' + (l === f.liga ? ' selected' : '') + '>' + esc(albNomeLiga(l)) + '</option>'; }).join('') + '</select></label>'
      + '<label><span>Time</span><select id="albClube"><option value="">Todos</option>' + nomesCl.map(function (k) { return '<option value="' + esc(k) + '"' + (k === f.clube ? ' selected' : '') + '>' + esc(albNomeClube(clubes[k][0])) + '</option>'; }).join('') + '</select></label>'
      + '<label><span>Mostrar</span><select id="albVer">' + [['todos', 'Todas'], ['faltam', 'Faltam'], ['tenho', 'Tenho']].map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === f.ver ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>'
      + '<label class="q"><span>Jogador</span><input id="albQ" type="search" value="' + esc(f.q) + '" placeholder="Buscar na liga" autocomplete="off"></label></div>';
    var totL = libs(naLiga).length;
    var topoLiga = '<div class="alb-topo"><button type="button" class="btn btn-sec sm" data-alb-liga="">Ligas</button><h2>' + esc(albNomeLiga(f.liga)) + '</h2>'
      + '<span class="muted">' + linha(naLiga, totL, conta(naLiga), gL) + '</span>' + albBtnResg(gL) + '</div>';
    var visivel = function (c) { var t = !!minhas[c.id]; return f.ver === 'todos' || (f.ver === 'tenho' ? t : !t); };
    var info = function (c) { return S.porId[c.id] || c; };
    var grade = function (lista) {
      var l = lista.filter(visivel);
      if (!l.length) return '<p class="muted">Nenhuma carta neste filtro.</p>';
      return '<div class="alb-grade">' + l.map(function (c) { return albCartaHTML(minhas[c.id] ? info(c) : c, !!minhas[c.id], !!est.tenho[c.id], c.lib); }).join('') + '</div>';
    };
    var q = String(f.q || '').toLowerCase().trim();
    if (q.length >= 2) {
      var achadas = naLiga.filter(function (c) { return minhas[c.id] && String(info(c).nome || '').toLowerCase().indexOf(q) >= 0; }).slice(0, 60);
      return cabe + topoLiga + filtros + grade(achadas) + '<p class="muted alb-aviso">A busca mostra só cartas que você já desbloqueou.</p>';
    }
    if (!f.clube) {
      return cabe + topoLiga + filtros + '<div class="alb-times">' + nomesCl.map(function (k) {
        var l = clubes[k], tot = libs(l).length, ten = conta(l), pct = tot ? Math.floor(100 * ten / tot) : 0, g = est.grupos[albChave(f.liga, k)];
        return '<div class="alb-time pan chanfro' + (albPode(g) ? ' pode' : '') + (tot ? '' : ' breve') + '"><button type="button" data-alb-clube="' + esc(k) + '">'
          + '<b>' + esc(albNomeClube(l[0])) + '</b><span class="muted">' + (tot ? ten + '/' + tot + ' · ' + pct + '%' : 'Em breve') + (tot && l.length > tot ? ' · +' + (l.length - tot) + ' em breve' : '') + '</span>'
          + albBarra(pct, tot && pct >= 100)
          + '<span class="s">' + (g ? albPremioTxt(g) : (tot ? 'Sem prêmio de time (menos de 11 cartas)' : '')) + '</span></button>' + albBtnResg(g) + '</div>';
      }).join('') + '</div>' + regras;
    }
    var noTime = (clubes[f.clube] || []).slice().sort(function (a, b) { return (b.lib - a.lib) || (rarIdx(b.raridade) - rarIdx(a.raridade)) || ((info(b).ovr || 0) - (info(a).ovr || 0)); });
    var gT = est.grupos[albChave(f.liga, f.clube)], totT = libs(noTime).length;
    var topoTime = '<div class="alb-topo"><h3>' + esc(noTime[0] ? albNomeClube(noTime[0]) : f.clube) + '</h3><span class="muted">'
      + (totT ? conta(noTime) + '/' + totT : 'Em breve') + (noTime.length > totT && totT ? ' · +' + (noTime.length - totT) + ' em breve' : '')
      + (gT ? ' · ' + albPremioTxt(gT) : '') + '</span>' + albBtnResg(gT) + '</div>';
    return cabe + topoLiga + filtros + topoTime + grade(noTime);
  }

  /* DESAFIOS: entregar cartas repetidas que cumprem requisitos e receber prêmio.
     Regras e entrega no servidor (meus_desafios / meu_desafio_cumpre); aqui só monta e confere antes. */
  var RAR_ORD = ['bronze', 'prata', 'ouro', 'safira', 'diamante', 'mitica'];
  function rarIdx(r) { var i = RAR_ORD.indexOf(r === 'mythic' ? 'mitica' : r); return i < 0 ? 0 : i; }
  async function carregaDesafios() {
    if (!window.Promessa || !window.Promessa.sb) return;
    S.desafios = 'carregando';
    try { var r = await window.Promessa.sb.rpc('meus_desafios'); if (r.error) throw r.error; S.desafios = r.data || []; }
    catch (e) { console.warn('[ultimate] desafios:', e); S.desafios = 'erro'; }
    if (S.aba === 'desafios') pinta();
  }
  function desReqTxt(r) {
    var a = [r.qtd + (r.qtd === 1 ? ' carta' : ' cartas')];
    if (r.mesmo) a.push({ nac: 'mesma nacionalidade', liga: 'mesma liga', clube: 'mesmo clube' }[r.mesmo] || r.mesmo);
    if (r.nac) a.push(r.nac);
    if (r.liga) a.push(LIGA_NOME[r.liga] || r.liga);
    if (r.clube) a.push(UPCarta.clubePt ? UPCarta.clubePt(r.clube, '') : r.clube);
    if (r.ovr_min) a.push('OVR ' + r.ovr_min + '+ cada');
    if (r.ovr_media) a.push('média ' + r.ovr_media + '+');
    var rot = function (x) { return rarVis(x === 'mythic' ? 'mitica' : x).rotulo || x; };
    if (r.raridade_min && r.raridade_min === r.raridade_max) a.push('só ' + rot(r.raridade_min));
    else { if (r.raridade_min) a.push(rot(r.raridade_min) + ' ou melhor'); if (r.raridade_max) a.push('até ' + rot(r.raridade_max)); }
    if (r.repetida !== false) a.push('só repetidas');
    return a.join(' · ');
  }
  function desPremioTxt(p) {
    var a = [];
    if (p.moedas) a.push(num(p.moedas) + ' ' + moeda().nome);
    (p.pacotes || []).forEach(function (x) { var pk = (S.E && S.E.pacotes && S.E.pacotes[x.pack]) || {}; a.push(x.qtd + 'x ' + (pk.nome || x.pack)); });
    (p.cartas || []).forEach(function (x) { var c = S.porId[x.jogador]; a.push(x.qtd + 'x carta ' + (c ? c.nome : String(x.jogador).split('|').pop())); });
    return a.join(' + ');
  }
  function desPeriodoTxt(d) {
    if (!d.limite) return 'Sem limite';
    var faltam = Math.max(0, d.limite - (d.feitos || 0));
    return faltam + ' de ' + d.limite + ({ conta: '', semana: ' nesta semana', dia: ' hoje' }[d.periodo] || '');
  }
  // dados de catálogo da carta (o servidor confere pelos mesmos campos crus do evento)
  function desInfo(c) {
    var f = S.porId[c.id] || {};
    return { nac: f.nac_pt || f.nac || f.pais || '', liga: f.liga || c.liga, clube: f.clube || '', ovr: c.ovr || 0, rar: rarIdx(c.raridade) };
  }
  // cartas que podem entrar: fora do mercado; se "repetida", sobra uma de cada jogador
  function desElegiveis(d) {
    var r = d.req || {}, rep = r.repetida !== false, porJog = {};
    (S.inventario || []).forEach(function (c) { (porJog[c.id] = porJog[c.id] || []).push(c); });
    var out = [];
    Object.keys(porJog).forEach(function (id) {
      var lista = porJog[id].filter(function (c) { return !c.em_venda; }).sort(function (a, b) { return (a.mint || 0) - (b.mint || 0); });
      var usar = rep ? Math.min(lista.length, porJog[id].length - 1) : lista.length;
      // entrega as de mint mais alto e guarda a de mint mais baixo
      lista.slice(lista.length - usar).forEach(function (c) {
        var i = desInfo(c);
        if (r.nac && i.nac !== r.nac) return;
        if (r.liga && i.liga !== r.liga) return;
        if (r.clube && i.clube !== r.clube) return;
        if (r.ovr_min && i.ovr < r.ovr_min) return;
        if (r.raridade_min && i.rar < rarIdx(r.raridade_min)) return;
        if (r.raridade_max && i.rar > rarIdx(r.raridade_max)) return;
        out.push(c);
      });
    });
    return out.sort(function (a, b) { return (a.ovr - b.ovr) || (rarIdx(a.raridade) - rarIdx(b.raridade)) || String(a.nome).localeCompare(String(b.nome)); });
  }
  function desChaveMesmo(r, c) { var i = desInfo(c); return r.mesmo === 'nac' ? i.nac : r.mesmo === 'liga' ? i.liga : r.mesmo === 'clube' ? i.liga + '|' + i.clube : ''; }
  function desConfere(d, sel) {
    var r = d.req || {}, q = r.qtd, msgs = [], ok = true;
    if (sel.length !== q) { ok = false; msgs.push(sel.length + '/' + q + ' cartas'); } else msgs.push(q + '/' + q + ' cartas');
    if (r.mesmo && sel.length) {
      var ks = {}; sel.forEach(function (c) { ks[desChaveMesmo(r, c)] = 1; });
      if (Object.keys(ks).length > 1) { ok = false; msgs.push('misturou ' + ({ nac: 'nacionalidades', liga: 'ligas', clube: 'clubes' }[r.mesmo])); }
    }
    if (r.ovr_media && sel.length) {
      var med = sel.reduce(function (s, c) { return s + (c.ovr || 0); }, 0) / sel.length;
      if (med < r.ovr_media) ok = false;
      msgs.push('média ' + med.toFixed(1).replace('.', ',') + ' de ' + r.ovr_media);
    }
    return { ok: ok, txt: msgs.join(' · ') };
  }
  // menor conjunto que cumpre: por grupo (se "mesmo"), janela de OVR mais baixa que atinge a média
  function desAuto(d) {
    var r = d.req || {}, q = r.qtd, el = desElegiveis(d), grupos = {};
    el.forEach(function (c) { var k = desChaveMesmo(r, c); (grupos[k] = grupos[k] || []).push(c); });
    var melhor = null, custo = function (l) { return l.reduce(function (s, c) { return s + rarIdx(c.raridade) * 1000 + c.ovr; }, 0); };
    Object.keys(grupos).forEach(function (k) {
      var l = grupos[k]; if (l.length < q) return;
      for (var i = 0; i + q <= l.length; i++) {
        var j = l.slice(i, i + q);
        if (r.ovr_media && j.reduce(function (s, c) { return s + c.ovr; }, 0) / q < r.ovr_media) continue;
        if (!melhor || custo(j) < custo(melhor)) melhor = j;
        break;
      }
    });
    return melhor;
  }
  function telaDesafios() {
    var cabe = '<div class="cabe"><div><span class="eyb">Troque repetidas por prêmios</span><h1>Desafios</h1></div></div>';
    if (!S.usuario) return cabe + '<div class="vazio" style="padding:24px 12px"><b>Entre na sua conta</b>Os desafios usam as cartas da sua coleção.</div>';
    if (S.desafios == null) carregaDesafios();
    if (S.desafios === 'carregando' || S.desafios == null) return cabe + '<div class="pm-esq" aria-busy="true" aria-label="Carregando"><div class="pm-esq-l"></div><div class="pm-esq-l"></div><div class="pm-esq-l"></div><div class="pm-esq-l"></div></div>';
    if (S.desafios === 'erro') return cabe + '<div class="vazio" style="padding:24px 12px"><b>Desafios indisponíveis agora</b>Tente de novo em instantes.</div>';
    var D = S.desSel && S.desafios.filter(function (x) { return x.id === S.desSel.id; })[0];
    if (D) return cabe + telaDesafioMonta(D);
    if (!S.desafios.length) return cabe + '<div class="vazio" style="padding:24px 12px"><b>Nenhum desafio no ar</b>Novos desafios aparecem aqui.</div>';
    var grupos = {}, ordem = [];
    S.desafios.forEach(function (d) { if (!grupos[d.grupo]) { grupos[d.grupo] = []; ordem.push(d.grupo); } grupos[d.grupo].push(d); });
    return cabe + '<p class="muted alb-aviso">As cartas entregues saem da coleção. Liberado a partir de 7 dias de conta; carta no mercado ou comprada há menos de 48 h não entra.</p>'
      + ordem.map(function (g) {
          return '<h2 class="des-grupo">' + esc(g) + '</h2><div class="des-lista">' + grupos[g].map(function (d) {
            var esgotou = d.limite && (d.feitos || 0) >= d.limite;
            var possivel = !esgotou && !!desAuto(d);
            return '<div class="pan chanfro des-card' + (esgotou ? ' feito' : '') + '">'
              + '<b class="t">' + esc(d.titulo) + '</b>'
              + (d.descricao ? '<span class="muted d">' + esc(d.descricao) + '</span>' : '')
              + '<span class="r">' + esc(desReqTxt(d.req || {})) + '</span>'
              + '<span class="p">' + esc(desPremioTxt(d.premio || {})) + '</span>'
              + '<span class="muted s">' + esc(desPeriodoTxt(d)) + (d.fecha ? ' · até ' + esc(new Date(d.fecha).toLocaleDateString('pt-BR')) : '') + (possivel ? ' · você já tem as cartas' : '') + '</span>'
              + (esgotou ? '' : '<button type="button" class="btn ' + (possivel ? 'btn-ouro' : 'btn-sec') + ' sm" data-des-abre="' + esc(d.id) + '">Montar</button>')
              + '</div>';
          }).join('') + '</div>';
        }).join('');
  }
  function telaDesafioMonta(d) {
    var sel = S.desSel, r = d.req || {};
    var el = desElegiveis(d), porUid = {}; el.forEach(function (c) { porUid[c.uid] = c; });
    sel.uids = sel.uids.filter(function (u) { return porUid[u]; });
    var escolhidas = sel.uids.map(function (u) { return porUid[u]; });
    var conf = desConfere(d, escolhidas);
    var topo = '<div class="alb-topo"><button type="button" class="btn btn-sec sm" data-des-volta="1">Desafios</button><h2>' + esc(d.titulo) + '</h2></div>'
      + '<div class="pan chanfro des-resumo"><span class="r">' + esc(desReqTxt(r)) + '</span><span class="p">Prêmio: ' + esc(desPremioTxt(d.premio || {})) + '</span>'
      + '<span class="' + (conf.ok ? 'ok' : 'muted') + '">' + esc(conf.txt) + '</span>'
      + '<div class="des-acoes"><button type="button" class="btn btn-sec sm" data-des-auto="1">Preencher com repetidas</button>'
      + (sel.uids.length ? '<button type="button" class="btn btn-sec sm" data-des-limpa="1">Limpar</button>' : '')
      + (conf.ok ? (sel.confirma
          ? '<button type="button" class="btn btn-ouro sm" data-des-envia="1"' + (S.desEnviando ? ' disabled' : '') + '>' + (S.desEnviando ? 'Entregando…' : 'Confirmar: entregar ' + r.qtd + ' cartas') + '</button>'
          : '<button type="button" class="btn btn-ouro sm" data-des-confirma="1">Entregar</button>') : '')
      + '</div></div>';
    if (!el.length) return topo + '<div class="vazio" style="padding:24px 12px"><b>Nenhuma carta serve</b>' + (r.repetida !== false ? 'Só entram cartas repetidas que cumprem o pedido.' : 'Nenhuma carta da coleção cumpre o pedido.') + '</div>';
    var marcado = {}; sel.uids.forEach(function (u) { marcado[u] = 1; });
    return topo + '<div class="des-tab" role="list">' + el.slice(0, 300).map(function (c) {
      var i = desInfo(c), on = !!marcado[c.uid];
      return '<button type="button" role="listitem" class="des-li' + (on ? ' on' : '') + '" data-des-carta="' + esc(c.uid) + '" aria-pressed="' + on + '">'
        + '<b class="o">' + esc(c.ovr) + '</b><span class="n">' + esc(c.nome) + '<small>' + esc(c.clube) + ' · ' + esc(i.nac) + '</small></span>'
        + '<span class="ra">' + esc(rarVis(c.raridade).rotulo || c.raridade) + '</span></button>';
    }).join('') + '</div>' + (el.length > 300 ? '<p class="muted alb-aviso">Mostrando as 300 de menor OVR.</p>' : '');
  }

  function telaPresentes() {
    var list = S.comunicados || [];
    return '<div class="cabe"><div><span class="eyb">Comunicados oficiais</span><h1>Presentes</h1></div></div>'
      + '<div class="presentes-container" style="max-width:850px">'
      + (list.length ? list.map(function (c) {
          var premio = itensComunicado(c).map(function (i) { return esc(i.rot + ': ' + i.nome + (i.det ? ' · ' + i.det : '')); }).join('<br>');
          return '<div class="pan chanfro" style="margin-bottom:16px;padding:20px;border-left:4px solid var(--ouro)">'
            + '<h2 style="font-size:24px;color:#fff;margin:0 0 6px">' + esc(c.titulo) + '</h2>'
            + '<p style="font-size:14px;color:rgba(255,255,255,0.75);line-height:1.5;margin-bottom:14px;white-space:pre-line">' + esc(c.mensagem) + '</p>'
            + (premio ? '<p style="color:var(--verde);font-weight:700;margin-bottom:12px">' + premio + '</p>' : '')
            + '<button class="btn btn-ouro sm" data-ler-comunicado="' + esc(c.id) + '"' + (S.lendoCom ? ' disabled' : '') + '>' + (premio ? 'Resgatar' : 'Marcar como lido') + '</button>'
            + '</div>';
        }).join('') : '<div class="vazio" style="padding:24px 12px"><b>Nenhum presente pendente</b>Comunicados e presentes oficiais aparecem aqui.</div>')
      + '</div>';
  }
  var TELAS = { inicio: telaInicio, pacotes: telaPacotes, colecao: telaColecao, mercado: telaMercado, missoes: telaMissoes, album: telaAlbum, desafios: telaDesafios, online: telaOnline, presentes: telaPresentes }; // tela de admin fora do jogo publico
  function pinta() {

    var raiz = document.getElementById('app');

    if (S.erro) { raiz.innerHTML = '<div class="conteudo" style="padding-top:40px"><div class="aviso">' + esc(S.erro) + '</div></div>'; return; }

    document.title = (S.U.nome || 'Ultimate Promessa') + ' — ' + (ABAS.filter(function (a) { return a[0] === S.aba; })[0] || ['', '', ''])[2];

    // guarda a rolagem (página e listas com rolagem própria) para redesenhos na mesma aba
    var se = document.scrollingElement || document.documentElement, mesmaAba = raiz.dataset.rolaAba === S.aba;
    var rolPag = se.scrollTop, rolEls = [];
    if (mesmaAba) raiz.querySelectorAll('*').forEach(function (el, k) {
      if (el.scrollTop > 0 || el.scrollLeft > 0) rolEls.push({ k: (el.id ? '#' + el.id : el.tagName + '.' + el.className) + '|' + k, t: el.scrollTop, l: el.scrollLeft, sel: el.id ? '#' + el.id : null, cls: el.className, tag: el.tagName });
    });
    raiz.innerHTML = topo() + lado() + '<div class="casca"><main class="conteudo" id="main">'

      + (S.msg ? '<div class="aviso chanfro" role="status">' + esc(S.msg) + '</div>' : '')

      + (TELAS[S.aba] || telaInicio)() + '</main></div>' + gaveta() + (S.comunicadoAtivo ? modalComunicadoHTML(S.comunicadoAtivo) : '');
    raiz.dataset.rolaAba = S.aba;
    ajustaRolagem();
    var PUa = window.PromessaUI; if (PUa) { try { PUa.animarNumeros(raiz); } catch (eN) { console.warn('[ultimate] números', eN); } }
    if (mesmaAba) {
      se.scrollTop = rolPag;
      rolEls.forEach(function (r) {
        var el = r.sel ? raiz.querySelector(r.sel) : null;
        if (!el && r.cls && typeof r.cls === 'string') { var cand = raiz.getElementsByClassName(r.cls.trim().split(/\s+/)[0]); for (var q = 0; q < cand.length; q++) { if (cand[q].tagName === r.tag && cand[q].scrollHeight > cand[q].clientHeight) { el = cand[q]; break; } } }
        if (el) { el.scrollTop = r.t; el.scrollLeft = r.l; }
      });
    }

  }



  function vaiPara(aba) {

    if (!TELAS[aba]) return;

    S.aba = aba; S.sel = null; S.msg = null;
    if (aba === 'online') S.ranking = null;
    if (aba === 'album') { S.alb = null; }
    S.albVer = null; document.documentElement.classList.remove('sem-rolar');
    if (aba === 'desafios') { S.desafios = null; S.desSel = null; }

    try { history.replaceState(null, '', '#' + aba); } catch (e) { location.hash = aba; }

    /* mecânicas comuns (comum/ui-promessa.js via promessa-boot): transição e última aba lembrada */
    var PUv = window.PromessaUI;
    if (PUv) { PUv.lembrar('ult:aba', aba); PUv.trocarTela(function () { pinta(); window.scrollTo(0, 0); }); }
    else { pinta(); window.scrollTo(0, 0); }

  }



  async function rpc(nome, args, sucesso) {

    var P = window.Promessa; if (!P || !S.usuario) { S.msg = 'Entre na sua conta para fazer isso.'; pinta(); return; }

    try {

      var r = await P.sb.rpc(nome, args);

      if (r.error) throw r.error;

      S.msg = sucesso; S.sel = null; S.mercFoco = null; S.confCompra = null; S.histMerc = null; document.documentElement.classList.remove('sem-rolar');

      await Promise.all([carregaConta(), carregaMercado()]);

    } catch (e) {

      console.error('[ultimate] ' + nome + ':', e);

      S.msg = (e && e.message) ? String(e.message) : 'Não deu certo. Tente de novo.';

    }

    pinta();

  }



  /* ---------------- eventos ---------------- */

  document.addEventListener('click', function (ev) {
    var btCom = ev.target.closest('[data-ler-comunicado]');
    if (btCom) {
      if (S.lendoCom) return;
      S.lendoCom = true; S.msgCom = null; pinta();
      (async function () {
        try {
          var r = await window.Promessa.sb.rpc('meu_le_comunicado', { p_id: btCom.dataset.lerComunicado });
          if (r.error) throw r.error;
          var d = r.data || {};
          (d.cartas || []).forEach(function (cc) { S.inventario.unshift(daCarta(cc)); });
          if ((d.pacotes || []).length) { try { await sincronizarInventarioNuvem(); } catch (e) { console.warn('[comunicado] inventario:', e); } }
          if (d.moedas) { try { S.saldo = await window.Promessa.saldo(); } catch (e) { console.warn('[comunicado] saldo:', e); } }
          if ((d.cartas || []).length || (d.pacotes || []).length || d.moedas) { try { if (window.PromessaSom) window.PromessaSom.tocar('pack_reveal'); } catch (e) { console.warn('[ultimate]', e); } }
          if (d.esgotadas) S.msg = d.esgotadas + (d.esgotadas > 1 ? ' cartas esgotaram' : ' carta esgotou') + ' antes do resgate; o resto do presente foi entregue.';
          S.comunicados = (S.comunicados || []).filter(function (x) { return x.id !== btCom.dataset.lerComunicado; });
          S.comunicadoAtivo = S.comunicados[0] || null;
        } catch (e) {
          console.warn('[comunicado] resgate:', e);
          S.msgCom = (e && e.message) ? String(e.message) : 'Nao deu para resgatar agora. Tente de novo.';
        } finally { S.lendoCom = false; pinta(); }
      })();
      return;
    }


    var t = ev.target;
    var bAV = t.closest('[data-alb-ver]');
    if (bAV) {
      var rect = (bAV.querySelector('.upc') || bAV).getBoundingClientRect();
      S.albVer = { id: bAV.dataset.albVer, info: false };
      document.documentElement.classList.add('sem-rolar');
      pinta(); albFocoAnima(rect); return;
    }
    if (t.closest('[data-alb-fecha]')) { albFocoFecha(); return; }
    if (t.closest('[data-alb-info]') && S.albVer) { S.albVer.info = !S.albVer.info; pinta(); return; }
    var bAL = t.closest('[data-alb-liga]'); if (bAL) { var fl = albF(); fl.liga = bAL.dataset.albLiga; fl.clube = ''; fl.q = ''; pinta(); window.scrollTo(0, 0); return; }
    var bAC = t.closest('[data-alb-clube]'); if (bAC) { albF().clube = bAC.dataset.albClube; pinta(); window.scrollTo(0, 0); return; }
    var btRA = t.closest('[data-resg-album]');
    if (btRA) {
      if (S.resgAlbum) return;
      S.resgAlbum = true; pinta();
      (async function () {
        try {
          var r = await window.Promessa.sb.rpc('meu_resgata_album', { p_clube: btRA.dataset.resgAlbum });
          if (r.error) throw r.error;
          var d = r.data || {};
          S.msg = d.pago ? 'Prêmio do álbum: ' + num(d.pago) + ' ' + moeda().nome + '.' : 'Nada novo para resgatar aqui.';
          try { S.saldo = await window.Promessa.saldo(); } catch (e) { console.warn('[album] saldo:', e); }
          try { if (window.PromessaSom) window.PromessaSom.tocar('pack_reveal'); } catch (e) { console.warn('[ultimate]', e); }
        } catch (e) { console.warn('[album] resgate:', e); S.msg = (e && e.message) || 'Não deu para resgatar agora.'; }
        S.resgAlbum = false; await carregaAlbum();
      })();
      return;
    }
    var bDA = t.closest('[data-des-abre]'); if (bDA) { S.desSel = { id: bDA.dataset.desAbre, uids: [], confirma: false }; S.msg = null; pinta(); window.scrollTo(0, 0); return; }
    if (t.closest('[data-des-volta]')) { S.desSel = null; pinta(); return; }
    var desAtual = function () { return S.desSel && Array.isArray(S.desafios) && S.desafios.filter(function (x) { return x.id === S.desSel.id; })[0]; };
    var bDC = t.closest('[data-des-carta]');
    if (bDC && S.desSel) {
      var dd = desAtual(), u = bDC.dataset.desCarta, ix = S.desSel.uids.indexOf(u);
      if (ix >= 0) S.desSel.uids.splice(ix, 1);
      else if (dd && S.desSel.uids.length < dd.req.qtd) S.desSel.uids.push(u);
      S.desSel.confirma = false; pinta(); return;
    }
    if (t.closest('[data-des-auto]') && S.desSel) {
      var m = desAuto(desAtual() || {});
      if (m) { S.desSel.uids = m.map(function (c) { return c.uid; }); S.msg = null; } else S.msg = 'Suas repetidas ainda não cumprem este desafio.';
      S.desSel.confirma = false; pinta(); return;
    }
    if (t.closest('[data-des-limpa]') && S.desSel) { S.desSel.uids = []; S.desSel.confirma = false; pinta(); return; }
    if (t.closest('[data-des-confirma]') && S.desSel) { S.desSel.confirma = true; pinta(); return; }
    if (t.closest('[data-des-envia]') && S.desSel) {
      if (S.desEnviando) return;
      var dEnv = desAtual(); if (!dEnv) return;
      S.desEnviando = true; pinta();
      (async function () {
        try {
          var r = await window.Promessa.sb.rpc('meu_desafio_cumpre', { p_desafio: dEnv.id, p_cards: S.desSel.uids });
          if (r.error) throw r.error;
          var x = r.data || {}, partes = [];
          if (x.moedas) partes.push(num(x.moedas) + ' ' + moeda().nome);
          (x.pacotes || []).forEach(function (p) { var pk = (S.E && S.E.pacotes && S.E.pacotes[p.pack_id]) || {}; partes.push(p.quantidade + 'x ' + (pk.nome || p.pack_id)); });
          if ((x.cartas || []).length) partes.push((x.cartas || []).length + ' carta(s)');
          S.msg = 'Desafio cumprido: ' + (partes.join(' + ') || 'prêmio entregue') + '.' + (x.esgotadas ? ' ' + x.esgotadas + ' carta(s) do prêmio esgotaram.' : '');
          S.desSel = null; S.desafios = null;
          await Promise.all([carregaConta(), sincronizarInventarioNuvem()]);
          try { if (window.PromessaSom) window.PromessaSom.tocar('pack_reveal'); } catch (e) { console.warn('[ultimate]', e); }
        } catch (e) { console.warn('[desafios] entrega:', e); S.msg = (e && e.message) || 'Não deu para entregar agora.'; if (S.desSel) S.desSel.confirma = false; }
        S.desEnviando = false; pinta(); window.scrollTo(0, 0);
      })();
      return;
    }

    
    var a = t.closest('[data-aba]'); if (a) { ev.preventDefault(); vaiPara(a.dataset.aba); return; }

    var bn = t.closest('[data-banner]'); if (bn) { S.banner = Number(bn.dataset.banner); pinta(); return; }

    var r = t.closest('[data-rar]'); if (r) { S.filtro.rar = r.dataset.rar; pinta(); return; }

    var lg = t.closest('[data-liga]'); if (lg) { S.filtro.liga = lg.dataset.liga; pinta(); return; }
    var es = t.closest('[data-est]'); if (es) { S.filtro.est = es.dataset.est; S.sel = null; pinta(); return; }

    if (t.closest('[data-merc-fecha]')) { S.mercFoco = null; S.confCompra = null; document.documentElement.classList.remove('sem-rolar'); pinta(); return; }
    var m = t.closest('[data-merc]'); if (m) { S.merc = m.dataset.merc; S.sel = null; S.confCompra = null; S.mercFoco = null; document.documentElement.classList.remove('sem-rolar'); if (S.merc === 'hist') S.histMerc = null; pinta(); window.scrollTo(0, 0); return; }

    var tr = t.closest('tr[data-k]');

    if (tr) {

      var k = tr.dataset.k;

      var fonte = S.aba === 'mercado' ? (S.merc === 'meus' ? S.meusAnuncios : S.anuncios) : (S.usuario ? S.inventario : S.drop.cartas);
      S.confCompra = null;

      S.sel = fonte.filter(function (c) { return (c.uid || ('c' + c.n)) === k; })[0] || null;
      if (S.aba === 'mercado' && S.sel) {
        // mercado: a carta vem para o meio da tela com as informações da venda
        var rl = tr.getBoundingClientRect(), hh = rl.height || 40;
        var rectM = { left: rl.left + 8, top: rl.top, width: hh * 0.72, height: hh }; // sai do começo da linha, no tamanho dela
        S.mercFoco = S.sel; document.documentElement.classList.add('sem-rolar');
        pinta(); albFocoAnima(rectM); return;
      }

      pinta();

      if (window.innerWidth <= 1180) { var d = document.querySelector('.det'); if (d) d.scrollIntoView({ block: 'start' }); }

      return;

    }

    var ab = t.closest('[data-abrir]'); if (ab && !ab.disabled) { location.href = 'abrir.html?pacote=' + encodeURIComponent(ab.dataset.abrir); return; }

    var cp = t.closest('[data-comprar]');
    if (cp && !cp.disabled) {
      if (S.confCompra !== cp.dataset.comprar) { S.confCompra = cp.dataset.comprar; pinta(); return; }
      S.confCompra = null; S.histMerc = null;
      rpc('minha_compra', { p_trade: cp.dataset.comprar }, 'Carta comprada. Ela já está na sua coleção.'); return;
    }

    var cc = t.closest('[data-cancelar]'); if (cc) { rpc('meu_cancela_trade', { p_trade: cc.dataset.cancelar }, 'Anúncio retirado.'); return; }

    var r8 = t.closest('[data-resgate-8h]');

    if (r8) {

      executarResgateDiario();

      return;

    }

    var rm = t.closest('[data-resgatar]'); if (rm) { rpc('meu_resgate', { p_obj: rm.dataset.resgatar }, 'Missão resgatada.'); return; }

    var df = t.closest('[data-desfazer]');

    if (df) {

      if (!window.confirm('Resgatar esta carta? Ela sai da sua coleção e não volta.')) return;

      rpc('meu_desfaz_carta', { p_card: df.dataset.desfazer }, 'Carta resgatada.');

      return;

    }

    var an = t.closest('[data-anunciar]');

    if (an) {

      var campo = document.getElementById('precoVenda'), preco = Math.floor(Number(campo && campo.value));

      var fx = faixa((S.sel && S.sel.raridade) || 'bronze');

      if (!Number.isFinite(preco) || preco < fx.min || preco > fx.max) { S.msg = 'O preço precisa ficar entre ' + num(fx.min) + ' e ' + num(fx.max) + '.'; pinta(); return; }

      rpc('minha_lista_venda', { p_card: an.dataset.anunciar, p_preco: preco }, 'Carta anunciada por ' + num(preco) + ' ' + moeda().nome + '.');

      return;

    }

    if (t.closest('#btCfg')) { S.cfg = true; pinta(); return; }

    if (t.closest('[data-fechar-cfg]')) { S.cfg = false; pinta(); return; }

    if (t.closest('#btSair')) { if (window.Promessa) window.Promessa.sair(); }

  });

  document.addEventListener('change', function (ev) {

    if (ev.target.id === 'ordem') { S.filtro.ordem = ev.target.value; pinta(); }
    if (ev.target.id === 'albLiga') { var f1 = albF(); f1.liga = ev.target.value; f1.clube = ''; f1.q = ''; pinta(); }
    if (ev.target.id === 'albClube') { albF().clube = ev.target.value; pinta(); }
    if (ev.target.id === 'albVer') { albF().ver = ev.target.value; pinta(); }

    if (ev.target.id === 'optAnim') lsSet(CHAVE_ANIM, ev.target.checked ? '1' : '0');

  });

  document.addEventListener('input', function (ev) {
    if (ev.target.id === 'albQ') {
      albF().q = ev.target.value; clearTimeout(S.albQt);
      S.albQt = setTimeout(function () { pinta(); var b = document.getElementById('albQ'); if (b) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); } }, 250);
      return;
    }

    if (ev.target.id === 'precoVenda') {

      var v = Math.floor(Number(ev.target.value) || 0), tx = Number(ev.target.dataset.taxa) || 5, el = document.getElementById('liquido');

      if (el) el.textContent = 'Você recebe ' + num(Math.max(0, v - Math.ceil(v * tx / 100))) + ' · faixa ' + el.dataset.faixa;

      return;

    }

    if (ev.target.id !== 'q') return;

    S.filtro.q = ev.target.value;

    clearTimeout(window.__uq);

    window.__uq = setTimeout(function () {

      var v = S.filtro.q; pinta();

      var c = document.getElementById('q'); if (c) { c.focus(); try { c.setSelectionRange(v.length, v.length); } catch (e) { /* type=search em alguns navegadores */ } }

    }, 220);

  });

  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && S.cfg) { S.cfg = false; pinta(); } });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && S.albVer) albFocoFecha(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && S.mercFoco) { S.mercFoco = null; S.confCompra = null; document.documentElement.classList.remove('sem-rolar'); pinta(); } });



  /* banners giram sozinhos se houver mais de um, e param com a aba escondida */

  setInterval(function () {

    if (document.hidden || S.aba !== 'inicio' || S.cfg || !S.U) return;

    var n = (S.U.banners || []).filter(function (b) { return b.ativo; }).length;

    if (n > 1) { S.banner = (S.banner + 1) % n; pinta(); }

  }, 8000);



  /* imagem que falha some (banner ou arte de pacote ainda não enviada).

     Listener e não onerror inline: a CSP desta página não libera script inline. */

  document.addEventListener('error', function (ev) { var el = ev.target; if (!el || el.tagName !== 'IMG') return; var p = el.parentElement; if (p && p.classList.contains('upc-foto') && window.UPCarta && UPCarta.silh) { p.innerHTML = UPCarta.silh; return; } el.remove(); }, true);



  carrega().then(function () {
    var PUi = window.PromessaUI;
    if (PUi && !location.hash) { var ult = PUi.recordar('ult:aba'); if (ult && TELAS[ult]) S.aba = ult; }
    pinta();
    if (!PUi) return;
    PUi.puxarAtualizar(async function () { await carregaConta(); pinta(); PUi.toast('Atualizado'); });
    PUi.tour('ultimate', [
      { alvo: '.topo .moeda', texto: 'Seu saldo de ' + moeda().nome + '. Toque para ver as missões que rendem mais.' },
      { alvo: '#main', texto: 'No celular, puxe a tela para baixo no topo para atualizar.' }]);
  });

})();