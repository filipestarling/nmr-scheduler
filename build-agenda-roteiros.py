# -*- coding: utf-8 -*-
import json, os, glob, shutil

EMC = 'C:/Users/filip/squads/squads/conteudo-instagram/output/_EM-CONSTRUCAO'
NMR = 'C:/Users/filip/nmr-scheduler'

# (data, id, pasta_origem, caption) — lote prático-psicológico, 12/07 a 16/07, ordem intercalada
POSTS = [
('2026-07-12','ciume-no-corpo','ciume-mora-no-corpo',
"💜 O ciúme não nasce na cabeça. Nasce no corpo.\n\nAntes de qualquer pensamento, o sistema nervoso já leu ameaça e disparou o alarme: o peito aperta, a respiração encurta. Por isso a razão sozinha não acalma. Primeiro o corpo, depois a conversa, e aí o ciúme vira informação, não acusação.\n\n👉 O seu ciúme aparece primeiro no corpo ou na cabeça? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #ciume #psicologia #relacionamentos #sistemanervoso"),

('2026-07-13','desromantizando-inicio','desromantizando-o-inicio',
"💜 Ninguém chega na não monogamia pronto.\n\nA maioria chega pela vida, não pela teoria: pela dor, pela traição, por uma crise, pela vontade de respirar diferente. Primeiro a gente vive, erra, se contradiz, e só depois entende. Chegar ferido não te desqualifica, e normalizar o começo bagunçado não é o mesmo que liberar o estrago.\n\n👉 Como foi (ou está sendo) o seu começo na não monogamia? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #psicologia #relacionamentos #autoconhecimento #relacaoaberta"),

('2026-07-14','limite-ou-muro','limites-ou-muros',
"💜 Será que é um limite? Ou é um muro?\n\nO limite protege o vínculo, ao definir o que você consegue sustentar. O muro protege você do vínculo, mantendo o outro a distância, e adora se vestir de autocuidado. Uma pergunta separa os dois: eu me afasto porque essa relação me faz mal, ou porque não sei lidar com o que sinto perto dela?\n\n👉 Você já chamou de limite algo que era, no fundo, um muro? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #limites #psicologia #relacionamentos #autoconhecimento"),

('2026-07-15','frieza-nao-e-evolucao','frieza-nao-e-evolucao',
"💜 Confundiram frieza com evolução.\n\nVirou comum tratar indiferença como maturidade. Mas evolução emocional não é sentir menos: é sentir e sustentar o que aparece sem desabar nem fugir. Boa parte da frieza é defesa, e quem anestesia pra não sofrer também anestesia pra não se ligar. Amadurecer amplia, não amputa.\n\n👉 Você já confundiu frieza com evolução? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #psicologia #maturidadeemocional #relacionamentos #autoconhecimento"),

('2026-07-16','liberdade-vira-individualismo','individualismo-na-nm',
"💜 Quando a liberdade vira individualismo.\n\n\"Seu ciúme é problema seu, resolve na terapia.\" A frase soa madura, mas faz um truque: empurra todo o desconforto pro outro. Tem uma meia verdade aí, cada um cuida do que sente. Só que vínculo tem duas pontas: o sentimento é seu pra cuidar, a relação é de vocês pra sustentar. Acompanhar não é consertar, e autonomia madura distribui cuidado.\n\n👉 Você já ouviu (ou disse) \"seu ciúme é problema seu\"? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #responsabilidadeafetiva #psicologia #relacionamentos #autonomia"),
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
print('--- adicionados: %d | jpgs: %d | total posts: %d' % (added, copied, len(sched['posts'])))
