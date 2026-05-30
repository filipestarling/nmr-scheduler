const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const slides = [
  '2026-05-12_varios-vinculos-nao-te-torna-disponivel',
  '2026-05-13_cuidado-relacional-e-marcador-etico',
  '2026-05-14_nm-ativa-traumas',
  '2026-05-15_apego-evitativo-idealizacao-liberdade',
  '2026-05-20_aceitei-por-medo',
  '2026-05-21_acordos-estruturam-liberdade',
  '2026-05-22_acordos-nao-substituem-cuidado',
  '2026-05-23_amor-ou-obediencia',
  '2026-05-24_ausencia-de-regras-presenca',
  '2026-05-25_cabeca-aceita-corpo-reage',
  '2026-05-26_ciume-nao-e-prova-de-amor',
  '2026-05-27_conforto-e-cerceamento',
  '2026-05-28_desconforto-nao-e-sofrimento',
  '2026-05-29_escolha-o-seu-dificil',
  '2026-05-30_escolha-ou-medo',
  '2026-05-31_escolhendo-ou-adaptando',
  '2026-06-01_exaustao-emocional',
  '2026-06-02_liberdade-ou-fuga',
  '2026-06-03_liberdade-te-assusta',
  '2026-06-04_liberdade-vira-sobrecarga',
  '2026-06-05_limites-nao-sao-controle',
  '2026-06-06_machismo-na-nm',
  '2026-06-07_nada-garante-que-outro-fique',
  '2026-06-08_novos-discursos-velhas-praticas',
  '2026-06-09_pluralidade-nao-elimina-solidao',
  '2026-06-10_quem-sou-sem-exclusividade',
  '2026-06-11_reconhecer-limites-saude-mental',
  '2026-06-12_relacoes-seguras-sistema-nervoso',
  '2026-06-13_seguranca-emocional-na-nm',
  '2026-06-14_silencio-e-controle',
  '2026-06-15_traicao-na-nm',
  '2026-06-16_transparencia-sem-despejo',
];

const baseDir = path.dirname(__filename);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1440 });

  for (const folder of slides) {
    const htmlPath = path.join(baseDir, folder, 'slide-01.html');
    const jpgPath = path.join(baseDir, folder, 'slide-01.jpg');

    if (!fs.existsSync(htmlPath)) {
      console.log(`SKIP (no HTML): ${folder}`);
      continue;
    }

    const html = fs.readFileSync(htmlPath, 'utf8');
    await page.evaluate((content) => {
      document.open();
      document.write(content);
      document.close();
    }, html);

    await page.waitForTimeout(800);
    await page.screenshot({ path: jpgPath, type: 'jpeg', quality: 92 });
    console.log(`OK: ${folder}`);
  }

  await browser.close();
  console.log('Done.');
})();
