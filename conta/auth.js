function concedePremiosBoasVindas(uid) {
  // Presente de boas-vindas e saldo sao emitidos SO no servidor (meus_presentes / meu_saldo).
  // Antes isto criava pacotes e 1000 moedas no localStorage, que a tela mostrava como reais.
  if (!uid) return;
}

'use strict';
/* PROMESSA · autenticação da conta (serve o jogo todo: carreira, J×J e cartas).
 * Login por nick OU e-mail, cadastro, Google OAuth, e modo convidado.
 * A conta é o que permite SALVAR carreira (na nuvem) e ter cartas/moeda.
 * Convidado joga, mas não salva. */

const CFG = window.PROMESSA_CARTAS;
const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
window.PROMESSA_SB = sb; // outras telas reaproveitam o mesmo cliente

const $ = (id) => document.getElementById(id);
const msg = (txt, tipo) => { const m = $('msg'); m.textContent = txt || ''; m.className = 'msg' + (tipo ? ' ' + tipo : ''); };
const carregando = (bt, on, txtOrig) => {
  if (on) { bt.dataset.txt = bt.innerHTML; bt.innerHTML = '<span class="spin"></span>'; bt.disabled = true; }
  else { bt.innerHTML = txtOrig || bt.dataset.txt || bt.innerHTML; bt.disabled = false; }
};

/* para onde ir depois de entrar: ?next=... ou o menu do jogo */
let DESTINO = new URLSearchParams(location.search).get('next') || '/index.html';
if (DESTINO && !DESTINO.startsWith('/') && !/^https?:/.test(DESTINO)) DESTINO = '/' + DESTINO; // força absoluto
function entrou() { location.href = DESTINO; }

/* se já há sessão válida, pula o login */
(async () => {
  const { data } = await sb.auth.getSession();
  if (data.session) entrou();
})();

/* ---------------- alternar entre Entrar e Criar conta ---------------- */
let modo = 'login';
function troca(novo) {
  modo = novo;
  const ehLogin = modo === 'login';
  $('formLogin').classList.toggle('hide', !ehLogin);
  $('formCad').classList.toggle('hide', ehLogin);
  $('tagModo').textContent = ehLogin ? 'ENTRAR' : 'CRIAR CONTA';
  $('troca').innerHTML = ehLogin
    ? 'Não tem conta? <a id="linkTroca">Criar agora</a>'
    : 'Já tem conta? <a id="linkTroca">Entrar</a>';
  $('linkTroca').onclick = () => troca(ehLogin ? 'cad' : 'login');
  msg('');
}
$('linkTroca').onclick = () => troca('cad');

/* mensagens de erro do Supabase traduzidas para o que o usuário entende */
function traduzErro(e) {
  const m = (e && e.message || '').toLowerCase();
  if (m.includes('invalid login')) return 'Nick/e-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).';
  if (m.includes('user already registered') || m.includes('already been registered')) return 'Esse e-mail já tem conta. Tente entrar.';
  if (m.includes('password should be at least')) return 'A senha precisa de ao menos 6 caracteres.';
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'E-mail inválido.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Espere um pouco e tente de novo.';
  if (m.includes('sending confirmation email') || (e && e.error_code === 'unexpected_failure')) return 'O envio de e-mails do Supabase falhou (Confirm email ativo sem SMTP). Entre com Google ou Convidado enquanto o admin desmarca "Confirm email" no painel Supabase (Auth > Providers > Email).';
  if (m.includes('network')) return 'Sem conexão. Verifique sua internet.';
  return e && e.message ? e.message : 'Algo deu errado. Tente novamente.';
}

/* ---------------- ENTRAR (nick ou e-mail) ---------------- */
$('formLogin').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const ident = $('loginId').value.trim();
  const senha = $('loginSenha').value;
  if (!ident || !senha) return;
  const bt = $('btLogin'); carregando(bt, true); msg('');
  try {
    // 1. Verifica conta local salva
    const rawLocal = localStorage.getItem('promessa_conta_local');
    if (rawLocal) {
      try {
        const cl = JSON.parse(rawLocal);
        if ((cl.email.toLowerCase() === ident.toLowerCase() || cl.nick.toLowerCase() === ident.toLowerCase()) && cl.senha === senha) {
          localStorage.setItem('promessa_apelido', cl.nick);
          localStorage.removeItem('promessa_convidado');
          localStorage.removeItem('promessa_modo_convidado');
          entrou();
          return;
        }
      } catch (e) { console.warn('[auth]', e); }
    }

    // 2. Login via Supabase
    if (!ident.includes('@')) { msg('Entre com o e-mail da sua conta.', 'erro'); carregando(bt, false, 'ENTRAR'); return; }
    const email = ident;
    const { error } = await sb.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
    entrou();
  } catch (e) {
    msg(traduzErro(e), 'erro'); carregando(bt, false, 'ENTRAR');
  }
});

/* ---------------- CRIAR CONTA ---------------- */
$('formCad').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const nick = $('cadNick').value.trim();
  const email = $('cadEmail').value.trim();
  const senha = $('cadSenha').value;
  if (nick.length < 3) { msg('O nick precisa de ao menos 3 caracteres.', 'erro'); return; }
  // mesmo critério da troca de senha; o mínimo real fica no Supabase (Auth > Email)
  if (senha.length < 8 || !/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) { msg('A senha precisa de ao menos 8 caracteres, com letras e números.', 'erro'); return; }
  const bt = $('btCad'); carregando(bt, true); msg('');
  try {
    let entrouDireto = false;
    try {
      const { data, error } = await sb.auth.signUp({
        email, password: senha,
        options: { data: { apelido_desejado: nick } },
      });
      if (error) throw error;
      if (data && data.session) {
        entrouDireto = true;
        try { await sb.from('profiles').update({ apelido: nick }).eq('id', data.user.id); } catch (e) { console.warn('[auth]', e); }
        concedePremiosBoasVindas(data.user.id);
      }
    } catch (sbErr) {
      const msgErr = (sbErr && sbErr.message || '').toLowerCase();
      const codeErr = sbErr && sbErr.error_code;
      // Se o Supabase falhar no envio do email de confirmacao (Confirm email ativo sem SMTP)
      if (msgErr.includes('sending confirmation email') || codeErr === 'unexpected_failure') {
        console.warn('[auth] Ativando conta local garantida:', sbErr);
        const localUid = 'usr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const contaLocal = {
          id: localUid,
          email: email,
          nick: nick,
          senha: senha,
          criado_em: new Date().toISOString()
        };
        localStorage.setItem('promessa_conta_local', JSON.stringify(contaLocal));
        localStorage.setItem('promessa_apelido', nick);
        localStorage.setItem('promessa_apelido_' + localUid, nick);
        localStorage.removeItem('promessa_convidado');
        localStorage.removeItem('promessa_modo_convidado');
        concedePremiosBoasVindas(localUid);
        msg('Conta criada com sucesso! Entrando no jogo...', 'ok');
        setTimeout(() => { entrou(); }, 500);
        return;
      }
      throw sbErr;
    }

    if (entrouDireto) {
      entrou();
    } else {
      // Tenta login direto caso a confirmacao nao seja obrigatoria
      try {
        const { data: logData, error: logErr } = await sb.auth.signInWithPassword({ email, password: senha });
        if (!logErr && logData && logData.session) {
          concedePremiosBoasVindas(logData.user.id);
          entrou();
          return;
        }
      } catch (e) { console.warn('[auth]', e); }
      msg('Conta criada com sucesso! Entrando...', 'ok');
      setTimeout(() => { entrou(); }, 500);
    }
  } catch (e) {
    if ((e.message || '').includes('profiles_apelido_key') || (e.code === '23505')) {
      msg('Esse nick já está em uso. Escolha outro.', 'erro');
    } else {
      msg(traduzErro(e), 'erro');
    }
    carregando(bt, false, 'CRIAR CONTA');
  }
});

/* ---------------- GOOGLE ----------------
 * Com GOOGLE_CLIENT_ID no config.js: login pelo script oficial do Google (Google Identity Services),
 * direto no site — o Google mostra promessafc.vercel.app, não o domínio do Supabase. O token (JWT) vai
 * para o Supabase com signInWithIdToken, que confere assinatura, emissor, audiência (client ID) e o nonce.
 * Nonce: o Google recebe o hash SHA-256; o Supabase recebe o valor puro e confere — token roubado não serve de novo.
 * Sem client ID (ou se o script do Google não carregar) cai no fluxo antigo por redirecionamento. */
const GOOGLE_ID = CFG.GOOGLE_CLIENT_ID || '';
async function sha256hex(t) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
function googleRedirect() {
  return sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.origin + location.pathname.replace('login.html', '') + 'login.html?next=' + encodeURIComponent(DESTINO) },
  });
}
async function iniciaGoogleNoSite() {
  if (!GOOGLE_ID) return false;
  await new Promise((ok, falha) => {
    if (window.google && window.google.accounts && window.google.accounts.id) return ok();
    const sc = document.createElement('script');
    sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true;
    sc.onload = ok; sc.onerror = () => falha(new Error('script do Google não carregou'));
    document.head.appendChild(sc);
  });
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = [...bytes].map((x) => x.toString(16).padStart(2, '0')).join('');
  const nonceHash = await sha256hex(nonce);
  google.accounts.id.initialize({
    client_id: GOOGLE_ID,
    nonce: nonceHash,
    ux_mode: 'popup',
    use_fedcm_for_prompt: true,
    callback: async (resp) => {
      msg('');
      try {
        if (!resp || !resp.credential) throw new Error('O Google não devolveu o login.');
        const { error } = await sb.auth.signInWithIdToken({ provider: 'google', token: resp.credential, nonce });
        if (error) throw error;
        // pós-login igual ao antigo: grava nick pendente e tira o modo convidado, depois vai para o jogo
        const { data: ses } = await sb.auth.getSession();
        const pend = localStorage.getItem('promessa_nick_pendente');
        if (pend && ses && ses.session) {
          try { await sb.from('profiles').update({ apelido: pend }).eq('id', ses.session.user.id); } catch (e2) { console.warn('[login google] nick:', e2); }
          localStorage.removeItem('promessa_nick_pendente');
        }
        localStorage.removeItem('promessa_convidado');
        entrou();
      } catch (e) {
        console.error('[login google]', e);
        msg(traduzErro(e), 'erro');
      }
    },
  });
  // botão oficial do Google no lugar do nosso (exigência de marca do Google); mesmo tamanho
  const bt = $('btGoogle'), largura = bt.offsetWidth, alvo = document.createElement('div');
  alvo.id = 'gBtn'; alvo.style.cssText = 'display:flex;justify-content:center;min-height:44px';
  bt.replaceWith(alvo);
  google.accounts.id.renderButton(alvo, {
    type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular',
    logo_alignment: 'center', locale: 'pt-BR', width: Math.max(200, Math.min(400, ($('btConvidado') && $('btConvidado').offsetWidth) || largura || 320)),
  });
  return true;
}
$('btGoogle').addEventListener('click', async () => {
  msg('');
  const { error } = await googleRedirect();
  if (error) msg(traduzErro(error), 'erro');
});
iniciaGoogleNoSite().catch((e) => console.warn('[login google] usando o fluxo antigo:', e));

/* ---------------- CONVIDADO ---------------- */
$('btConvidado').addEventListener('click', () => {
  // marca a sessão como convidada: joga, mas não salva carreira nem tem cartas
  localStorage.setItem('promessa_convidado', '1');
  localStorage.removeItem('promessa_nick_pendente');
  entrou();
});

/* ---------------- ESQUECI A SENHA ---------------- */
$('linkEsqueci').addEventListener('click', async () => {
  const ident = $('loginId').value.trim();
  if (!ident.includes('@')) { msg('Digite seu e-mail no campo acima para recuperar a senha.', 'erro'); return; }
  const { error } = await sb.auth.resetPasswordForEmail(ident, {
    redirectTo: location.origin + location.pathname.replace('login.html', '') + 'nova-senha.html',
  });
  msg(error ? traduzErro(error) : 'Enviamos um link de recuperação para seu e-mail.', error ? 'erro' : 'ok');
});

/* ---------------- ao voltar do Google: aplica o nick pendente, se houver ---------------- */
sb.auth.onAuthStateChange(async (evt, session) => {
  if (evt === 'SIGNED_IN' && session) {
    const pend = localStorage.getItem('promessa_nick_pendente');
    if (pend) {
      try { await sb.from('profiles').update({ apelido: pend }).eq('id', session.user.id); } catch (e) { console.warn('[auth]', e); }
      localStorage.removeItem('promessa_nick_pendente');
    }
    localStorage.removeItem('promessa_convidado');
  }
});

// Aviso de motivo de redirecionamento (ex: Ultimate requer conta)
try {
  const motivo = new URLSearchParams(location.search).get('motivo');
  if (motivo === 'ultimate_requer_conta') {
    const av = $('avisoMotivo');
    if (av) {
      av.textContent = '✦ O Modo Ultimate é exclusivo para jogadores com conta cadastrada. Entre com seu e-mail ou crie sua conta grátis para colecionar e negociar.';
      av.classList.remove('hide');
    }
  }
} catch (e) { console.warn('[auth]', e); }


/* ---------------- Login via QR Code (Cross-Device) ---------------- */
/* ==================== LOGIN POR CODIGO (gerado no PC, validado no celular) ====================
 * Seguranca:
 *  - Codigo de 8 caracteres (alfabeto sem ambiguos, 32^8 ~ 1 trilhao de combinacoes), expira em 3 min.
 *  - O canal Realtime usa SHA-256 do codigo (o codigo nunca trafega).
 *  - A sessao e cifrada ponta a ponta: ECDH P-256 + AES-GCM. Quem escutar o canal so ve dados cifrados.
 *  - So o celular JA LOGADO pode autorizar, e o usuario confirma la. */
const ALFA_COD = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
let qrCurrentChannel = null, qrTimerInterval = null, qrPubInterval = null;

function gerarCodigo() {
  const r = crypto.getRandomValues(new Uint8Array(8));
  let c = ''; for (const b of r) c += ALFA_COD[b % 32];
  return c.slice(0, 4) + '-' + c.slice(4);
}
async function hashCanal(cod) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('promessa:' + cod.replace(/[^A-Z0-9]/g, '')));
  return 'lgc_' + Array.from(new Uint8Array(d)).slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
}

function limparCanalCodigo() {
  if (qrTimerInterval) clearInterval(qrTimerInterval);
  if (qrPubInterval) clearInterval(qrPubInterval);
  if (qrCurrentChannel) { try { sb.removeChannel(qrCurrentChannel); } catch (e) { console.warn('[auth]', e); } qrCurrentChannel = null; }
}

async function iniciarLoginQR() {
  ['formLogin', 'formCad', 'divisor', 'btGoogle', 'btConvidado', 'btAbrirQR', 'troca'].forEach(id => $(id) && $(id).classList.add('hide'));
  $('tagModo').textContent = 'CÓDIGO';
  $('boxQR').classList.remove('hide');
  limparCanalCodigo();

  const codigo = gerarCodigo();
  $('qrCodigoTxt').textContent = codigo;
  $('qrCodeContainer').innerHTML = '<div style="font-size:12.5px;color:var(--dim);line-height:1.5;padding:4px 8px">No <b style="color:var(--branco)">celular já logado</b>, abra<br><b style="color:var(--verde);font-family:var(--f-mono);font-size:14px">promessafc.vercel.app/conectar.html</b><br>e digite o código abaixo.</div>';
  $('qrCodeContainer').style.height = 'auto';
  $('qrCodeContainer').style.width = '100%';

  // Par de chaves efemero do PC
  const par = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
  const pubJwk = await crypto.subtle.exportKey('jwk', par.publicKey);

  const channel = sb.channel(await hashCanal(codigo));
  qrCurrentChannel = channel;
  let concluido = false;

  channel
    .on('broadcast', { event: 'autorizado' }, async ({ payload }) => {
      if (concluido || !payload || !payload.pub || !payload.ct) return;
      try {
        const pubCel = await crypto.subtle.importKey('jwk', payload.pub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
        const chave = await crypto.subtle.deriveKey({ name: 'ECDH', public: pubCel }, par.privateKey, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
        const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
        const ct = Uint8Array.from(atob(payload.ct), c => c.charCodeAt(0));
        const dados = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, chave, ct)));
        concluido = true;
        try { channel.send({ type: 'broadcast', event: 'ack', payload: { ok: true } }); } catch (e) { console.warn('[auth]', e); }
        limparCanalCodigo();
        $('boxQR').innerHTML = '<div style="padding:28px 10px;text-align:center"><div class="spin" style="width:30px;height:30px;border-width:3px;margin:0 auto 14px auto"></div><b style="color:var(--verde);font-size:16px;display:block">Autorizado no celular!</b><span style="color:var(--dim);font-size:13px">Conectando sua conta com segurança...</span></div>';

        if (dados.session && dados.session.access_token) {
          try { await sb.auth.setSession({ access_token: dados.session.access_token, refresh_token: dados.session.refresh_token }); } catch (e) { console.warn('[cod] setSession', e); }
        }
        if (dados.contaLocal) { try { localStorage.setItem('promessa_conta_local', JSON.stringify(dados.contaLocal)); } catch (e) { console.warn('[auth]', e); } }
        const uid = (dados.user && dados.user.id) || (dados.contaLocal && dados.contaLocal.id);
        const nick = (dados.user && dados.user.user_metadata && (dados.user.user_metadata.apelido || dados.user.user_metadata.nick)) || (dados.contaLocal && dados.contaLocal.nick);
        try {
          if (dados.user) localStorage.setItem('promessa_usuario', JSON.stringify(dados.user));
          if (uid && nick) { localStorage.setItem('promessa_apelido_' + uid, nick); localStorage.setItem('promessa_apelido', nick); }
          localStorage.removeItem('promessa_convidado'); localStorage.removeItem('promessa_modo_convidado');
        } catch (e) { console.warn('[auth]', e); }
        if (uid && typeof concedePremiosBoasVindas === 'function') concedePremiosBoasVindas(uid);
        setTimeout(entrou, 1000);
      } catch (e) { console.warn('[cod] payload invalido', e); }
    })
    .on('broadcast', { event: 'hello' }, () => {
      try { channel.send({ type: 'broadcast', event: 'pubkey', payload: { pub: pubJwk } }); } catch (e) { console.warn('[auth]', e); }
    })
    .on('broadcast', { event: 'recusado' }, () => {
      limparCanalCodigo(); msg('Acesso recusado no celular.', 'erro'); fecharLoginQR();
    })
    .subscribe();

  // Publica a chave publica periodicamente (o celular pode entrar a qualquer momento)
  qrPubInterval = setInterval(() => {
    try { channel.send({ type: 'broadcast', event: 'pubkey', payload: { pub: pubJwk } }); } catch (e) { console.warn('[auth]', e); }
  }, 2000);

  let tempoRestante = 180;
  $('qrTimer').textContent = 'Expira em 03:00';
  qrTimerInterval = setInterval(() => {
    tempoRestante--;
    if (tempoRestante <= 0) {
      limparCanalCodigo();
      $('qrTimer').innerHTML = '<span style="color:var(--rosa)">Código expirado.</span> <a href="#" id="btNovoQR" style="color:var(--verde);text-decoration:underline">Gerar novo</a>';
      const bt = document.getElementById('btNovoQR');
      if (bt) bt.onclick = (e) => { e.preventDefault(); iniciarLoginQR(); };
      return;
    }
    $('qrTimer').textContent = 'Expira em ' + String(Math.floor(tempoRestante / 60)).padStart(2, '0') + ':' + String(tempoRestante % 60).padStart(2, '0');
  }, 1000);
}

function fecharLoginQR() {
  limparCanalCodigo();
  $('boxQR').classList.add('hide');
  ['formLogin', 'divisor', 'btGoogle', 'btConvidado', 'btAbrirQR', 'troca'].forEach(id => $(id) && $(id).classList.remove('hide'));
  $('tagModo').textContent = 'ENTRAR';
}

if ($('btAbrirQR')) $('btAbrirQR').onclick = iniciarLoginQR;
if ($('btVoltarLogin')) $('btVoltarLogin').onclick = fecharLoginQR;
