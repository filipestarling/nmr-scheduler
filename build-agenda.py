# -*- coding: utf-8 -*-
import json, os, glob, shutil

OUT = 'C:/Users/filip/squads/squads/conteudo-instagram/output'
NMR = 'C:/Users/filip/nmr-scheduler'

# (data, id, pasta_do_carrossel, caption) — ordem variada, 17/06 a 04/07
POSTS = [
('2026-06-17','dados-2-milhoes','novo-01-dados-2-milhoes',
"💜 A não monogamia é mais comum do que parece.\n\nDois estudos com amostras nacionais nos EUA apontam que cerca de 21% das pessoas já viveram uma relação não monogâmica consentida; no Brasil, uma pesquisa recente fala em 53%. O desejo sempre existiu — novo é poder dizer em voz alta.\n\n👉 Esses números te surpreendem? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #dados #psicologia #relacionamentos #relacoesabertas"),

('2026-06-18','monogamia-posse','ev-01-monogamia-posse',
"💜 A monogamia sempre foi uma forma de posse.\n\nDá pra amar uma pessoa só a vida inteira sem tratá-la como propriedade. O problema nunca foi a monogamia — foi a posse disfarçada de amor.\n\n👉 A sua monogamia te liberta ou te prende? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #monogamia #amorlivre #psicologia #relacionamentos"),

('2026-06-19','mitos-nm','novo-05-mitos-nm',
"💜 5 mentiras que te contaram sobre a não monogamia.\n\n\"É desculpa pra trair\", \"é falta de amor\", \"quem ama não divide\"... quase tudo que você ouviu é caricatura. Desmontar o mito não empurra ninguém pra lugar nenhum — só limpa a lente pra você escolher informado.\n\n👉 Qual desses mitos você já ouviu? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #mitos #psicologia #relacoesabertas #relacionamentos"),

('2026-06-20','sociedade-ja-nao-mono','ev-02-sociedade-ja-nao-mono',
"💜 A sociedade já é não monogâmica. Só finge que não.\n\nVários levantamentos apontam índices de traição perto de 70%. Não é exceção de gente \"sem caráter\" — talvez o problema esteja no modelo, não nas pessoas. Honestidade no lugar da máscara.\n\n👉 Por que ainda fingimos que a exclusividade é a regra? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #traicao #monogamia #psicologia #relacionamentos"),

('2026-06-21','compersao','novo-03-compersao',
"💜 Compersão: a alegria de ver quem você ama feliz com outra pessoa.\n\nFalam dela como o oposto do ciúme, mas não é bem assim — os dois cabem no mesmo peito. Ninguém deve sentir compersão na marra; ela se cultiva com segurança interna e tempo.\n\n👉 Você já sentiu compersão de verdade? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #compersao #ciume #psicologia #inteligenciaemocional"),

('2026-06-22','fechar-a-relacao','ev-03-fechar-a-relacao',
"💜 Às vezes o certo não é abrir. É fechar.\n\nTodo mundo fala em abrir a relação; quase ninguém fala da outra metade do caminho — reconhecer a hora de fechar de novo, nem que seja por um tempo. Recuar também é cuidado.\n\n👉 Você já precisou dar um passo pra trás? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #relacaoaberta #psicologia #relacionamentos #cuidado"),

('2026-06-23','poliamor-aberta-nm','novo-06-poliamor-aberta-nm',
"💜 Poliamor, relação aberta e não monogamia não são a mesma coisa.\n\nNão monogamia é o guarda-chuva; embaixo dele cabem relação aberta, poliamor, anarquia relacional e mais. Misturar os termos atrapalha os acordos — nomear destrava a conversa.\n\n👉 Você já conhecia essas diferenças? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #relacaoaberta #anarquiarelacional #psicologia #relacionamentos"),

('2026-06-24','nm-pode-ser-sofrida','ev-04-nm-pode-ser-sofrida',
"💜 A não monogamia pode ser difícil pra caramba. E normalizar isso é parte da cura.\n\nDá pra desejar a NM com toda a sinceridade e ainda assim tremer de medo. Seus piores medos — ciúme, insegurança, sensação de descontrole — são comuns. Você não está sozinho nem quebrado.\n\n👉 Quem se identificou com isso, comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #psicologia #relacoesabertas #autoconhecimento #vulnerabilidade"),

('2026-06-25','monogamia-compulsoria','novo-02-monogamia-compulsoria',
"💜 E se você nunca tivesse realmente escolhido a monogamia?\n\nMonogamia compulsória é o conjunto de regras que tratam a exclusividade como o único caminho normal — o ar que a gente respira sem perceber. Duvidar não é atacar: é devolver a ela o lugar de escolha.\n\n👉 Você escolheu de verdade ou foi escolhido pela sociedade? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #monogamiacompulsoria #psicologia #relacionamentos #liberdade"),

('2026-06-26','zona-cinzenta','ev-07-zona-cinzenta',
"💜 A zona cinzenta dos acordos: o detalhe que vocês esqueceram de combinar.\n\nA maioria das brigas não nasce do acordo em si — nasce do que cada um imaginou que ele significava. Na dúvida, abstenha-se até conversar. Comunicação é o coração de tudo.\n\n👉 Você já caiu numa zona cinzenta? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #acordos #comunicacao #psicologia #relacionamentos"),

('2026-06-27','nm-nao-traumatiza','novo-09-nm-nao-traumatiza',
"💜 A não monogamia não traumatiza. O despreparo, sim.\n\nA dor raramente vem do modelo — vem de entrar nele sem as ferramentas pra sustentá-lo. Não é a estrada que machuca; é dirigir nela no escuro. Com preparo, a mesma experiência vira crescimento.\n\n👉 Na sua experiência, falta mais informação ou preparo emocional? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #psicologia #relacoesabertas #autoconhecimento #trauma"),

('2026-06-28','conto-do-unicornio','ev-05-conto-do-unicornio',
"💜 Cuidado com o conto do unicórnio.\n\nÉ a pessoa procurada pra \"completar\" o casal — desejada enquanto serve à fantasia e descartada quando surge a primeira insegurança. Relação principal não é escudo: hierarquia não é licença pra crueldade.\n\n👉 Você já viu (ou viveu) o conto do unicórnio? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #unicornio #responsabilidadeafetiva #psicologia #relacionamentos"),

('2026-06-29','teoria-x-pratica','novo-07-teoria-x-pratica',
"💜 Na teoria, a não monogamia parecia simples. Aí veio a prática.\n\nConcordar é fácil quando a liberdade ainda é abstrata. O nó aparece quando o outro exerce, de verdade, a liberdade que vocês combinaram. O abismo entre teoria e prática não é fracasso — é onde o trabalho começa.\n\n👉 O que mais te pegou de surpresa na NM? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #psicologia #relacoesabertas #relacionamentos #autoconhecimento"),

('2026-06-30','ninguem-100-nao-mono','ev-06-ninguem-100-nao-mono',
"💜 Ninguém é 100% não monogâmico. E perseguir esse ideal te adoece.\n\nFomos criados na monogamia — é inevitável carregar resquícios. Criar um \"não mono de verdade\" é tão opressor quanto a norma que a gente quis largar. Gentileza com o seu processo.\n\n👉 Você já se sentiu inadequado por não ser \"não mono suficiente\"? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #psicologia #autocobranca #relacoesabertas #autoconhecimento"),

('2026-07-01','controle-disfarcado','novo-08-controle-disfarcado',
"💜 Quando o acordo vira ferramenta de controle.\n\nAcordo é o que você sustenta; controle é o que você impõe ao outro. Diante de cada regra, pergunte: isto protege a relação, ou protege o meu medo? Controle disfarçado de amor adoece.\n\n👉 Você já confundiu controle com acordo? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #controle #acordos #psicologia #relacionamentos"),

('2026-07-02','glossario-termos','ev-08-glossario-termos',
"💜 O glossário que ninguém te explicou.\n\nSolopoli, compersão, simbiossexualidade, metamor, NRE, polifidelidade... saber o nome não é pedantismo — é a base pra combinar com clareza o que vocês de fato querem.\n\n👉 Qual desses termos você não conhecia? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #glossario #anarquiarelacional #psicologia #relacionamentos"),

('2026-07-03','autonomia-maturidade-fuga','novo-10-autonomia-maturidade-fuga',
"💜 Nem toda autonomia é maturidade. Às vezes é fuga.\n\nAutonomia saudável é poder se vincular sem se perder. Como defesa, é manter todo mundo a uma distância segura pra nunca doer. A intimidade não mora no número de vínculos — mora na profundidade que você se permite alcançar.\n\n👉 Sua autonomia te aproxima ou te protege? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #autonomia #apego #psicologia #autoconhecimento"),

('2026-07-04','nm-machista','novo-11-nm-machista',
"💜 A não monogamia também pode ser machista.\n\nUsar o vocabulário da liberdade pra reorganizar privilégios antigos: um colhe a aventura, o outro segura a barra emocional sozinho. Trocar o nome não muda a estrutura — não monogamia ética distribui o cuidado.\n\n👉 Você já viu liberdade virar privilégio de um lado só? Comenta aqui 💜\n\n.\n.\n.\n#poliamor #naomonogamia #naomonogamiaresponsavel #machismo #responsabilidadeafetiva #psicologia #relacionamentos"),
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
