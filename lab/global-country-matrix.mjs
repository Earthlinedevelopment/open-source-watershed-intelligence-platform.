import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const SHARD_INDEX=Number(process.env.EARTHLINE_SHARD_INDEX||0);
const SHARD_TOTAL=Math.max(1,Number(process.env.EARTHLINE_SHARD_TOTAL||16));
const HARD_CEILING_MS=15000;
const WAIT_LIMIT_MS=26000;

const C=(region,name,search=name,aliases=[])=>({region,name,search,aliases:[name,search,...aliases]});
const COUNTRIES=[
// North America / Caribbean / Latin America
C('North America','Canada'),C('North America','United States'),
C('Latin America & Caribbean','Mexico'),C('Latin America & Caribbean','Belize'),C('Latin America & Caribbean','Costa Rica'),C('Latin America & Caribbean','El Salvador'),C('Latin America & Caribbean','Guatemala'),C('Latin America & Caribbean','Honduras'),C('Latin America & Caribbean','Nicaragua'),C('Latin America & Caribbean','Panama'),
C('Latin America & Caribbean','Argentina'),C('Latin America & Caribbean','Bolivia'),C('Latin America & Caribbean','Brazil'),C('Latin America & Caribbean','Chile'),C('Latin America & Caribbean','Colombia'),C('Latin America & Caribbean','Ecuador'),C('Latin America & Caribbean','Guyana'),C('Latin America & Caribbean','Paraguay'),C('Latin America & Caribbean','Peru'),C('Latin America & Caribbean','Suriname'),C('Latin America & Caribbean','Uruguay'),C('Latin America & Caribbean','Venezuela'),
C('Latin America & Caribbean','Antigua and Barbuda'),C('Latin America & Caribbean','Bahamas','The Bahamas',['Bahamas']),C('Latin America & Caribbean','Barbados'),C('Latin America & Caribbean','Cuba'),C('Latin America & Caribbean','Dominica'),C('Latin America & Caribbean','Dominican Republic'),C('Latin America & Caribbean','Grenada'),C('Latin America & Caribbean','Haiti'),C('Latin America & Caribbean','Jamaica'),C('Latin America & Caribbean','Saint Kitts and Nevis'),C('Latin America & Caribbean','Saint Lucia'),C('Latin America & Caribbean','Saint Vincent and the Grenadines'),C('Latin America & Caribbean','Trinidad and Tobago'),
// Europe
C('Europe','Albania'),C('Europe','Andorra'),C('Europe','Austria'),C('Europe','Belarus'),C('Europe','Belgium'),C('Europe','Bosnia and Herzegovina'),C('Europe','Bulgaria'),C('Europe','Croatia'),C('Europe','Cyprus'),C('Europe','Czechia','Czechia',['Czech Republic']),C('Europe','Denmark'),C('Europe','Estonia'),C('Europe','Finland'),C('Europe','France'),C('Europe','Germany'),C('Europe','Greece'),C('Europe','Hungary'),C('Europe','Iceland'),C('Europe','Ireland'),C('Europe','Italy'),C('Europe','Latvia'),C('Europe','Liechtenstein'),C('Europe','Lithuania'),C('Europe','Luxembourg'),C('Europe','Malta'),C('Europe','Moldova','Moldova',['Republic of Moldova']),C('Europe','Monaco'),C('Europe','Montenegro'),C('Europe','Netherlands'),C('Europe','North Macedonia'),C('Europe','Norway'),C('Europe','Poland'),C('Europe','Portugal'),C('Europe','Romania'),C('Europe','San Marino'),C('Europe','Serbia'),C('Europe','Slovakia'),C('Europe','Slovenia'),C('Europe','Spain'),C('Europe','Sweden'),C('Europe','Switzerland'),C('Europe','Ukraine'),C('Europe','United Kingdom'),C('Europe','Vatican City','Vatican City',['Holy See']),C('Europe','Kosovo'),
// Africa
C('Africa','Algeria'),C('Africa','Angola'),C('Africa','Benin'),C('Africa','Botswana'),C('Africa','Burkina Faso'),C('Africa','Burundi'),C('Africa','Cabo Verde','Cabo Verde',['Cape Verde']),C('Africa','Cameroon'),C('Africa','Central African Republic'),C('Africa','Chad'),C('Africa','Comoros'),C('Africa','Democratic Republic of the Congo','Democratic Republic of the Congo',['DR Congo','Congo-Kinshasa']),C('Africa','Republic of the Congo','Republic of the Congo',['Congo-Brazzaville']),C('Africa','Côte d’Ivoire','Côte d’Ivoire',["Cote d'Ivoire",'Ivory Coast']),C('Africa','Djibouti'),C('Africa','Egypt'),C('Africa','Equatorial Guinea'),C('Africa','Eritrea'),C('Africa','Eswatini','Eswatini',['Swaziland']),C('Africa','Ethiopia'),C('Africa','Gabon'),C('Africa','Gambia','The Gambia',['Gambia']),C('Africa','Ghana'),C('Africa','Guinea'),C('Africa','Guinea-Bissau'),C('Africa','Kenya'),C('Africa','Lesotho'),C('Africa','Liberia'),C('Africa','Libya'),C('Africa','Madagascar'),C('Africa','Malawi'),C('Africa','Mali'),C('Africa','Mauritania'),C('Africa','Mauritius'),C('Africa','Morocco'),C('Africa','Mozambique'),C('Africa','Namibia'),C('Africa','Niger'),C('Africa','Nigeria'),C('Africa','Rwanda'),C('Africa','São Tomé and Príncipe','São Tomé and Príncipe',['Sao Tome and Principe']),C('Africa','Senegal'),C('Africa','Seychelles'),C('Africa','Sierra Leone'),C('Africa','Somalia'),C('Africa','South Africa'),C('Africa','South Sudan'),C('Africa','Sudan'),C('Africa','Tanzania','Tanzania',['United Republic of Tanzania']),C('Africa','Togo'),C('Africa','Tunisia'),C('Africa','Uganda'),C('Africa','Zambia'),C('Africa','Zimbabwe'),
// Middle East / Caucasus
C('Middle East & Caucasus','Armenia'),C('Middle East & Caucasus','Azerbaijan'),C('Middle East & Caucasus','Bahrain'),C('Middle East & Caucasus','Georgia','Georgia country',['Georgia, country']),C('Middle East & Caucasus','Iran'),C('Middle East & Caucasus','Iraq'),C('Middle East & Caucasus','Israel'),C('Middle East & Caucasus','Jordan'),C('Middle East & Caucasus','Kuwait'),C('Middle East & Caucasus','Lebanon'),C('Middle East & Caucasus','Oman'),C('Middle East & Caucasus','Palestine','Palestine',['State of Palestine']),C('Middle East & Caucasus','Qatar'),C('Middle East & Caucasus','Saudi Arabia'),C('Middle East & Caucasus','Syria','Syria',['Syrian Arab Republic']),C('Middle East & Caucasus','Türkiye','Türkiye',['Turkey']),C('Middle East & Caucasus','United Arab Emirates'),C('Middle East & Caucasus','Yemen'),
// Central / South Asia
C('Central & South Asia','Afghanistan'),C('Central & South Asia','Bangladesh'),C('Central & South Asia','Bhutan'),C('Central & South Asia','India'),C('Central & South Asia','Kazakhstan'),C('Central & South Asia','Kyrgyzstan'),C('Central & South Asia','Maldives'),C('Central & South Asia','Nepal'),C('Central & South Asia','Pakistan'),C('Central & South Asia','Sri Lanka'),C('Central & South Asia','Tajikistan'),C('Central & South Asia','Turkmenistan'),C('Central & South Asia','Uzbekistan'),
// East Asia
C('East Asia','China'),C('East Asia','Japan'),C('East Asia','Mongolia'),C('East Asia','North Korea','North Korea',['Democratic People’s Republic of Korea','DPRK']),C('East Asia','South Korea','South Korea',['Republic of Korea']),
// Southeast Asia
C('Southeast Asia','Brunei'),C('Southeast Asia','Cambodia'),C('Southeast Asia','Indonesia'),C('Southeast Asia','Laos'),C('Southeast Asia','Malaysia'),C('Southeast Asia','Myanmar'),C('Southeast Asia','Philippines'),C('Southeast Asia','Singapore'),C('Southeast Asia','Thailand'),C('Southeast Asia','Timor-Leste'),C('Southeast Asia','Vietnam'),
// Oceania
C('Oceania','Australia'),C('Oceania','Fiji'),C('Oceania','Kiribati'),C('Oceania','Marshall Islands'),C('Oceania','Micronesia','Federated States of Micronesia',['Micronesia']),C('Oceania','Nauru'),C('Oceania','New Zealand'),C('Oceania','Palau'),C('Oceania','Papua New Guinea'),C('Oceania','Samoa'),C('Oceania','Solomon Islands'),C('Oceania','Tonga'),C('Oceania','Tuvalu'),C('Oceania','Vanuatu')
];

const TESTS=COUNTRIES.filter((_,i)=>i%SHARD_TOTAL===SHARD_INDEX);
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const hasAlias=(text,target)=>target.aliases.some(a=>norm(text).includes(norm(a))||norm(a).includes(norm(text)));

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
  await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true&&window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602?.auditOnly===true,null,{timeout:20000});
  return frame;
}

function snap(){
  const m=typeof M!=='undefined'&&M;
  const r=window.earthlineRegional15778||{};
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  const why=document.getElementById('earthlineWhyNotHere15803');
  const propertyBtn=document.getElementById('earthlineDeclareProperty16169');
  const run=[...document.querySelectorAll('button')].find(x=>/\brun\s+analysis\b/i.test(String(x.textContent||'')))||document.getElementById('runBtn');
  let debug=false;
  if(why){const cs=getComputedStyle(why),b=why.getBoundingClientRect();debug=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&b.width>1&&b.height>1;}
  return {
    loc:m&&m.loc?JSON.parse(JSON.stringify(m.loc)):null,
    displayed:{tier:String(d.tier||d.mode||''),name:String(d.name||d.label||d.location||''),runToken:d.runToken||d.token||null},
    regional:{active:!!r.active,mode:String(r.mode||'')},
    runControl:run?{id:run.id||'',text:String(run.textContent||'').trim().slice(0,120),disabled:!!run.disabled,busy:run.getAttribute('aria-busy')==='true'||run.dataset.busy==='1'}:null,
    propertyButton:!!propertyBtn,propertyButtonDisabled:!!(propertyBtn&&propertyBtn.disabled),
    propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),audit:a,
    lock:m&&m.propertyResultLock15815||null,safety:m&&m.safetyAudit15806||null,vector:m&&m.vectorNoBuildCoverage||null,
    water16601:window.EARTHLINE_LAB_WATER_16601||null,camera16602:window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602||null,
    swales:Number(m&&m.swales&&m.swales.length||0),recharge:Number(m&&m.rechZones&&m.rechZones.length||0),analysisReady:!!(m&&m.analysisReady),debugVisible:debug,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1200)
  };
}

async function chooseCountry(frame,target){
  await frame.evaluate(q=>{const i=document.getElementById('searchInput');if(!i)throw new Error('search input unavailable');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));},target.search);
  await frame.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  const picked=await frame.evaluate(({search,aliases})=>{
    const n=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const matches=s=>aliases.some(a=>n(s).includes(n(a))||n(a).includes(n(s)));
    const box=document.getElementById('earthlineSearchSuggestions15970');
    const opts=box?[...box.querySelectorAll('button[role="option"]')]:[];
    let b=opts.find(x=>/Country/i.test(x.textContent||'')&&n(x.dataset.query||'')===n(search));
    if(!b)b=opts.find(x=>/Country/i.test(x.textContent||'')&&(matches(x.dataset.query||'')||matches(x.textContent||'')));
    if(!b)return {ok:false,options:opts.map(x=>({text:(x.textContent||'').trim().slice(0,180),q:x.dataset.query||''}))};
    const chosen={text:(b.textContent||'').trim().slice(0,220),q:b.dataset.query||''};b.click();return {ok:true,chosen};
  },{search:target.search,aliases:target.aliases});
  if(!picked.ok)throw new Error('no country suggestion '+JSON.stringify(picked.options));
  await frame.waitForFunction(()=>{const m=typeof M!=='undefined'&&M;return !!(m&&m.loc&&String(m.loc.placeType||'').toLowerCase()==='country');},null,{timeout:12000,polling:150});
  await frame.waitForTimeout(300);
  const selected=await frame.evaluate(snap);
  const identity=[selected.loc?.name,selected.loc?.fullName,selected.loc?.q,selected.loc?.sub].filter(Boolean).join(' ');
  return {chosen:picked.chosen,selected,geographicPass:hasAlias(identity,target)||hasAlias(picked.chosen.q,target)||hasAlias(picked.chosen.text,target)};
}

async function waitRunEnabled(frame){
  try{await frame.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(x=>/\brun\s+analysis\b/i.test(String(x.textContent||'')))||document.getElementById('runBtn');return !!b&&!b.disabled;},null,{timeout:12000,polling:150});return true;}catch(_){return false;}
}
async function clickRun(frame){
  return await frame.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/\brun\s+analysis\b/i.test(String(x.textContent||''))&&!x.disabled)||document.getElementById('runBtn');if(!b||b.disabled)return false;b.click();return true;});
}

async function regional(frame,target){
  const started=Date.now();
  const sel=await chooseCountry(frame,target);
  if(!sel.geographicPass)return {pass:false,classification:'GEO_FAIL',elapsedMs:Date.now()-started,...sel};
  if(!(await waitRunEnabled(frame)))return {pass:false,classification:'RUN_CONTROL_TIMEOUT',elapsedMs:Date.now()-started,...sel,s:await frame.evaluate(snap)};
  if(!(await clickRun(frame)))return {pass:false,classification:'RUN_CONTROL_UNAVAILABLE',elapsedMs:Date.now()-started,...sel,s:await frame.evaluate(snap)};
  let timeout=false;
  try{await frame.waitForFunction(()=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};const b=[...document.querySelectorAll('button')].find(x=>/\brun\s+analysis\b/i.test(String(x.textContent||'')))||document.getElementById('runBtn');const busy=!!(b&&(b.getAttribute('aria-busy')==='true'||b.dataset.busy==='1'));const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return (!busy&&String(d.tier||d.mode||'').toLowerCase()==='regional')||/analysis failed/i.test(status);},null,{timeout:WAIT_LIMIT_MS,polling:200});}catch(_){timeout=true;}
  const s=await frame.evaluate(snap),elapsedMs=Date.now()-started;
  const failed=/analysis failed/i.test(s.status);
  const settled=!timeout&&String(s.displayed?.tier||'').toLowerCase()==='regional'&&!s.runControl?.busy;
  const pass=settled&&!failed&&elapsedMs<=HARD_CEILING_MS&&!s.debugVisible;
  return {pass,classification:pass?'REGIONAL_PASS':failed?'REGIONAL_APP_FAIL':timeout?'REGIONAL_TIMEOUT':elapsedMs>HARD_CEILING_MS?'REGIONAL_SLOW':'REGIONAL_FAIL',elapsedMs,timeout,...sel,s};
}

async function property(frame){
  try{await frame.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&document.documentElement.classList.contains('earthline-property-ready-16188')&&!b.disabled;},null,{timeout:9000,polling:150});}catch(_){ }
  const pre=await frame.evaluate(snap),started=Date.now(),errorStart=consoleErrors.length;
  const clicked=await frame.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b||b.disabled)return false;b.click();return true;});
  if(!clicked)return {classification:'PROPERTY_CONTROL_UNAVAILABLE',pass:false,elapsedMs:0,pre,post:pre};
  let timeout=false;
  try{await frame.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};const state=String(document.documentElement.dataset.earthlinePropertyRunState||'');return a.settled===true&&state!=='running';},null,{timeout:WAIT_LIMIT_MS,polling:150});}catch(_){timeout=true;}
  const elapsedMs=Date.now()-started,post=await frame.evaluate(snap),a=post.audit||{};
  const published=a.settled===true&&a.result===true&&(String(post.displayed.tier).toLowerCase()==='property'||post.analysisReady);
  const safe=post.safety?.verified===true&&post.lock?.safetyVerified===true;
  const safelyBlocked=a.settled===true&&a.result===false&&(/stopped safely|blocked|unverified|unavailable|failed/i.test(String(a.error||'')+' '+post.status));
  const staleRegional=post.regional.active===true&&String(post.displayed.tier).toLowerCase()!=='property';
  const perf=elapsedMs<=HARD_CEILING_MS;
  let classification='PROPERTY_FAIL';
  if(!timeout&&!post.debugVisible&&!staleRegional&&perf&&published&&safe)classification='PASS';
  else if(!timeout&&!post.debugVisible&&!staleRegional&&perf&&safelyBlocked)classification='SAFE_BLOCK';
  return {classification,pass:classification==='PASS',safeBlock:classification==='SAFE_BLOCK',timeout,elapsedMs,performancePass:perf,published,safe,safelyBlocked,staleRegional,pre,post,errors:consoleErrors.slice(errorStart,errorStart+20)};
}

const rows=[];
let frame=await openSurface();
for(const target of TESTS){
  const row={target,region:target.region};
  try{
    row.regional=await regional(frame,target);
    if(!row.regional.pass){row.classification=row.regional.classification;row.pass=false;}
    else{row.property=await property(frame);row.classification=row.property.classification;row.pass=row.property.pass;}
  }catch(e){row.classification='HARNESS_FAIL';row.pass=false;row.error=String(e&&e.stack||e);}
  rows.push(row);
  console.log(`GLOBAL ${target.region} | ${target.name}: ${row.classification} regional=${row.regional?.elapsedMs??'n/a'}ms property=${row.property?.elapsedMs??'n/a'}ms water=${row.property?.post?.water16601?.installed===true||row.regional?.s?.water16601?.installed===true?'ON':'OFF'}`);
  try{frame=await openSurface();}catch(e){console.error('surface reload failed',e);break;}
}

const regionSummary={};
for(const r of rows){const k=r.region||'Unknown';const x=regionSummary[k]||(regionSummary[k]={run:0,pass:0,safeBlock:0,fail:0});x.run++;if(r.classification==='PASS')x.pass++;else if(r.classification==='SAFE_BLOCK')x.safeBlock++;else x.fail++;}
const summary={shardIndex:SHARD_INDEX,shardTotal:SHARD_TOTAL,expected:TESTS.length,run:rows.length,pass:rows.filter(r=>r.classification==='PASS').length,safeBlock:rows.filter(r=>r.classification==='SAFE_BLOCK').length,fail:rows.filter(r=>!['PASS','SAFE_BLOCK'].includes(r.classification)).length,regions:regionSummary};
const report={generatedAt:new Date().toISOString(),url:URL,totalCountries:COUNTRIES.length,summary,rows};
await fs.mkdir('lab-results',{recursive:true});
await fs.writeFile(`lab-results/global-${SHARD_INDEX}-of-${SHARD_TOTAL}.json`,JSON.stringify(report,null,2));
console.log('GLOBAL SUMMARY '+JSON.stringify(summary));
await browser.close();
if(summary.fail>0)process.exitCode=1;
