import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const AREA=process.env.EARTHLINE_AREA||'US';
const SHARD_INDEX=Number(process.env.EARTHLINE_SHARD_INDEX||0);
const SHARD_TOTAL=Math.max(1,Number(process.env.EARTHLINE_SHARD_TOTAL||1));
const HARD_CEILING_MS=15000;
const WAIT_LIMIT_MS=26000;
const STATES=[
{name:'Alabama',lat:32.377716,lng:-86.300568},{name:'Alaska',lat:58.301598,lng:-134.420212},{name:'Arizona',lat:33.448143,lng:-112.096962},{name:'Arkansas',lat:34.746613,lng:-92.288986},{name:'California',lat:38.576668,lng:-121.493629},{name:'Colorado',lat:39.739227,lng:-104.984856},{name:'Connecticut',lat:41.764046,lng:-72.682198},{name:'Delaware',lat:39.157307,lng:-75.519722},{name:'Florida',lat:30.438118,lng:-84.281296},{name:'Georgia',lat:33.749027,lng:-84.388229},
{name:'Hawaii',lat:21.307442,lng:-157.857376},{name:'Idaho',lat:43.617775,lng:-116.199722},{name:'Illinois',lat:39.798363,lng:-89.654961},{name:'Indiana',lat:39.768623,lng:-86.162643},{name:'Iowa',lat:41.591087,lng:-93.603729},{name:'Kansas',lat:39.048191,lng:-95.677956},{name:'Kentucky',lat:38.186722,lng:-84.875374},{name:'Louisiana',lat:30.457069,lng:-91.187393},{name:'Maine',lat:44.307167,lng:-69.781693},{name:'Maryland',lat:38.978764,lng:-76.490936},
{name:'Massachusetts',lat:42.358162,lng:-71.063698},{name:'Michigan',lat:42.733635,lng:-84.555328},{name:'Minnesota',lat:44.955097,lng:-93.102211},{name:'Mississippi',lat:32.303848,lng:-90.182106},{name:'Missouri',lat:38.579201,lng:-92.172935},{name:'Montana',lat:46.585709,lng:-112.018417},{name:'Nebraska',lat:40.808075,lng:-96.699654},{name:'Nevada',lat:39.163914,lng:-119.766121},{name:'New Hampshire',lat:43.206898,lng:-71.537994},{name:'New Jersey',lat:40.220596,lng:-74.769913},
{name:'New Mexico',lat:35.68224,lng:-105.939728},{name:'New York',lat:42.652843,lng:-73.757874},{name:'North Carolina',lat:35.78043,lng:-78.639099},{name:'North Dakota',lat:46.82085,lng:-100.783318},{name:'Ohio',lat:39.961346,lng:-82.999069},{name:'Oklahoma',lat:35.492207,lng:-97.503342},{name:'Oregon',lat:44.938461,lng:-123.030403},{name:'Pennsylvania',lat:40.264378,lng:-76.883598},{name:'Rhode Island',lat:41.830914,lng:-71.414963},{name:'South Carolina',lat:34.000343,lng:-81.033211},
{name:'South Dakota',lat:44.367031,lng:-100.346405},{name:'Tennessee',lat:36.16581,lng:-86.784241},{name:'Texas',lat:30.27467,lng:-97.740349},{name:'Utah',lat:40.777477,lng:-111.888237},{name:'Vermont',lat:44.262436,lng:-72.580536},{name:'Virginia',lat:37.538857,lng:-77.43364},{name:'Washington',lat:47.035805,lng:-122.905014},{name:'West Virginia',lat:38.336246,lng:-81.612328},{name:'Wisconsin',lat:43.074684,lng:-89.384445},{name:'Wyoming',lat:41.140259,lng:-104.820236}
];
const SEA=[
{name:'Brunei',lat:4.9031,lng:114.9398},{name:'Cambodia',lat:11.5564,lng:104.9282},{name:'Indonesia',lat:-6.2088,lng:106.8456},{name:'Laos',lat:17.9757,lng:102.6331},{name:'Malaysia',lat:3.139,lng:101.6869},{name:'Myanmar',lat:19.7633,lng:96.0785},{name:'Philippines',lat:14.5995,lng:120.9842},{name:'Singapore',lat:1.3521,lng:103.8198},{name:'Thailand',lat:13.7563,lng:100.5018},{name:'Timor-Leste',lat:-8.5569,lng:125.5603},{name:'Vietnam',lat:21.0278,lng:105.8342}
];
const source=AREA==='SEA'?SEA:STATES;
const TESTS=source.filter((_,i)=>i%SHARD_TOTAL===SHARD_INDEX);

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const consoleErrors=[];
page.on('pageerror',e=>consoleErrors.push({type:'pageerror',message:String(e)}));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push({type:'console',message:m.text()});});

async function openSurface(){
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  let frame=page;
  const host=await page.$('#earthline-lab-frame');
  if(host){const nested=await host.contentFrame();if(!nested)throw new Error('lab iframe unavailable');frame=nested;}
  await frame.waitForSelector('#searchInput',{timeout:30000});
  await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
  return frame;
}

function snap(){
  const m=typeof M!=='undefined'&&M;
  const r=window.earthlineRegional15778||{};
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
  const why=document.getElementById('earthlineWhyNotHere15803');
  const btn=document.getElementById('earthlineDeclareProperty16169');
  let debug=false;
  if(why){const cs=getComputedStyle(why),b=why.getBoundingClientRect();debug=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&b.width>1&&b.height>1;}
  let mapCenter=null,mapZoom=null;
  try{const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;if(map&&map.getCenter){const c=map.getCenter();mapCenter={lat:Number(c.lat),lng:Number(c.lng)};mapZoom=Number(map.getZoom&&map.getZoom());}}catch(_){}
  return {
    searchGen:Number(m&&m.searchGen||0),loc:m&&m.loc?JSON.parse(JSON.stringify(m.loc)):null,
    center:{lat:Number(m&&m.centerLat),lng:Number(m&&m.centerLng)},mapCenter,mapZoom,
    displayed:{tier:String(d.tier||d.mode||''),name:String(d.name||d.label||d.location||''),runToken:d.runToken||d.token||null},
    regional:{active:!!r.active,mode:String(r.mode||'')},propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
    propertyReady:document.documentElement.classList.contains('earthline-property-ready-16188'),propertyButton:!!btn,propertyButtonDisabled:!!(btn&&btn.disabled),
    audit:a,publication:p,lock:m&&m.propertyResultLock15815||null,safety:m&&m.safetyAudit15806||null,vector:m&&m.vectorNoBuildCoverage||null,
    water16601:window.EARTHLINE_LAB_WATER_16601||null,camera16602:window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602||null,
    swales:Number(m&&m.swales&&m.swales.length||0),recharge:Number(m&&m.rechZones&&m.rechZones.length||0),analysisReady:!!(m&&m.analysisReady),debugVisible:debug,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,900),runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true'
  };
}

async function chooseLocation(frame,target){
  await frame.evaluate(name=>{
    const i=document.getElementById('searchInput');if(!i)throw new Error('search input unavailable');i.focus();i.value=name;i.dispatchEvent(new Event('input',{bubbles:true}));
  },target.name);
  await frame.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  const picked=await frame.evaluate(({name,area})=>{
    const box=document.getElementById('earthlineSearchSuggestions15970');
    const opts=box?[...box.querySelectorAll('button[role="option"]')]:[];
    let b=null;
    if(area==='US') b=opts.find(x=>/Registered U\.S\. state profile/i.test(x.textContent||'')&&(x.dataset.query||'').trim().toLowerCase()===name.toLowerCase())||opts.find(x=>/State \/ Region/i.test(x.textContent||''));
    else b=opts.find(x=>/Country/i.test(x.textContent||'')&&(x.dataset.query||'').toLowerCase().includes(name.toLowerCase()))||opts.find(x=>/Country/i.test(x.textContent||''));
    if(!b)return {ok:false,options:opts.map(x=>({text:(x.textContent||'').trim().slice(0,180),q:x.dataset.query||''}))};
    const chosen={text:(b.textContent||'').trim().slice(0,220),q:b.dataset.query||''};b.click();return {ok:true,chosen};
  },{name:target.name,area:AREA});
  if(!picked.ok)throw new Error('no authoritative suggestion '+JSON.stringify(picked.options));
  await frame.waitForFunction(name=>{const m=typeof M!=='undefined'&&M;return !!(m&&m.loc&&String(m.loc.name||m.loc.query||'').toLowerCase().includes(name.toLowerCase()));},target.name,{timeout:12000,polling:150});
  await frame.waitForTimeout(250);
  return picked.chosen;
}

async function regional(frame,target){
  const started=Date.now(),chosen=await chooseLocation(frame,target),selected=await frame.evaluate(snap);
  const selectionName=String(selected.loc?.name||selected.loc?.query||'').toLowerCase();
  const geographicPass=selectionName.includes(target.name.toLowerCase());
  if(!geographicPass)return {target,chosen,selected,elapsedMs:Date.now()-started,timeout:false,geographicPass:false,pass:false,reason:'authoritative location selection mismatch'};
  const clicked=await frame.evaluate(()=>{const b=document.getElementById('runBtn');if(!b||b.disabled)return false;b.click();return true;});
  if(!clicked)return {target,chosen,selected,elapsedMs:Date.now()-started,timeout:false,geographicPass:true,pass:false,reason:'Run Analysis control unavailable'};
  let timeout=false;
  try{await frame.waitForFunction(()=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};return document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true'&&String(d.tier||d.mode||'').toLowerCase()==='regional';},null,{timeout:WAIT_LIMIT_MS,polling:200});}catch(_){timeout=true;}
  const s=await frame.evaluate(snap),elapsedMs=Date.now()-started;
  const failed=/analysis failed/i.test(s.status);
  const settled=!timeout&&String(s.displayed?.tier||'').toLowerCase()==='regional'&&s.runBusy===false;
  return {target,chosen,selected,elapsedMs,timeout,geographicPass,s,pass:settled&&!failed&&elapsedMs<=HARD_CEILING_MS&&!s.debugVisible};
}

async function property(frame){
  try{await frame.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&document.documentElement.classList.contains('earthline-property-ready-16188')&&!b.disabled;},null,{timeout:8000,polling:150});}catch(_){ }
  const pre=await frame.evaluate(snap),errorStart=consoleErrors.length,started=Date.now();
  const clicked=await frame.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b||b.disabled)return false;b.click();return true;});
  if(!clicked)return {classification:'FAIL',pass:false,reason:'authoritative Property control unavailable',elapsedMs:0,pre,post:pre,errors:[]};
  let timeout=false;
  try{await frame.waitForFunction(({priorGen})=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};const state=String(document.documentElement.dataset.earthlinePropertyRunState||'');return a.settled===true&&Number(a.searchGenAtSettle||a.searchGen||0)>=Number(priorGen||0)&&state!=='running';},{priorGen:pre.searchGen},{timeout:WAIT_LIMIT_MS,polling:150});}catch(_){timeout=true;}
  const elapsedMs=Date.now()-started,post=await frame.evaluate(snap),a=post.audit||{};
  const published=a.settled===true&&a.result===true&&(String(post.displayed.tier).toLowerCase()==='property'||post.analysisReady);
  const safe=post.safety?.verified===true&&post.lock?.safetyVerified===true;
  const safelyBlocked=a.settled===true&&a.result===false&&(/stopped safely|blocked|unverified|unavailable|failed/i.test(String(a.error||'')+' '+post.status));
  const staleRegional=post.regional.active===true&&String(post.displayed.tier).toLowerCase()!=='property';
  const perf=elapsedMs<=HARD_CEILING_MS;
  let classification='FAIL';
  if(!timeout&&!post.debugVisible&&!staleRegional&&perf&&published&&safe)classification='PASS';
  else if(!timeout&&!post.debugVisible&&!staleRegional&&perf&&safelyBlocked)classification='SAFE_BLOCK';
  return {classification,pass:classification==='PASS',safeBlock:classification==='SAFE_BLOCK',timeout,elapsedMs,performancePass:perf,published,safe,safelyBlocked,staleRegional,pre,post,errors:consoleErrors.slice(errorStart,errorStart+20)};
}

const rows=[];
let frame=await openSurface();
for(const target of TESTS){
  let row={query:target.name,target,area:AREA};
  try{const reg=await regional(frame,target);row.regional=reg;if(!reg.pass){row.classification='REGIONAL_FAIL';row.pass=false;}else{const prop=await property(frame);row.property=prop;row.classification=prop.classification;row.pass=prop.pass;}}
  catch(e){row.classification='HARNESS_FAIL';row.pass=false;row.error=String(e);}
  rows.push(row);
  console.log(`${AREA} ${target.name}: ${row.classification} geo=${row.regional?.geographicPass===true?'OK':'BAD'} regional=${row.regional?.elapsedMs??'n/a'}ms property=${row.property?.elapsedMs??'n/a'}ms camera16602=${row.property?.post?.camera16602?.installed===true||row.regional?.s?.camera16602?.installed===true?'ON':'OFF'}`);
  try{frame=await openSurface();}catch(e){console.error('surface reload failed',e);break;}
}
const summary={area:AREA,shardIndex:SHARD_INDEX,shardTotal:SHARD_TOTAL,expected:TESTS.length,run:rows.length,pass:rows.filter(r=>r.classification==='PASS').length,safeBlock:rows.filter(r=>r.classification==='SAFE_BLOCK').length,fail:rows.filter(r=>!['PASS','SAFE_BLOCK'].includes(r.classification)).length,geographicPass:rows.filter(r=>r.regional?.geographicPass===true).length};
const report={generatedAt:new Date().toISOString(),url:URL,currentPatches:[16601,16602],acceptedParent:16584,protocol:{hardCeilingMs:HARD_CEILING_MS,realPropertyControl:true,acceptedParentUnchanged:true,sharedCoreOnly:true,safetyRequiredForPublishedProperty:true,authoritativeSuggestionSelection:true},summary,rows};
await fs.mkdir('lab-results',{recursive:true});
const out=`lab-results/property-${AREA.toLowerCase()}-${SHARD_INDEX}-of-${SHARD_TOTAL}.json`;await fs.writeFile(out,JSON.stringify(report,null,2));
console.log('EARTHLINE_PROPERTY_MATRIX '+JSON.stringify(report));
await browser.close();
if(summary.fail>0||summary.safeBlock>0)process.exitCode=1;
