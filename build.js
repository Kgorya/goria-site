const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');
const matter = require('gray-matter');
const { marked } = require('marked');
marked.setOptions({ gfm: true, breaks: false });
const ROOT = __dirname;
const DOMAIN = 'https://goria.co';
const OUTPUT = process.env.SITE_OUTPUT_DIR ? path.resolve(process.env.SITE_OUTPUT_DIR) : ROOT;
const i18n = require('./lib/i18n');
const {analyticsConfig, analyticsMarkup} = require('./lib/analytics');
const analytics = analyticsConfig();
const translations = i18n.loadTranslations(ROOT, process.env.SITE_TRANSLATIONS_DIR);
const defaultLocale = i18n.config.defaultLocale;
function shellText(html, locale) {
  if (locale === defaultLocale) return html;
  // Translate only the shared shell; editorial HTML is supplied by each locale.
  const texts = ['Головна','Рішення','Кейси','Дослідження','Блог','До основного змісту','Goria, на головну','Основна навігація','Безкоштовний аудит','Меню','Мобільна навігація','Навігація в підвалі','Костянтин Горя','AI-системи для обробки звернень і заявок','Telegram-бот →','Telegram-канал →','Конфіденційність','Умови співпраці','Закрити','Обговоримо вашу задачу','Оберіть зручний формат зв’язку','Перевірити свої заявки →','Шість запитань. Бал з 10 і де губляться заявки','Написати Костянтину напряму →','Для швидких запитань або особистого обговорення','Без Telegram · написати на email'];
  const pattern = new RegExp(texts.sort((a,b)=>b.length-a.length).map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
  return i18n.rewriteLinks(html.replace(pattern, text => i18n.translate(text, locale)), locale, translations);
}
function languageLinks(baseUrl, locale) {
  const pages = i18n.variants(baseUrl, translations);
  if (pages.length < 2) return '';
  return `<nav class="language-switch" aria-label="${esc(i18n.translate('Мова',locale))}">${pages.map(p=>`<a href="${p.url}" lang="${p.locale}" hreflang="${p.locale}"${p.locale===locale?' aria-current="page"':''}>${esc(i18n.localeConfig(p.locale).label)}</a>`).join('')}</nav>`;
}
const assetVersion = file => createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex').slice(0, 12);
const NAVIGATION = [['home', '/', 'Головна'], ['products', '/products/', 'Рішення'], ['cases', '/cases/', 'Кейси'], ['research', '/blog/research/', 'Дослідження'], ['blog', '/blog/', 'Блог']];
const CONTACT = 'https://t.me/konstantin_goria_bot';
const PERSONAL_TG = 'https://t.me/Goria_Konstantin';
const CHANNEL_TG = 'https://t.me/konstantin_goria';
const botUrl = source => `${CONTACT}?start=test_${source}`;
const cleanHeading = value => String(value).replace(/[.:—]/g, ' ').replace(/\s+/g, ' ').trim();
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function write(file, value) { const target = path.join(OUTPUT, file); fs.mkdirSync(path.dirname(target), {recursive:true}); fs.writeFileSync(target,value); }
function header(active = '', locale = defaultLocale, baseUrl = '/') {
  const nav = NAVIGATION.map(([id, url, label]) => `<a href="${url}"${active === id ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  const html = `<a class="skip-link" href="#main">До основного змісту</a>
  <header class="site-header" id="top"><div class="shell header-inner">
    <a class="logo" href="/" aria-label="Goria, на головну">goria.</a>
    <nav class="desktop-nav" aria-label="Основна навігація">${nav}</nav>
    <a class="header-contact" href="${botUrl('header')}" target="_blank" rel="noopener noreferrer">Безкоштовний аудит</a>
    <button class="menu-toggle" aria-label="Меню" aria-expanded="false" aria-controls="mobile-nav" hidden><span></span><span></span></button>
  </div><nav class="mobile-nav shell" id="mobile-nav" aria-label="Мобільна навігація">${nav}<a href="${botUrl('menu')}" target="_blank" rel="noopener noreferrer">Безкоштовний аудит</a></nav>${languageLinks(baseUrl,locale)}</header>`;
  return shellText(html, locale);
}
function footer(locale = defaultLocale) {
  const settings = analytics.enabled ? `<button class="analytics-settings" type="button" data-analytics-settings>${esc(i18n.translate('Налаштування аналітики',locale))}</button>` : '';
  const html = `<footer class="site-footer"><div class="shell"><div class="footer-main">
  <div><a class="logo" href="/">goria.</a><p>Костянтин Горя<br>AI-системи для обробки звернень і заявок</p></div>
  <nav aria-label="Навігація в підвалі">${NAVIGATION.map(([,url,label]) => `<a href="${url}">${label}</a>`).join('')}</nav>
  <div class="footer-contacts"><a href="${botUrl('footer')}" target="_blank" rel="noopener noreferrer">Telegram-бот →</a><a href="${CHANNEL_TG}" target="_blank" rel="noopener noreferrer">Telegram-канал →</a><a href="mailto:kostya.gorya@gmail.com" target="_blank" rel="noopener noreferrer">kostya.gorya@gmail.com</a></div>
  </div></div><div class="footer-bar"><div class="shell footer-bottom"><span>© ${new Date().getFullYear()} Костянтин Горя</span><a href="/privacy.html">Конфіденційність</a><a href="/terms.html">Умови співпраці</a>${settings}</div></div></footer>
  <dialog class="contact-dialog" id="contact-dialog" aria-labelledby="contact-dialog-title"><div class="contact-dialog-inner">
    <button class="dialog-close" type="button" aria-label="Закрити">×</button>
    <h2 id="contact-dialog-title">Обговоримо вашу задачу</h2><p>Оберіть зручний формат зв’язку</p>
    <a class="button" id="dialog-test" href="${botUrl('contact')}" target="_blank" rel="noopener noreferrer">Пройти швидкий аудит →</a>
    <p class="note">Вісім запитань про бізнес і рекомендація за відповідями</p>
    <a class="text-link" href="${PERSONAL_TG}" target="_blank" rel="noopener noreferrer">Написати Костянтину напряму →</a>
    <p class="note">Для швидких запитань або особистого обговорення</p>
    <a class="email-fallback" id="dialog-email" href="mailto:kostya.gorya@gmail.com" target="_blank" rel="noopener noreferrer">Без Telegram · написати на email</a>
  </div></dialog><script src="/site.js?v=${assetVersion('site.js')}" defer></script>`;
  return shellText(html, locale);
}
function layout({title,description,url,active='',body,image='/assets/img/hero-1100.webp',type='website',schema=null,locale=defaultLocale,baseUrl=url}) {const localeSettings=i18n.localeConfig(locale); const alternatives=i18n.variants(baseUrl,translations); const alternateMarkup=alternatives.length>1?alternatives.map(p=>`<link rel="alternate" hreflang="${p.locale}" href="${DOMAIN}${p.url}">`).join(''):''; body=i18n.rewriteLinks(body,locale,translations); body = body.replace(/(<h1\b[^>]*>[\s\S]*?<\/h1>\s*<p class="lead">[\s\S]*?<\/p>)/g, '<div class="intro-copy">$1</div>'); body = body.replace(/(<h[1-6]\b[^>]*>)([\s\S]*?)(<\/h[1-6]>)/g, (_, open, inner, close) => open + inner.replace(/(^|>)([^<]+)/g, (__, prefix, text) => prefix + cleanHeading(text)) + close).replace(/—/g, ','); body = body.replace(/<a\b([^>]*\bhref="(?:https?:\/\/|mailto:)[^>]+)>/g, (_, attrs) => '<a' + attrs.replace(/\s(?:target|rel)="[^"]*"/g, '') + ' target="_blank" rel="noopener noreferrer">'); return `<!doctype html><html lang="${localeSettings.htmlLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)} | ${esc(i18n.translate('Костянтин Горя',locale))} · Goria</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#ffffff"><meta name="robots" content="index, follow"><link rel="canonical" href="${DOMAIN}${url}">${alternateMarkup}<meta property="og:type" content="${type}"><meta property="og:locale" content="${localeSettings.ogLocale}"><meta property="og:site_name" content="Goria"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${DOMAIN}${url}"><meta property="og:image" content="${DOMAIN}${image}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/site.css?v=${assetVersion('site.css')}">${schema ? `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`:''}</head><body data-page="${esc(baseUrl === '/blog/' ? 'blog-catalog' : active)}">${header(active,locale,baseUrl)}<main id="main">${body}</main>${footer(locale)}${analyticsMarkup(analytics)}</body></html>`;}
function contactBlock(title = 'З чого почати', text = 'Пройдіть короткий аудит або напишіть мені про свою задачу.', source = 'contact') {
 return `<section class="section-surface" id="contact"><div class="section contact-section shell"><div class="cta-layout"><div class="cta-intro"><h2>${title}</h2><p class="lead">${text}</p></div><div class="cta-cards"><div class="cta-card"><div><h3>Швидкий аудит</h3><p>Кілька запитань про роботу зі зверненнями. За відповідями отримаєте підказки, що перевірити й що можна автоматизувати.</p></div><a class="text-link" href="${botUrl(source)}" target="_blank" rel="noopener noreferrer">Пройти аудит →</a></div><div class="cta-card"><div><h3>Написати мені</h3><p>Розкажіть, звідки приходять звернення та що забирає час команди. Обговоримо, чи допоможе автоматизація.</p></div><a class="text-link" href="${PERSONAL_TG}" target="_blank" rel="noopener noreferrer">Написати мені →</a></div></div></div></div></section>`;
}
function card(item) {
  const isResearch = item.group === 'research';
  const linkLabel = isResearch ? 'Читати дослідження →' : 'Читати статтю →';
  return `<article class="journal-card">
    <a class="journal-image" href="${item.url}" tabindex="-1" aria-hidden="true"><img src="${item.image}" alt="" width="1200" height="675" loading="lazy"></a>
    <h3><a href="${item.url}">${esc(cleanHeading(item.title))}</a></h3><p>${esc(item.description)}</p>
    <a class="text-link" href="${item.url}">${linkLabel}</a>
  </article>`;
}
function researchCard(item) {
  const metaParts = [];
  if (item.format) metaParts.push(item.format);
  if (item.period) metaParts.push(item.period);
  const metaHtml = metaParts.length > 0 ? `<div class="card-meta">${esc(metaParts.join(' · '))}</div>` : '';
  const imageHtml = item.image ? `<a class="case-card-image" href="${item.url}" tabindex="-1" aria-hidden="true"><img src="${item.image}" width="1200" height="675" alt="${esc(item.image_alt || item.title)}" loading="lazy"></a>` : '';
  return `<article class="case-card">${imageHtml}${metaHtml}<h3><a href="${item.url}">${esc(cleanHeading(item.title))}</a></h3><p>${esc(item.description)}</p><a class="text-link" href="${item.url}">Читати дослідження →</a></article>`;
}
function blogCard(item) {
  const dateFormatted = item.date ? new Intl.DateTimeFormat('uk-UA', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'}).format(new Date(item.date)) : '';
  const dateHtml = dateFormatted ? `<div class="card-meta"><time datetime="${esc(item.date)}">${dateFormatted}</time></div>` : '';
  const imageHtml = item.image ? `<a class="case-card-image" href="${item.url}" tabindex="-1" aria-hidden="true"><img src="${item.image}" width="1200" height="675" alt="${esc(item.image_alt || item.title)}" loading="lazy"></a>` : '';
  return `<article class="case-card">${imageHtml}${dateHtml}<h3><a href="${item.url}">${esc(cleanHeading(item.title))}</a></h3><p>${esc(item.description)}</p><a class="text-link" href="${item.url}">Читати статтю →</a></article>`;
}
function productCard(product) {
  return `<article class="product-card"><a class="product-card-image" href="${product.url}" tabindex="-1" aria-hidden="true"><img src="${product.image}" width="1200" height="675" alt="" loading="lazy"></a>
    <h3><a href="${product.url}">${esc(product.title)}</a></h3><p>${esc(product.description)}</p><a class="text-link" href="${product.url}">Подивитися рішення →</a></article>`;
}
function caseCard(item) {
  const isExternal = item.type === 'external';
  const originLabel = isExternal ? 'Досвід інших підприємців' : 'Мій досвід';
  const originHtml = `<div class="card-origin">${originLabel}</div>`;
  const linkLabel = item.linkLabel || (isExternal ? 'Читати розбір →' : 'Читати кейс →');
  const metaParts = [];
  if (item.process) metaParts.push(item.process);
  if (item.status) metaParts.push(item.status);
  if (item.sourceLabel) metaParts.push(item.sourceLabel);
  const metaHtml = metaParts.length > 0 ? `<div class="card-meta">${esc(metaParts.join(' · '))}</div>` : '';
  const imageHtml = item.image ? `<a class="case-card-image" href="${item.url}" tabindex="-1" aria-hidden="true"><img src="${item.image}" width="1200" height="675" alt="${esc(item.imageAlt || '')}" loading="lazy"></a>` : '';
  const noticeHtml = isExternal && item.unverifiedNotice ? `<p class="case-card-notice">${esc(item.unverifiedNotice)}</p>` : '';
  return `<article class="case-card">${imageHtml}${originHtml}${metaHtml}<h3><a href="${item.url}">${esc(cleanHeading(item.title))}</a></h3><p>${esc(item.description)}</p>${noticeHtml}<a class="text-link" href="${item.url}">${linkLabel}</a></article>`;
}
function blogOffer(item) {
 if (item.slug === 'kyiv-dentistry') return `<section class="section contact-section shell"><div class="audit-strip"><div><h2>Як ваша клініка відповідає ввечері</h2><p>Шаблон допоможе перевірити час відповіді й передачу діалогу ранковій зміні.</p></div><a class="button" href="/resources/evening-inquiries/">Про шаблон →</a></div></section>`;
 return contactBlock('Знайдіть задачу для автоматизації', 'Пройдіть короткий аудит та отримайте рекомендації під ваш процес. Або напишіть мені напряму.', 'blog_' + item.slug.replaceAll('-', '_'));
}
function loadItems() {const items=[]; for (const section of ['cases','tools','news']) { for(const file of fs.readdirSync(path.join(ROOT,'content',section)).filter(f=>f.endsWith('.md'))) {const {data,content}=matter(fs.readFileSync(path.join(ROOT,'content',section,file),'utf8'));const slug=data.slug || file.replace(/\.md$/,'');items.push({...data,title:cleanHeading(data.title),image:data.image || '/assets/img/engineer-desk.jpg',slug,section,kind:data.kind || (section==='cases'?'Дослідження':section==='tools'?'Інструменти':'Нотатка'),readTime:data.read_time || '4 хв',url:`/blog/${slug}/`,legacy:`/${section}/${slug}/`,bodyHtml:marked(content)});} }return items.sort((a,b)=>String(b.date).localeCompare(String(a.date)));}
function filters(selected='all') {return `<nav class="blog-filters" aria-label="Розділи блогу">${[['all','Усі матеріали','/blog/'],['research','Дослідження','/blog/research/'],['practice','Практика','/blog/practice/'],['tools','Інструменти','/blog/tools/']].map(([id,name,url])=>`<a href="${url}"${id===selected?' aria-current="page"':''}>${name}</a>`).join('')}</nav>`;}
function redirect(from,to) {write(from,`<!doctype html><html lang="uk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="refresh" content="0;url=${to}"><link rel="canonical" href="${DOMAIN}${to}"><meta name="robots" content="noindex, follow"><title>Сторінка переїхала · Goria</title></head><body><p>Сторінка переїхала. <a href="${to}">Перейти на нову адресу</a>.</p></body></html>`);}
const items=loadItems();
const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/products.json'), 'utf8')).sort((a,b) => b.order - a.order);
const casesData = fs.existsSync(path.join(ROOT, 'content/cases.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'content/cases.json'), 'utf8')).sort((a,b) => (b.order || 0) - (a.order || 0)) : [];
const ownCases = casesData.filter(c => c.type === 'own');
const externalCases = casesData.filter(c => c.type === 'external');
const staticPages=[['about','about/index.html','/about/','Про мене','Костянтин Горя. Досвід у продажах, маркетингу й автоматизації бізнес-процесів.','about'],['cases','cases/index.html','/cases/','Як AI допомагає в роботі бізнесу','Мої впровадження та розбори досвіду інших підприємців. Показую, яку задачу вирішує система, як вона працює та що потрібно для схожого впровадження.','cases'],['ecommerce-agent','products/ecommerce-agent/index.html','/products/ecommerce-agent/','AI-агент для інтернет-магазину','Стежить за заявками в CRM, ставить нагадування й готує відповіді клієнтам. Менеджер перевіряє листи перед відправленням.','products'],['resources','resources/index.html','/resources/','Матеріали для роботи','Аудит роботи з клієнтами та шаблон перевірки вечірніх повідомлень. Практичні інструменти для першого кроку.','resources'],['audit','resources/automation-test/index.html','/resources/automation-test/','Що автоматизувати в роботі з клієнтами','Кілька запитань у Telegram про звернення та заявки. Короткий розбір і рекомендації за відповідями.','resources'],['evening','resources/evening-inquiries/index.html','/resources/evening-inquiries/','Як клініка відповідає ввечері','Інструкція й шаблон, щоб перевірити час першої відповіді та передачу повідомлення адміністратору.','resources'],['home','index.html','/','Швидка відповідь 24/7, жодної втраченої заявки з реклами','AI-асистенти для магазинів та сфери послуг. Швидка відповідь 24/7, підхоплення звернень клієнтів та доведення до замовлення або запису.','home'],['products','products/index.html','/products/','Готові рішення для бізнесу','Оберіть рішення за вашою задачею. Налаштування та технічний супровід беру на себе.','products'],['dental','products/dental-assistant/index.html','/products/dental-assistant/','AI-асистент для стоматології','Відповідає на запитання про послуги та ціни, з’ясовує потребу пацієнта й допомагає обрати час. Перевірте демо Goria Dental та обговоріть запуск для клініки.','products']];
const baseRoutes = new Set([...staticPages.map(p=>p[2]), ...items.map(p=>p.url), '/blog/', '/blog/research/', '/privacy.html', '/terms.html']);
for (const page of translations) {
  if (!baseRoutes.has(page.baseUrl)) throw new Error(`Translation without original: ${page.baseUrl}`);
  if (!['home','products','cases','research','blog','about','resources',''].includes(page.active || '')) throw new Error(`Invalid navigation key: ${page.active}`);
}
for (const [source,file,url,title,description,active] of staticPages) {let body=fs.readFileSync(path.join(ROOT,'pages',`${source}.html`),'utf8');body=body.replace('{{products}}',products.slice(0,2).map(productCard).join(''))
  .replace('{{productsMore}}', products.length > 2 ? '<a class="text-link section-link" href="/products/">Усі продукти →</a>' : '')
  .replace('{{allProducts}}',products.map(productCard).join(''))
  .replace('{{cases}}', casesData.length > 0 ? casesData.map(caseCard).join('') : '<p class="cases-empty">Тут з’являтимуться впровадження та розбори досвіду.</p>')
  .replace('{{research}}',items.filter(i=>i.group==='research').slice(0,2).map(card).join(''))
  .replace('{{latest}}',items.filter(i=>i.group!=='research').slice(0,2).map(card).join(''))
  .replace('{{contact}}', source === 'products' ? contactBlock('Не знайшли рішення для свого бізнесу?', 'Пройдіть короткий аудит або напишіть мені. Розберемо, як ви зараз відповідаєте клієнтам, і перевіримо, чи можна адаптувати одне з рішень під вашу задачу.', 'products') : contactBlock(undefined, undefined, source));write(file,layout({title,description,url,active,body}));}
for(const item of items) {
  const isResearch = item.group === 'research';
  const author = `<aside class="author"><img src="/assets/img/about-750.webp" alt="Костянтин Горя" width="80" height="80" loading="lazy"><div><h2>Костянтин Горя</h2><p>Пишу про власні впровадження та дослідження роботи бізнесу.</p><a class="text-link" href="/#about">Про мене →</a></div></aside>`;
  const breadcrumbs = isResearch
    ? `<nav class="breadcrumbs" aria-label="Шлях до сторінки"><a href="/blog/research/">Дослідження</a><span aria-hidden="true">/</span><span>${esc(cleanHeading(item.title))}</span></nav>`
    : `<nav class="breadcrumbs" aria-label="Шлях до сторінки"><a href="/blog/">Блог</a><span aria-hidden="true">/</span><span>${esc(cleanHeading(item.title))}</span></nav>`;
  const relatedSection = isResearch
    ? `<section class="section shell"><h2>Інші дослідження</h2><div class="cases-grid">${items.filter(i => i.group === 'research' && i.slug !== item.slug).map(researchCard).join('')}</div></section>`
    : `<section class="section shell"><h2>Ще у блозі</h2><div class="cases-grid">${items.filter(i => i.group !== 'research' && i.slug !== item.slug).slice(0, 2).map(blogCard).join('')}</div></section>`;
  const body = `<header class="article-header prose-shell">${breadcrumbs}<h1>${esc(item.title)}</h1><p class="lead">${esc(item.description)}</p><div class="article-meta">${item.date ? `<time datetime="${esc(item.date)}">${new Intl.DateTimeFormat('uk-UA',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(item.date))}</time><span aria-hidden="true">·</span>`:''}<span>${esc(item.readTime)} читання</span></div></header><article class="prose-shell"><div class="prose"><figure class="article-image"><img src="${item.image}" alt="${esc(item.image_alt || 'Тематична ілюстрація до матеріалу')}" width="1200" height="675" loading="eager"><figcaption>Ілюстрація до матеріалу</figcaption></figure>${item.bodyHtml}</div>${author}</article>${blogOffer(item)}${relatedSection}`;
  write(`blog/${item.slug}/index.html`, layout({
    title: item.title,
    description: item.description,
    url: item.url,
    active: isResearch ? 'research' : 'blog',
    body,
    image: item.image,
    type: 'article',
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: item.title,
      description: item.description,
      datePublished: item.date,
      inLanguage: 'uk',
      url: DOMAIN + item.url,
      author: { '@type': 'Person', name: 'Костянтин Горя', url: DOMAIN + '/#about' }
    }
  }));
  redirect(`${item.section}/${item.slug}/index.html`, item.url);
}

const researchItems = items.filter(i => i.group === 'research');
const researchBody = `<header class="page-intro shell"><h1>Дослідження</h1><p class="lead">Перевіряю, як бізнес відповідає клієнтам і працює зі зверненнями. Публікую методику, результати та висновки, щоб ви могли перевірити схожі ситуації у своєму бізнесі.</p></header><section class="section section-tight shell"><div class="cases-grid">${researchItems.map(researchCard).join('')}</div></section>`;
write('blog/research/index.html', layout({
  title: 'Дослідження',
  description: 'Перевіряю, як бізнес відповідає клієнтам і працює зі зверненнями. Публікую методику, результати та висновки, щоб ви могли перевірити схожі ситуації у своєму бізнесі.',
  url: '/blog/research/',
  active: 'research',
  body: researchBody
}));

const blogItems = items.filter(i => i.group !== 'research');
const blogBody = `<header class="page-intro shell"><h1>Про звернення, продажі та AI</h1><p class="lead">Практичні статті про відповіді клієнтам, повторні контакти та організацію роботи із заявками. Пояснюю, де допомагає автоматизація і що варто залишити людині.</p></header><section class="section section-tight shell"><div class="cases-grid">${blogItems.map(blogCard).join('')}</div></section><section class="section shell"><div class="contact-panel contact-panel-split"><div class="contact-panel-copy"><h2>Хочете застосувати це у своєму бізнесі?</h2><p>Напишіть про свою задачу. Обговоримо, що можна автоматизувати та з чого варто почати.</p></div><div class="contact-panel-action"><a class="button" href="${PERSONAL_TG}" target="_blank" rel="noopener noreferrer">Обговорити задачу →</a></div></div></section>`;
write('blog/index.html', layout({
  title: 'Про звернення, продажі та AI',
  description: 'Практичні статті про відповіді клієнтам, повторні контакти та організацію роботи із заявками. Пояснюю, де допомагає автоматизація і що варто залишити людині.',
  url: '/blog/',
  active: 'blog',
  body: blogBody
}));

redirect('blog/practice/index.html', '/blog/');
redirect('blog/tools/index.html', '/blog/');
redirect('tools/index.html', '/blog/');
redirect('news/index.html', '/blog/');
redirect('stomatology/index.html', '/blog/kyiv-dentistry/');
redirect('products/shopify-preorder/index.html', '/products/ecommerce-agent/');

for(const file of ['privacy.html','terms.html']) {
  const html = fs.readFileSync(path.join(ROOT, 'pages', file), 'utf8');
  const content = html.match(/<div class="legal__inner">([\s\S]*?)<\/div>\s*<\/div>\s*<\/main>/)[1];
  const title = file === 'privacy.html' ? 'Політика конфіденційності' : 'Умови співпраці';
  write(file, layout({
    title,
    description: title + ' Goria та Костянтина Горі.',
    url: '/' + file,
    body: `<article class="legal prose-shell"><div class="prose">${content}</div></article>`
  }));
}

// Remove only translated HTML files recorded by a previous build, never source files.
const localeOutputManifest = path.join(OUTPUT, '.generated-locales.json');
const currentLocaleUrls = translations.map(page => page.url);
if (fs.existsSync(localeOutputManifest)) {
  for (const url of JSON.parse(fs.readFileSync(localeOutputManifest, 'utf8'))) {
    if (currentLocaleUrls.includes(url)) continue;
    if (typeof url !== 'string' || !/^\/[a-z]{2}(?:-[A-Z]{2})?\//.test(url) || url.includes('..')) throw new Error('Invalid previous locale output');
    const target = path.resolve(OUTPUT, i18n.outputFile(url));
    if (!target.startsWith(path.resolve(OUTPUT) + path.sep) || !target.endsWith('.html')) throw new Error('Unsafe previous locale output');
    if (fs.existsSync(target)) fs.unlinkSync(target);
  }
}
write('.generated-locales.json', JSON.stringify(currentLocaleUrls, null, 2) + '\n');

for (const page of translations) {
  const schema = page.schema ? {...page.schema, inLanguage:page.locale, url:DOMAIN+page.url} : null;
  write(i18n.outputFile(page.url), layout({...page, schema}));
}

const urls = [
  '/',
  '/products/',
  '/products/dental-assistant/',
  '/products/ecommerce-agent/',
  '/cases/',
  '/blog/research/',
  '/blog/',
  '/about/',
  '/resources/',
  '/resources/automation-test/',
  '/resources/evening-inquiries/',
  '/privacy.html',
  '/terms.html',
  ...items.map(i => i.url),
  ...translations.map(p => p.url)
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${DOMAIN}${url}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`Built ${staticPages.length} main pages, ${items.length} articles, blog catalog, research catalog and 2 legal pages.`);
