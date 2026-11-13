/* ====================================================================
   PROMESSA 2.0 — HABILIDADES DO ATLETA (árvore v3)
   Uma lista só para a criação, a carreira (aba Atleta) e o motor.
   - 29 habilidades de linha em 6 grupos (o padrão que o jogador de
     Pro Clubs / FC já conhece) e 16 de goleiro em 6 grupos.
   - O motor de partida e os 78 mil NPCs continuam com os 10 atributos
     de linha / 4 de goleiro: paraAtributos() faz a ponte.
   - Traços: a média de cada grupo destrava 3 traços (70/80/90). O efeito
     é interno (proMods); a tela mostra só o nome e uma frase, sem número.
   Uso: PromessaHab.configurar({ overall: overallDeAtributos }) antes de ovr().
   ==================================================================== */
(function (raiz) {
  'use strict';
  if (raiz.PromessaHab) return;

  const GRUPOS = {
    linha: [
      { id: 'rit', nome: 'Ritmo', sigla: 'RIT', hab: [['ace', 'Aceleração'], ['vel', 'Velocidade']],
        tracos: [['Arrancada', 'Sai na frente na primeira passada.'], ['Motor', 'Mantém a velocidade até o fim da jogada.'], ['Foguete', 'Ninguém alcança no contra-ataque.']] },
      { id: 'fin', nome: 'Finalização', sigla: 'FIN', hab: [['pos', 'Posicionamento ofensivo'], ['fin', 'Finalização'], ['chu', 'Força do chute'], ['lon', 'Chute de longe'], ['vol', 'Voleio'], ['pen', 'Pênalti']],
        tracos: [['Pé calibrado', 'Acerta mais o alvo.'], ['Matador', 'Aproveita melhor as chances claras.'], ['Artilheiro', 'Faz gol de onde ninguém faz.']] },
      { id: 'pas', nome: 'Passe', sigla: 'PAS', hab: [['vis', 'Visão de jogo'], ['cru', 'Cruzamento'], ['pcu', 'Passe curto'], ['plo', 'Passe longo'], ['efe', 'Efeito'], ['fal', 'Cobrança de falta']],
        tracos: [['Visão', 'Enxerga o companheiro livre.'], ['Maestro', 'Dita o ritmo do time.'], ['Gênio', 'Cria o passe que decide o jogo.']] },
      { id: 'dri', nome: 'Drible', sigla: 'DRI', hab: [['agi', 'Agilidade'], ['equ', 'Equilíbrio'], ['rea', 'Reação'], ['con', 'Controle de bola'], ['dri', 'Drible'], ['fri', 'Frieza']],
        tracos: [['Ginga', 'Passa do primeiro marcador.'], ['Liso', 'Difícil de desarmar.'], ['Mágico', 'Resolve no um contra um.']] },
      { id: 'def', nome: 'Defesa', sigla: 'DEF', hab: [['int', 'Interceptação'], ['cab', 'Cabeceio'], ['lei', 'Leitura defensiva'], ['dpe', 'Desarme em pé'], ['car', 'Carrinho']],
        tracos: [['Leitura', 'Chega antes no passe.'], ['Muralha', 'Ganha mais divididas.'], ['Xerife', 'Comanda a defesa.']] },
      { id: 'fis', nome: 'Físico', sigla: 'FIS', hab: [['imp', 'Impulsão'], ['fol', 'Fôlego'], ['for', 'Força'], ['agr', 'Agressividade']],
        tracos: [['Pulmão', 'Rende até o apito final.'], ['Tanque', 'Aguenta o contato e se machuca menos.'], ['Incansável', 'Cresce quando o jogo cansa.']] },
    ],
    gol: [
      { id: 'ela', nome: 'Elasticidade', sigla: 'ELA', hab: [['mba', 'Mergulho rasteiro'], ['mal', 'Salto no ângulo']],
        tracos: [['Elástico', 'Alcança bolas no canto.'], ['Felino', 'Espalma o que parecia gol.'], ['Voador', 'Fecha o ângulo inteiro.']] },
      { id: 'man', nome: 'Manejo', sigla: 'MAN', hab: [['fir', 'Firmeza de mãos'], ['enc', 'Encaixe'], ['alt', 'Saída no alto']],
        tracos: [['Mãos firmes', 'Dá menos rebote.'], ['Cofre', 'Segura o chute forte.'], ['Paredão', 'Domina a área no cruzamento.']] },
      { id: 'rep', nome: 'Reposição', sigla: 'REP', hab: [['tmt', 'Tiro de meta'], ['psa', 'Saída com os pés'], ['lan', 'Lançamento com as mãos']],
        tracos: [['Reposição', 'Repõe rápido e certo.'], ['Lançador', 'Começa o contra-ataque.'], ['Armador', 'Joga como líbero com a bola.']] },
      { id: 'ref', nome: 'Reflexos', sigla: 'REF', hab: [['rqr', 'Reação à queima-roupa'], ['tre', 'Tempo de reação'], ['dpn', 'Defesa de pênalti']],
        tracos: [['Reflexo', 'Reage no chute de perto.'], ['Relâmpago', 'Defende o desvio no meio do caminho.'], ['Milagreiro', 'Faz a defesa impossível.']] },
      { id: 'agl', nome: 'Agilidade', sigla: 'AGI', hab: [['sch', 'Saída do gol'], ['rec', 'Recuperação rápida']],
        tracos: [['Ágil', 'Levanta rápido para a segunda bola.'], ['Ligeiro', 'Sai bem no um contra um.'], ['Líbero', 'Cobre as costas da zaga.']] },
      { id: 'pgo', nome: 'Posicionamento', sigla: 'POS', hab: [['pjo', 'Posição em jogo'], ['fan', 'Fechamento de ângulo'], ['com', 'Comando da área']],
        tracos: [['Bem posicionado', 'Está no lugar certo.'], ['Dono da área', 'Ninguém entra sem pedir.'], ['Comandante', 'Organiza a defesa toda.']] },
    ],
  };
  const MARCOS = [70, 80, 90];
  /* Régua dos estilos pelo tamanho do grupo: grupo pequeno (Ritmo tem só Aceleração e Velocidade, como no FC)
     sobe a média muito mais barato, então a régua dele é mais alta. Regra de jogo calibrada, não dado real:
     custo para o 1º estilo fica perto de 100 pontos em todos os grupos (antes: Ritmo 40, Finalização 100+). */
  const REGUA = { 2: [80, 90, 97], 3: [76, 86, 95], 4: [73, 83, 93], 5: [70, 80, 90], 6: [70, 80, 90] };
  for (const lado of ['linha', 'gol']) for (const g of GRUPOS[lado]) g.marcos = REGUA[g.hab.length] || MARCOS;

  /* Ponte para os atributos do motor (pesos somam 1 em cada atributo). */
  const PONTE_LINHA = {
    'Armação': { vis: 0.45, plo: 0.2, pcu: 0.15, fri: 0.1, efe: 0.1 },
    'Passe': { pcu: 0.45, plo: 0.25, vis: 0.2, efe: 0.1 },
    'Cruzamento': { cru: 0.6, efe: 0.2, plo: 0.2 },
    'Finalização': { fin: 0.4, pos: 0.2, chu: 0.15, lon: 0.1, fri: 0.1, vol: 0.05 },
    'Cabeceio': { cab: 0.5, imp: 0.2, pos: 0.1, for: 0.1, _aer: 0.1 },
    'Drible': { dri: 0.35, con: 0.3, agi: 0.15, equ: 0.1, rea: 0.1 },
    'Velocidade': { vel: 0.55, ace: 0.45 },
    'Marcação': { lei: 0.5, int: 0.3, agr: 0.1, rea: 0.1 },
    'Desarme': { dpe: 0.45, car: 0.25, int: 0.15, agr: 0.15 },
    'Resistência': { fol: 0.75, for: 0.25 },
  };
  const PONTE_GOL = {
    'GK:ref': { rqr: 0.4, tre: 0.4, rec: 0.2 },
    'GK:ela': { mba: 0.5, mal: 0.5 },
    'GK:col': { pjo: 0.3, fan: 0.25, com: 0.15, alt: 0.1, fir: 0.1, enc: 0.1 },
    'GK:pes': { psa: 0.45, tmt: 0.3, lan: 0.15, sch: 0.1 },
  };

  /* Pontos por nível (barra de XP cheia) e criação. Calibrados em
     calibra-hab.mjs: um nível vale ~+1 de OVR aos 65, como no motor 1.0. */
  const PPN = { GOL: 30, LAT: 24, ZAG: 20, MEI: 36, ATA: 34 }; // GOL 24 -> 30: sim-evolucao.mjs, o goleiro ficava 2 abaixo do motor antigo no auge
  /* orçamento da criação: focado leva o garoto de 58 a ~66; espalhado, a ~62 (especializar rende OVR, espalhar rende perfil) */
  const CRIACAO = { orcamento: 140, limiteOvr: 70, teto: 99, piso: 30, ovrBase: 58 };

  let overallFn = null;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ehGol = (pos5) => pos5 === 'GOL';
  const grupos = (pos5) => (ehGol(pos5) ? GRUPOS.gol : GRUPOS.linha);
  const chaves = (pos5) => grupos(pos5).flatMap((g) => g.hab.map((h) => h[0]));
  const nomeDe = (k) => { for (const t of ['linha', 'gol']) for (const g of GRUPOS[t]) for (const h of g.hab) if (h[0] === k) return h[1]; return k; };

  /* mesmo degrau do motor: 1 até 59, 2 até 69, 3 até 79, 4 até 89, 5 depois */
  function custo(v) { const x = Math.floor(v); return x < 60 ? 1 : x < 70 ? 2 : x < 80 ? 3 : x < 90 ? 4 : 5; }
  function custoEntre(de, ate) { let s = 0; for (let v = Math.floor(de); v < Math.floor(ate); v++) s += custo(v); return s; }

  /* jogo aéreo pelo biotipo: 1,78 m = 60, +1,5 por cm; IMC acima de 27 tira impulsão */
  function aereo(sk) {
    const alt = Number(sk && sk._alt), imc = Number(sk && sk._imc);
    const gord = isFinite(imc) ? Math.max(0, imc - 27) : 0;
    return isFinite(alt) && alt > 0 ? clamp(60 + (alt - 178) * 1.5 - 4 * gord, 35, 90) : Number(sk.imp) || 60;
  }
  function paraAtributos(sk, pos5) {
    const P = ehGol(pos5) ? PONTE_GOL : PONTE_LINHA, out = {};
    for (const a in P) {
      let s = 0;
      for (const k in P[a]) s += (k === '_aer' ? aereo(sk) : (Number(sk[k]) || 50)) * P[a][k];
      out[a] = clamp(Math.round(s * 10) / 10, 1, 99); // uma casa: o motor guarda atributo com decimal
    }
    return out;
  }
  function ovr(sk, pos5) {
    if (typeof overallFn !== 'function') throw new Error('[habilidades] configurar({ overall }) não foi chamado');
    return overallFn(paraAtributos(sk, pos5), pos5);
  }
  function medias(sk, pos5) {
    const m = {};
    for (const g of grupos(pos5)) m[g.id] = g.hab.reduce((s, h) => s + (Number(sk[h[0]]) || 0), 0) / g.hab.length;
    return m;
  }
  /** traços destravados: [{ grupo, nivel (0..2), nome, desc }] */
  function tracos(sk, pos5) {
    const md = medias(sk, pos5), out = [];
    for (const g of grupos(pos5)) g.marcos.forEach((m, i) => { if (md[g.id] >= m) out.push({ grupo: g.id, nivel: i, nome: g.tracos[i][0], desc: g.tracos[i][1] }); });
    return out;
  }

  /* Ponto de partida da criação: base do grupo pela posição + biotipo. */
  const BASE_POS = {
    ATA: { rit: 62, fin: 63, pas: 54, dri: 59, def: 35, fis: 60 }, SA: { rit: 63, fin: 61, pas: 58, dri: 62, def: 36, fis: 55 },
    PE: { rit: 66, fin: 58, pas: 56, dri: 64, def: 35, fis: 52 }, PD: { rit: 66, fin: 58, pas: 56, dri: 64, def: 35, fis: 52 },
    MEI: { rit: 60, fin: 57, pas: 63, dri: 63, def: 42, fis: 55 }, MC: { rit: 60, fin: 55, pas: 62, dri: 60, def: 52, fis: 60 },
    ME: { rit: 64, fin: 54, pas: 60, dri: 61, def: 45, fis: 54 }, MD: { rit: 64, fin: 54, pas: 60, dri: 61, def: 45, fis: 54 },
    VOL: { rit: 56, fin: 48, pas: 59, dri: 57, def: 62, fis: 63 }, LE: { rit: 64, fin: 46, pas: 57, dri: 58, def: 60, fis: 58 },
    LD: { rit: 64, fin: 46, pas: 57, dri: 58, def: 60, fis: 58 }, ZAE: { rit: 54, fin: 35, pas: 52, dri: 50, def: 64, fis: 64 },
    ZAD: { rit: 54, fin: 35, pas: 52, dri: 50, def: 64, fis: 64 },
  };
  /* ajuste fino por habilidade dentro do grupo, por função (um zagueiro cabeceia melhor do que dribla, etc.) */
  const AJUSTE = {
    ZAE: { cab: 6, imp: 3, pen: -8, vol: -6, lon: -4, fal: -6 }, ZAD: { cab: 6, imp: 3, pen: -8, vol: -6, lon: -4, fal: -6 },
    VOL: { lei: 3, int: 3, car: 2, plo: 3 }, LE: { cru: 5, car: 2 }, LD: { cru: 5, car: 2 },
    ATA: { pos: 4, cab: 4, lei: -4 }, SA: { pos: 2, fri: 2 }, PE: { cru: 3, dri: 2 }, PD: { cru: 3, dri: 2 },
    MEI: { vis: 3, fal: 2, efe: 2 }, MC: { pcu: 2, plo: 2 },
  };
  function base(posicao, mod) {
    const m = mod || {}, p = String(posicao || 'MC').toUpperCase();
    if (p === 'GOL') {
      return nivelar({ mba: 58 + Math.round((m.agilidade || 0) * 0.5), mal: 60 + Math.round((m.cabeceio || 0) * 0.5), fir: 59 + Math.round((m.forca || 0) * 0.4), enc: 58,
        alt: 58 + Math.round((m.cabeceio || 0) * 0.6), tmt: 60, psa: 57, lan: 58, rqr: 62 + Math.round((m.agilidade || 0) * 0.6), tre: 60, dpn: 56,
        sch: 58 + Math.round((m.ritmo || 0) * 0.5), rec: 59 + Math.round((m.agilidade || 0) * 0.5), pjo: 60, fan: 60, com: 57 }, 'GOL');
    }
    const b = BASE_POS[p] || { rit: 60, fin: 55, pas: 60, dri: 58, def: 50, fis: 58 }, aj = AJUSTE[p] || {};
    const bio = { ace: m.ritmo, vel: Math.round((m.ritmo || 0) * 0.8), agi: m.agilidade, equ: Math.round((m.agilidade || 0) * 0.5), chu: Math.round((m.forca || 0) * 0.5),
      for: m.forca, imp: m.salto, cab: m.cabeceio, fol: m.folego, int: Math.round((m.cabeceio || 0) * 0.4) };
    const out = {};
    for (const g of GRUPOS.linha) for (const [k] of g.hab) out[k] = clamp(b[g.id] + (aj[k] || 0) + (bio[k] || 0), CRIACAO.piso, 85);
    return nivelar(out, p);
  }
  /* toda posição começa no mesmo OVR (o biotipo e a função mudam o perfil, não o ponto de partida) */
  function nivelar(sk, p) {
    if (typeof overallFn !== 'function') return sk;
    const pos5 = pos5De(p), delta = Math.round(CRIACAO.ovrBase - ovr(sk, pos5));
    if (delta) for (const k in sk) sk[k] = clamp(sk[k] + delta, CRIACAO.piso, 85);
    return sk;
  }
  /* posição da criação (13) -> as 5 do motor */
  function pos5De(p) {
    p = String(p || 'MC').toUpperCase();
    if (p === 'GOL') return 'GOL';
    if (p === 'ZAE' || p === 'ZAD' || p === 'ZAG') return 'ZAG';
    if (p === 'LE' || p === 'LD' || p === 'LAT') return 'LAT';
    if (p === 'ATA' || p === 'SA' || p === 'PE' || p === 'PD' || p === 'PON') return 'ATA';
    return 'MEI';
  }

  /* Saves de antes da árvore v3: monta as habilidades a partir dos 10 atributos. */
  function deAtributos(atr, pos5) {
    const P = ehGol(pos5) ? PONTE_GOL : PONTE_LINHA, soma = {}, peso = {};
    for (const a in P) for (const k in P[a]) { if (k === '_aer') continue; soma[k] = (soma[k] || 0) + (Number(atr[a]) || 50) * P[a][k]; peso[k] = (peso[k] || 0) + P[a][k]; }
    const sk = {};
    for (const k of chaves(pos5)) sk[k] = peso[k] ? clamp(Math.round(soma[k] / peso[k]), 1, 99) : 55;
    return sk;
  }

  /* Efeito interno (não aparece na tela): traços e as habilidades que o motor de 10 atributos não enxerga
     (pênalti, falta, chute de longe, voleio, frieza, defesa de pênalti). Multiplica o resultado do proMods. */
  const EFEITO_TRACO = {
    rit: [{ dr: 0.02 }, { dr: 0.02, g: 0.01 }, { dr: 0.03, g: 0.02 }], fin: [{ g: 0.02 }, { g: 0.03 }, { g: 0.04 }],
    pas: [{ a: 0.02 }, { a: 0.03 }, { a: 0.04 }], dri: [{ dr: 0.03 }, { dr: 0.03 }, { dr: 0.04, a: 0.01 }],
    def: [{ tk: 0.03 }, { tk: 0.03 }, { tk: 0.04 }], fis: [{ nota: 0.03 }, { nota: 0.03 }, { nota: 0.04 }],
    ela: [{ saves: 0.02 }, { saves: 0.03 }, { saves: 0.04 }], man: [{ saves: 0.02 }, { saves: 0.02 }, { saves: 0.03 }],
    rep: [{ a: 0.02 }, { a: 0.02 }, { a: 0.03 }], ref: [{ saves: 0.02 }, { saves: 0.03 }, { saves: 0.04 }],
    agl: [{ saves: 0.01 }, { saves: 0.02 }, { saves: 0.02 }], pgo: [{ saves: 0.02 }, { saves: 0.02 }, { saves: 0.03 }],
  };
  /* Passivas: só as ATIVAS dão efeito, no máximo MAX_PASSIVAS. ativos = ['grupo:nivel', ...] escolhidos pelo jogador;
     sem escolha (save antigo ou nunca mexeu), entram as de nível mais alto. */
  const MAX_PASSIVAS = 5;
  function passivasAtivas(sk, pos5, ativos) {
    const lst = tracos(sk, pos5);
    if (!Array.isArray(ativos)) return lst.slice().sort((a, b) => b.nivel - a.nivel).slice(0, MAX_PASSIVAS);
    const quer = new Set(ativos);
    return lst.filter((t) => quer.has(t.grupo + ':' + t.nivel)).slice(0, MAX_PASSIVAS);
  }
  function mods(sk, pos5, ativos) {
    const m = { g: 1, a: 1, dr: 1, tk: 1, saves: 1, pen: 1, nota: 0 };
    if (!sk) return m;
    for (const t of passivasAtivas(sk, pos5, ativos)) { const e = (EFEITO_TRACO[t.grupo] || [])[t.nivel] || {}; for (const k in e) { if (k === 'nota') m.nota += e[k]; else m[k] *= 1 + e[k]; } }
    const acima = (k, ref) => Math.max(0, ((Number(sk[k]) || 0) - ref) / 100);
    if (!ehGol(pos5)) {
      m.g *= 1 + 0.08 * acima('pen', 65) + 0.06 * acima('lon', 65) + 0.04 * acima('vol', 65) + 0.05 * acima('fal', 65);
      m.a *= 1 + 0.04 * acima('fal', 65);
      m.nota += 0.1 * acima('fri', 65);
    } else {
      m.pen *= 1 + 0.2 * acima('dpn', 60);
    }
    return m;
  }

  /** Carreira: põe n pontos numa habilidade de c.hab. Devolve quantos entraram. */
  function gastar(c, k, n) {
    if (!c || !c.hab || !(k in c.hab)) return 0;
    let feitos = 0;
    for (let i = 0; i < (n || 1); i++) {
      const v = c.hab[k]; if (v >= 99) break;
      const cu = custo(v); if ((c.pontos || 0) < cu) break;
      c.pontos -= cu; c.hab[k] = v + 1; feitos++;
    }
    return feitos;
  }
  /** Distribui sozinho: maior ganho de OVR por ponto (espalha quando a habilidade principal encarece). */
  function gastarAuto(c, pos5) {
    if (!c || !c.hab) return 0;
    let n = 0;
    for (let guarda = 0; guarda < 600; guarda++) {
      const atual = ovr(c.hab, pos5);
      let melhor = null, razao = 0;
      for (const k of chaves(pos5)) {
        const v = c.hab[k]; if (v >= 99) continue;
        const cu = custo(v); if (cu > (c.pontos || 0)) continue;
        c.hab[k] = v + 1; const ganho = ovr(c.hab, pos5) - atual; c.hab[k] = v;
        const r = (ganho + 0.0005) / cu;
        if (r > razao) { razao = r; melhor = k; }
      }
      if (!melhor) break;
      n += gastar(c, melhor, 1);
    }
    return n;
  }

  /* idade: o físico cai primeiro (mesma tabela do motor 1.0, levada para as habilidades) */
  const DECLINIO = { ace: 1.9, vel: 1.9, agi: 1.3, equ: 1.0, rea: 0.9, fol: 1.5, for: 0.8, imp: 1.2, agr: 0.5, dri: 1.1, con: 0.7, fri: 0.2,
    fin: 0.8, pos: 0.5, chu: 0.7, lon: 0.6, vol: 0.8, pen: 0.2, cab: 0.9, int: 0.7, lei: 0.4, dpe: 1.0, car: 1.1, vis: 0.3, pcu: 0.4, plo: 0.4,
    cru: 0.8, efe: 0.4, fal: 0.3, mba: 1.5, mal: 1.5, rqr: 1.2, tre: 1.2, rec: 1.3, sch: 1.2, fir: 0.6, enc: 0.6, alt: 0.8, tmt: 0.4, psa: 0.5,
    lan: 0.4, dpn: 0.6, pjo: 0.4, fan: 0.4, com: 0.3 };
  function declinio(sk, pos5, quanto) {
    if (!sk || !(quanto > 0)) return;
    const ks = chaves(pos5), media = ks.reduce((s, k) => s + (DECLINIO[k] || 1), 0) / ks.length;
    for (const k of ks) sk[k] = Math.max(1, Math.round((sk[k] - quanto * (DECLINIO[k] || 1) / media) * 10) / 10);
  }

  raiz.PromessaHab = {
    GRUPOS, MARCOS, REGUA, PPN, MAX_PASSIVAS, CRIACAO, PONTE_LINHA, PONTE_GOL,
    configurar(o) { if (o && typeof o.overall === 'function') overallFn = o.overall; },
    grupos, chaves, nomeDe, pos5De, custo, custoEntre, paraAtributos, ovr, medias, tracos, base, deAtributos, mods, passivasAtivas, gastar, gastarAuto, declinio,
  };
})(typeof window !== 'undefined' ? window : globalThis);
