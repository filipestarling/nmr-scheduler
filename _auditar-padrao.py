# -*- coding: utf-8 -*-
"""
Audita os carrosseis publicados/agendados contra o padrao atual.

SLIDE 09 (CTA)  - por analise de cor:
   . accent unico em lilas  -> fora do padrao (deve ser coral)
   . emoji roxo no botao    -> fora do padrao (botao e' so "Comenta aqui")

SLIDE 10 (final) - por comparacao com a referencia:
   o slide final tem conteudo FIXO, entao todos deveriam ser praticamente
   identicos. Qualquer diferenca relevante = versao antiga do template.

Saida: _AUDITORIA-PADRAO.txt
"""
import io, os, sys
import numpy as np
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
SLIDES = os.path.join(BASE, 'slides')

CORAL  = np.array([248, 113, 113])
LILAS  = np.array([196, 181, 253])
ROXO_EMOJI = np.array([155, 89, 182])   # coracao roxo do Segoe UI Emoji

def perto(arr, cor, tol=34):
    return (np.abs(arr.astype(int) - cor).sum(axis=2) < tol)

def ultimo_slide(pasta):
    js = sorted(f for f in os.listdir(pasta) if f.startswith('slide-') and f.endswith('.jpg'))
    return js[-1] if js else None

def analisa_cta(caminho):
    """devolve (n_coral, n_lilas, n_emoji) na faixa do texto do CTA"""
    im = np.array(Image.open(caminho).convert('RGB'))
    h = im.shape[0]
    # faixa do titulo do CTA: entre 30% e 62% da altura (fora do divisor e do botao)
    faixa = im[int(h*0.30):int(h*0.62)]
    # faixa do botao: 58% a 78%
    botao = im[int(h*0.58):int(h*0.78)]
    return (int(perto(faixa, CORAL).sum()),
            int(perto(faixa, LILAS).sum()),
            int(perto(botao, ROXO_EMOJI, 46).sum()))

def assinatura(caminho):
    """miniatura em escala de cinza, pra comparar slides finais"""
    im = Image.open(caminho).convert('L').resize((96, 128))
    return np.array(im, dtype=np.int16)

pastas = sorted(d for d in os.listdir(SLIDES) if os.path.isdir(os.path.join(SLIDES, d)))

# referencia do slide final: o que acabei de renderizar no padrao atual
REF = os.path.join(SLIDES, '2026-06-10_quem-sou-sem-exclusividade', 'slide-10.jpg')
ref_sig = assinatura(REF)
ref_h = Image.open(REF).size[1]

linhas, problemas = [], []
for d in pastas:
    p = os.path.join(SLIDES, d)
    ult = ultimo_slide(p)
    if not ult:
        linhas.append((d, 'SEM SLIDES', '', '')); continue
    n_slides = len([f for f in os.listdir(p) if f.startswith('slide-') and f.endswith('.jpg')])
    final_path = os.path.join(p, ult)
    alt = Image.open(final_path).size[1]

    # --- slide final ---
    if n_slides < 10:
        st_final = 'so %d slides (sem final fixo?)' % n_slides
    else:
        dif = int(np.abs(assinatura(final_path) - ref_sig).mean())
        if alt != ref_h:
            st_final = 'altura %d (formato na-midia)' % alt
            if dif > 12: st_final += ' + DIFERE (%d)' % dif
        elif dif <= 6:
            st_final = 'ok'
        else:
            st_final = 'DIFERE da referencia (%d)' % dif

    # --- CTA (penultimo slide) ---
    cta_path = os.path.join(p, 'slide-%02d.jpg' % (n_slides - 1)) if n_slides >= 2 else None
    st_cta = '?'
    if cta_path and os.path.exists(cta_path):
        c, l, e = analisa_cta(cta_path)
        marcas = []
        if c < 300 and l > 300: marcas.append('accent LILAS')
        if c < 300 and l < 300: marcas.append('sem accent')
        if e > 120: marcas.append('emoji no botao')
        st_cta = ' + '.join(marcas) if marcas else 'ok'

    linhas.append((d, str(n_slides), st_cta, st_final))
    if st_cta != 'ok' or st_final not in ('ok',) and 'na-midia' not in st_final:
        problemas.append((d, st_cta, st_final))

with io.open(os.path.join(BASE, '_AUDITORIA-PADRAO.txt'), 'w', encoding='utf-8') as f:
    f.write('AUDITORIA DE PADRAO - %d carrosseis\n' % len(pastas))
    f.write('=' * 78 + '\n')
    f.write('CTA   = slide 09: accent unico deve ser CORAL, botao sem emoji\n')
    f.write('FINAL = slide 10: conteudo fixo, comparado com a referencia atual\n')
    f.write('=' * 78 + '\n\n')
    f.write('%-52s %3s  %-28s %s\n' % ('POST', 'N', 'CTA', 'FINAL'))
    f.write('-' * 78 + '\n')
    for d, n, cta, fin in linhas:
        f.write('%-52s %3s  %-28s %s\n' % (d[:52], n, cta, fin))
    f.write('\n\n' + '=' * 78 + '\nFORA DO PADRAO: %d\n' % len(problemas) + '=' * 78 + '\n')
    for d, cta, fin in problemas:
        f.write('%-52s  CTA: %-26s FINAL: %s\n' % (d[:52], cta, fin))

print('carrosseis analisados: %d' % len(pastas))
print('fora do padrao: %d' % len(problemas))
print('relatorio: _AUDITORIA-PADRAO.txt')
