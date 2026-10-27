"""Render typographic article covers from content/covers.json into assets/img/covers/<slug>.jpg.

Usage: python3 scripts/covers.py [slug ...]   (no slugs = all)
Needs Google Chrome for headless rendering and macOS sips for jpg conversion.
"""
import html, json, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
THEMES = {'light': ('#f3f1ec', '#191919'), 'dark': ('#191919', '#f3f1ec')}
FONTS = (ROOT / 'assets/fonts').as_uri()

def page(spec):
    bg, ink = THEMES[spec['theme']]
    facts = ''.join(f'<div><b>{html.escape(n)}</b>{html.escape(t)}</div>' for n, t in spec['facts'])
    return f"""<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:G;src:url('{FONTS}/eb-garamond-regular.ttf')}}
@font-face{{font-family:I;src:url('{FONTS}/inter-cyrillic.woff2')}}
@font-face{{font-family:I;src:url('{FONTS}/inter-latin.woff2');unicode-range:U+0000-00FF}}
html,body{{margin:0}}body{{width:1600px;height:900px;background:{bg};color:{ink};font-family:I;box-sizing:border-box;padding:110px 120px;display:flex;flex-direction:column;justify-content:space-between}}
.k{{font-size:30px;letter-spacing:.06em;text-transform:uppercase;opacity:.6}}
h1{{font-family:G;font-weight:400;font-size:112px;line-height:1.02;margin:0;max-width:1300px;letter-spacing:-.01em}}
.n{{display:flex;gap:90px;font-size:30px;opacity:.85}}.n b{{display:block;font-family:G;font-weight:400;font-size:84px;line-height:1;margin-bottom:10px}}
</style><div class="k">{html.escape(spec['label'])}</div><h1>{html.escape(spec['title'])}</h1><div class="n">{facts}</div>"""

def main(slugs):
    specs = json.loads((ROOT / 'content/covers.json').read_text())
    out = ROOT / 'assets/img/covers'
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        for slug in slugs or specs:
            src, png = Path(tmp) / f'{slug}.html', Path(tmp) / f'{slug}.png'
            src.write_text(page(specs[slug]))
            subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
                            '--window-size=1600,900', f'--screenshot={png}', src.as_uri()], check=True, capture_output=True)
            subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '88', str(png), '--out', str(out / f'{slug}.jpg')], check=True, capture_output=True)
            print('ok', slug)

if __name__ == '__main__':
    main(sys.argv[1:])
