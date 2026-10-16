"""Validate canonical indexable pages, article metadata and redirect exclusions."""
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DOMAIN = 'https://goria.co'
class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.meta = {}; self.canonicals = []; self.h1 = 0
        self.title = ''; self.schemas = []; self.mode = None; self.buffer = ''; self.lang = ''
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'html': self.lang = a.get('lang', '')
        if tag == 'h1': self.h1 += 1
        if tag == 'meta': self.meta[a.get('name', a.get('property', ''))] = a.get('content', '')
        if tag == 'link' and a.get('rel') == 'canonical': self.canonicals.append(a.get('href'))
        if tag == 'title' or (tag == 'script' and a.get('type') == 'application/ld+json'):
            self.mode = tag; self.buffer = ''
    def handle_data(self, data):
        if self.mode: self.buffer += data
    def handle_endtag(self, tag):
        if tag == self.mode:
            if tag == 'title': self.title = self.buffer
            else: self.schemas.append(json.loads(self.buffer))
            self.mode = None

ns = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
urls = [n.text for n in ET.parse(ROOT/'sitemap.xml').findall('s:url/s:loc', ns)]
assert len(urls) == len(set(urls)), 'Duplicate sitemap URL'
titles = set(); descriptions = set()
for url in urls:
    assert url.startswith(DOMAIN+'/'), url
    route = urlsplit(url).path
    file = ROOT / (route.lstrip('/') + 'index.html' if route.endswith('/') else route.lstrip('/'))
    page = Page(file.read_text())
    assert page.canonicals == [url], (url, 'canonical')
    assert page.h1 == 1 and page.lang, (url, 'H1 or language')
    assert 'noindex' not in page.meta.get('robots',''), (url, 'noindex')
    assert page.title and page.title not in titles, (url, 'title')
    desc = page.meta.get('description','')
    assert desc and desc not in descriptions, (url, 'description')
    titles.add(page.title); descriptions.add(desc)
    assert page.meta.get('og:url') == url, (url, 'OG URL')
    for key in ['og:image','twitter:image']:
        image = page.meta.get(key,'')
        assert image.startswith(DOMAIN+'/') and (ROOT/urlsplit(image).path.lstrip('/')).is_file(), (url,key)
    assert any(s.get('@type') == 'WebPage' for s in page.schemas), (url,'WebPage')
    for schema in page.schemas:
        if schema.get('@type') == 'Article':
            assert schema.get('headline') and schema.get('author',{}).get('name') and schema.get('datePublished'), (url,'Article')
            assert schema.get('image') and schema.get('mainEntityOfPage') == url, (url,'Article image')
        if schema.get('@type') == 'BreadcrumbList':
            entries = schema['itemListElement']
            assert len(entries) >= 2 and [e['position'] for e in entries] == list(range(1,len(entries)+1)), (url,'breadcrumbs')
            assert entries[-1]['item'] == url, (url,'breadcrumb destination')
# Old and unpublished routes must not compete with the canonical pages.
redirects = 0
for file in ROOT.rglob('*.html'):
    if any(part in ['node_modules','.git','pages','content'] for part in file.relative_to(ROOT).parts): continue
    text = file.read_text()
    if 'http-equiv="refresh"' not in text: continue
    page = Page(text); redirects += 1
    assert 'noindex' in page.meta.get('robots',''), str(file)
    assert page.canonicals and page.canonicals[0] in urls, str(file)
    own = DOMAIN + '/' + str(file.relative_to(ROOT)).replace('index.html','')
    assert own not in urls, str(file)
assert 'Sitemap: '+DOMAIN+'/sitemap.xml' in (ROOT/'robots.txt').read_text()
print(f'PASS: SEO metadata, schemas, images and canonicals for {len(urls)} indexable pages; {redirects} redirects excluded.')
