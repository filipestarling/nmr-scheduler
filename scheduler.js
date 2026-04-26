// Instagram Scheduler
// Lê schedule.json e publica posts cujo horário chegou.
// Rodado pelo GitHub Actions diariamente às 13h BRT.

const { readFileSync, writeFileSync, readdirSync } = require('fs');
const { resolve, join } = require('path');
const { spawnSync } = require('child_process');

const BASE_DIR      = __dirname;
const SCHEDULE_FILE = join(BASE_DIR, 'schedule.json');
const PUBLISH_SCRIPT = join(BASE_DIR, 'skills/instagram-publisher/scripts/publish.js');
const MAX_LATE_HOURS = 2;

function collectSlides(slidesDir) {
  const dir = resolve(BASE_DIR, slidesDir);
  const files = readdirSync(dir).filter(f => /^slide-\d+(-justified)?\.jpg$/.test(f));
  const map = new Map();
  for (const f of files) {
    const m = f.match(/^slide-(\d+)(-justified)?\.jpg$/);
    if (!m) continue;
    const n = parseInt(m[1], 10);
    if (!map.has(n) || m[2]) map.set(n, join(dir, f));
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([, p]) => p);
}

function main() {
  const now = new Date();
  console.log(`\n📅 Scheduler: ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);

  const scheduleData = JSON.parse(readFileSync(SCHEDULE_FILE, 'utf8'));

  const pending = scheduleData.posts.filter(p => {
    if (p.status !== 'pending') return false;
    const scheduledAt = new Date(p.scheduledAt);
    const deadline = new Date(scheduledAt.getTime() + MAX_LATE_HOURS * 3_600_000);
    return scheduledAt <= now && now <= deadline;
  });

  if (!pending.length) {
    console.log('Nenhum post para publicar agora.\n');
    return;
  }

  for (const post of pending) {
    console.log(`\n🚀 Publicando: ${post.id}`);
    const idx = scheduleData.posts.findIndex(p => p.id === post.id);

    try {
      const slides = collectSlides(post.slidesDir);
      if (slides.length < 2) throw new Error(`Slides insuficientes: ${slides.length}`);
      console.log(`   ${slides.length} slides`);

      const result = spawnSync(
        'node',
        [PUBLISH_SCRIPT, '--images', slides.join(','), '--caption', post.caption],
        { encoding: 'utf8', cwd: BASE_DIR, timeout: 300_000 }
      );

      if (result.status !== 0) {
        throw new Error(result.stderr?.trim() || result.stdout?.trim() || 'Erro desconhecido');
      }

      console.log(result.stdout);

      const postIdMatch = result.stdout.match(/Post ID:\s*(\d+)/);
      const urlMatch    = result.stdout.match(/URL:\s*(https:\/\/www\.instagram\.com\/p\/[^\s]+)/);

      scheduleData.posts[idx].status = 'published';
      scheduleData.posts[idx].publishedAt = now.toISOString();
      if (postIdMatch) scheduleData.posts[idx].postId    = postIdMatch[1];
      if (urlMatch)    scheduleData.posts[idx].permalink = urlMatch[1];

      console.log(`   ✅ Publicado!`);
    } catch (err) {
      console.error(`   ❌ Erro: ${err.message}`);
      scheduleData.posts[idx].status    = 'failed';
      scheduleData.posts[idx].error     = err.message;
      scheduleData.posts[idx].failedAt  = now.toISOString();
    }

    writeFileSync(SCHEDULE_FILE, JSON.stringify(scheduleData, null, 2), 'utf8');
  }
}

main();
