const fs = require('fs');
const path = require('path');
const config = require('../config/locales.json');

function localeConfig(code) {
  const locale = config.locales[code];
  if (!locale) throw new Error(`Unknown locale: ${code}`);
  if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(locale.htmlLang)) throw new Error(`Invalid language: ${code}`);
  return locale;
}
function translate(text, code = config.defaultLocale) {
  if (code === config.defaultLocale) return text;
  // New languages supply their own UI dictionary instead of falling back to Ukrainian.
  const dictionary = require(`../content/locales/${code}/ui.json`);
  if (!(text in dictionary)) throw new Error(`Missing ${code} UI translation: ${text}`);
  return dictionary[text];
}
function localizedUrl(baseUrl, code) {
  const {prefix} = localeConfig(code);
  if (!baseUrl.startsWith('/') || baseUrl.startsWith('//') || /[?#]|\.\./.test(baseUrl)) throw new Error(`Invalid page URL: ${baseUrl}`);
  return prefix + baseUrl;
}
function outputFile(url) {
  return url.endsWith('/') ? url.slice(1) + 'index.html' : url.slice(1);
}
function loadTranslations(root, manifestsRoot = path.join(root, 'content/locales')) {
  const result = [];
  for (const [locale, settings] of Object.entries(config.locales)) {
    if (locale === config.defaultLocale || !settings.enabled) continue;
    localeConfig(locale);
    const manifest = path.join(manifestsRoot, locale, 'pages.json');
    if (!fs.existsSync(manifest)) throw new Error(`Missing translation manifest: ${manifest}`);
    const entries = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    const seen = new Set();
    for (const entry of entries) {
      if (entry.published !== true) continue;
      if (!entry.baseUrl || !entry.title || !entry.description || !entry.source) throw new Error(`Incomplete ${locale} translation`);
      if (seen.has(entry.baseUrl)) throw new Error(`Duplicate ${locale} translation: ${entry.baseUrl}`);
      seen.add(entry.baseUrl);
      const source = path.resolve(manifestsRoot, locale, entry.source);
      const directory = path.resolve(manifestsRoot, locale) + path.sep;
      if (!source.startsWith(directory) || !source.endsWith('.html')) throw new Error(`Invalid translation source: ${entry.source}`);
      const body = fs.readFileSync(source, 'utf8');
      if (!body.trim() || !/<h1\b/i.test(body) || /\{\{[^}]+\}\}/.test(body)) throw new Error(`Unfinished translation: ${source}`);
      result.push({...entry, locale, url: localizedUrl(entry.baseUrl, locale), body});
    }
  }
  return result;
}
function variants(baseUrl, translations) {
  return [{locale:config.defaultLocale, url:baseUrl}, ...translations.filter(p=>p.baseUrl===baseUrl).map(p=>({locale:p.locale,url:p.url}))];
}
function rewriteLinks(body, locale, translations) {
  if (locale === config.defaultLocale) return body;
  return body.replace(/\bhref="(\/(?!\/)[^"?#]*)([?#][^"]*)?"/g, (match, base, suffix='') => {
    const page = translations.find(p=>p.locale===locale && p.baseUrl===base);
    // A missing translation remains an honest link to the Ukrainian original.
    return page ? `href="${page.url}${suffix}"` : match;
  });
}
module.exports = {config, localeConfig, translate, localizedUrl, outputFile, loadTranslations, variants, rewriteLinks};
