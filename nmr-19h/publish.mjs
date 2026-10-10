// Publica no @naomonogamiaresponsavel o post extra das 19h (imagem única), conforme agenda.json.
// Roda no GitHub Actions às 19h BRT (workflow nmr-19h.yml) e grava o status de volta no agenda.json.
// Usa os mesmos secrets do publicador das 13h (INSTAGRAM_ACCESS_TOKEN / INSTAGRAM_USER_ID).
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const AGENDA = join(DIR, 'agenda.json');
const IG_BASE = 'https://graph.facebook.com/v21.0';

const agenda = JSON.parse(readFileSync(AGENDA, 'utf8'));
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()); // AAAA-MM-DD
console.log('Data (BRT):', today);
const item = agenda.posts.find(p => p.date === today && p.status === 'pending');
if (!item) { console.log('Nenhum post das 19h pendente pra hoje. Saindo.'); process.exit(0); }

const { INSTAGRAM_ACCESS_TOKEN: TOKEN, INSTAGRAM_USER_ID: USER,
        CLOUDINARY_CLOUD_NAME: CN, CLOUDINARY_API_KEY: CK, CLOUDINARY_API_SECRET: CS } = process.env;
for (const [k, v] of Object.entries({ TOKEN, USER, CN, CK, CS })) if (!v) throw new Error('Faltando env: ' + k);

async function uploadCloudinary(path) {
  const file = `data:image/jpeg;base64,${readFileSync(path).toString('base64')}`;
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = createHash('sha1').update(`timestamp=${ts}${CS}`).digest('hex');
  const form = new FormData();
  form.append('file', file); form.append('api_key', CK);
  form.append('timestamp', ts); form.append('signature', sig);
  const j = await (await fetch(`https://api.cloudinary.com/v1_1/${CN}/image/upload`, { method: 'POST', body: form })).json();
  if (!j.secure_url) throw new Error('Cloudinary: ' + JSON.stringify(j));
  return j.secure_url;
}
async function poll(id) {
  for (let i = 0; i < 25; i++) {
    const j = await (await fetch(`${IG_BASE}/${id}?fields=status_code&access_token=${TOKEN}`)).json();
    if (j.status_code === 'FINISHED') return;
    if (j.status_code === 'ERROR') throw new Error('Container ERROR: ' + JSON.stringify(j));
    await new Promise(s => setTimeout(s, 3000));
  }
}
const salvar = () => writeFileSync(AGENDA, JSON.stringify(agenda, null, 2));

try {
  console.log('Publicando no @naomonogamiaresponsavel:', item.file);
  const url = await uploadCloudinary(join(DIR, item.file));
  await new Promise(s => setTimeout(s, 12000));
  let cj, ok = false;
  for (let a = 1; a <= 5 && !ok; a++) {
    const r = await fetch(`${IG_BASE}/${USER}/media`, { method: 'POST',
      body: new URLSearchParams({ image_url: url, caption: item.caption, access_token: TOKEN }) });
    cj = await r.json();
    if (cj.id) { ok = true; break; }
    const sub = cj.error && cj.error.error_subcode;
    if (sub === 2207052 || (cj.error && cj.error.is_transient)) { console.log('retry', a); await new Promise(s => setTimeout(s, 6000 * a)); }
    else break;
  }
  if (!ok) throw new Error('Falha container: ' + JSON.stringify(cj));
  await poll(cj.id);
  await new Promise(s => setTimeout(s, 6000));
  let pj;
  for (let a = 1; a <= 5; a++) {
    pj = await (await fetch(`${IG_BASE}/${USER}/media_publish`, { method: 'POST',
      body: new URLSearchParams({ creation_id: cj.id, access_token: TOKEN }) })).json();
    if (pj.id) break;
    console.log('retry publish', a); await new Promise(s => setTimeout(s, 8000 * a));
  }
  if (!pj.id) throw new Error('Falha publish: ' + JSON.stringify(pj));
  const lj = await (await fetch(`${IG_BASE}/${pj.id}?fields=permalink&access_token=${TOKEN}`)).json();
  Object.assign(item, { status: 'published', publishedAt: new Date().toISOString(), postId: pj.id, permalink: lj.permalink || null });
  salvar();
  console.log('✅ PUBLICADO! media:', pj.id, '| permalink:', lj.permalink || '(n/d)');
} catch (e) {
  Object.assign(item, { status: 'failed', error: e.message, failedAt: new Date().toISOString() });
  salvar();
  console.error('❌ ERRO:', e.message);
  process.exit(1);
}
