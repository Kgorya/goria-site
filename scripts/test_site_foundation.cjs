const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const {execFileSync} = require('child_process');
const root = path.resolve(__dirname,'..');
const i18n = require('../lib/i18n');
const {analyticsConfig,analyticsMarkup} = require('../lib/analytics');

test('locale routes keep Ukrainian URLs and namespace translated URLs',()=>{
  assert.equal(i18n.localizedUrl('/products/','uk'),'/products/');
  assert.equal(i18n.localizedUrl('/products/','en'),'/en/products/');
  assert.equal(i18n.localizedUrl('/','en'),'/en/');
  assert.throws(()=>i18n.localizedUrl('//other.example/','en'));
  assert.throws(()=>i18n.localizedUrl('/../private/','en'));
  assert.equal(i18n.rewriteLinks('<a href="/blog/#top">Read</a>','en',[{locale:'en',baseUrl:'/blog/',url:'/en/blog/'}]),'<a href="/en/blog/#top">Read</a>');
});

test('no tracker markup without IDs; malformed IDs fail the build',()=>{
  assert.equal(analyticsMarkup(analyticsConfig({GA4_MEASUREMENT_ID:'',CLARITY_PROJECT_ID:''})), '');
  assert.throws(()=>analyticsConfig({GA4_MEASUREMENT_ID:'bad'}));
  assert.throws(()=>analyticsConfig({CLARITY_PROJECT_ID:'bad/id'}));
});

test('published translations get reciprocal alternates, own canonical, localized shell and sitemap',()=>{
  const temp = fs.mkdtempSync(path.join(os.tmpdir(),'goria-i18n-'));
  try {
    const content=path.join(temp,'content'); fs.mkdirSync(path.join(content,'en'),{recursive:true});
    fs.writeFileSync(path.join(content,'en','pages.json'),JSON.stringify([
      {baseUrl:'/',title:'Customer enquiries',description:'English site',active:'home',source:'home.html',published:true},
      {baseUrl:'/cases/',title:'Draft',description:'Draft',source:'missing.html',published:false}
    ]));
    fs.writeFileSync(path.join(content,'en','home.html'),'<header class="page-intro shell"><h1>Customer enquiries</h1><p class="lead">English editorial copy.</p></header>');
    const out=path.join(temp,'output');
    execFileSync(process.execPath,['-e',"require('./config/locales.json').locales.en.enabled=true; require('./build.js')"],{
      cwd:root,env:{...process.env,SITE_OUTPUT_DIR:out,SITE_TRANSLATIONS_DIR:content,GA4_MEASUREMENT_ID:'',CLARITY_PROJECT_ID:''}
    });
    const en=fs.readFileSync(path.join(out,'en/index.html'),'utf8');
    const uk=fs.readFileSync(path.join(out,'index.html'),'utf8');
    assert.match(en,/<html lang="en">/);
    assert.match(en,/<link rel="canonical" href="https:\/\/goria.co\/en\/">/);
    assert.match(en,/hreflang="uk" href="https:\/\/goria.co\/"/);
    assert.match(uk,/hreflang="en" href="https:\/\/goria.co\/en\/"/);
    assert.match(en,/aria-label="Main navigation"/);
    assert.match(en,/>Home<\/a>/);
    assert.match(en,/English editorial copy/);
    assert.doesNotMatch(en,/Костянтин|Основна навігація|Безкоштовний аудит/);
    assert.match(fs.readFileSync(path.join(out,'sitemap.xml'),'utf8'),/https:\/\/goria.co\/en\//);
    assert.equal(fs.existsSync(path.join(out,'en/cases/index.html')),false);
    assert.equal(en.includes('analytics-config'),false);
    execFileSync(process.execPath,['build.js'],{cwd:root,env:{...process.env,SITE_OUTPUT_DIR:out,SITE_TRANSLATIONS_DIR:content,GA4_MEASUREMENT_ID:'',CLARITY_PROJECT_ID:''}});
    assert.equal(fs.existsSync(path.join(out,'en/index.html')),false,'Unpublished translations must not survive the next build');

  } finally { fs.rmSync(temp,{recursive:true,force:true}); }
});

function runtime({host='goria.co',choice=null,storageFails=false}={}) {
  class Element {
    constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.hidden=false;this.attrs={};}
    append(...nodes){this.children.push(...nodes);}
    appendChild(node){this.children.push(node);}
    setAttribute(key,value){this.attrs[key]=value;}
    addEventListener(name,fn){this.listeners[name]=fn;}
    focus(){}
  }
  const head=new Element('head'),body=new Element('body'),settings=new Element('button');
  const config={enabled:true,allowedHosts:['goria.co'],ga4MeasurementId:'G-TEST12345',clarityProjectId:'test123'};
  let stored=choice?JSON.stringify({value:choice,time:Date.now()}):null;
  const doc={head,body,documentElement:{lang:'uk'},referrer:'https://example.com/article?email=private',cookie:'',listeners:{},
    getElementById:()=>({textContent:JSON.stringify(config)}),
    createElement:tag=>new Element(tag),querySelector:()=>null,
    querySelectorAll:selector=>selector==='[data-analytics-settings]'?[settings]:[],
    addEventListener(name,fn){this.listeners[name]=fn;}};
  let reloaded=false;
  const location={hostname:host,origin:'https://'+host,href:'https://'+host+'/cases/?email=private',pathname:'/cases/',reload(){reloaded=true;}};
  const context={document:doc,location,window:{},localStorage:{
    getItem(){if(storageFails)throw Error('blocked');return stored;},
    setItem(k,v){if(storageFails)throw Error('blocked');stored=v;}
  },URL,Date};
  vm.runInNewContext(fs.readFileSync(path.join(root,'analytics.js'),'utf8'),context);
  return {head,body,settings,doc,context,reloaded:()=>reloaded};
}

test('no vendor requests on localhost, before consent, or after refusal',()=>{
  for(const options of [{host:'localhost',choice:'granted'},{choice:null},{choice:'denied'},{storageFails:true}]) {
    const state=runtime(options); assert.equal(state.head.children.length,0);
  }
  const state=runtime(); const banner=state.body.children[0];
  assert.equal(banner.hidden,false);
  banner.children[1].children[1].listeners.click();
  assert.equal(state.head.children.length,0); assert.equal(banner.hidden,true);
});

test('acceptance loads both trackers once, strips query strings, and withdrawal disables tracking',()=>{
  const state=runtime(); const banner=state.body.children[0];
  banner.children[1].children[0].listeners.click();
  assert.equal(state.head.children.length,2);
  banner.children[1].children[0].listeners.click(); assert.equal(state.head.children.length,2);
  const commands=state.context.window.dataLayer.map(args=>Array.from(args));
  const config=commands.find(args=>args[0]==='config')[2];
  assert.equal(config.page_location,'https://goria.co/cases/');
  assert.equal(config.page_referrer,'https://example.com/article');
  assert.equal(config.allow_google_signals,false);
  state.settings.listeners.click(); assert.equal(banner.hidden,false);
  banner.children[1].children[1].listeners.click();
  assert.equal(state.context.window['ga-disable-G-TEST12345'],true); assert.equal(state.reloaded(),true);
});
