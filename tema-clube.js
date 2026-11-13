// tema-clube.js — fundo temático do clube a partir do padrão real da camisa (padroes.json) e da ficha do clube (Wikidata).
// Uso: const t = temaClube(padrao, info); el.style.background = t.fundo;
// O elemento que recebe o fundo define --kx (centro da camisa, em %), --kxl (o mesmo centro como comprimento), --cw (largura do elemento)
// e --u (largura do tronco da camisa na tela).
(function (raiz) {
  'use strict';
  const rgb = (h) => { let s = String(h || '#777777').slice(1); if (s.length === 3) s = s.replace(/./g, '$&$&'); const n = parseInt(s, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const lum = (h) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const sat = (h) => { const c = rgb(h), mx = Math.max(...c), mn = Math.min(...c); return mx ? (mx - mn) / mx : 0; };
  const contraste = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  const dist = (a, b) => { const x = rgb(a), y = rgb(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]); };
  // tom levemente mais vivo: a camisa vem com sombreado, o fundo plano precisa da cor "de catálogo"
  const vivo = (h) => {
    const [r, g, b] = rgb(h), mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn < 18) return h; // branco, cinza e preto ficam como estão
    const k = Math.min(1.18, 255 / mx);
    return '#' + [r, g, b].map((v) => Math.round(Math.min(255, v * k)).toString(16).padStart(2, '0')).join('').toUpperCase();
  };
  const K = 1.25; // o fundo usa as faixas um pouco maiores que na camisa
  const U = (f) => `calc(var(--u) * ${(f * K).toFixed(3)})`;

  function larguras(runs) {
    // largura típica de cada cor, usando as faixas internas (as das bordas vêm cortadas pelo recorte do tronco)
    const meio = runs.length > 2 ? runs.slice(1, -1) : runs, por = {};
    for (const [v, f] of meio) (por[v] = por[v] || []).push(f);
    const med = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    return Object.fromEntries(Object.entries(por).map(([v, a]) => [v, med(a)]));
  }

  function fundoDoPadrao(p) {
    const cores = (p.cores || ['#777777']).map(vivo);
    const cr = (p.corRuns || []).map((c, i) => vivo(c || cores[p.runs[i][0]] || cores[0]));
    const corDe = (v) => { const i = (p.runs || []).findIndex((r) => r[0] === v); return (i >= 0 && cr[i]) || cores[v] || cores[0]; };
    const A = cores[0], B = cores[1] || cores[0];
    switch (p.tipo) {
      case 'listras_v':
      case 'aros': {
        const w = larguras(p.runs), v0 = p.runs[0][0], v1 = 1 - v0;
        const a = w[v0] || 0.12, b = w[v1] || 0.12, ca = corDe(v0), cb = corDe(v1);
        const pct = (a / (a + b) * 100).toFixed(2);
        if (p.tipo === 'listras_v') {
          return `linear-gradient(90deg,${ca} 0 ${pct}%,${cb} ${pct}% 100%) calc(var(--kxl) - ${U(a / 2)}) 0 / ${U(a + b)} 100% repeat-x,${ca}`;
        }
        // aros: se houver mais de duas cores nas faixas (ex.: vermelho e preto alternando com branco), desenha a sequência real
        const distintas = [...new Set(cr.filter(Boolean))];
        if (distintas.length > 2 && p.runs.length >= 4) {
          let pos = 0; const tot = p.runs.reduce((s, r) => s + r[1], 0), partes = [];
          p.runs.forEach((r, i) => { const ini = pos / tot * 100, fim = (pos += r[1]) / tot * 100; partes.push(`${cr[i]} ${ini.toFixed(2)}% ${fim.toFixed(2)}%`); });
          return `linear-gradient(180deg,${partes.join(',')}) 0 var(--ty,30%) / 100% ${U(tot)} repeat-y,${ca}`;
        }
        return `linear-gradient(180deg,${ca} 0 ${pct}%,${cb} ${pct}% 100%) 0 var(--ty,30%) / 100% ${U(a + b)} repeat-y,${ca}`;
      }
      case 'faixa_central_v': {
        const f = p.runs[1][1], cb = cr[1] || B, ca = cr[0] || A;
        return `linear-gradient(90deg,transparent calc(var(--kx) - ${U(f / 2)}),${cb} calc(var(--kx) - ${U(f / 2)}) calc(var(--kx) + ${U(f / 2)}),transparent calc(var(--kx) + ${U(f / 2)})),${ca}`;
      }
      case 'metades_v':
        return `linear-gradient(90deg,${cr[0] || A} 0 var(--kx),${cr[1] || B} var(--kx) 100%)`;
      case 'metades_h':
        return `linear-gradient(180deg,${cr[0] || A} 0 50%,${cr[1] || B} 50% 100%)`;
      case 'faixa_h': {
        const [r0, r1] = [p.runs[0][1], p.runs[1][1]], ini = 22 + r0 * 60, fim = ini + r1 * 60;
        return `linear-gradient(180deg,transparent ${ini.toFixed(1)}%,${cr[1] || B} ${ini.toFixed(1)}% ${fim.toFixed(1)}%,transparent ${fim.toFixed(1)}%),${cr[0] || A}`;
      }
      case 'degrade': {
        const ord = cores.slice().sort((x, y) => lum(y) - lum(x)), claro = ord[0], escuro = ord[ord.length - 1];
        const [c1, c2] = p.dir === 'clareia_baixo' ? [escuro, claro] : [claro, escuro];
        return `radial-gradient(ellipse 38% 70% at var(--kx) 38%,${c1} 0 35%,transparent 75%),linear-gradient(180deg,${c1} 0 20%,${c2} 90%)`;
      }
      case 'faixa_diag':
      case 'listras_diag': {
        // sentidoBanda/anguloBanda: direção real da faixa medida na camisa ('/' sobe para a direita, '\\' desce)
        const th = p.anguloBanda || p.angulo || 50, sb = p.sentidoBanda || '/';
        const ang = sb === '/' ? 180 - th : th;
        if (p.tipo === 'listras_diag') {
          const w = larguras(p.runs), v0 = p.runs[0][0], a = w[v0] || 0.15, b = w[1 - v0] || 0.15;
          return `repeating-linear-gradient(${ang.toFixed(1)}deg,${corDe(v0)} 0 ${U(a)},${corDe(1 - v0)} ${U(a)} ${U(a + b)})`;
        }
        const f = (p.runs[1] || [0, 0.2])[1], cb = cr[1] || B, ca = cr[0] || A, m = 50, h = f * 50;
        return `linear-gradient(${ang.toFixed(1)}deg,transparent ${(m - h).toFixed(1)}%,${cb} ${(m - h).toFixed(1)}% ${(m + h).toFixed(1)}%,transparent ${(m + h).toFixed(1)}%) calc(var(--kxl) - var(--cw)) 0 / calc(var(--cw) * 2) 100% no-repeat,${ca}`;
      }
      default: {
        // liso: cor da camisa; se a manga tem outra cor marcante, ela aparece nas laterais como na camisa
        const mg = vivo(p.manga || A);
        const lat = dist(mg, A) > 70 ? `linear-gradient(90deg,${mg} 0 6%,transparent 6% 94%,${mg} 94%),` : '';
        return `${lat}radial-gradient(ellipse 60% 80% at var(--kx) 40%,rgba(255,255,255,.07),transparent 70%),${A}`;
      }
    }
  }

  // Ajustes manuais onde a leitura automática da camisa não pega a identidade do clube (padrão tradicional + detalhe de torcedor).
  const ESTRELA = (cor, x, y, s) => `<svg viewBox="0 0 24 24" style="position:absolute;left:${x};top:${y};width:${s};height:${s}"><path fill="${cor}" d="M12 1.8l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.1l7.1-.7z"/></svg>`;
  const faixaH = (base, cores, ini) => { const h = 4.5, partes = cores.map((c, i) => `${c} ${ini + i * h}% ${ini + (i + 1) * h}%`).join(','); return `linear-gradient(180deg,transparent ${ini}%,${partes},transparent ${ini + cores.length * h}%),${base}`; };
  const MANUAL = {
    'São Paulo': { fundo: faixaH('#F4F4F4', ['#E30613', '#F4F4F4', '#111111'], 30), cores: ['#E30613', '#111111', '#FFFFFF'] },
    'Coritiba': { fundo: faixaH('#F4F4F4', ['#00543C', '#F4F4F4', '#00543C'], 32), cores: ['#00543C', '#FFFFFF'] },
    'CRB': { fundo: 'repeating-linear-gradient(180deg,#D8131B 0 calc(var(--u) * .32),#F4F4F4 calc(var(--u) * .32) calc(var(--u) * .64))', cores: ['#D8131B', '#FFFFFF'] },
    'Athletico-PR': { fundo: 'linear-gradient(118deg,transparent 52%,#111 52% 61%,transparent 61%),#C8102E', cores: ['#C8102E', '#111111'] },
    'RB Bragantino': { fundo: 'linear-gradient(90deg,#D50032 0 5%,transparent 5% 95%,#D50032 95%),#F4F4F4', cores: ['#D50032', '#FFFFFF'] },
    'Barcelona': { fundo: 'linear-gradient(90deg,#A50044 0 50%,#004D98 50% 100%) calc(var(--kxl) - var(--u) * .4) 0 / calc(var(--u) * .8) 100% repeat-x', cores: ['#A50044', '#004D98', '#EDBB00'] },
    'Manchester City': { fundo: 'radial-gradient(ellipse 60% 80% at var(--kx) 40%,rgba(255,255,255,.12),transparent 70%),#6CABDD', cores: ['#6CABDD', '#1C2C5B'] },
    'Tottenham Hotspur': { fundo: 'linear-gradient(90deg,#132257 0 5%,transparent 5% 95%,#132257 95%),#F4F4F4', cores: ['#132257', '#FFFFFF'] },
    'Paris Saint Germain': { fundo: 'linear-gradient(90deg,transparent calc(var(--kxl) - var(--u) * .62),#F4F4F4 calc(var(--kxl) - var(--u) * .62) calc(var(--kxl) - var(--u) * .5),#DA291C calc(var(--kxl) - var(--u) * .5) calc(var(--kxl) + var(--u) * .5),#F4F4F4 calc(var(--kxl) + var(--u) * .5) calc(var(--kxl) + var(--u) * .62),transparent calc(var(--kxl) + var(--u) * .62)),#004170', cores: ['#004170', '#DA291C', '#FFFFFF'] },
    // Cruzeiro: as cinco estrelas do Cruzeiro do Sul do escudo
    'Cruzeiro': { cores: ['#2F529E', '#FFFFFF'], extra: ESTRELA('#FFF', 'calc(var(--kx) + 13vw)', '16%', '34px') + ESTRELA('#FFF', 'calc(var(--kx) + 10vw)', '30%', '30px') + ESTRELA('#FFF', 'calc(var(--kx) + 16vw)', '32%', '28px') + ESTRELA('#FFF', 'calc(var(--kx) + 13.4vw)', '46%', '38px') + ESTRELA('#FFF', 'calc(var(--kx) + 15.4vw)', '40%', '16px') },
    // Botafogo: a Estrela Solitária
    'Botafogo': { extra: ESTRELA('#FFF', 'calc(var(--kx) + 12vw)', '14%', '54px') },
  };

  // Apelidos consagrados (marca d'água). Para os demais clubes, o nome curto do clube.
  const APELIDO = { 'Flamengo': 'Mengão', 'Corinthians': 'Timão', 'Palmeiras': 'Verdão', 'São Paulo': 'Tricolor', 'Santos': 'Peixe', 'Vasco da Gama': 'Gigante da Colina',
    'Botafogo': 'Glorioso', 'Fluminense': 'Tricolor', 'Grêmio': 'Imortal', 'Internacional': 'Colorado', 'Atlético-MG': 'Galo', 'Cruzeiro': 'Raposa', 'Bahia': 'Esquadrão',
    'Vitória': 'Leão da Barra', 'Sport': 'Leão da Ilha', 'Fortaleza': 'Leão do Pici', 'Ceará': 'Vozão', 'Athletico-PR': 'Furacão', 'Coritiba': 'Coxa', 'Goiás': 'Verdão',
    'Juventus': 'Bianconeri', 'Milan': 'Rossoneri', 'Inter de Milão': 'Nerazzurri', 'Roma': 'Giallorossi', 'Lazio': 'Biancocelesti', 'Napoli': 'Partenopei',
    'Real Madrid': 'Los Blancos', 'Barcelona': 'Blaugrana', 'Atlético de Madrid': 'Colchoneros', 'Manchester United': 'Red Devils', 'Liverpool': 'The Reds',
    'Chelsea': 'The Blues', 'Arsenal': 'Gunners', 'Tottenham Hotspur': 'Spurs', 'Manchester City': 'Citizens', 'Bayern München': 'FC Bayern', 'Borussia Dortmund': 'BVB',
    'Paris Saint Germain': 'PSG', 'Boca Juniors': 'Xeneizes', 'River Plate': 'Millonarios', 'Benfica': 'Encarnados', 'Porto': 'Dragões', 'Sporting': 'Leões',
    'Celtic': 'The Bhoys', 'Rangers': 'The Gers', 'Galatasaray': 'Cimbom', 'Fenerbahçe': 'Kanaryalar', 'Beşiktaş': 'Kara Kartallar' };

  function temaClube(p, info, nome) {
    const man = MANUAL[nome] || {};
    p = p || { tipo: 'liso', cores: man.cores || ['#1E2A24'] };
    if (man.cores) p = { ...p, cores: man.cores, corRuns: null };
    info = info || {};
    const todas = [...new Set([...(p.corRuns || []).filter(Boolean), ...(p.cores || [])])].map(vivo);
    const base = (p.tipo === 'liso' || p.tipo === 'faixa_central_v' || p.tipo === 'faixa_h') ? todas[0] : null;
    // cor forte = a mais saturada; sem nenhuma saturada (preto e branco), a mais escura
    const satur = todas.filter((c) => sat(c) > 0.35).sort((x, y) => sat(y) * (1 - Math.abs(lum(y) - 0.3)) - sat(x) * (1 - Math.abs(lum(x) - 0.3)));
    const forte = satur[0] || todas.slice().sort((x, y) => lum(x) - lum(y))[0] || '#1E2A24';
    const outra = todas.find((c) => c !== forte && dist(c, forte) > 80) || (lum(forte) > 0.4 ? '#111111' : '#F2F2F2');
    const txtSobre = (c) => (contraste(c, '#FFFFFF') >= contraste(c, '#0B0B0B') ? '#FFFFFF' : '#0B0B0B');
    const acc = lum(forte) < 0.03 ? outra : forte;
    const fundoClaro = lum(base || todas[0]) > 0.45;
    const nomeOf = info.nomeOficial || info.nome || nome || '';
    const apel = [...new Set([APELIDO[nome], ...(info.apelidos || [])].filter(Boolean))].slice(0, 2);
    const partes = [nomeOf, info.cidade, info.fundacao ? 'Desde ' + info.fundacao : '', info.estadio, ...apel].filter(Boolean);
    return {
      fundo: man.fundo || fundoDoPadrao(p), extra: man.extra || '',
      forte, outra, acc, accTxt: txtSobre(acc),
      apelido: APELIDO[nome] || String(nome || '').replace(/\s*\([^)]*\)/g, ''),
      apCor: fundoClaro ? 'rgba(0,0,0,.14)' : 'rgba(255,255,255,.14)',
      faixa: { fundo: forte, cor: txtSobre(forte), borda: outra, txt: partes.join(' · ') },
      ficha: [info.fundacao, info.cidade, info.estadio].filter(Boolean),
    };
  }
  raiz.temaClube = temaClube;
})(typeof window !== 'undefined' ? window : globalThis);
