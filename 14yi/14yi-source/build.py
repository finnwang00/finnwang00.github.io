"""把 src/ 下的源码、数据和字体子集打包成一个可直接发布的 index.html。
用法：pip install fonttools  然后  python3 build.py
输出：../14yi-site/index.html（如不存在会自动创建）
"""
import pathlib, base64, io, json, os, sys
from fontTools import subset
from fontTools.ttLib import TTFont

R = pathlib.Path(__file__).parent
S = R / 'src'
OUT = R.parent / '14yi-site'
OUT.mkdir(exist_ok=True)
# 思源宋体（Noto Serif CJK）：从 https://github.com/notofonts/noto-cjk 下载 NotoSerifCJK-Black.ttc 和 NotoSerifCJK-SemiBold.ttc 放进 fonts/
NOTO_BLACK = os.environ.get('NOTO_BLACK', str(R / 'fonts' / 'NotoSerifCJK-Black.ttc'))
NOTO_SEMI = os.environ.get('NOTO_SEMI', str(R / 'fonts' / 'NotoSerifCJK-SemiBold.ttc'))
SC_INDEX = 2  # ttc 里简体中文（SC）的序号

t = (S / 'template.html').read_text(encoding='utf8')
for k in ['DATA', 'ERA', 'PERS', 'ENGINE', 'CHOICES', 'UI']:
    t = t.replace('/*%s*/' % k, (S / (k.lower() + '.js')).read_text(encoding='utf8'))
chars = set(t) | set('0123456789“”‘’，。！？、：；（）《》—…·')

def sub(path, uni, num=None):
    f = TTFont(path, fontNumber=num) if num is not None else TTFont(path)
    o = subset.Options(); o.flavor = 'woff'; o.layout_features = ['kern', 'liga', 'palt']
    o.name_IDs = [0, 1, 2, 3, 4, 5, 6]; o.hinting = False; o.desubroutinize = True
    s = subset.Subsetter(o); s.populate(unicodes=[ord(c) for c in uni if ord(c) > 32]); s.subset(f)
    b = io.BytesIO(); f.flavor = 'woff'; f.save(b); return base64.b64encode(b.getvalue()).decode()

css = '@font-face{font-family:"LC14";src:url(data:font/woff;base64,%s) format("woff");font-display:swap}\n' % sub(R / 'fonts' / 'LongCang-Regular.ttf', chars)
if os.path.exists(NOTO_BLACK) and os.path.exists(NOTO_SEMI):
    css += '@font-face{font-family:"NS14";font-weight:900;src:url(data:font/woff;base64,%s) format("woff");font-display:swap}\n' % sub(NOTO_BLACK, chars, SC_INDEX)
    css += '@font-face{font-family:"NS14";font-weight:500 800;src:url(data:font/woff;base64,%s) format("woff");font-display:swap}\n' % sub(NOTO_SEMI, chars, SC_INDEX)
else:
    print('提示：没找到思源宋体文件，标题会用系统宋体。', file=sys.stderr)
lc = ''.join(sorted(c for c in chars if ord(c) > 127))
body = t.replace('/*FONTS*/', css).replace('/*LCCHARS*/', 'const LC_CHARS = ' + json.dumps(lc, ensure_ascii=False) + ';')
desc = '按真实统计随机出生为一个中国人：可以生在1950年至今的任何一年，经历那个年代的大事和流行文化，做二选一的人生抉择，看性格怎样被一生改变。'
title = '<title>14亿分之1</title>'
body = body.replace(title, '', 1)
body = body.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '', 1)
body = body.replace('<meta name="description" content="按真实统计随机出生成为一个中国新生儿，过完TA的一生。">\n', '', 1)
head = f'''<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{title}
<meta name="description" content="{desc}">
<meta name="theme-color" content="#b88a52">
<meta property="og:title" content="14亿分之1">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="website">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<style>html{{-webkit-text-size-adjust:100%}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}</style>
</head>
<body>
'''
(OUT / 'index.html').write_text(head + body + '\n</body>\n</html>\n', encoding='utf8')
print('已生成', OUT / 'index.html', round((OUT / 'index.html').stat().st_size / 1e6, 2), 'MB')
