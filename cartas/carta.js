'use strict';
/* ULTIMATE PROMESSA — desenho único de carta, verso, pacote e efeito 3D holográfico.
 * Usado pela tela principal, pela abertura e pelo editor, para que todas
 * mostrem exatamente a mesma carta e o mesmo efeito holográfico interativo. */
(function () {
  var TIER = { bronze: 'comum', prata: 'comum', ouro: 'rara', safira: 'epica', diamante: 'lendaria', mitica: 'mitica' };
  var COROAS = { epica: 1, lendaria: 2, mitica: 3 };
  var esc = function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
  var SILH = '<svg class="silh" viewBox="0 0 100 110" aria-hidden="true"><circle cx="50" cy="32" r="20"/><path d="M8 110c2-28 18-44 42-44s40 16 42 44z"/></svg>';

  var PAIS_PT = {
    afeganistao: 'Afeganistão', africa_do_sul: 'África do Sul', albania: 'Albânia', alemanha: 'Alemanha',
    angola: 'Angola', arabia_saudita: 'Arábia Saudita', argelia: 'Argélia', argentina: 'Argentina',
    armenia: 'Armênia', australia: 'Austrália', austria: 'Áustria', belgica: 'Bélgica',
    bielorrussia: 'Bielorrússia', bolivia: 'Bolívia', bosnia_e_herzegovina: 'Bósnia', brasil: 'Brasil',
    bulgaria: 'Bulgária', burkina_faso: 'Burkina Faso', cabo_verde: 'Cabo Verde', camaroes: 'Camarões',
    canada: 'Canadá', catar: 'Catar', chile: 'Chile', china: 'China', colombia: 'Colômbia',
    coreia_sul: 'Coreia do Sul', costa_do_marfim: 'Costa do Marfim', costa_rica: 'Costa Rica',
    croacia: 'Croácia', dinamarca: 'Dinamarca', egito: 'Egito', equador: 'Equador', escocia: 'Escócia',
    eslovaquia: 'Eslováquia', eslovenia: 'Eslovênia', espanha: 'Espanha', estados_unidos: 'EUA',
    finlandia: 'Finlândia', franca: 'França', gabao: 'Gabão', gana: 'Gana', georgia: 'Geórgia',
    grecia: 'Grécia', guine: 'Guiné', guine_bissau: 'Guiné-Bissau', haiti: 'Haiti', holanda: 'Holanda',
    honduras: 'Honduras', hungria: 'Hungria', inglaterra: 'Inglaterra', ira: 'Irã', iraque: 'Iraque',
    irlanda: 'Irlanda', irlanda_do_norte: 'Irlanda do Norte', islandia: 'Islândia', israel: 'Israel',
    italia: 'Itália', jamaica: 'Jamaica', japao: 'Japão', kosovo: 'Kosovo', mali: 'Mali',
    marrocos: 'Marrocos', mexico: 'México', mocambique: 'Moçambique', montenegro: 'Montenegro',
    nigeria: 'Nigéria', noruega: 'Noruega', nova_zelandia: 'Nova Zelândia', pais_de_gales: 'País de Gales',
    panama: 'Panamá', paraguai: 'Paraguai', peru: 'Peru', polonia: 'Polônia', portugal: 'Portugal',
    rd_congo: 'RD Congo', republica_dominicana: 'Rep. Dominicana', romenia: 'Romênia', russia: 'Rússia',
    senegal: 'Senegal', servia: 'Sérvia', suecia: 'Suécia', suica: 'Suíça', suriname: 'Suriname',
    tailandia: 'Tailândia', tchequia: 'Tchéquia', togo: 'Togo', tunisia: 'Tunísia', turquia: 'Turquia',
    ucrania: 'Ucrânia', uruguai: 'Uruguai', uzbequistao: 'Uzbequistão', venezuela: 'Venezuela', zambia: 'Zâmbia'
  };

  var NAC_EN_FLAG = {
    Brazil: 'brasil', Spain: 'espanha', England: 'inglaterra', Argentina: 'argentina', France: 'franca',
    Germany: 'alemanha', Italy: 'italia', Portugal: 'portugal', Netherlands: 'holanda', Belgium: 'belgica',
    Uruguay: 'uruguai', Colombia: 'colombia', Croatia: 'croacia', Morocco: 'marrocos', Senegal: 'senegal',
    Japan: 'japao', 'United States': 'estados_unidos', Mexico: 'mexico', Denmark: 'dinamarca',
    Sweden: 'suecia', Norway: 'noruega', Switzerland: 'suica', Austria: 'austria', Poland: 'polonia',
    Serbia: 'servia', Ukraine: 'ucrania', Russia: 'russia', Scotland: 'escocia', Wales: 'pais_de_gales',
    Ireland: 'irlanda', Chile: 'chile', Paraguay: 'paraguai', Peru: 'peru', Ecuador: 'equador',
    Bolivia: 'bolivia', Venezuela: 'venezuela', Egypt: 'egito', Algeria: 'argelia', Nigeria: 'nigeria',
    Ghana: 'gana', Cameroon: 'camaroes', "Cote d'Ivoire": 'costa_do_marfim', 'Saudi Arabia': 'arabia_saudita',
    Qatar: 'catar', China: 'china', Australia: 'australia', 'Korea, South': 'coreia_sul', Greece: 'grecia',
    Hungary: 'hungria', Bulgaria: 'bulgaria', Romania: 'romenia', Slovakia: 'eslovaquia', Slovenia: 'eslovenia',
    'Czech Republic': 'tchequia', 'Türkiye': 'turquia', Turkey: 'turquia',
    Alemanha: 'alemanha', 'Arábia Saudita': 'arabia_saudita', 'Austrália': 'australia', 'Áustria': 'austria',
    'Bélgica': 'belgica', 'Bolívia': 'bolivia', Brasil: 'brasil', 'Bulgária': 'bulgaria', Catar: 'catar',
    'Colômbia': 'colombia', 'Croácia': 'croacia', Dinamarca: 'dinamarca', Egito: 'egito', Equador: 'equador',
    'Escócia': 'escocia', Espanha: 'espanha', 'Estados Unidos': 'estados_unidos', EUA: 'estados_unidos', 'França': 'franca',
    'Grécia': 'grecia', Holanda: 'holanda', Hungria: 'hungria', Inglaterra: 'inglaterra', 'Itália': 'italia',
    'Japão': 'japao', Marrocos: 'marrocos', 'México': 'mexico', Noruega: 'noruega', Paraguai: 'paraguai',
    'Polônia': 'polonia', 'Rússia': 'russia', 'Sérvia': 'servia', 'Suécia': 'suecia', 'Suíça': 'suica',
    'Tailândia': 'tailandia', 'Tchéquia': 'tchequia', Turquia: 'turquia', 'Ucrânia': 'ucrania', Uruguai: 'uruguai'
  };

  var CLUBE_ESCUDO = {
    'Al-Ahli': 'al_ahli_ara', 'Al-Ettifaq': 'ettifaq_ara', 'Al-Fateh Club': 'al_fateh_ara',
    'Al-Fayha': 'al_fayha_ara', 'Al-Hazem Sport Club': 'al_hazem_ara', 'Al-Hilal': 'al_hilal',
    'Al-Ittihad': 'alittihad_ara', 'Al-Khaleej Club (Saihat)': 'al_khaleej_ara',
    'Al-Kholood Club': 'alkholood_ara', 'Al-Najma Sport Club': 'alnajma', 'Al-Nassr': 'alnassr_ara',
    'Al-Okhdood Club': 'alokhdood_ara', 'Al-Qadsiah': 'al_qadisiya_ara',
    'Al-Riyadh Saudi Club': 'alriyadh_ara', 'Al-Shabab Club': 'al_shabab_ara',
    'Al-Taawoun': 'al_taawon_ara', 'Damac': 'damacfc_ara', 'Neom Sports Club': 'neom_ara'
  };

  var POS_NOME = {
    GOL: 'Goleiro', ZAG: 'Zagueiro', LD: 'Lateral Direito', LE: 'Lateral Esquerdo', LAT: 'Lateral',
    VOL: 'Volante', MC: 'Meio-Campista', MEI: 'Meia Atacante', MD: 'Meia Direita', ME: 'Meia Esquerda',
    PD: 'Ponta Direita', PE: 'Ponta Esquerda', SA: 'Segundo Atacante', ATA: 'Centroavante'
  };

  var STAT_NOME = {
    RIT: 'Ritmo', FIN: 'Finalização', PAS: 'Passe', DRI: 'Drible', DEF: 'Defesa', FIS: 'Físico',
    MER: 'Mergulho', MAN: 'Manejo', CHU: 'Chute', REF: 'Reflexo', VEL: 'Velocidade', POS: 'Posicionamento'
  };

  function hashStr(s) {
    var h = 2166136261;
    s = String(s || 'jogador');
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function garanteMiniOveralls(c) {
    var ea = c.ea || {};
    var pos = String(c.pos || c.pos5 || 'MEI').toUpperCase();
    var ovr = Number(c.ovr) || 70;
    var seed = hashStr(c.id || c.nome || '');
    var jit = function (i, sp) { return ((seed >>> (i * 4)) % (sp * 2 + 1)) - sp; };
    var clp = function (x) { return Math.max(35, Math.min(99, Math.round(x))); };

    if (pos === 'GOL') {
      var Lgk = ['MER', 'MAN', 'CHU', 'REF', 'VEL', 'POS'];
      var sgk = [ea.mer, ea.man, ea.chu, ea.ref, ea.vel, ea.pos];
      if (sgk.every(function (x) { return x != null; })) return { L: Lgk, st: sgk };
      if (ea.rit != null && ea.fin != null && ea.pas != null && ea.dri != null && ea.def != null && ea.fis != null) {
        return { L: Lgk, st: [ea.rit, ea.fin, ea.pas, ea.dri, ea.def, ea.fis] };
      }
      return {
        L: Lgk,
        st: [
          clp(ovr + 1 + jit(0, 3)),
          clp(ovr - 1 + jit(1, 3)),
          clp(ovr - 6 + jit(2, 4)),
          clp(ovr + 2 + jit(3, 3)),
          clp(ovr - 18 + jit(4, 5)),
          clp(ovr + 0 + jit(5, 3))
        ]
      };
    }

    var L = ['RIT', 'FIN', 'PAS', 'DRI', 'DEF', 'FIS'];
    var st = [ea.rit, ea.fin, ea.pas, ea.dri, ea.def, ea.fis];
    if (st.every(function (x) { return x != null; })) return { L: L, st: st };

    var profs = {
      ATA: [3, 2, -6, 1, -32, -2],
      PD: [6, 0, -3, 4, -28, -5],
      PE: [6, 0, -3, 4, -28, -5],
      SA: [3, 1, -1, 3, -24, -4],
      MEI: [1, -4, 2, 3, -16, -5],
      MC: [-1, -6, 2, 1, -6, -2],
      VOL: [-4, -12, -1, -3, 1, 2],
      LD: [5, -14, -2, 0, -2, -2],
      LE: [5, -14, -2, 0, -2, -2],
      LAT: [5, -14, -2, 0, -2, -2],
      ZAG: [-8, -24, -10, -12, 2, 3]
    };
    var pf = profs[pos] || [0, -5, 0, 0, -10, -2];
    return {
      L: L,
      st: pf.map(function (off, idx) {
        return st[idx] != null ? st[idx] : clp(ovr + off + jit(idx, 3));
      })
    };
  }

  function seta(d) {
    d = Number(d) || 0;
    if (!d) return '';
    var up = d > 0;
    return '<span class="upc-delta ' + (up ? 'up' : 'dn') + '" title="' + (up ? 'Subiu ' : 'Caiu ') + Math.abs(d) + ' de overall">'
      + '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="' + (up ? 'M6 1l5 7H7.5v3h-3V8H1z' : 'M6 11L1 4h3.5V1h3v3H11z') + '"/></svg>'
      + Math.abs(d) + '</span>';
  }

  function bandeiraSlug(c) {
    if (!c) return '';
    return c.bandeira || NAC_EN_FLAG[c.nac] || NAC_EN_FLAG[c.nac_pt] || NAC_EN_FLAG[c.pais] || '';
  }

  function escudoSlug(c) {
    if (!c) return '';
    return c.escudo || CLUBE_ESCUDO[c.clube] || (c.id && String(c.id).indexOf('|') > 0 ? String(c.id).split('|')[0] : '');
  }

  function paisPt(band, nac, pais) {
    var b = band || NAC_EN_FLAG[nac] || NAC_EN_FLAG[pais] || '';
    if (b && PAIS_PT[b]) return PAIS_PT[b];
    var fl = NAC_EN_FLAG[nac] || NAC_EN_FLAG[pais];
    if (fl && PAIS_PT[fl]) return PAIS_PT[fl];
    return nac || pais || '';
  }

  function clubePt(clube, id) {
    if (clube && String(clube).trim()) return String(clube).trim();
    if (id && String(id).indexOf('|') > 0) {
      var slug = String(id).split('|')[0].replace(/_[a-z]{2,3}$/i, '').replace(/_/g, ' ').trim();
      if (slug) return slug.replace(/\b\w/g, function (m) { return m.toUpperCase(); });
    }
    return '';
  }

  function posNome(pos) {
    var p = String(pos || '').toUpperCase().trim();
    return POS_NOME[p] || p || '—';
  }

  function peNome(pe) {
    var p = String(pe || '').toUpperCase().trim();
    if (p === 'E' || p === 'ESQUERDO' || p === 'LEFT' || p === 'CANHOTO') return 'Esquerdo (Canhoto)';
    if (p === 'D' || p === 'DIREITO' || p === 'RIGHT' || p === 'DESTRO') return 'Direito (Destro)';
    if (p === 'A' || p === 'AMBIDESTRO' || p === 'BOTH') return 'Ambidestro';
    return pe || '—';
  }

  function statNome(sigla) {
    return STAT_NOME[String(sigla || '').toUpperCase()] || sigla;
  }

  /* c: carta do catálogo; v: {rotulo,cor,cor2}; o: {base:'../', logo, rodape} */
  // cadeado ao lado da posição: carta ainda presa para venda e troca (destravada_em no futuro)
  function cadeado(c) {
    if (!c || !c.destravada_em) return '';
    var t = new Date(c.destravada_em);
    if (!(t > new Date())) return '';
    var quando = t.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    return '<svg class="upc-cad" viewBox="0 0 16 16" role="img" aria-label="Bloqueada para venda e troca até ' + esc(quando) + '"><title>Bloqueada para venda e troca até ' + esc(quando) + '</title>'
      + '<path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
      + '<rect x="3" y="7" width="10" height="7.5" rx="1.6" fill="currentColor"/></svg>';
  }
  function frente(c, v, o) {
    o = o || {}; v = v || {};
    var b = o.base || '../', t = TIER[c.raridade] || 'comum', n = COROAS[t] || 0;
    var mini = garanteMiniOveralls(c), st = mini.st, L = mini.L;

    var band = bandeiraSlug(c);
    var escSlug = escudoSlug(c);
    var nacNome = paisPt(band, c.nac_pt || c.nac, c.pais);
    var clubeNome = clubePt(c.clube, c.id);
    var subPartes = [];
    if (clubeNome) subPartes.push(clubeNome);
    if (nacNome) subPartes.push(nacNome);
    if (c.edicao === 'natal') subPartes.push('Natal');
    else if (c.edicao === 'raizes') subPartes.push('Raízes');
    else if (c.promessa) subPartes.push('Promessa');
    var subTxt = subPartes.length ? subPartes.join(' · ') : (v.rotulo || '');

    return '<div class="upc" data-tier="' + t + '"' + (c.edicao ? ' data-edicao="' + esc(c.edicao) + '"' : '')
      + ' style="--rc:' + esc(v.cor) + ';--rc2:' + esc(v.cor2) + ';--arte:url(' + b + 'assets/cartas/verso_' + t + '.png)">'
      + '<div class="upc-in"><div class="upc-miolo"></div>'
      + '<div class="upc-holo" aria-hidden="true"></div>'
      + '<div class="upc-glare" aria-hidden="true"></div>'
      + (n ? '<img class="upc-coroa" src="' + b + 'assets/cartas/coroa_' + t + '.png" alt="">' : '')
      + '<div class="upc-lado"><b class="upc-ovr">' + esc(c.ovr) + '</b><span class="upc-pos">' + esc(c.pos || '') + '</span>'
      + (band ? '<img class="upc-band" src="' + b + 'flags/' + esc(band) + '.png" alt="' + esc(nacNome) + '" title="' + esc(nacNome) + '">' : '')
      + (escSlug ? '<img class="upc-esc" src="' + b + 'assets/escudos/' + esc(escSlug) + '.png" alt="' + esc(clubeNome) + '" title="' + esc(clubeNome) + '">' : '')
      + '</div>'
      + seta(c.delta)
      + '<div class="upc-foto">' + (c.foto ? '<img src="' + b + esc(c.foto) + '" alt="">' : SILH) + '</div>'
      + '<div class="upc-nome"><b>' + esc(c.nome) + '</b>'
      + '<span title="' + esc(subTxt) + '">' + esc(subTxt) + '</span></div>'
      + '<div class="upc-st">' + st.map(function (x, k) { return '<div><b>' + (x == null ? '-' : esc(x)) + '</b><i>' + L[k] + '</i></div>'; }).join('') + '</div>'
      + (o.rodape ? '<div class="upc-rod">' + o.rodape + '</div>' : '')
      + '</div></div>';
  }

  function verso(raridade, v, o) {
    o = o || {};
    var t = TIER[raridade] || 'comum';
    return '<div class="upc upc-verso" data-tier="' + t + '" style="--rc:' + esc(v.cor) + ';--rc2:' + esc(v.cor2) + ';--arte:url(' + (o.base || '../') + 'assets/cartas/verso_' + t + '.png)">'
      + '<div class="upc-in" role="img" aria-label="' + esc(o.nome || 'ULTIMATE PROMESSA') + '">'
      + '<div class="upc-holo" aria-hidden="true"></div><div class="upc-glare" aria-hidden="true"></div>'
      + '</div></div>';
  }

  function pacote(p) {
    var b = p.base || '../', src = p.imagem || ('assets/cartas/pacote_' + (p.arte || 'comum') + '.png');
    if (src.indexOf('?') === -1) src += '?v=20261022c';
    return '<div class="envelope foil ' + (p.cls || '') + '" style="--c:' + esc(p.cor || '#C9D2D6') + '">'
      + '<img class="arte" src="' + b + esc(src) + '" alt="">'
      + '<span class="em"><small>' + esc(p.cartas) + ' CARTAS</small><b>' + esc(String(p.nome || '').replace(/^Pacote\s+/i, '')) + '</b></span></div>';
  }

  function grupos(ordemDesc, rv) {
    var out = [], idx = {};
    ordemDesc.forEach(function (r) {
      var v = rv(r);
      if (idx[v.rotulo] == null) { idx[v.rotulo] = out.length; out.push({ rotulo: v.rotulo, cor: v.cor, ids: [] }); }
      out[idx[v.rotulo]].ids.push(r);
    });
    return out;
  }

  /* ---------------- Efeito 3D Tilt & Holográfico Interativo ---------------- */
  var ativoEl = null;
  var pDownX = 0, pDownY = 0, arrastou = false, ultimoArrasto = 0;

  function limpaTilt(el) {
    if (!el) return;
    el.classList.remove('upc-ativo');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--tx', '0px');
    el.style.setProperty('--ty', '0px');
    el.style.setProperty('--px', '50%');
    el.style.setProperty('--py', '50%');
    el.style.setProperty('--hyp', '0');
  }

  function aplicaTilt(el, clientX, clientY) {
    var rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var x = clientX - rect.left;
    var y = clientY - rect.top;
    var nx = Math.max(0, Math.min(1, x / rect.width));
    var ny = Math.max(0, Math.min(1, y / rect.height));
    var rx = (0.5 - ny) * 26;
    var ry = (nx - 0.5) * 28;
    var tx = (nx - 0.5) * 9;
    var ty = (ny - 0.5) * 9;
    var hyp = Math.min(1, Math.hypot(nx - 0.5, ny - 0.5) * 1.9);

    el.classList.add('upc-ativo');
    el.style.setProperty('--px', (nx * 100).toFixed(1) + '%');
    el.style.setProperty('--py', (ny * 100).toFixed(1) + '%');
    el.style.setProperty('--rx', rx.toFixed(2) + 'deg');
    el.style.setProperty('--ry', ry.toFixed(2) + 'deg');
    el.style.setProperty('--tx', tx.toFixed(2) + 'px');
    el.style.setProperty('--ty', ty.toFixed(2) + 'px');
    el.style.setProperty('--hyp', hyp.toFixed(2));
  }

  function achaCartaAlvo(ev) {
    var t = ev.target;
    if (!t || !t.closest) return null;
    var upc = t.closest('.upc');
    if (upc && !upc.closest('.f-v')) return upc;
    var cena = t.closest('#cena');
    if (cena) {
      var rev = cena.querySelector('.slot.vira .f-f .upc');
      if (rev) return rev;
    }
    var palco = t.closest('.det-palco');
    if (palco) {
      return palco.querySelector('.upc');
    }
    return null;
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', function (ev) {
      pDownX = ev.clientX;
      pDownY = ev.clientY;
      arrastou = false;
      var el = achaCartaAlvo(ev);
      if (el) {
        ativoEl = el;
        aplicaTilt(el, ev.clientX, ev.clientY);
      }
    }, { passive: true });

    document.addEventListener('pointermove', function (ev) {
      if (ev.buttons > 0 || ev.pointerType === 'touch') {
        if (Math.hypot(ev.clientX - pDownX, ev.clientY - pDownY) > 10) {
          arrastou = true;
          ultimoArrasto = Date.now();
        }
      }
      var el = achaCartaAlvo(ev);
      if (el) {
        if (ativoEl && ativoEl !== el) limpaTilt(ativoEl);
        ativoEl = el;
        aplicaTilt(el, ev.clientX, ev.clientY);
      } else if (ativoEl) {
        limpaTilt(ativoEl);
        ativoEl = null;
      }
    }, { passive: true });

    document.addEventListener('pointerup', function (ev) {
      if (ev.pointerType === 'touch' && ativoEl) {
        setTimeout(function () {
          if (ativoEl) { limpaTilt(ativoEl); ativoEl = null; }
        }, 280);
      }
    }, { passive: true });

    document.addEventListener('pointercancel', function () {
      if (ativoEl) { limpaTilt(ativoEl); ativoEl = null; }
    }, { passive: true });

    document.addEventListener('mouseout', function (ev) {
      if (!ev.relatedTarget && ativoEl) {
        limpaTilt(ativoEl);
        ativoEl = null;
      }
    }, { passive: true });
  }

  window.UPCarta = {
    frente: frente,
    verso: verso,
    pacote: pacote,
    grupos: grupos,
    paisPt: paisPt,
    clubePt: clubePt,
    bandeiraSlug: bandeiraSlug,
    escudoSlug: escudoSlug,
    posNome: posNome,
    peNome: peNome,
    statNome: statNome,
    garanteMiniOveralls: garanteMiniOveralls,
    foiArrasto: function () { return arrastou || (Date.now() - ultimoArrasto < 260); },
    silh: SILH,
    tier: function (r) { return TIER[r] || 'comum'; }
  };
})();
