/* First-party loader. Vendor scripts are requested only after opt-in on production hosts. */
(() => {
  'use strict';
  const element = document.getElementById('analytics-config');
  if (!element) return;
  let config;
  try { config = JSON.parse(element.textContent); } catch { return; }
  if (!config.enabled || !config.allowedHosts.includes(location.hostname)) return;
  const key = 'goria.analytics-consent.v1';
  const maxAge = 180 * 86400000;
  const english = document.documentElement.lang.startsWith('en');
  const copy = english ? {
    title:'Website analytics', text:'With your permission, Google Analytics measures visits and Microsoft Clarity records page interactions. This helps me improve the website.',
    accept:'Allow analytics', reject:'Decline', privacy:'Privacy policy'
  } : {
    title:'Аналітика сайту', text:'З вашого дозволу Google Analytics збирає статистику відвідувань, а Microsoft Clarity записує взаємодію зі сторінками. Це допомагає мені покращувати сайт.',
    accept:'Дозволити аналітику', reject:'Відмовитися', privacy:'Політика конфіденційності'
  };
  let loaded = false;
  let consent = null;
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved && ['granted','denied'].includes(saved.value) && Date.now() - saved.time < maxAge) consent = saved.value;
  } catch { /* A blocked storage API must not break the website. */ }
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function() { window.dataLayer.push(arguments); };
  const denied = {analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'};
  window.gtag('consent','default',denied);
  function appendScript(src) {
    const script = document.createElement('script'); script.async = true; script.src = src;
    document.head.appendChild(script);
  }
  function cleanUrl(value) {
    try { const url = new URL(value,location.origin); return url.origin + url.pathname; } catch { return ''; }
  }
  function start() {
    if (loaded || consent !== 'granted') return;
    loaded = true;
    if (config.ga4MeasurementId) {
      window.gtag('consent','update',{...denied,analytics_storage:'granted'});
      window.gtag('js',new Date());
      window.gtag('config',config.ga4MeasurementId,{
        allow_google_signals:false, allow_ad_personalization_signals:false,
        page_location:cleanUrl(location.href), page_referrer:document.referrer ? cleanUrl(document.referrer) : '',
        language:document.documentElement.lang
      });
      appendScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.ga4MeasurementId));
    }
    if (config.clarityProjectId) {
      window.clarity = window.clarity || function() { (window.clarity.q = window.clarity.q || []).push(arguments); };
      window.clarity('consentv2',{ad_Storage:'denied',analytics_Storage:'granted'});
      // Do not expose input text or the content of example customer cards in recordings.
      document.querySelectorAll('input,textarea,select,[contenteditable],.handoff-example').forEach(node=>node.setAttribute('data-clarity-mask','true'));
      appendScript('https://www.clarity.ms/tag/' + encodeURIComponent(config.clarityProjectId));
    }
  }
  const banner = document.createElement('section');
  banner.className = 'analytics-consent'; banner.setAttribute('aria-label',copy.title); banner.hidden = true;
  const description = document.createElement('p'); description.textContent = copy.text;
  const actions = document.createElement('div'); actions.className = 'analytics-consent-actions';
  const accept = document.createElement('button'); accept.type = 'button'; accept.className = 'button'; accept.textContent = copy.accept;
  const reject = document.createElement('button'); reject.type = 'button'; reject.className = 'button analytics-decline'; reject.textContent = copy.reject;
  const privacy = document.createElement('a'); privacy.href = english ? (document.querySelector('a[href="/en/privacy.html"]') ? '/en/privacy.html' : '/privacy.html') : '/privacy.html'; privacy.textContent = copy.privacy;
  actions.append(accept,reject,privacy); banner.append(description,actions); document.body.appendChild(banner);
  function choose(value) {
    consent = value;
    try { localStorage.setItem(key,JSON.stringify({value,time:Date.now()})); } catch { /* Keep this page's choice in memory. */ }
    banner.hidden = true;
    if (value === 'granted') start();
    else if (loaded) {
      if (config.ga4MeasurementId) {
        window['ga-disable-' + config.ga4MeasurementId] = true;
        window.gtag('consent','update',denied);
      }
      if (window.clarity) window.clarity('consentv2',{ad_Storage:'denied',analytics_Storage:'denied'});
      // Remove first-party measurement cookies before reloading without vendor scripts.
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.trim().split('=')[0];
        if (!/^(_ga(?:_|$)|_gid$|_gat|_clck$|_clsk$)/.test(name)) continue;
        for (const domain of ['',location.hostname,'.' + location.hostname,'.goria.co']) {
          document.cookie = name + '=; Max-Age=0; Path=/' + (domain ? '; Domain=' + domain : '');
        }
      }
      location.reload();
    }
  }
  accept.addEventListener('click',()=>choose('granted'));
  reject.addEventListener('click',()=>choose('denied'));
  document.querySelectorAll('[data-analytics-settings]').forEach(button=>button.addEventListener('click',()=>{
    banner.hidden = false; accept.focus();
  }));
  if (consent === 'granted') start();
  else if (consent === null) banner.hidden = false;
  // Only fixed classifications and URL paths are sent; never email, message text, or query parameters.
  document.addEventListener('click',event=>{
    if (consent !== 'granted' || !config.ga4MeasurementId) return;
    const link = event.target.closest('a[href]');
    if (!link) return;
    let url; try { url = new URL(link.href,location.origin); } catch { return; }
    let action;
    if (url.hostname === 't.me') action = url.pathname === '/Goria_Konstantin' ? 'contact_click' : 'bot_click';
    else if (url.protocol === 'mailto:') action = 'email_click';
    else if (url.origin === location.origin && url.pathname.startsWith('/products/')) action = 'solution_click';
    if (action) window.gtag('event',action,{page_path:location.pathname,site_language:document.documentElement.lang});
  });
})();
