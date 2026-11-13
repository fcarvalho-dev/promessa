/* PROMESSA — atributos do atleta (etapa 10). GERADO por monta-pro.mjs a partir
   do Dashboard Carreira: nao edite aqui, edite fonte/pro-atributos.js. */
(function () {
  const PESO_POS = {
    GOL: { "GK:col": 0.3234, "GK:ref": 0.2323, "GK:pes": 0.2343, "GK:ela": 0.21 },
    LAT: { "Armação": 0.0018, "Cabeceio": 0.0078, "Cruzamento": 0.3073, "Marcação": 0.0411, "Drible": 0.0024, "Finalização": 0.0746, "Desarme": 0.258, "Passe": 0.1183, "Resistência": 0.0083, "Velocidade": 0.1803 },
    ZAG: { "Cabeceio": 0.1552, "Marcação": 0.3411, "Drible": 0.0012, "Finalização": 0.0198, "Desarme": 0.2415, "Passe": 0.0216, "Resistência": 0.131, "Velocidade": 0.0882 },
    MEI: { "Armação": 0.1486, "Cabeceio": 0.0233, "Cruzamento": 0.001, "Marcação": 0.1595, "Drible": 0.054, "Finalização": 0.1394, "Desarme": 0.1323, "Passe": 0.2253, "Resistência": 0.0137, "Velocidade": 0.103 },
    ATA: { "Armação": 0.012, "Cabeceio": 0.1503, "Drible": 0.1576, "Finalização": 0.3781, "Passe": 0.0593, "Resistência": 0.0296, "Velocidade": 0.2126 },
  };
  const ATR_GK    = ['GK:col','GK:ref','GK:pes','GK:ela'];
  const ATR_LINHA = ['Armação','Cabeceio','Cruzamento','Marcação','Drible',
                     'Finalização','Desarme','Passe','Resistência','Velocidade'];
  const atrListaDe = (pos5) => (pos5 === 'GOL' ? ATR_GK : ATR_LINHA);

  /* K_POS: o quanto pertencer a posicao puxa o atributo.
     K_CAR: o quanto a caracteristica REAL do jogador puxa.
     Calibrados juntos: com K_CAR baixo a caracteristica real perdia para a
     posicao e todo atacante saia com Finalizacao 99 — o "todo mundo igual"
     que o motor antigo tinha. Nestes valores a caracteristica real e o topo
     do jogador e a posicao molda o resto. */
  const K_POS = 0.9, K_CAR = 0.32, K_RUIDO = 0.06;

  function atributosDe(p) {
    const pos5  = p.pos5 || p.pos || 'MEI';
    const lista = atrListaDe(pos5);
    const w     = PESO_POS[pos5] || PESO_POS.MEI;
    const forca = Number(p.forca) || 50;
    const cars  = (p.cars || []).map(x => (x && x.nome) ? x.nome : x);
    const r     = rngDe('atr:' + (p.id || p.nome || '') + ':' + (p.hash || 0));
    const mw    = 1 / lista.length;

    const rel = {};
    for (const c of lista) {
      let v = 1 + K_POS * ((w[c] || 0) - mw);
      if (cars.indexOf(c) >= 0) v += K_CAR;
      v += (r() + r() - 1) * K_RUIDO;
      rel[c] = Math.max(0.25, v);
    }
    /* Reescala para o overall bater com a forca. O teto de 99 pode quebrar a
       conta num craque, entao repete distribuindo a sobra so entre os que
       ainda nao bateram no teto. */
    const out = {}, trav = {};
    for (const c of lista) { out[c] = 0; trav[c] = false; }
    for (let passo = 0; passo < 4; passo++) {
      let livre = 0, feito = 0;
      for (const c of lista) {
        const wc = w[c] || 0;
        if (trav[c]) feito += out[c] * wc; else livre += rel[c] * wc;
      }
      if (livre <= 0) break;
      const esc = (forca - feito) / livre;
      let mudou = false;
      for (const c of lista) {
        if (trav[c]) continue;
        const v = rel[c] * esc;
        if (v > 99) { out[c] = 99; trav[c] = true; mudou = true; } else out[c] = v;
      }
      if (!mudou) break;
    }
    for (const c of lista) out[c] = Math.max(1, Math.min(99, Math.round(out[c])));
    return out;
  }

  /** O caminho de volta: vetor -> um numero, pelos pesos da posicao. */
  function overallDeAtributos(atr, pos5) {
    const w = PESO_POS[pos5] || PESO_POS.MEI;
    let s = 0;
    for (const c of atrListaDe(pos5)) s += (atr[c] || 0) * (w[c] || 0);
    return Math.round(s * 10) / 10;
  }

  /** Percentil do atributo contra a base — para a tela de criacao mostrar
      referencia de verdade em vez de numero no vacuo. Preenchido sob demanda. */
  function rngDe(semente) {
    let a = 0;
    const s = String(semente);
    for (let i = 0; i < s.length; i++) a = (Math.imul(a, 31) + s.charCodeAt(i)) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }/* ==================================================================== */
/*  ETAPA 10 — ATRIBUTOS DO ATLETA, ESTILO PRO CLUBS                    */
/* ==================================================================== */
/*
 * ANTES: o overall era UM numero. A criacao sorteava esse numero (a
 * roleta de 50 a 75) e a carreira somava +1 cada vez que a barra de XP
 * enchia. Como qualquer partida jogada da XP, quem jogava subia sempre —
 * o "no comeco e loteria, depois e garantido" do relato.
 *
 * AGORA: o atleta e o vetor de atributos (os mesmos 10 de linha / 4 de
 * goleiro que os 78 mil NPCs tem, etapa 4). O overall e CONSEQUENCIA:
 * a media ponderada pelos pesos medidos da posicao.
 *   - criacao: todo mundo parte do mesmo perfil de garoto e distribui o
 *     mesmo orcamento. Sem sorteio.
 *   - nivel (barra de XP cheia): da pontos, nao overall.
 *   - custo do ponto sobe com o atributo (1 ate 59, 2 ate 69, 3 ate 79,
 *     4 ate 89, 5 depois). E isso que tira o "garantido": o mesmo nivel
 *     que vale +1 de overall aos 62 vale ~+0,5 aos 82.
 *   - idade: o declinio sai dos atributos, fisico primeiro. O ponta
 *     rapido perde a arrancada e fica com o passe.
 *   - partida: gol, assistencia, drible, desarme e defesa usam o atributo
 *     contra o perfil NEUTRO da posicao no mesmo overall. Um 70 que investiu
 *     em Finalizacao marca mais que um 70 que investiu em Velocidade.
 */

const PRO = {
  baseCriacao: 50,      // perfil neutro de onde toda criacao parte
  tetoCriacao: 78,      // nenhum atributo sai da criacao acima disto
  /* calibra-pro.mjs: um nivel vale +1,0 de overall aos 65 (o ritmo do
     sistema antigo no comeco) e ~+0,64 aos 82. Por posicao porque o meia
     espalha o peso em 10 atributos e o goleiro concentra em 4. */
  pontosPorNivel: { GOL: 10, LAT: 12, ZAG: 11, MEI: 16, ATA: 11 },
  /* orcamento que, gasto do jeito que mais rende overall, leva o perfil
     neutro de 50 a 65 — o padrao que a tela de inicio ja usava. Espalhar
     por igual da 58 a 62: especializar rende overall, espalhar rende
     perfil. */
  orcamento: { GOL: 77, LAT: 95, ZAG: 93, MEI: 133, ATA: 86 },
  pisoOverall: 52,      // o declinio nao leva abaixo do piso antigo
};

/* posicao do contrato (8 opcoes) -> as 5 da base */
function proPos5(pos) {
  const p = String(pos || 'MEI').toUpperCase();
  if (p === 'GOL') return 'GOL';
  if (p === 'ZAG') return 'ZAG';
  if (p === 'LAT' || p === 'LD' || p === 'LE') return 'LAT';
  if (p === 'ATA' || p === 'SA' || p === 'PON' || p === 'PE' || p === 'PD') return 'ATA';
  return 'MEI';
}

/* a caracteristica como a tela chama -> a chave do atributo */
const PRO_NOME_GK = { 'Colocação': 'GK:col', 'Reflexo': 'GK:ref', 'Elasticidade': 'GK:ela', 'Jogo com os pés': 'GK:pes' };
function proChave(nome) { return PRO_NOME_GK[nome] || nome; }

/** custo para levar o atributo de v para v+1 */
function proCusto(v) {
  const x = Math.floor(v);
  return x < 60 ? 1 : x < 70 ? 2 : x < 80 ? 3 : x < 90 ? 4 : 5;
}
function proCustoEntre(de, ate) {
  let s = 0;
  for (let v = Math.floor(de); v < Math.floor(ate); v++) s += proCusto(v);
  return s;
}

/** O perfil que a posicao da a um jogador sem caracteristica e sem ruido:
    a mesma forma de atributosDe (etapa 4), so que limpa. E a regua contra
    a qual o atributo vira vantagem em campo. */
function proPerfilNeutro(ovr, pos5) {
  const lista = atrListaDe(pos5);
  const w = PESO_POS[pos5] || PESO_POS.MEI;
  const mw = 1 / lista.length;
  const rel = {}, out = {}, trav = {};
  for (const k of lista) { rel[k] = Math.max(0.25, 1 + K_POS * ((w[k] || 0) - mw)); out[k] = 0; trav[k] = false; }
  for (let passo = 0; passo < 4; passo++) {
    let livre = 0, feito = 0;
    for (const k of lista) { if (trav[k]) feito += out[k] * (w[k] || 0); else livre += rel[k] * (w[k] || 0); }
    if (livre <= 0) break;
    const esc = (ovr - feito) / livre;
    let mudou = false;
    for (const k of lista) {
      if (trav[k]) continue;
      const v = rel[k] * esc;
      if (v > 99) { out[k] = 99; trav[k] = true; mudou = true; } else out[k] = v;
    }
    if (!mudou) break;
  }
  for (const k of lista) out[k] = Math.max(1, Math.min(99, Math.round(out[k])));
  return out;
}

/** Ponto de partida da tela de criacao: o garoto neutro da posicao. */
function proBaseCriacao(pos5) { return proPerfilNeutro(PRO.baseCriacao, pos5); }

/** Confere uma distribuicao vinda da tela. Devolve o que foi gasto, o
    overall resultante e, se invalida, o motivo — a carreira nao confia
    no que chega pela prop. */
function proValidarCriacao(atr, pos5) {
  const base = proBaseCriacao(pos5);
  const orc = PRO.orcamento[pos5] || 0;
  if (!atr || typeof atr !== 'object') return { ok: false, erro: 'sem atributos' };
  let gasto = 0;
  for (const k of atrListaDe(pos5)) {
    const v = Number(atr[k]);
    if (!isFinite(v)) return { ok: false, erro: 'falta ' + k };
    if (v < base[k]) return { ok: false, erro: k + ' abaixo da base (' + base[k] + ')' };
    if (v > PRO.tetoCriacao) return { ok: false, erro: k + ' acima do teto de criacao (' + PRO.tetoCriacao + ')' };
    gasto += proCustoEntre(base[k], v);
  }
  if (gasto > orc) return { ok: false, erro: 'gastou ' + gasto + ' de ' + orc, gasto: gasto, orcamento: orc };
  return { ok: true, gasto: gasto, orcamento: orc, sobra: orc - gasto, overall: overallDeAtributos(atr, pos5) };
}

function proSincOvr(c) {
  c.ovr = Math.max(1, Math.min(99, Math.round(overallDeAtributos(c.atr, c.pos5))));
  return c.ovr;
}

/** A tela de criacao v2 (arvore de 12 habilidades em 6 grupos, 30 pontos)
    fala outra lingua: Aceleracao, Velocidade, Finalizacao, Chute, Visao,
    Passe, Agilidade, Controle, Interceptacao, Desarme, Forca, Folego.
    Aqui ela vira os 10 atributos de linha (ou 4 de goleiro) que o motor e
    os 78 mil NPCs usam. Onde nao ha habilidade equivalente (Cruzamento,
    Cabeceio, e o goleiro inteiro) a conta mistura as mais proximas. */
function proDeSkillsV2(sk, pos5) {
  const v = (k, d) => { const x = Number(sk && sk[k]); return isFinite(x) ? Math.max(30, Math.min(99, x)) : d; };
  const ace = v('ace', 60), vel = v('vel', 60), fin = v('fin', 55), chu = v('chu', 55), vis = v('vis', 60), pas = v('pas', 60);
  const agi = v('agi', 60), con = v('con', 60), itc = v('int', 52), des = v('des', 52), forc = v('for', 60), fol = v('fol', 60);
  const r = (x) => Math.round(x);
  /* altura (cm) da tela v3: 1,78 m = 60 de jogo aereo; +1,5 por cm */
  const altCm = Number(sk && sk.alt);
  /* excesso de peso (IMC acima de 27, fora do peso de atleta) tira impulsao: alto e pesado nao e bom no alto */
  const imcX = Number(sk && sk.imc);
  const gord = isFinite(imcX) ? Math.max(0, imcX - 27) : 0;
  const aer = isFinite(altCm) && altCm > 0 ? Math.max(35, Math.min(90, 60 + (altCm - 178) * 1.5 - 4 * gord)) : (forc * 0.55 + agi * 0.45);
  if (pos5 === 'GOL') {
    /* tela v3: o goleiro tem habilidades proprias, ja convertidas pela ponte */
    if (sk && sk.gk && typeof sk.gk === 'object') {
      const g = (k) => { const x = Number(sk.gk[k]); return isFinite(x) ? Math.max(30, Math.min(99, Math.round(x))) : 60; };
      return { 'GK:ref': g('GK:ref'), 'GK:ela': g('GK:ela'), 'GK:col': g('GK:col'), 'GK:pes': g('GK:pes') };
    }
    return { 'GK:ref': r(agi * 0.6 + ace * 0.4), 'GK:ela': r(agi * 0.5 + vel * 0.25 + forc * 0.25),
             'GK:col': r(itc * 0.7 + vis * 0.3), 'GK:pes': r(pas * 0.7 + vis * 0.3) };
  }
  return {
    'Armação': r(vis * 0.6 + pas * 0.4), 'Passe': r(pas * 0.6 + vis * 0.4), 'Cruzamento': r(pas * 0.5 + vis * 0.3 + chu * 0.2),
    'Finalização': r(fin * 0.65 + chu * 0.35), 'Cabeceio': r(forc * 0.40 + fin * 0.20 + aer * 0.40),
    'Drible': r(con * 0.55 + agi * 0.45), 'Velocidade': r(vel * 0.55 + ace * 0.45),
    'Marcação': r(itc * 0.7 + des * 0.3), 'Desarme': r(des * 0.7 + itc * 0.3), 'Resistência': r(fol * 0.8 + forc * 0.2),
  };
}

/** Garante que a carreira tem atributos. Tres origens, nesta ordem:
    1. a distribuicao da tela de criacao (prop atributos), se valida;
    2. a carreira ja tinha (save);
    3. derivar do overall atual pela mesma regra dos NPCs, com as
       caracteristicas escolhidas puxando os atributos delas. E o caminho
       dos saves antigos e da criacao de hoje (a roleta). */
function proGarantir(c, posicao, cars, atrCriacao) {
  if (!c) return c;
  const pos5 = proPos5(posicao);
  if (c.atr && c.pos5 === pos5) return c;
  let atr = null;
  if (atrCriacao) {
    let a = atrCriacao;
    if (typeof a === 'string') { try { a = JSON.parse(a); } catch (e) { a = null; } }
    /* criacao v2: a tela ja limitou 30 pontos e 45-90 por habilidade */
    if (a && a._v === 2 && a.skills) {
      atr = proDeSkillsV2(a.skills, pos5);
    }
    const v = atr ? { ok: false } : (a ? proValidarCriacao(a, pos5) : { ok: false, erro: 'json invalido' });
    if (atr) { /* ja convertido */ }
    else if (v.ok) {
      atr = {};
      for (const k of atrListaDe(pos5)) atr[k] = Number(a[k]);
    } else if (a) {
      console.warn('[atributos] criacao recusada:', v.erro);
    }
  }
  if (!atr) {
    const lista = Array.isArray(cars) ? cars : [];
    atr = atributosDe({ id: 'eu:' + (c.saveId || ''), pos5: pos5, forca: Number(c.ovr) || 60, cars: lista.map(proChave) });
  }
  c.atr = atr;
  c.pos5 = pos5;
  c.pontos = c.pontos || 0;
  c.nivel = c.nivel || 0;
  if (c.proAuto == null) c.proAuto = true;
  proSincOvr(c);
  return c;
}

/** Investe n pontos num atributo. Para quando o saldo nao paga o proximo. */
function proGastar(c, k, n) {
  if (!c || !c.atr || !(k in c.atr)) return 0;
  let feitos = 0;
  for (let i = 0; i < (n || 1); i++) {
    const v = c.atr[k];
    if (v >= 99) break;
    const custo = proCusto(v);
    if ((c.pontos || 0) < custo) break;
    c.pontos -= custo;
    c.atr[k] = Math.min(99, Math.round((v + 1) * 10) / 10);
    feitos++;
  }
  if (feitos) proSincOvr(c);
  return feitos;
}

/** Enquanto nao existe a tela de distribuir: o jogo gasta pelo melhor
    ganho de overall por ponto. A cada compra o custo muda, entao ele
    espalha sozinho quando o atributo principal fica caro. */
function proGastarAuto(c) {
  if (!c || !c.atr) return 0;
  const w = PESO_POS[c.pos5] || PESO_POS.MEI;
  let n = 0;
  for (let guarda = 0; guarda < 400; guarda++) {
    let melhor = null, razao = 0;
    for (const k of Object.keys(c.atr)) {
      if (c.atr[k] >= 99) continue;
      const custo = proCusto(c.atr[k]);
      if (custo > (c.pontos || 0)) continue;
      const r = ((w[k] || 0) + 0.01) / custo;
      if (r > razao) { razao = r; melhor = k; }
    }
    if (!melhor) break;
    n += proGastar(c, melhor, 1);
  }
  return n;
}

/** A barra de XP encheu: um nivel, PRO.pontosPorNivel pontos. */
function proGanharNivel(c) {
  c.nivel = (c.nivel || 0) + 1;
  const ppn = PRO.pontosPorNivel;
  c.pontos = (c.pontos || 0) + (typeof ppn === 'number' ? ppn : (ppn[c.pos5] || 11));
  if (c.proAuto !== false) proGastarAuto(c);
  return proSincOvr(c);
}

/* O que a idade leva primeiro. Fisico cai rapido, leitura de jogo quase
   nao cai. Media ponderada perto de 1, entao o overall perde por ano o
   mesmo que a curva de idade dos NPCs. */
const PRO_DECLINIO = {
  'Velocidade': 1.9, 'Resistência': 1.5, 'Drible': 1.1, 'Cabeceio': 0.9, 'Finalização': 0.8,
  'Cruzamento': 0.8, 'Desarme': 1.0, 'Marcação': 0.6, 'Passe': 0.45, 'Armação': 0.4,
  'GK:ela': 1.5, 'GK:ref': 1.2, 'GK:col': 0.5, 'GK:pes': 0.5,
};
function proDeclinio(c, quanto) {
  if (!c || !c.atr || !(quanto > 0)) return;
  const w = PESO_POS[c.pos5] || PESO_POS.MEI;
  let sw = 0, swf = 0;
  for (const k of Object.keys(c.atr)) { sw += (w[k] || 0); swf += (w[k] || 0) * (PRO_DECLINIO[k] || 1); }
  const norm = sw > 0 && swf > 0 ? sw / swf : 1;   // o overall cai 'quanto', a forma da queda e da tabela
  const antes = Object.assign({}, c.atr);
  for (const k of Object.keys(c.atr)) {
    c.atr[k] = Math.max(1, Math.round((c.atr[k] - quanto * (PRO_DECLINIO[k] || 1) * norm) * 10) / 10);
  }
  if (overallDeAtributos(c.atr, c.pos5) < PRO.pisoOverall) c.atr = antes;
  proSincOvr(c);
}
function proLesoes(c) {
  if (!c || !c.atr) return;
  if ('Resistência' in c.atr) c.atr['Resistência'] = Math.max(1, c.atr['Resistência'] - 2);
  if ('Velocidade' in c.atr) c.atr['Velocidade'] = Math.max(1, c.atr['Velocidade'] - 1);
  if ('GK:ela' in c.atr) c.atr['GK:ela'] = Math.max(1, c.atr['GK:ela'] - 2);
  proSincOvr(c);
}

/** O atributo em campo. Mesmo formato do caracMods (que ele substitui
    quando a carreira tem atributos — as caracteristicas ja estao DENTRO
    dos atributos, somar as duas contaria duas vezes). Referencia: o
    perfil neutro da posicao no MESMO overall; 10 pontos acima dele
    rendem +15% de gol (Finalizacao), +12% de assistencia, +18% de drible. */
function proMods(c) {
  const m = { g: 1, a: 1, dr: 1, tk: 1, saves: 1, pen: 1, nota: 0 };
  if (!c || !c.atr) return m;
  const n = proPerfilNeutro(overallDeAtributos(c.atr, c.pos5), c.pos5);
  const d = (k) => (k in c.atr) ? ((c.atr[k] - (n[k] || c.atr[k])) / 10) : 0;
  /* media ponderada dos desvios, nao soma: um finalizador puro tem
     Armacao, Passe e Cruzamento abaixo do neutro ao mesmo tempo, e somar
     os tres o punia tres vezes pela mesma escolha. */
  const med = (par) => { let s = 0, w = 0; for (const x of par) if (x[0] in c.atr) { s += d(x[0]) * x[1]; w += x[1]; } return w ? s / w : 0; };
  const f = (x) => Math.max(0.8, Math.min(1.3, 1 + x));
  m.g = f(0.15 * med([['Finalização', 0.6], ['Cabeceio', 0.2], ['Velocidade', 0.12], ['Drible', 0.08]]));
  m.a = f(0.12 * med([['Armação', 0.35], ['Passe', 0.35], ['Cruzamento', 0.22], ['Drible', 0.08], ['GK:pes', 1]]));
  m.dr = f(0.18 * med([['Drible', 0.8], ['Velocidade', 0.2]]));
  m.tk = f(0.12 * med([['Marcação', 0.5], ['Desarme', 0.5]]));
  m.saves = f(0.12 * med([['GK:ref', 0.4], ['GK:col', 0.35], ['GK:ela', 0.25]]));
  m.pen = f(0.2 * d('GK:ela'));
  m.nota = Math.max(-0.15, Math.min(0.15, 0.1 * d('Resistência')));
  return m;
}

  window.PromessaAtributos = { PRO, PESO_POS, ATR_GK, ATR_LINHA, atrListaDe, overallDeAtributos,
    proPos5, proCusto, proCustoEntre, proPerfilNeutro, proBaseCriacao, proValidarCriacao, proMods, proDeSkillsV2 };
})();
