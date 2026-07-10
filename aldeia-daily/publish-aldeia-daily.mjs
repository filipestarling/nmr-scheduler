// Publica 1 post de divulgação da Aldeia por dia (imagem única) no @naomonogamiaresponsavel.
// Roda no GitHub Actions às 19h BRT (cron '0 22 * * *'). Mapa por data (America/Sao_Paulo).
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DIR = dirname(fileURLToPath(import.meta.url));
const IG_BASE = 'https://graph.facebook.com/v21.0';

const CAP = {
  p02: `🌈 Feed, fórum, eventos, grupos, comunidades: tudo que a sua tribo precisa, num só lugar.

Chega de se espalhar por mil grupos — a Aldeia Não Mono reúne a comunidade não mono num espaço só, com segurança e respeito.

📅 Chega dia 15/07, 19h.
👉 Garante seu acesso: www.aldeianaomono.com.br 💜

#naomonogamia #poliamor #relacaoaberta #comunidade #aldeianaomono`,
  p04: `🌈 Não é só um app: é um ecossistema completo pra quem ama no plural.

Comunidade, conexões, eventos e conteúdo — pensados pra vida não mono, com segurança e respeito. Não é paquera: é pertencer.

📅 15 de julho, 19h.
👉 www.aldeianaomono.com.br 💜

#naomonogamia #poliamor #relacaoaberta #comunidade #aldeianaomono`,
  p05: `🌈 O primeiro app pensado pra quem vive o amor de forma livre, plural e honesta.

A não monogamia merece um lugar feito pra ela — não uma adaptação de app de namoro mono. A Aldeia Não Mono nasce pra isso.

📅 Lançamento 15/07, 19h.
👉 Entra pra lista: www.aldeianaomono.com.br 💜

#naomonogamia #poliamor #relacaoaberta #aldeianaomono`,
  p12: `🌈 Feed · Fórum · Eventos · Grupos · Chat · Relatos · Enquetes · Censo · Biblioteca.

Tudo o que a comunidade não mono precisa, num só lugar — a Aldeia Não Mono. Falta pouco!

📅 15 de julho, 19h.
👉 www.aldeianaomono.com.br 💜

#naomonogamia #poliamor #relacaoaberta #comunidade #aldeianaomono`,
};

const MAP = {
  '2026-07-11': { file: 'post-02.jpg', caption: CAP.p02 },
  '2026-07-12': { file: 'post-04.png', caption: CAP.p04 },
  '2026-07-13': { file: 'post-05.png', caption: CAP.p05 },
  '2026-07-14': { file: 'post-12.png', caption: CAP.p12 },
};

const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date()); // YYYY-MM-DD
console.log('Data (BRT):', today);
const item = MAP[today];
if (!item) { console.log('Nenhum post da Aldeia agendado pra hoje. Saindo.'); process.exit(0); }

const { INSTAGRAM_ACCESS_TOKEN: TOKEN, INSTAGRAM_USER_ID: USER,
        CLOUDINARY_CLOUD_NAME: CN, CLOUDINARY_API_KEY: CK, CLOUDINARY_API_SECRET: CS } = process.env;
for (const [k, v] of Object.entries({ TOKEN, USER, CN, CK, CS })) if (!v) throw new Error('Faltando env: ' + k);

async function uploadCloudinary(path) {
  const buf = readFileSync(path);
  const mime = path.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const file = `data:${mime};base64,${buf.toString('base64')}`;
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = createHash('sha1').update(`timestamp=${ts}${CS}`).digest('hex');
  const form = new FormData();
  form.append('file', file); form.append('api_key', CK);
  form.append('timestamp', ts); form.append('signature', sig);
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CN}/image/upload`, { method: 'POST', body: form });
  const j = await r.json();
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

(async () => {
  console.log('Publicando Aldeia:', item.file);
  const url = await uploadCloudinary(join(DIR, item.file));
  await new Promise(s => setTimeout(s, 12000));
  let cj, ok = false;
  for (let a = 1; a <= 5 && !ok; a++) {
    const r = await fetch(`${IG_BASE}/${USER}/media`, { method: 'POST',
      body: new URLSearchParams({ image_url: url, caption: item.caption, access_token: TOKEN }) });
    cj = await r.json();
    if (cj.id) { ok = true; break; }
    const sub = cj.error && cj.error.error_subcode;
    if (sub === 2207052 || (cj.error && cj.error.is_transient)) { console.log('retry', a); await new Promise(s => setTimeout(s, 6000)); }
    else break;
  }
  if (!ok) throw new Error('Falha container: ' + JSON.stringify(cj));
  await poll(cj.id);
  const pr = await fetch(`${IG_BASE}/${USER}/media_publish`, { method: 'POST',
    body: new URLSearchParams({ creation_id: cj.id, access_token: TOKEN }) });
  const pj = await pr.json();
  if (!pj.id) throw new Error('Falha publish: ' + JSON.stringify(pj));
  const lj = await (await fetch(`${IG_BASE}/${pj.id}?fields=permalink&access_token=${TOKEN}`)).json();
  console.log('✅ PUBLICADO Aldeia! media:', pj.id, '| permalink:', lj.permalink || '(n/d)');
})().catch(e => { console.error('❌ ERRO:', e.message); process.exit(1); });
