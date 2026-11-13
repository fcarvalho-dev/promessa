'use strict';
/* Redefinição de senha: o link do e-mail traz a sessão de recuperação na URL
   (#access_token... ou ?code=...). O supabase-js troca isso por uma sessão
   temporária; aí o usuário define a senha nova com updateUser. */
(function () {
  var CFG = window.PROMESSA_CARTAS;
  var sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  var $ = function (id) { return document.getElementById(id); };
  var msg = function (t, tipo) { var m = $('msg'); m.textContent = t || ''; m.className = 'msg' + (tipo ? ' ' + tipo : ''); };
  var pronto = false;
  function libera() { if (pronto) return; pronto = true; $('formNova').classList.remove('hide'); msg(''); $('senha1').focus(); }

  // erro vindo do próprio link (expirado, já usado)
  var h = new URLSearchParams(location.hash.slice(1)), q = new URLSearchParams(location.search);
  var erro = h.get('error_description') || q.get('error_description');
  if (erro) { msg('Este link não vale mais (' + erro.replace(/\+/g, ' ') + '). Peça um novo em "esqueci minha senha".', 'erro'); return; }

  sb.auth.onAuthStateChange(function (ev, sess) { if ((ev === 'PASSWORD_RECOVERY' || ev === 'SIGNED_IN') && sess) libera(); });
  setTimeout(async function () {
    try {
      var r = await sb.auth.getSession();
      if (r.error) throw r.error;
      if (r.data.session) libera();
      else if (!pronto) msg('Link inválido ou expirado. Peça um novo em "esqueci minha senha".', 'erro');
    } catch (e) { console.error('[nova-senha] sessão:', e); msg('Não deu para validar o link. Peça um novo.', 'erro'); }
  }, 1500);

  $('formNova').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var a = $('senha1').value, b = $('senha2').value;
    if (a.length < 8 || !/[a-zA-Z]/.test(a) || !/[0-9]/.test(a)) { msg('A senha precisa de ao menos 8 caracteres, com letras e números.', 'erro'); return; }
    if (a !== b) { msg('As duas senhas não são iguais.', 'erro'); return; }
    var bt = $('btSalvar'); bt.disabled = true; bt.textContent = 'SALVANDO…';
    try {
      var r = await sb.auth.updateUser({ password: a });
      if (r.error) throw r.error;
      msg('Senha alterada. Levando você para o jogo…', 'ok');
      setTimeout(function () { location.href = '../index.html'; }, 1400);
    } catch (e) {
      console.error('[nova-senha] updateUser:', e);
      var t = String((e && e.message) || '');
      msg(/same|different/i.test(t) ? 'Use uma senha diferente da anterior.' : /weak|short|least/i.test(t) ? 'Senha fraca. Use ao menos 8 caracteres com letras e números.' : 'Não deu para salvar. Peça um novo link.', 'erro');
      bt.disabled = false; bt.textContent = 'SALVAR SENHA';
    }
  });
})();
