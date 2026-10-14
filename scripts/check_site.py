from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import re
root=Path(__file__).resolve().parent.parent; errors=[]
class Page(HTMLParser):
 def __init__(self):super().__init__();self.links=[];self.ids=[];self.headings=[];self.h=None;self.text=[];self.navs=[];self.nav=None;self.anchor=None;self.assets=[]
 def handle_starttag(self,t,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if t=='nav':self.nav={'label':a.get('aria-label'), 'links':[]};self.navs.append(self.nav)
  if t=='a' and self.nav is not None:self.anchor=[a.get('href'), ''];self.nav['links'].append(self.anchor)
  if t in ['img','script'] and a.get('src'):self.assets.append(a['src'])
  if t=='link' and a.get('rel') in ['stylesheet','icon']:self.assets.append(a.get('href'))
  if t=='a':self.links.append(a)
  if re.fullmatch('h[1-6]',t):self.h=[t,''];self.headings.append(self.h)
 def handle_endtag(self,t):
  if t=='nav':self.nav=None
  if t=='a':self.anchor=None
  if self.h and t==self.h[0]:self.h=None
 def handle_data(self,d):
  self.text.append(d)
  if self.anchor is not None:self.anchor[1]+=d
  if self.h:self.h[1]+=d
pages={}
for p in root.rglob('*.html'):
 if any(n in p.parts for n in ['node_modules','pages']):continue
 q=Page();q.feed(p.read_text());pages[p]=q
for p,q in pages.items():
 if '<meta http-equiv="refresh"' in p.read_text():continue
 expected=[['/','Головна'],['/products/','Рішення'],['/cases/','Кейси'],['/blog/','Блог']]
 for label in ['Основна навігація','Мобільна навігація','Навігація в підвалі']:
  menus=[n for n in q.navs if n['label']==label]
  if len(menus)!=1 or menus[0]['links'][:4]!=expected:errors.append(f'Navigation {p}: {label}')
 for asset in q.assets:
  u=urlsplit(asset)
  dest=root/unquote(u.path).lstrip('/') if u.path.startswith('/') else p.parent/unquote(u.path)
  if not u.scheme and not dest.exists():errors.append(f'Missing asset {p}: {asset}')
 if sum(t=='h1' for t,v in q.headings)!=1:errors.append(f'H1 {p}')
 if len(q.ids)!=len(set(q.ids)):errors.append(f'IDs {p}')
 if any(re.search('[.:—]',v) for t,v in q.headings):errors.append(f'Heading punctuation {p}')
 if re.search(r'\bтест\w*\b',' '.join(q.text),re.I):errors.append(f'Test terminology {p}')
 for a in q.links:
  u=urlsplit(a.get('href',''))
  if u.scheme in ['http','https']:
   if a.get('target')!='_blank' or 'noopener' not in a.get('rel',''):errors.append(f'External tab {p} {a}')
   continue
  if u.scheme:continue
  dest=root/unquote(u.path).lstrip('/') if u.path.startswith('/') else p.parent/unquote(u.path) if u.path else p
  if dest.is_dir():dest=dest/'index.html'
  if not dest.exists():errors.append(f'Broken {p}: {a}')
  if u.fragment and dest in pages and u.fragment not in pages[dest].ids:errors.append(f'Anchor {p}: {a}')
assert not errors, '\n'.join(errors)
home=pages[root/'index.html']
assert (root/'index.html').read_text().count('class="journal-card"')==2
assert not (root/'resources/evening-inquiries/checklist.txt').exists()
assert 'Видача в боті готується' in (root/'resources/index.html').read_text()
assert 'start=resource_evening' not in (root/'resources/evening-inquiries/index.html').read_text()
print(f'PASS: {len(pages)} HTML files, identical menus, headings, terminology, assets, external tabs, local links and anchors, two-card blocks, gated resource')
