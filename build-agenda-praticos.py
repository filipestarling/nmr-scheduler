# -*- coding: utf-8 -*-
import json, os, glob, shutil

OUT = 'C:/Users/filip/squads/squads/conteudo-instagram/output'
NMR = 'C:/Users/filip/nmr-scheduler'

# (data, id, pasta_origem, caption) — série prática, 05/07 a 11/07, emendando após 04/07
POSTS = [
('2026-07-05','primeiros-passos-nm','prat-01-primeiros-passos',
"💜 Começou na não monogamia? Respira: isso aqui é processo, não prova.\n\nNão existe modelo único, cada relação inventa os próprios acordos. Conversem sobre expectativas, combinem limites (e revisem), escutem de verdade e vão com calma. Insegurança no começo é esperada.\n\n👉 Em que passo você está agora? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #relacionamentos #relacaoaberta #psicologia #autoconhecimento"),

('2026-07-06','ciume-nao-some','prat-02-ciumes',
"💜 O ciúme não some só porque você passou a se chamar de não monogâmico.\n\nO que muda é como você se relaciona com ele. Procure a raiz (medo, insegurança, comparação), fale por você, cuide da sua autoestima. Bem olhado, o ciúme tem muito a te ensinar.\n\n👉 Qual é a raiz do seu ciúme? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #ciume #relacionamentos #psicologia #inteligenciaemocional"),

('2026-07-07','comunicacao-nm','prat-05-comunicacao',
"💜 Sem conversa, não tem não monogamia que se sustente.\n\nFale do que sente sem medo, comece pelo \"eu senti\", seja transparente sobre desejos e limites, revisite os acordos e fuja dos segredos. Comunicar é uma das formas mais concretas de cuidar.\n\n👉 O que anda difícil de falar pra você? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #comunicacao #relacionamentos #psicologia #cnv"),

('2026-07-08','recursos-internos-nm','prat-03-recursos-internos',
"💜 A não monogamia se sustenta por dentro.\n\nAutoconhecimento, resiliência, empatia, flexibilidade, comunicação não violenta e autonomia: são as ferramentas internas que seguram qualquer vínculo, com uma pessoa ou com várias.\n\n👉 Qual desses recursos você quer fortalecer? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #autoconhecimento #psicologia #relacionamentos #autonomia"),

('2026-07-09','dificuldades-nm','prat-04-dificuldades',
"💜 Os desafios reais da não monogamia, aqueles que ninguém te avisa.\n\nMedo do julgamento, insegurança, conflito de agendas, desejos diferentes, pressão pra se encaixar, comparação entre parceiros. Nenhuma dessas dores é sinal de fracasso, são material de crescimento.\n\n👉 Qual desses desafios mais te pega? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #relacionamentos #psicologia #relacaoaberta #autoconhecimento"),

('2026-07-10','organizacao-tempo-nm','prat-07-organizacao-tempo',
"💜 Dá tempo pra todo mundo?\n\nA agenda também é cuidado. Use ferramentas, priorize qualidade sobre quantidade, equilibre as áreas da vida, planeje momentos de verdade com cada pessoa e reserve tempo pra você. Organização previne desgaste e ressentimento.\n\n👉 Como você divide o tempo entre vínculos? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #relacionamentos #organizacao #psicologia #gestaodetempo"),

('2026-07-11','julgamento-social-nm','prat-08-julgamento-social',
"💜 A sua vida não é dos outros.\n\nNem todo mundo vai entender, e está tudo bem. Você não deve explicação a quem não importa. Procure os seus, não se culpe por não se encaixar e proteja-se por dentro. Viver a sua verdade tem algo de revolucionário.\n\n👉 Como você lida com o julgamento de fora? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #relacionamentos #psicologia #autenticidade #preconceito"),
]

sched = json.load(open(NMR+'/schedule.json', encoding='utf-8'))
existing = {p['id'] for p in sched['posts']}
added=0; copied=0
for date,pid,folder,cap in POSTS:
    sd_rel = 'slides/%s_%s' % (date, pid)
    sd_abs = '%s/%s' % (NMR, sd_rel)
    os.makedirs(sd_abs, exist_ok=True)
    srcs = sorted(glob.glob('%s/%s/v2/slides/slide-*.jpg' % (OUT, folder)))
    for s in srcs:
        shutil.copy(s, sd_abs + '/' + os.path.basename(s)); copied+=1
    if pid in existing:
        print('SKIP (id existe):', pid); continue
    sched['posts'].append({
        'id': pid,
        'scheduledAt': '%sT13:00:00-03:00' % date,
        'slidesDir': sd_rel,
        'caption': cap,
        'status': 'pending'
    })
    added+=1
    print('OK %s | %s | %d slides' % (date, pid, len(srcs)))

json.dump(sched, open(NMR+'/schedule.json','w',encoding='utf-8'), ensure_ascii=False, indent=2)
print('--- adicionados: %d | jpgs copiados: %d | total posts: %d' % (added, copied, len(sched['posts'])))
