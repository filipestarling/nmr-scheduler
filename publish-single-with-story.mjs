#!/usr/bin/env node
// Publish single image to feed (with optional collab) + story
// Usage: node --env-file=<path> publish-single-with-story.mjs <image-path> "<caption>" [collaborator_id]

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const {
  INSTAGRAM_ACCESS_TOKEN,
  INSTAGRAM_USER_ID,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!INSTAGRAM_ACCESS_TOKEN) throw new Error('INSTAGRAM_ACCESS_TOKEN missing');
if (!INSTAGRAM_USER_ID) throw new Error('INSTAGRAM_USER_ID missing');
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error('Cloudinary credentials missing');
}

const IMAGE_PATH = process.argv[2];
const CAPTION = process.argv[3];
const COLLABORATOR_ID = process.argv[4] ?? null;

if (!IMAGE_PATH || !CAPTION) {
  console.error('Usage: node publish-single-with-story.mjs <image-path> "<caption>" [collaborator_id]');
  process.exit(1);
}

const IG_BASE = 'https://graph.facebook.com/v21.0';

async function uploadToCloudinary(imagePath) {
  const buf = readFileSync(resolve(imagePath));
  const isPng = buf[0] === 0x89 && buf[1] === 0x50;
  const mime = isPng ? 'image/png' : 'image/jpeg';
  const b64 = `data:${mime};base64,${buf.toString('base64')}`;
  const ts = Math.floor(Date.now() / 1000).toString();
  const sig = createHash('sha1').update(`timestamp=${ts}${CLOUDINARY_API_SECRET}`).digest('hex');

  const form = new FormData();
  form.append('file', b64);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', ts);
  form.append('signature', sig);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST', body: form,
  });
  if (!res.ok) throw new Error(`Cloudinary upload failed [${res.status}]: ${await res.text()}`);
  const json = await res.json();
  if (!json.secure_url) throw new Error(`Cloudinary upload failed: ${JSON.stringify(json)}`);
  // Force JPEG output via Cloudinary transformation (Instagram requires JPEG)
  return json.secure_url.replace('/upload/', '/upload/f_jpg,q_95/');
}

async function pollUntilFinished(containerId, timeoutMs = 90_000, intervalMs = 4_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const params = new URLSearchParams({ fields: 'status_code', access_token: INSTAGRAM_ACCESS_TOKEN });
    const res = await fetch(`${IG_BASE}/${containerId}?${params}`);
    const json = await res.json();
    if (json.status_code === 'FINISHED') return;
    if (json.status_code === 'ERROR') throw new Error(`Container ${containerId} in ERROR state`);
    console.log(`   status: ${json.status_code} — aguardando...`);
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Container ${containerId} timed out`);
}

async function publishMedia(containerId) {
  const params = new URLSearchParams({ creation_id: containerId, access_token: INSTAGRAM_ACCESS_TOKEN });
  const res = await fetch(`${IG_BASE}/${INSTAGRAM_USER_ID}/media_publish?${params}`, { method: 'POST' });
  const text = await res.text();
  if (!res.ok) throw new Error(`publishMedia failed [${res.status}]: ${text}`);
  return JSON.parse(text).id;
}

async function getPermalink(mediaId) {
  const params = new URLSearchParams({ fields: 'permalink', access_token: INSTAGRAM_ACCESS_TOKEN });
  const res = await fetch(`${IG_BASE}/${mediaId}?${params}`);
  const json = await res.json();
  return json.permalink ?? null;
}

// ── Upload ────────────────────────────────────────────────────
console.log('📸 Fazendo upload da imagem para Cloudinary...');
const imageUrl = await uploadToCloudinary(IMAGE_PATH);
console.log(`   URL: ${imageUrl}`);

const CDN_WARMUP = 8000;
console.log(`\n⏲  Aguardando ${CDN_WARMUP / 1000}s para CDN propagar...`);
await new Promise(r => setTimeout(r, CDN_WARMUP));

// ── Feed post ────────────────────────────────────────────────
console.log('\n📦 Criando container do feed post...');
const feedParams = new URLSearchParams({
  image_url: imageUrl,
  caption: CAPTION,
  access_token: INSTAGRAM_ACCESS_TOKEN,
});
if (COLLABORATOR_ID) {
  feedParams.append('collaborator_ids', COLLABORATOR_ID);
  console.log(`   collab: ${COLLABORATOR_ID}`);
}
const feedRes = await fetch(`${IG_BASE}/${INSTAGRAM_USER_ID}/media?${feedParams}`, { method: 'POST' });
const feedResText = await feedRes.text();
if (!feedRes.ok) throw new Error(`createImageContainer failed [${feedRes.status}]: ${feedResText}`);
const feedContainerId = JSON.parse(feedResText).id;
console.log(`   Container ID: ${feedContainerId}`);

console.log('⏳ Aguardando processamento...');
await pollUntilFinished(feedContainerId);

console.log('🚀 Publicando feed post...');
const feedMediaId = await publishMedia(feedContainerId);
const feedPermalink = await getPermalink(feedMediaId);
console.log(`✅ Feed post publicado!`);
console.log(`   Media ID: ${feedMediaId}`);
console.log(`   URL: ${feedPermalink}`);

// ── Story ────────────────────────────────────────────────────
console.log('\n📖 Criando container da story...');
const storyParams = new URLSearchParams({
  image_url: imageUrl,
  media_type: 'STORIES',
  access_token: INSTAGRAM_ACCESS_TOKEN,
});
const storyRes = await fetch(`${IG_BASE}/${INSTAGRAM_USER_ID}/media?${storyParams}`, { method: 'POST' });
const storyResText = await storyRes.text();
if (!storyRes.ok) throw new Error(`createStoryContainer failed [${storyRes.status}]: ${storyResText}`);
const storyContainerId = JSON.parse(storyResText).id;
console.log(`   Container ID: ${storyContainerId}`);

console.log('⏳ Aguardando processamento...');
await pollUntilFinished(storyContainerId);

console.log('🚀 Publicando story...');
const storyMediaId = await publishMedia(storyContainerId);
console.log(`✅ Story publicada!`);
console.log(`   Media ID: ${storyMediaId}`);

console.log('\n🎉 Concluído!');
