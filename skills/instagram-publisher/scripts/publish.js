#!/usr/bin/env node
// Instagram Carousel Publisher
// Usage: node --env-file=.env publish.js --images "slide1.jpg,slide2.jpg" --caption "..." [--dry-run]

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

// ── Argument parsing ──────────────────────────────────────────

export function parseArgs(argv) {
  const args = { images: [], caption: '', dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--images') {
      if (i + 1 < argv.length) args.images = argv[++i].split(',').map(s => s.trim());
    }
    else if (argv[i] === '--caption') {
      if (i + 1 < argv.length) args.caption = argv[++i];
    }
    else if (argv[i] === '--dry-run') args.dryRun = true;
  }
  return args;
}

// ── Image upload (Cloudinary) ─────────────────────────────────

export async function uploadToCloudinary(imagePath, { cloudName, apiKey, apiSecret }) {
  const absolutePath = resolve(imagePath);
  const fileBuffer = readFileSync(absolutePath);
  const base64Data = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  // Signed upload: SHA1 of "timestamp=<ts><api_secret>"
  const signature = createHash('sha1').update(`timestamp=${timestamp}${apiSecret}`).digest('hex');

  const form = new FormData();
  form.append('file', base64Data);
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('signature', signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Cloudinary upload failed [${res.status}]: ${await res.text()}`);
  const json = await res.json();
  if (!json.secure_url) throw new Error(`Cloudinary upload failed: ${JSON.stringify(json)}`);
  return json.secure_url;
}

// ── Instagram Graph API ───────────────────────────────────────

const IG_BASE = 'https://graph.facebook.com/v21.0';

// Erros transitórios da Graph API que valem nova tentativa:
//   2207052 → IG não conseguiu baixar a mídia do Cloudinary (CDN ainda frio)
//   2207027 → "Media ID is not available" (container ainda não liberado pro publish)
//   2207001/2207003 → falhas temporárias de download
//   1 / 2      → erros genéricos temporários da plataforma
const TRANSIENT_SUBCODES = new Set([2207052, 2207027, 2207001, 2207003]);
const TRANSIENT_CODES = new Set([1, 2]);

function isTransient(body) {
  const e = body && body.error;
  if (!e) return false;
  if (e.is_transient) return true;
  if (TRANSIENT_SUBCODES.has(e.error_subcode)) return true;
  if (TRANSIENT_CODES.has(e.code)) return true;
  return false;
}

/**
 * Executa `fn` (que deve retornar {res, body}) com novas tentativas em falhas
 * transitórias. Espera crescente: 6s, 12s, 18s, ...
 */
async function withRetry(label, fn, { attempts = 5, baseDelayMs = 6000 } = {}) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    const { res, body } = await fn();
    if (res.ok && body && !body.error) return body;
    last = body;
    const transient = isTransient(body);
    const msg = (body && body.error && body.error.message) || `HTTP ${res.status}`;
    if (!transient || i === attempts) {
      throw new Error(`${label} failed [${res.status}] after ${i} attempt(s): ${JSON.stringify(body)}`);
    }
    const wait = baseDelayMs * i;
    console.log(`   ⚠  ${label}: ${msg} — tentativa ${i}/${attempts}, aguardando ${wait / 1000}s...`);
    await new Promise(r => setTimeout(r, wait));
  }
  throw new Error(`${label} failed: ${JSON.stringify(last)}`);
}

export async function createChildContainer(userId, imageUrl, accessToken) {
  const params = new URLSearchParams({
    image_url: imageUrl,
    is_carousel_item: 'true',
    access_token: accessToken,
  });
  const body = await withRetry('createChildContainer', async () => {
    const res = await fetch(`${IG_BASE}/${userId}/media?${params}`, { method: 'POST' });
    return { res, body: await res.json().catch(() => null) };
  });
  return body.id;
}

export async function getContainerStatus(containerId, accessToken) {
  const params = new URLSearchParams({ fields: 'status_code', access_token: accessToken });
  const res = await fetch(`${IG_BASE}/${containerId}?${params}`);
  if (!res.ok) throw new Error(`getContainerStatus failed [${res.status}]: ${await res.text()}`);
  return (await res.json()).status_code;
}

export async function pollUntilFinished(containerId, accessToken, timeoutMs = 150_000, intervalMs = 3_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const status = await getContainerStatus(containerId, accessToken);
    if (status === 'FINISHED') return;
    if (status === 'ERROR') throw new Error(`Container ${containerId} entered ERROR state`);
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`Container ${containerId} timed out after ${timeoutMs}ms`);
}

export async function createCarouselContainer(userId, childIds, caption, accessToken) {
  const params = new URLSearchParams({
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption,
    access_token: accessToken,
  });
  const res = await fetch(`${IG_BASE}/${userId}/media?${params}`, { method: 'POST' });
  if (!res.ok) throw new Error(`createCarouselContainer failed [${res.status}]: ${await res.text()}`);
  return (await res.json()).id;
}

export async function publishMedia(userId, containerId, accessToken) {
  const params = new URLSearchParams({ creation_id: containerId, access_token: accessToken });
  // Mais tentativas e espera maior: o erro 2207027 ("Media ID is not available")
  // costuma resolver sozinho em alguns segundos.
  const body = await withRetry('publishMedia', async () => {
    const res = await fetch(`${IG_BASE}/${userId}/media_publish?${params}`, { method: 'POST' });
    return { res, body: await res.json().catch(() => null) };
  }, { attempts: 6, baseDelayMs: 8000 });
  return body.id;
}

export async function getPermalink(mediaId, accessToken) {
  const params = new URLSearchParams({ fields: 'permalink', access_token: accessToken });
  const res = await fetch(`${IG_BASE}/${mediaId}?${params}`);
  if (!res.ok) return null; // non-fatal — just skip the URL display
  const json = await res.json();
  return json.permalink ?? null;
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  const { images, caption, dryRun } = parseArgs(process.argv);

  if (!images.length) throw new Error('--images is required (e.g. --images "slide1.jpg,slide2.jpg")');
  if (!caption) throw new Error('--caption is required');
  if (images.length < 2 || images.length > 10) {
    throw new Error(`Instagram carousels require 2–10 images (got ${images.length})`);
  }
  if (caption.length > 2200) {
    throw new Error(`Caption exceeds Instagram's 2200-character limit (got ${caption.length})`);
  }

  const {
    INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID,
    CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
  } = process.env;
  if (!INSTAGRAM_ACCESS_TOKEN) throw new Error('INSTAGRAM_ACCESS_TOKEN is not set in environment');
  if (!INSTAGRAM_USER_ID) throw new Error('INSTAGRAM_USER_ID is not set in environment');
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary credentials missing — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env. Get them at https://cloudinary.com/console');
  }

  console.log(`📸 Uploading ${images.length} image(s) to Cloudinary (cloud: ${CLOUDINARY_CLOUD_NAME})...`);
  const cloud = { cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, apiSecret: CLOUDINARY_API_SECRET };
  const imageUrls = [];
  for (const p of images) {
    imageUrls.push(await uploadToCloudinary(p, cloud));
  }
  imageUrls.forEach((url, i) => console.log(`   [${i + 1}] ${url}`));

  // Wait for Cloudinary CDN edge to propagate before asking IG to fetch.
  // Without this, IG sometimes hits an edge node before the image is cached
  // and fails with "Não foi possível obter a mídia deste URI" (error 2207052).
  const CDN_WARMUP_MS = 15000;
  console.log(`\n⏲  Aguardando ${CDN_WARMUP_MS / 1000}s pra Cloudinary CDN propagar...`);
  await new Promise(r => setTimeout(r, CDN_WARMUP_MS));

  console.log('\n📦 Creating Instagram media containers...');
  // Sequential (not parallel) to further reduce pressure on the IG fetch side.
  const childIds = [];
  for (const url of imageUrls) {
    childIds.push(await createChildContainer(INSTAGRAM_USER_ID, url, INSTAGRAM_ACCESS_TOKEN));
  }
  console.log(`   Container IDs: ${childIds.join(', ')}`);

  console.log('\n⏳ Waiting for containers to finish processing...');
  await Promise.all(childIds.map(id => pollUntilFinished(id, INSTAGRAM_ACCESS_TOKEN)));
  console.log('   All containers ready.');

  console.log('\n🎠 Creating carousel container...');
  const carouselId = await createCarouselContainer(
    INSTAGRAM_USER_ID, childIds, caption, INSTAGRAM_ACCESS_TOKEN
  );
  await pollUntilFinished(carouselId, INSTAGRAM_ACCESS_TOKEN);
  console.log(`   Carousel container ID: ${carouselId}`);

  // FINISHED nem sempre significa publicável na mesma hora: o publish pode
  // responder 2207027 ("Media ID is not available") por alguns segundos.
  const SETTLE_MS = 6000;
  console.log(`   ⏲  Aguardando ${SETTLE_MS / 1000}s antes de publicar...`);
  await new Promise(r => setTimeout(r, SETTLE_MS));

  if (dryRun) {
    console.log('\n✅ DRY RUN complete — skipping final publish call.');
    console.log(`   Carousel container ready: ${carouselId}`);
    return;
  }

  console.log('\n🚀 Publishing to Instagram...');
  const postId = await publishMedia(INSTAGRAM_USER_ID, carouselId, INSTAGRAM_ACCESS_TOKEN);
  const permalink = await getPermalink(postId, INSTAGRAM_ACCESS_TOKEN);
  console.log(`\n✅ Published successfully!`);
  console.log(`   Post ID: ${postId}`);
  if (permalink) console.log(`   URL: ${permalink}`);
}

// Run only when executed directly (not when imported for tests)
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch(err => {
    console.error(`\n❌ ${err.message}`);
    process.exit(1);
  });
}
