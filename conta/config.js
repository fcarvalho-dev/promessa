// PROMESSA · Game de cartas — configuração pública do Supabase.
// A chave publishable (sb_publishable_...) é SEGURA no cliente: a proteção real
// está na RLS e nas funções SECURITY DEFINER do banco, não em esconder esta chave.
// NUNCA coloque aqui a service_role key (essa dá acesso total e não pode ir ao front).
window.PROMESSA_CARTAS = {
  SUPABASE_URL: 'https://qtdycffnwqblysfgvmck.supabase.co',
  SUPABASE_KEY: 'sb_publishable_7FbcotsG3ThADGIyoSMFsg_m6R9ySxY',
  // Client ID do OAuth do Google (público, termina em .apps.googleusercontent.com). Vazio = login Google pelo redirecionamento antigo.
  GOOGLE_CLIENT_ID: '109732551344-jc8tlflm0niduoa8t8qm86vrlqkif6qu.apps.googleusercontent.com',
  // RPCs seguras que o front chama (todas usam auth.uid() internamente):
  RPC: {
    loginDiario:  'minha_login_diario',
    saldo:        'meu_saldo',
    abrePack:     'meu_abre_pack',
    resgata:      'meu_resgate',
    listaVenda:   'minha_lista_venda',
    compra:       'minha_compra',
    cancela:      'meu_cancela_trade',
  },
};
