// Checa se o token do Instagram está válido e avisa se estiver perto de expirar.
// Falha o workflow (fica vermelho no GitHub + e-mail) quando há problema.
const { INSTAGRAM_ACCESS_TOKEN: T, INSTAGRAM_USER_ID: U } = process.env;
const G = 'https://graph.facebook.com/v21.0';
const DIAS_ALERTA = 10;

if (!T || !U) { console.error('❌ Faltando INSTAGRAM_ACCESS_TOKEN ou INSTAGRAM_USER_ID nos secrets.'); process.exit(1); }

// 1) o token funciona de verdade?
const r = await fetch(`${G}/${U}?fields=username&access_token=${T}`);
const j = await r.json();
if (!j.username) {
  console.error('❌ TOKEN INVÁLIDO OU EXPIRADO — os posts agendados NÃO vão publicar.');
  console.error('   Erro:', (j.error && j.error.message) || JSON.stringify(j));
  console.error('\n   Como resolver:');
  console.error('   1. developers.facebook.com/tools/explorer -> app "NMR Opensquad Publisher"');
  console.error('   2. Generate Access Token (permissões instagram_*, pages_show_list, business_management)');
  console.error('   3. Trocar por token longo e pegar o PAGE token (não expira)');
  console.error('   4. gh secret set INSTAGRAM_ACCESS_TOKEN');
  process.exit(1);
}
console.log('✅ Token válido — conta @' + j.username);

// 2) quando expira?
const d = await (await fetch(`${G}/debug_token?input_token=${T}&access_token=${T}`)).json();
const exp = d.data && d.data.expires_at;
if (!exp) {
  console.log('✅ Token permanente (não expira). Nada a fazer.');
  process.exit(0);
}
const dias = Math.floor((exp * 1000 - Date.now()) / 86400000);
const quando = new Date(exp * 1000).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
console.log(`   Expira em ${quando} (faltam ${dias} dias)`);
if (dias <= DIAS_ALERTA) {
  console.error(`\n⚠️  ATENÇÃO: faltam só ${dias} dias para o token expirar. Renove agora.`);
  process.exit(1);
}
console.log('✅ Prazo confortável.');
