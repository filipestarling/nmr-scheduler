# -*- coding: utf-8 -*-
import json, os, glob, shutil
EMC = 'C:/Users/filip/squads/squads/conteudo-instagram/output/_EM-CONSTRUCAO'
NMR = 'C:/Users/filip/nmr-scheduler'

# (data, id, pasta_origem, caption) — lote 3, 21/07 a 24/07
POSTS = [
('2026-07-21','desequilibrio-mudo','desequilibrio-mudo',
"💜 O desequilíbrio que ninguém vê.\n\nTem relação em que uma pessoa descansa e a outra carrega toda a sobrecarga. O trabalho emocional (lembrar das datas, puxar as conversas difíceis, segurar a barra) é invisível, e na não monogamia se multiplica. Cuidado solitário deixa de ser encontro e vira sobrecarga. Reciprocidade não é simetria, mas o cuidado precisa ir e voltar.\n\n👉 Na sua relação, o cuidado vai e volta, ou pesa mais de um lado? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #responsabilidadeafetiva #psicologia #relacionamentos #cuidado"),

('2026-07-22','errei-virei-vilao','errar-tentando',
"💜 Errei tentando. Virei o vilão?\n\nNinguém entra na não monogamia pronto, e no caminho a gente quase sempre machuca tentando acertar. Mas existe uma linha: uma coisa é errar buscando construir, outra é ferir conscientemente e não se responsabilizar. Nem toda falha é abuso, e nem todo abuso vira só \"processo\". O que diferencia é reparar: reconhecer o dano, escutar e mudar a conduta.\n\n👉 Você já precisou reparar um dano que causou tentando acertar? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #responsabilidadeafetiva #psicologia #relacionamentos #autoconhecimento"),

('2026-07-23','amar-e-logistica','materialidade-do-amor',
"💜 Amar também é logística.\n\nFalamos muito de amor, desejo e liberdade, mas existe uma parte concreta dos afetos que quase nunca aparece: quem cuida de quem quando a vida aperta? O amor é infinito, mas tempo, energia e presença não são. Muita gente constrói família fora do molde e raramente protege isso na prática (plano de saúde, uma internação, quem ampara). Amor maduro pensa no perrengue.\n\n👉 Quem é a sua rede de cuidado real numa emergência? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #psicologia #relacionamentos #familia #cuidado"),

('2026-07-24','relacao-nao-e-terapia','afeto-tambem-e-descanso',
"💜 Nem toda relação precisa virar terapia.\n\nA gente aprendeu a analisar tudo: cada desconforto vira tema, cada sentimento vira processo. Refletir é importante, até demais, mas problematizar o tempo todo cansa. Afeto também é descanso. Acolher não exige resolver, e viver vem antes de explicar. Deixe a relação respirar: carinho, silêncio confortável e leveza também sustentam um vínculo.\n\n👉 Você tem deixado as suas relações respirarem, ou tudo vira análise? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #psicologia #relacionamentos #autocuidado #presenca"),
]

sched = json.load(open(NMR+'/schedule.json', encoding='utf-8'))
existing = {p['id'] for p in sched['posts']}
added=0; copied=0
for date,pid,folder,cap in POSTS:
    sd_rel = 'slides/%s_%s' % (date, pid)
    sd_abs = '%s/%s' % (NMR, sd_rel)
    os.makedirs(sd_abs, exist_ok=True)
    srcs = sorted(glob.glob('%s/%s/v2/slides/slide-*.jpg' % (EMC, folder)))
    for s in srcs:
        shutil.copy(s, sd_abs + '/' + os.path.basename(s)); copied+=1
    if pid in existing:
        print('SKIP (id existe):', pid); continue
    sched['posts'].append({'id': pid,'scheduledAt': '%sT13:00:00-03:00' % date,'slidesDir': sd_rel,'caption': cap,'status': 'pending'})
    added+=1
    print('OK %s | %s | %d slides' % (date, pid, len(srcs)))

json.dump(sched, open(NMR+'/schedule.json','w',encoding='utf-8'), ensure_ascii=False, indent=2)
print('--- adicionados: %d | jpgs: %d | total: %d' % (added, copied, len(sched['posts'])))
