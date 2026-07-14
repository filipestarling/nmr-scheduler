# -*- coding: utf-8 -*-
import json, os, glob, html

NMR = 'C:/Users/filip/nmr-scheduler'
s = json.load(open(NMR+'/schedule.json', encoding='utf-8'))
pend = [p for p in s['posts'] if p.get('status')=='pending' and p['scheduledAt'][:10] >= '2026-06-17']
pend.sort(key=lambda x: x['scheduledAt'])

cards = []
for i,p in enumerate(pend,1):
    d = p['scheduledAt'][:10]
    sd = p['slidesDir']
    jpgs = sorted(glob.glob('%s/%s/slide-*.jpg' % (NMR, sd)))
    thumbs = ''.join('<img src="%s/%s" loading="lazy">' % (sd, os.path.basename(j)) for j in jpgs)
    cap = html.escape(p['caption']).replace('\n','<br>')
    cards.append('''
    <section class="card">
      <div class="head">
        <span class="num">#%02d</span>
        <span class="date">%s · 13h</span>
        <span class="id">%s</span>
        <span class="cnt">%d slides</span>
      </div>
      <div class="strip">%s</div>
      <details class="cap"><summary>caption</summary><div class="captext">%s</div></details>
    </section>''' % (i, d, html.escape(p['id']), len(jpgs), thumbs, cap))

page = '''<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
<title>Agenda de carrosséis · 17/06 a 04/07</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#120826;color:#EDE9FE;font-family:'Segoe UI',system-ui,Arial,sans-serif;padding:28px 32px 80px}
h1{font-size:24px;font-weight:700;margin-bottom:4px}
.sub{color:#A78BCA;font-size:14px;margin-bottom:26px}
.card{background:#1C0D33;border:1px solid #33215c;border-radius:14px;padding:16px 18px;margin-bottom:22px}
.head{display:flex;align-items:center;gap:14px;margin-bottom:12px;flex-wrap:wrap}
.num{font-weight:700;color:#C4B5FD;font-size:15px}
.date{background:#7C3AED;color:#fff;font-weight:600;font-size:13px;padding:3px 10px;border-radius:20px}
.id{color:#F0EAFB;font-size:15px;font-weight:600}
.cnt{color:#8B7AAE;font-size:12px;margin-left:auto}
.strip{display:flex;gap:8px;overflow-x:auto;padding-bottom:8px}
.strip img{height:300px;width:auto;border-radius:8px;border:1px solid #2c1c4d;flex:0 0 auto;background:#000}
.cap{margin-top:12px}
.cap summary{cursor:pointer;color:#A78BCA;font-size:13px;user-select:none}
.captext{margin-top:8px;background:#150a28;border:1px solid #2c1c4d;border-radius:8px;padding:12px 14px;font-size:14px;line-height:1.5;color:#D7CCF0;white-space:normal;max-width:760px}
.strip::-webkit-scrollbar{height:8px}
.strip::-webkit-scrollbar-thumb{background:#4a2f86;border-radius:8px}
</style></head><body>
<h1>Agenda de carrosséis — 18 posts</h1>
<div class="sub">17/06 a 04/07/2026 · 1/dia às 13h BRT · pré-publicação (nada no ar ainda)</div>
%s
</body></html>''' % ''.join(cards)

open(NMR+'/agenda-gallery.html','w',encoding='utf-8').write(page)
print('OK — agenda-gallery.html com %d carrosséis' % len(pend))
