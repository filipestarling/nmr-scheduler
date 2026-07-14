# -*- coding: utf-8 -*-
import json, os, glob, shutil
EMC = 'C:/Users/filip/squads/squads/conteudo-instagram/output/_EM-CONSTRUCAO'
NMR = 'C:/Users/filip/nmr-scheduler'

date='2026-07-25'; pid='liberdade-irresponsavel'; folder='liberdade-irresponsavel'
caption=("💜 Liberdade irresponsável.\n\n"
 "Tem quem use a não monogamia como desculpa pra imaturidade, colocando a própria liberdade acima de tudo e mandando o outro \"se virar com as consequências\". "
 "Mas todo relacionamento tem corresponsabilidade. Gosto da analogia do Rubem Alves: relação é frescobol, não tênis. No frescobol você joga a bola de um jeito que facilite a vida do outro, porque quer que o jogo continue. Se um perde, os dois perdem.\n\n"
 "👉 Nos seus relacionamentos, você joga frescobol ou tênis? Comenta aqui 💜\n\n.\n.\n.\n"
 "#poliamor #naomonogamia #naomonogamiaresponsavel #responsabilidadeafetiva #psicologia #relacionamentos #liberdade")

sched = json.load(open(NMR+'/schedule.json', encoding='utf-8'))
existing = {p['id'] for p in sched['posts']}
sd_rel = 'slides/%s_%s' % (date, pid); sd_abs = '%s/%s' % (NMR, sd_rel)
os.makedirs(sd_abs, exist_ok=True)
srcs = sorted(glob.glob('%s/%s/v2/slides/slide-*.jpg' % (EMC, folder)))
for s in srcs: shutil.copy(s, sd_abs + '/' + os.path.basename(s))
if pid in existing:
    print('SKIP (id existe):', pid)
else:
    sched['posts'].append({'id': pid,'scheduledAt': '%sT13:00:00-03:00' % date,'slidesDir': sd_rel,'caption': caption,'status': 'pending'})
    json.dump(sched, open(NMR+'/schedule.json','w',encoding='utf-8'), ensure_ascii=False, indent=2)
    print('OK %s | %s | %d slides | total: %d' % (date, pid, len(srcs), len(sched['posts'])))
