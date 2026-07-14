# -*- coding: utf-8 -*-
import json, os, glob, shutil

EMC = 'C:/Users/filip/squads/squads/conteudo-instagram/output/_EM-CONSTRUCAO'
NMR = 'C:/Users/filip/nmr-scheduler'

# (data, id, pasta_origem, caption) — lote 2, 17/07 a 20/07, ordem intercalada
POSTS = [
('2026-07-17','nao-mono-de-que','sou-nao-mono-de-que',
"💜 Disse que é não mono. Mas o que isso significa?\n\n\"Não monogamia\" é um guarda-chuva enorme: uma pessoa pensa em relação aberta, outra em poliamor, e as duas dizem a mesma frase. Quando ninguém pergunta o que o outro quer dizer, cada um preenche a lacuna com a própria expectativa, e a frustração chega depois. Rótulo não é acordo.\n\n👉 Quando alguém diz \"sou não mono\", você pergunta o que isso significa? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #relacaoaberta #psicologia #relacionamentos #acordos"),

('2026-07-18','racionalizacao-defesa','racionalizacao-defesa',
"💜 Tem gente que sabe tudo sobre relacionamento e trava na hora de sentir.\n\nA psicanálise chama isso de intelectualização: transformar emoção em explicação pra não precisar senti-la. A cabeça protege o peito, e a teoria vira escudo. Mas compreender não é o mesmo que viver: dá pra saber tudo sobre cuidado e ainda ter dificuldade de cuidar. Em algum momento é preciso descer da cabeça pro corpo.\n\n👉 Você já explicou um sentimento pra não precisar senti-lo? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #psicologia #psicanalise #relacionamentos #autoconhecimento"),

('2026-07-19','leveza-ou-descaso','leveza-virou-desculpa',
"💜 Leveza ou descaso?\n\nVirou moda querer tudo \"leve\". Só que leve, muitas vezes, virou sinônimo de não se comprometer com nada: não retornar, não cuidar, não sustentar o mínimo que o outro sente. Por trás do \"sou leve\" costuma morar um medo de intimidade. Leveza de verdade tem cuidado, e responsabilidade afetiva não é peso, é o básico de qualquer vínculo.\n\n👉 Pra você, onde termina a leveza e onde começa o descaso? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #responsabilidadeafetiva #psicologia #relacionamentos #leveza"),

('2026-07-20','autonomia-ou-isolamento','autonomia-x-interdependencia',
"💜 Autonomia ou isolamento?\n\nVirou ideal não precisar de ninguém. Mas somos seres de vínculo: precisar não é fraqueza, é da natureza humana. Às vezes a autonomia radical é defesa, protege de um medo antigo de depender e ser deixado. Interdependência não é dependência, é poder se apoiar e ser apoio sem se perder. Liberdade não é solidão.\n\n👉 Pra você, onde fica o limite entre autonomia e isolamento? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #autonomia #apego #psicologia #relacionamentos"),
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
print('--- adicionados: %d | jpgs: %d | total posts: %d' % (added, copied, len(sched['posts'])))
