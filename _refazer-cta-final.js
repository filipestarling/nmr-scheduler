// Re-renderiza slide-09 (CTA) e slide-10 (final fixo) dos dois posts de
// junho, trazendo pro padrão atual:
//   - accent do CTA em CORAL quando é o único (pedido do Filipe, 27/08)
//   - botão "Comenta aqui" SEM emoji
//   - slide 10: "indicações de terapeutas" (era "uma lista de"), corpo
//     alinhado à esquerda (era justificado)
const { chromium } = require('playwright');
const fs=require('fs'), path=require('path'), url=require('url');

const POSTS=[
 { dir:'slides/2026-06-10_quem-sou-sem-exclusividade',
   cta:'Sua <span class="accent-coral">identidade</span> já foi abalada pela falta de exclusividade?' },
 { dir:'slides/2026-06-12_relacoes-seguras-sistema-nervoso',
   cta:'Você sente <span class="accent-coral">segurança</span> nos seus vínculos?' },
];

const HEAD=`@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400;1,600&family=Inter:wght@400;500;600;700;800&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1440px;overflow:hidden;background:#1C0D33;font-family:'Inter','Segoe UI',Arial,sans-serif;display:flex;flex-direction:column;position:relative}
body::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 800px 600px at 50% 0%,#2D1555 0%,transparent 70%),radial-gradient(ellipse 600px 500px at 100% 100%,#0E0620 0%,transparent 60%);pointer-events:none}
.series-top{text-align:center;padding:56px 0 0;font-family:'Inter','Segoe UI',sans-serif;font-size:28px;font-weight:600;color:#CDBEFF;letter-spacing:0.06em;position:relative;z-index:2}
.accent-coral{color:#F87171;font-style:italic}.accent{color:#C4B5FD;font-style:italic}
.divider{width:72px;height:3px;background:linear-gradient(90deg,#7C3AED,#C4B5FD);border-radius:2px}`;

function cta(label){return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>${HEAD}
.content{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:80px;position:relative;z-index:2;gap:50px;text-align:center}
.cta-label{font-family:'Lora',Georgia,serif;font-size:56px;font-weight:600;line-height:1.3;color:#FFFFFF}
.divider{width:80px;height:4px}
.cta-button{display:inline-block;border:2px solid rgba(196,181,253,0.55);color:#FFFFFF;background:transparent;font-size:34px;font-weight:600;padding:24px 64px;border-radius:100px;letter-spacing:0.04em}
.swipe-hint{position:absolute;bottom:80px;right:88px;z-index:2;font-size:30px;font-weight:600;color:#8B7BAB}
</style></head><body>
<div class="series-top">Filipe Starling &middot; Psic&oacute;logo Cl&iacute;nico e Terapeuta de Casais</div>
<div class="content"><p class="cta-label">${label}</p><div class="divider"></div><div class="cta-button">Comenta aqui</div></div>
<p class="swipe-hint">arraste &#8594;</p>
</body></html>`;}

function final(){return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>${HEAD}
.content{flex:1;display:flex;flex-direction:column;justify-content:center;padding:80px;position:relative;z-index:2;gap:40px}
.headline{font-family:'Lora',Georgia,serif;font-size:64px;font-weight:600;line-height:1.2;color:#FFFFFF;text-align:left}
.body-text{font-size:38px;font-weight:400;color:#E2D9F3;line-height:1.6;text-align:left}
.pill-inline{display:inline-block;background:#7C3AED;color:#FFFFFF;font-size:34px;font-weight:700;padding:6px 28px;border-radius:50px;vertical-align:middle;margin:0 4px}
.pill-coral{display:inline-block;background:#F87171;color:#FFFFFF;font-weight:700;padding:4px 20px;border-radius:8px;font-size:36px}
</style></head><body>
<div class="series-top">Filipe Starling &middot; Psic&oacute;logo Cl&iacute;nico e Terapeuta de Casais</div>
<div class="content">
  <h1 class="headline">Está tendo <span class="accent-coral">dificuldades</span> com a não monogamia?</h1>
  <div class="divider"></div>
  <p class="body-text">Para fazer parte do grupo de apoio <span class="accent">sos não mono</span>, escreva <span class="pill-inline">apoio</span> nos comentários.</p>
  <p class="body-text">Para receber indicações de <span class="accent">terapeutas não mono</span>, envie um direct com a palavra <span class="pill-coral">terapeutas</span>.</p>
</div>
</body></html>`;}

(async()=>{
 const b=await chromium.launch();
 const p=await b.newPage();
 await p.setViewportSize({width:1080,height:1440});
 for(const post of POSTS){
   const d=path.join(__dirname,post.dir);
   for(const [nome,html] of [['slide-09',cta(post.cta)],['slide-10',final()]]){
     const hp=path.join(d,'_tmp.html');
     fs.writeFileSync(hp,html);
     await p.goto(url.pathToFileURL(hp).href);
     await p.waitForTimeout(600);
     await p.screenshot({path:path.join(d,nome+'.jpg'),type:'jpeg',quality:94});
     fs.unlinkSync(hp);
     console.log('OK '+post.dir+'/'+nome+'.jpg');
   }
 }
 await b.close();
})();
