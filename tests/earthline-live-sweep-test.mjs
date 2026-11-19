// Earthline LIVE SWEEP TEST — read-only. Visits the public site exactly as a visitor would.
// Changes nothing on the site or in the repository's live branch.
//
//   SWEEP=primary   ONLY="Iowa"   -> one primary state: Regional x2, Property sites x2 each, Regional->Property->Regional->Property
//   SWEEP=states    SHARD=0 NSHARDS=10 -> a slice of the 50 states: Regional, then Property on the top-ranked corridor
//   SWEEP=countries SHARD=0 NSHARDS=20 -> a slice of the 195 countries: Regional
//
// Usage: EARTHLINE_PROFILE=desktop-chrome SWEEP=primary ONLY=Iowa node tests/earthline-live-sweep-test.mjs
// DRY=1 shortens every wait (plumbing check against a stub page only).
import {chromium,firefox,webkit,devices} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
import {geometryAudit} from './geometry-audit.mjs';
import {boundaryAudit} from './boundary-audit.mjs';

const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const PROFILE=process.env.EARTHLINE_PROFILE||'desktop-chrome';
const SWEEP=process.env.SWEEP||'primary';
const ONLY=(process.env.ONLY||'').trim();
const SHARD=Number(process.env.SHARD||0),NSHARDS=Math.max(1,Number(process.env.NSHARDS||1));
const DRY=process.env.DRY==='1';
const T=ms=>DRY?Math.min(ms,1200):ms;
const PROFILES={
  'desktop-chrome': {engine:chromium,ctx:{viewport:{width:1440,height:900}}},
  'desktop-firefox':{engine:firefox, ctx:{viewport:{width:1440,height:900}}},
  'desktop-safari': {engine:webkit,  ctx:{viewport:{width:1440,height:900}}},
  'iphone':         {engine:webkit,  ctx:{...devices['iPhone 14']}},
  'android':        {engine:chromium,ctx:{...devices['Pixel 7']}},
};

// ---- What gets tested -------------------------------------------------------------------------------------------
// Primary states = the six already named in the release gates (Iowa, Arkansas, Nebraska, Vermont, Arizona, New York).
// Sites for Iowa, Vermont and Arizona are the ones used in every earlier live test. Arkansas, Nebraska and New York
// sites are NEW sample points chosen for this sweep, except the two Arkansas crosshairs taken from Jonathan's screenshots of Nov 18.
const PRIMARY={
  'Iowa':[{name:'iowa-farmland',q:'42.13000, -93.68000',at:[-93.68000,42.13000]},{name:'iowa-creek',q:'41.95748, -93.38977',at:[-93.38977,41.95748]}],
  'Arkansas':[{name:'arkansas-your-screenshot-1',q:'34.77042, -92.12943',at:[-92.12943,34.77042]},{name:'arkansas-your-screenshot-2',q:'34.75262, -92.14778',at:[-92.14778,34.75262]},{name:'arkansas-ozark-farmland',q:'35.99000, -94.00000',at:[-94.00000,35.99000]}],
  'Nebraska':[{name:'nebraska-farmland',q:'40.75000, -96.85000',at:[-96.85000,40.75000]}],
  'Vermont':[{name:'vermont',q:'43.88279, -72.45147',at:[-72.45147,43.88279]},{name:'essex',q:'61 Sleepy Hollow Road, Essex, Vermont'}],
  'Arizona':[{name:'arizona',q:'34.21572, -111.93073',at:[-111.93073,34.21572]},{name:'darling-mine',q:'33.73774, -114.33439',at:[-114.33439,33.73774]}],
  // New York: five sites chosen for the problems NY has had before — shoreline/water setback (Lake George was the earlier NY water gate), steep wooded land, farmland, flat outwash.
  'New York':[
    // Jonathan's two New York screenshots (Nov 18, 2026, 20:34 ET), run first. Lifecycle uses the first site.
    {name:'ny-your-screenshot-1',q:'42.78781, -75.76996',at:[-75.76996,42.78781]},
    {name:'ny-your-screenshot-2',q:'42.78860, -75.77379',at:[-75.77379,42.78860]},
    {name:'ny-lake-george-shore',q:'43.57293, -73.60775',at:[-73.60775,43.57293]},
    {name:'ny-hudson-valley-farmland',q:'41.93000, -73.90000',at:[-73.90000,41.93000]},
    {name:'ny-catskills-steep-wooded',q:'42.10000, -74.30000',at:[-74.30000,42.10000]},
    {name:'ny-finger-lakes-farmland',q:'42.68000, -76.82000',at:[-76.82000,42.68000]},
    {name:'ny-long-island-flat',q:'40.85000, -72.80000',at:[-72.80000,40.85000]},
  ],
};
// [name, approx centre lat, approx centre lng] — used only to check that the search landed in the right place.
const STATES=[['Alabama',32.8,-86.8],['Alaska',64.0,-152.0],['Arizona',34.2,-111.7],['Arkansas',34.9,-92.4],['California',37.2,-119.5],['Colorado',39.0,-105.5],['Connecticut',41.6,-72.7],['Delaware',39.0,-75.5],['Florida',28.6,-82.4],['Georgia',32.7,-83.4],['Hawaii',20.8,-156.3],['Idaho',44.4,-114.6],['Illinois',40.0,-89.2],['Indiana',39.9,-86.3],['Iowa',42.07,-93.5],['Kansas',38.5,-98.4],['Kentucky',37.5,-85.3],['Louisiana',31.1,-92.0],['Maine',45.3,-69.2],['Maryland',39.0,-76.8],['Massachusetts',42.3,-71.8],['Michigan',44.3,-85.4],['Minnesota',46.3,-94.3],['Mississippi',32.7,-89.7],['Missouri',38.4,-92.5],['Montana',47.0,-109.6],['Nebraska',41.5,-99.8],['Nevada',39.3,-116.6],['New Hampshire',43.7,-71.6],['New Jersey',40.1,-74.7],['New Mexico',34.4,-106.1],['New York',42.9,-75.5],['North Carolina',35.5,-79.4],['North Dakota',47.4,-100.5],['Ohio',40.3,-82.8],['Oklahoma',35.6,-97.5],['Oregon',43.9,-120.6],['Pennsylvania',40.9,-77.8],['Rhode Island',41.7,-71.5],['South Carolina',33.9,-80.9],['South Dakota',44.4,-100.2],['Tennessee',35.8,-86.3],['Texas',31.5,-99.3],['Utah',39.3,-111.7],['Vermont',44.0,-72.7],['Virginia',37.5,-78.8],['Washington',47.4,-120.6],['West Virginia',38.6,-80.6],['Wisconsin',44.6,-89.9],['Wyoming',43.0,-107.5]];
// 193 UN members + Vatican City + Palestine. Optional 4th field = the text typed into search when the common name differs.
const COUNTRIES=[['Afghanistan',33.9,67.7],['Albania',41.15,20.17],['Algeria',28.0,1.66],['Andorra',42.5,1.52],['Angola',-11.2,17.9],['Antigua and Barbuda',17.06,-61.8],['Argentina',-38.4,-63.6],['Armenia',40.07,45.04],['Australia',-25.3,133.8],['Austria',47.5,14.55],['Azerbaijan',40.14,47.58],['Bahamas',25.03,-77.4],['Bahrain',26.07,50.56],['Bangladesh',23.7,90.4],['Barbados',13.19,-59.54],['Belarus',53.7,27.95],['Belgium',50.5,4.47],['Belize',17.19,-88.5],['Benin',9.31,2.32],['Bhutan',27.5,90.43],['Bolivia',-16.3,-63.6],['Bosnia and Herzegovina',43.9,17.68],['Botswana',-22.3,24.7],['Brazil',-14.2,-51.9],['Brunei',4.54,114.73],['Bulgaria',42.73,25.49],['Burkina Faso',12.24,-1.56],['Burundi',-3.37,29.92],['Cabo Verde',16.0,-24.0,'Cape Verde'],['Cambodia',12.57,104.99],['Cameroon',7.37,12.35],['Canada',56.1,-106.3],['Central African Republic',6.6,20.9],['Chad',15.45,18.7],['Chile',-35.7,-71.5],['China',35.9,104.2],['Colombia',4.57,-74.3],['Comoros',-11.88,43.87],['Republic of the Congo',-0.23,15.83],['Costa Rica',9.75,-83.75],["Côte d'Ivoire",7.54,-5.55,'Ivory Coast'],['Croatia',45.1,15.2],['Cuba',21.52,-77.78],['Cyprus',35.13,33.43],['Czechia',49.82,15.47],['Democratic Republic of the Congo',-4.04,21.76],['Denmark',56.26,9.5],['Djibouti',11.83,42.59],['Dominica',15.41,-61.37],['Dominican Republic',18.74,-70.16],['Ecuador',-1.83,-78.18],['Egypt',26.82,30.8],['El Salvador',13.79,-88.9],['Equatorial Guinea',1.65,10.27],['Eritrea',15.18,39.78],['Estonia',58.6,25.0],['Eswatini',-26.52,31.47],['Ethiopia',9.15,40.49],['Fiji',-17.7,178.07],['Finland',61.92,25.75],['France',46.6,2.2],['Gabon',-0.8,11.6],['Gambia',13.44,-15.31],['Georgia',42.3,43.36,'Georgia (country)'],['Germany',51.17,10.45],['Ghana',7.95,-1.02],['Greece',39.07,21.82],['Grenada',12.12,-61.68],['Guatemala',15.78,-90.23],['Guinea',9.95,-9.7],['Guinea-Bissau',11.8,-15.18],['Guyana',4.86,-58.93],['Haiti',18.97,-72.29],['Honduras',15.2,-86.24],['Hungary',47.16,19.5],['Iceland',64.96,-19.02],['India',20.6,78.96],['Indonesia',-0.79,113.92],['Iran',32.43,53.69],['Iraq',33.22,43.68],['Ireland',53.41,-8.24],['Israel',31.05,34.85],['Italy',41.87,12.57],['Jamaica',18.11,-77.3],['Japan',36.2,138.25],['Jordan',30.59,36.24,'Jordan (country)'],['Kazakhstan',48.02,66.92],['Kenya',-0.02,37.91],['Kiribati',1.45,173.0],['Kuwait',29.31,47.48],['Kyrgyzstan',41.2,74.77],['Laos',19.86,102.5],['Latvia',56.88,24.6],['Lebanon',33.85,35.86,'Lebanon (country)'],['Lesotho',-29.61,28.23],['Liberia',6.43,-9.43],['Libya',26.34,17.23],['Liechtenstein',47.17,9.56],['Lithuania',55.17,23.88],['Luxembourg',49.82,6.13],['Madagascar',-18.77,46.87],['Malawi',-13.25,34.3],['Malaysia',4.21,101.98],['Maldives',3.2,73.22],['Mali',17.57,-3.99],['Malta',35.94,14.38],['Marshall Islands',7.13,171.18],['Mauritania',21.0,-10.94],['Mauritius',-20.35,57.55],['Mexico',23.63,-102.55,'Mexico (country)'],['Micronesia',6.92,158.16],['Moldova',47.41,28.37],['Monaco',43.74,7.42],['Mongolia',46.86,103.85],['Montenegro',42.71,19.37],['Morocco',31.79,-7.09],['Mozambique',-18.67,35.53],['Myanmar',21.91,95.96],['Namibia',-22.96,18.49],['Nauru',-0.52,166.93],['Nepal',28.39,84.12],['Netherlands',52.13,5.29],['New Zealand',-40.9,174.89],['Nicaragua',12.87,-85.21],['Niger',17.61,8.08,'Niger (country)'],['Nigeria',9.08,8.68],['North Korea',40.34,127.51],['North Macedonia',41.61,21.75],['Norway',60.47,8.47],['Oman',21.51,55.92],['Pakistan',30.38,69.35],['Palau',7.51,134.58],['Palestine',31.95,35.23],['Panama',8.54,-80.78,'Panama (country)'],['Papua New Guinea',-6.31,143.96],['Paraguay',-23.44,-58.44],['Peru',-9.19,-75.02,'Peru (country)'],['Philippines',12.88,121.77],['Poland',51.92,19.15],['Portugal',39.4,-8.22],['Qatar',25.35,51.18],['Romania',45.94,24.97],['Russia',61.52,105.32],['Rwanda',-1.94,29.87],['Saint Kitts and Nevis',17.36,-62.78],['Saint Lucia',13.91,-60.98],['Saint Vincent and the Grenadines',12.98,-61.29],['Samoa',-13.76,-172.1],['San Marino',43.94,12.46],['São Tomé and Príncipe',0.19,6.61],['Saudi Arabia',23.89,45.08],['Senegal',14.5,-14.45],['Serbia',44.02,21.0],['Seychelles',-4.68,55.49],['Sierra Leone',8.46,-11.78],['Singapore',1.35,103.82],['Slovakia',48.67,19.7],['Slovenia',46.15,14.99],['Solomon Islands',-9.65,160.16],['Somalia',5.15,46.2],['South Africa',-30.56,22.94],['South Korea',35.91,127.77],['South Sudan',6.88,31.31],['Spain',40.46,-3.75],['Sri Lanka',7.87,80.77],['Sudan',12.86,30.22],['Suriname',3.92,-56.03],['Sweden',60.13,18.64],['Switzerland',46.82,8.23],['Syria',34.8,38.99],['Tajikistan',38.86,71.28],['Tanzania',-6.37,34.89],['Thailand',15.87,100.99],['Timor-Leste',-8.87,125.73],['Togo',8.62,0.82],['Tonga',-21.18,-175.2],['Trinidad and Tobago',10.69,-61.22],['Tunisia',33.89,9.54],['Turkey',38.96,35.24,'Turkey (country)'],['Turkmenistan',38.97,59.56],['Tuvalu',-7.11,177.65],['Uganda',1.37,32.29],['Ukraine',48.38,31.17],['United Arab Emirates',23.42,53.85],['United Kingdom',55.38,-3.44],['United States',37.09,-95.71],['Uruguay',-32.52,-55.77],['Uzbekistan',41.38,64.59],['Vanuatu',-15.38,166.96],['Vatican City',41.9,12.45],['Venezuela',6.42,-66.59],['Vietnam',14.06,108.28],['Yemen',15.55,48.52],['Zambia',-13.13,27.85],['Zimbabwe',-19.02,29.15]];

const POSTAL={Alabama:'AL',Alaska:'AK',Arizona:'AZ',Arkansas:'AR',California:'CA',Colorado:'CO',Connecticut:'CT',Delaware:'DE',Florida:'FL',Georgia:'GA',Hawaii:'HI',Idaho:'ID',Illinois:'IL',Indiana:'IN',Iowa:'IA',Kansas:'KS',Kentucky:'KY',Louisiana:'LA',Maine:'ME',Maryland:'MD',Massachusetts:'MA',Michigan:'MI',Minnesota:'MN',Mississippi:'MS',Missouri:'MO',Montana:'MT',Nebraska:'NE',Nevada:'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY','North Carolina':'NC','North Dakota':'ND',Ohio:'OH',Oklahoma:'OK',Oregon:'OR',Pennsylvania:'PA','Rhode Island':'RI','South Carolina':'SC','South Dakota':'SD',Tennessee:'TN',Texas:'TX',Utah:'UT',Vermont:'VT',Virginia:'VA',Washington:'WA','West Virginia':'WV',Wisconsin:'WI',Wyoming:'WY'};
const boundaryOf=async(page,stateName)=>{const st=POSTAL[stateName];if(!st)return null;try{return await page.evaluate(boundaryAudit,{path:'/data/jurisdiction/us-states-2025-500k/'+st+'.geojson',sourceId:'el-live-swales-15970'});}catch(e){return {ok:false,error:String(e).slice(0,160)};}};
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
const tag=[PROFILE,ONLY?slug(ONLY):null,NSHARDS>1?('s'+SHARD):null].filter(Boolean).join('-');
const OUT='live-test-results/'+SWEEP+'/'+tag;
mkdirSync(OUT,{recursive:true});
const prof=PROFILES[PROFILE];
if(!prof){console.error('unknown profile '+PROFILE);process.exit(2);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rows=[];
const meta={sweep:SWEEP,profile:PROFILE,only:ONLY||null,shard:NSHARDS>1?SHARD:null,nshards:NSHARDS>1?NSHARDS:null,url:BASE,startedAt:new Date().toISOString(),launchError:null};
const flush=(done)=>{try{writeFileSync(OUT+'/results.json',JSON.stringify({...meta,finishedAt:done?new Date().toISOString():null,complete:!!done,rows},null,1));}catch(_){}};
const km=(a,b)=>{const R=6371.0088,r=Math.PI/180,dp=(b[0]-a[0])*r,dl=(b[1]-a[1])*r,p1=a[0]*r,p2=b[0]*r;
  const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return Math.round(2*R*Math.asin(Math.min(1,Math.sqrt(q))));};

// ---- Runs inside the page: one snapshot of everything a visitor would be looking at (same as live-site test v3) ----
function snap(){
  const hav=(a,b)=>{const R=6371008.8,r=Math.PI/180,p1=a[1]*r,p2=b[1]*r,dp=(b[1]-a[1])*r,dl=(b[0]-a[0])*r;
    const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));};
  const m=(typeof M!=='undefined'&&M)||null;
  let map=null;try{map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;}catch(_){}
  const srcCount=id=>{try{const s=map&&map.getSource&&map.getSource(id);const d=s&&(s._data||(s.serialize&&s.serialize().data));
    return d&&Array.isArray(d.features)?d.features.length:null;}catch(_){return null;}};
  let swales=[];
  try{const fc=typeof earthlineSwaleGeoJSON==='function'?earthlineSwaleGeoJSON():null;
    swales=((fc&&fc.features)||[]).filter(f=>f&&f.geometry&&/LineString/.test(f.geometry.type)).map(f=>{
      const c=f.geometry.type==='LineString'?f.geometry.coordinates:(f.geometry.coordinates[0]||[]);
      let len=0;for(let i=1;i<c.length;i++)len+=hav(c[i-1],c[i]);
      const p=f.properties||{};
      return {id:p.id||p.label||null,lengthM:Math.round(len*10)/10,slopePct:Number(p.slope_pct??p.slope??p.mean_slope_pct)};
    });}catch(e){swales=[{error:String(e)}];}
  let elder=null;
  try{const e=window.EARTHLINE_ELDER_TREE_LAST_17097;
    if(e){elder={};for(const k of Object.keys(e)){const v=e[k];
      elder[k]=Array.isArray(v)?('array:'+v.length):(v&&typeof v==='object'?'object':v);}}}catch(_){}
  const de=document.documentElement,vis=id=>{const el=document.getElementById(id);if(!el)return null;
    const b=el.getBoundingClientRect(),cs=getComputedStyle(el);
    return {shown:cs.display!=='none'&&cs.visibility!=='hidden'&&b.width>1&&b.height>1,
      insideScreen:b.left>=-1&&b.top>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1,
      w:Math.round(b.width),h:Math.round(b.height)};};
  const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  return {
    tier:de.dataset.earthlineAnalysisTier||null,
    runState:de.dataset.earthlineRunState||null,
    propertyRunState:de.dataset.earthlinePropertyRunState||null,
    location:m&&m.loc?String(m.loc.name||''):null,
    center:m?{lat:Number(m.centerLat),lng:Number(m.centerLng)}:null,
    analysisReady:!!(m&&m.analysisReady),
    engineSwales:m&&Array.isArray(m.swales)?m.swales.length:null,
    engineSlopes:m&&Array.isArray(m.swales)?m.swales.map(w=>Number(w&&(w.slope??w.slope_pct??w.meanSlope))).filter(Number.isFinite).map(v=>Math.round(v*10)/10):[],
    shownSwales:swales.length,swales,
    rechargeTargets:m&&Array.isArray(m.rechZones)?m.rechZones.length:null,
    regionalSwaleFeatures:srcCount('el-live-swales-15970'),
    aquiferFeatures:srcCount('el-live-aquifer-15970'),
    elder,
    propertyAudit:audit?{settled:audit.settled??null,result:audit.result??null,error:audit.error?String(audit.error).slice(0,300):null}:null,
    statusText:(()=>{try{return Array.from(document.querySelectorAll('[id*="Status"],[id*="status"],[id*="Notice"]')).filter(e=>!/^(STYLE|SCRIPT)$/.test(e.tagName)&&e.getBoundingClientRect().width>1).map(e=>e.textContent.trim().replace(/\s+/g,' ')).filter(Boolean).join(' | ').slice(0,500);}catch(_){return null;}})(),
    integrity:(()=>{try{const i=window.EARTHLINE_LOCATION_INTEGRITY_15801;return i?{ok:i.ok,phase:i.phase,mode:i.mode,reasons:Array.isArray(i.reasons)?i.reasons.slice(0,6):null,mapDeltaM:i.mapDeltaM??null,identityDeltaM:i.identityDeltaM??null,toleranceM:i.toleranceM??null,zoom:i.zoom??null,anchor:i.anchor||null}:null;}catch(_){return null;}})(),
    propertyFailure:(()=>{try{const f=m&&m.propertyRunFailure16539;return f?{stage:String(f.stage||''),reason:String(f.reason||'').slice(0,200)}:null;}catch(_){return null;}})(),
    regionalError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970?String(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970).slice(0,300):null,
    layout:{screen:[innerWidth,innerHeight],pageWiderThanScreen:de.scrollWidth>innerWidth+2,
      searchBox:vis('searchInput'),runButton:vis('runBtn'),propertyButton:vis('earthlineDeclareProperty16169'),
      mapCanvas:!!document.querySelector('.mapboxgl-canvas'),
      searchDirectlyBelowLogo:(()=>{const h=document.getElementById('earthlinePanelBrand16201'),l=h&&h.querySelector(':scope > .brand'),q=document.getElementById('earthlineSearchSection16188');return !!(h&&l&&q&&q.parentElement===h&&q.previousElementSibling===l);})()},
  };
}
async function typeAndRun(page,q){
  await page.evaluate(query=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    if(!i||!b)throw Error('search box or Run button missing');
    i.value=query;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},q);
}
async function watchAquifer(page,ms){
  let last=null,blanks=0,max=0,samples=0,seenEmpty=false,refilled=false,midRun=0;const end=Date.now()+ms;
  while(Date.now()<end){
    let n=null;try{n=await page.evaluate(()=>{try{const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
      const s=map&&map.getSource&&map.getSource('el-live-aquifer-15970');const d=s&&(s._data||(s.serialize&&s.serialize().data));
      return d&&Array.isArray(d.features)?d.features.length:null;}catch(_){return null;}});}catch(_){}
    samples++;if(n!=null){if(last>0&&n===0){blanks++;if(refilled)midRun++;}if(n===0)seenEmpty=true;if(n>0&&(seenEmpty||last===null||last===0))refilled=true;if(n>max)max=n;last=n;}
    await sleep(250);
  }
  return {samples,maxFeatures:max,timesWentBlank:blanks,blankedAfterRefillThisRun:midRun,endedWith:last};
}
async function open(browser){
  const ctx=await browser.newContext(prof.ctx);const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+String(e).slice(0,300)));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text().slice(0,300));});
  await page.goto(BASE+(BASE.includes('?')?'&':'?')+'livetest='+Date.now(),{waitUntil:'domcontentloaded',timeout:T(60000)});
  await page.waitForSelector('#searchInput',{timeout:T(30000),state:'attached'});
  await sleep(T(4000));
  return {ctx,page,errors};
}
async function shot(page,name){try{await page.screenshot({path:OUT+'/'+name+'.jpg',type:'jpeg',quality:60});}catch(_){}}
async function waitRegionalDone(page,ms){const f0=Date.now();
  while(Date.now()-f0<ms){const ok=await page.evaluate(()=>{const b=document.getElementById('runBtn');return !!b&&!/deriving|loading|running/i.test(b.textContent||'');});if(ok)return true;await sleep(1000);}return false;}

// ---- Property: press the site's own Property button and wait for it to settle (same logic as live-site test v3) ----
async function propertyOnce(page,pressNow,elderMs){
  const t0=Date.now();let pressed=false,timedOut=false,clickKind=null;
  const end=Date.now()+T(75000);
  while(Date.now()<end){
    const st=await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};const de=document.documentElement;
      const bv=!!b&&getComputedStyle(b).display!=='none'&&!b.disabled&&b.getBoundingClientRect().width>1;
      return {button:bv,readyClass:de.classList.contains('earthline-property-ready-16188'),settled:a.settled===true,state:String(de.dataset.earthlinePropertyRunState||''),
        ready:(typeof M!=='undefined'&&M&&M.analysisReady&&de.dataset.earthlineAnalysisTier==='property')};});
    if(pressed&&st.settled&&st.state!=='running')break;
    if(!pressed&&st.ready&&st.state!=='running'&&Date.now()-t0>T(6000))break;
    if(!pressed&&st.button&&(pressNow||st.readyClass||Date.now()-t0>T(20000))){
      try{await page.click('#earthlineDeclareProperty16169',{timeout:5000});clickKind='real click';}catch(_){try{await page.evaluate(()=>document.getElementById('earthlineDeclareProperty16169').click());clickKind='real click failed, scripted click used';}catch(e2){clickKind='could not press: '+String(e2).slice(0,80);}}
      pressed=true;}
    await sleep(300);
  }
  if(Date.now()>=end)timedOut=true;
  await sleep(T(2500));
  const s=await page.evaluate(snap);
  let geometry=null;try{geometry=await page.evaluate(geometryAudit);}catch(e){geometry={ok:false,error:String(e).slice(0,160)};}
  const e0=Date.now();let elder=s.elder;
  while(!elder&&Date.now()-e0<T(elderMs)){await sleep(2000);elder=await page.evaluate(()=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097;
    if(!e)return null;const o={};for(const k of Object.keys(e)){const v=e[k];o[k]=Array.isArray(v)?('array:'+v.length):(v&&typeof v==='object'?'object':v);}return o;});}
  const sl=(s.engineSlopes&&s.engineSlopes.length)?s.engineSlopes:s.swales.filter(x=>Number.isFinite(x.slopePct)).map(x=>x.slopePct),ln=s.swales.filter(x=>Number.isFinite(x.lengthM)).map(x=>x.lengthM);
  return {seconds:Math.round((Date.now()-t0)/100)/10,propertyButtonPressed:pressed,clickKind,timedOut,
    tier:s.tier,location:s.location,center:s.center,analysisReady:s.analysisReady,
    engineSwales:s.engineSwales,shownSwales:s.shownSwales,slopesMeasured:sl.length,statusText:s.statusText,
    steepestSwalePct:sl.length?Math.max(...sl):null,swalesOver4pct:sl.filter(v=>v>4.0001).length,
    shortestSwaleM:ln.length?Math.min(...ln):null,longestSwaleM:ln.length?Math.max(...ln):null,
    rechargeTargets:s.rechargeTargets,elder,elderWaitSeconds:Math.round((Date.now()-e0)/1000),
    propertyAudit:s.propertyAudit,integrity:s.integrity,propertyFailure:s.propertyFailure,statusAfter:s.statusText,layout:s.layout,geometry,swales:s.swales};
}

// ---- PRIMARY: full set for one state ----
async function regionalPrimary(browser,q){
  const row={kind:'regional',query:q,profile:PROFILE};const t=Date.now();let h=null;
  try{
    h=await open(browser);row.before=await h.page.evaluate(snap);
    for(const run of [1,2]){
      const t0=Date.now();await typeAndRun(h.page,q);
      const watch=await watchAquifer(h.page,T(run===1?45000:30000));
      const finished=await waitRegionalDone(h.page,T(105000));
      const s=await h.page.evaluate(snap);
      row['run'+run]={seconds:Math.round((Date.now()-t0)/100)/10,finished,aquiferWatch:watch,
        tier:s.tier,location:s.location,center:s.center,regionalSwaleFeatures:s.regionalSwaleFeatures,aquiferFeatures:s.aquiferFeatures,
        elder:s.elder,regionalError:s.regionalError,layout:s.layout,boundary:await boundaryOf(h.page,q)};
      await shot(h.page,'regional-'+slug(q)+'-run'+run);
    }
  }catch(e){row.couldNotRun=String(e).slice(0,400);}
  row.pageErrors=h?h.errors.slice(0,15):[];row.totalSeconds=Math.round((Date.now()-t)/1000);
  if(h)await h.ctx.close().catch(()=>{});
  rows.push(row);flush();console.log('EARTHLINE_SWEEP '+JSON.stringify(row));
}
async function propertyPrimary(browser,site){
  const row={kind:'property',site:site.name,query:site.q,profile:PROFILE};const t=Date.now();let h=null;
  try{
    h=await open(browser);
    for(const run of [1,2]){
      if(site.at){
        row.reachedBy='map moved to coordinate';
        await h.page.evaluate(c=>{const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
          if(!map)throw Error('map not available');map.jumpTo({center:c,zoom:17});},site.at);
        await sleep(T(5000));
      }else{row.reachedBy='address typed in search';await typeAndRun(h.page,site.q);}
      row['run'+run]=await propertyOnce(h.page,!!site.at,30000);
      await shot(h.page,'property-'+site.name+'-run'+run);
    }
    const a=row.run1,b=row.run2;
    row.sameResultBothRuns=!!(a&&b&&a.shownSwales===b.shownSwales&&JSON.stringify(a.swales)===JSON.stringify(b.swales));
    for(const r of [a,b])if(r)r.swales=undefined;
  }catch(e){row.couldNotRun=String(e).slice(0,400);}
  row.pageErrors=h?h.errors.slice(0,15):[];row.totalSeconds=Math.round((Date.now()-t)/1000);
  if(h)await h.ctx.close().catch(()=>{});
  rows.push(row);flush();console.log('EARTHLINE_SWEEP '+JSON.stringify(row));
}
async function lifecycle(browser,q){
  const row={kind:'lifecycle',query:q,profile:PROFILE,steps:[]};const t=Date.now();let h=null;
  try{
    h=await open(browser);
    for(const round of [1,2]){
      await typeAndRun(h.page,q);const watch=await watchAquifer(h.page,T(20000));const finished=await waitRegionalDone(h.page,T(130000));await sleep(T(2000));
      const r=await h.page.evaluate(snap);
      row.steps.push({step:'regional '+round,finished,tier:r.tier,regionalSwaleFeatures:r.regionalSwaleFeatures,aquiferFeatures:r.aquiferFeatures,blankedAfterRefillThisRun:watch.blankedAfterRefillThisRun,regionalError:r.regionalError});
      await shot(h.page,'lifecycle-'+slug(q)+'-regional'+round);
      const pr=await propertyOnce(h.page,false,30000);
      row.steps.push({step:'property '+round,seconds:pr.seconds,clickKind:pr.clickKind,timedOut:pr.timedOut,tier:pr.tier,analysisReady:pr.analysisReady,engineSwales:pr.engineSwales,shownSwales:pr.shownSwales,steepestSwalePct:pr.steepestSwalePct,swalesOver4pct:pr.swalesOver4pct,rechargeTargets:pr.rechargeTargets,elder:pr.elder,propertyAudit:pr.propertyAudit,center:pr.center,geometry:pr.geometry,swales:pr.swales});
      await shot(h.page,'lifecycle-'+slug(q)+'-property'+round);
    }
    const P=row.steps.filter(x=>x.step.startsWith('property')),R=row.steps.filter(x=>x.step.startsWith('regional'));
    row.propertySameBothRounds=P.length===2&&JSON.stringify(P[0].swales)===JSON.stringify(P[1].swales);
    row.regionalSameBothRounds=R.length===2&&R[0].regionalSwaleFeatures===R[1].regionalSwaleFeatures&&R[0].aquiferFeatures===R[1].aquiferFeatures;
    for(const x of P)x.swales=undefined;
  }catch(e){row.couldNotRun=String(e).slice(0,400);}
  row.pageErrors=h?h.errors.slice(0,15):[];row.totalSeconds=Math.round((Date.now()-t)/1000);
  if(h)await h.ctx.close().catch(()=>{});
  rows.push(row);flush();console.log('EARTHLINE_SWEEP '+JSON.stringify(row));
}

// ---- STATES / COUNTRIES: one fresh page per item ----
async function sweepItem(browser,item,withProperty){
  const [name,lat,lng,typed]=item;const q=typed||name;
  const row={kind:'sweep',sweep:SWEEP,name,query:q,profile:PROFILE,expected:{lat,lng}};const t=Date.now();let h=null;
  try{
    h=await open(browser);
    const t0=Date.now();
    await typeAndRun(h.page,q);
    const watch=await watchAquifer(h.page,T(30000));
    const finished=await waitRegionalDone(h.page,T(120000));
    await sleep(T(2500));
    const s=await h.page.evaluate(snap);
    const c=s.center&&Number.isFinite(s.center.lat)&&Number.isFinite(s.center.lng)?s.center:null;
    row.regional={seconds:Math.round((Date.now()-t0)/100)/10,finished,tier:s.tier,location:s.location,center:c,
      distanceFromExpectedKm:c?km([lat,lng],[c.lat,c.lng]):null,
      regionalSwaleFeatures:s.regionalSwaleFeatures,aquiferFeatures:s.aquiferFeatures,regionalError:s.regionalError,
      aquiferWatch:watch,statusText:s.statusText,elder:s.elder,layout:s.layout,boundary:SWEEP==='states'?await boundaryOf(h.page,name):null};
    await shot(h.page,slug(name)+'-regional');
    if(withProperty){
      const top=await h.page.evaluate(()=>{try{
        const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
        const src=map&&map.getSource&&map.getSource('el-live-swales-15970');const d=src&&(src._data||(src.serialize&&src.serialize().data));
        const fs=((d&&d.features)||[]).filter(f=>f&&f.geometry&&/LineString/.test(f.geometry.type));
        if(!fs.length)return null;
        fs.sort((a,b)=>(Number(a.properties&&a.properties.rank)||1e9)-(Number(b.properties&&b.properties.rank)||1e9));
        const g=fs[0].geometry,cc=g.type==='LineString'?g.coordinates:g.coordinates[0];const m=cc[Math.floor((cc.length-1)/2)];
        return {lng:m[0],lat:m[1],rank:(fs[0].properties&&fs[0].properties.rank)??null,corridors:fs.length};}catch(e){return null;}});
      if(!top){row.property={skipped:'Regional produced no corridor to open Property on'};}
      else{
        await h.page.evaluate(c=>{const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
          if(!map)throw Error('map not available');map.jumpTo({center:c,zoom:17});},[top.lng,top.lat]);
        await sleep(T(5000));
        const pr=await propertyOnce(h.page,true,15000);pr.swales=undefined;
        row.property={atTopRankedCorridor:top,...pr};
        await shot(h.page,slug(name)+'-property');
      }
    }
  }catch(e){row.couldNotRun=String(e).slice(0,400);}
  row.pageErrors=h?h.errors.slice(0,15):[];row.totalSeconds=Math.round((Date.now()-t)/1000);
  if(h)await h.ctx.close().catch(()=>{});
  return row;
}
const timeoutRow=(item,ms)=>new Promise(r=>setTimeout(()=>r({kind:'sweep',sweep:SWEEP,name:item[0],profile:PROFILE,couldNotRun:'item exceeded '+Math.round(ms/1000)+' s and was abandoned',pageErrors:[]}),ms));

// ---- main ----
let browser=null;
try{browser=await prof.engine.launch({headless:true});}catch(e){meta.launchError=String(e).slice(0,400);}
if(browser){
  if(SWEEP==='primary'){
    const list=ONLY?[ONLY]:Object.keys(PRIMARY);
    for(const st of list){
      if(!PRIMARY[st]){console.error('not a primary state: '+st);continue;}
      await regionalPrimary(browser,st);
      for(const site of PRIMARY[st])await propertyPrimary(browser,site);
      await lifecycle(browser,st);
    }
  }else{
    const all=SWEEP==='states'?STATES:COUNTRIES;
    if(!all)throw Error('unknown SWEEP '+SWEEP);
    const mine=all.filter((_,i)=>i%NSHARDS===SHARD);
    meta.assigned=mine.map(x=>x[0]);
    flush();
    for(const item of mine){
      const ms=DRY?20000:(SWEEP==='states'?420000:240000);
      const row=await Promise.race([sweepItem(browser,item,SWEEP==='states'),timeoutRow(item,ms)]);
      rows.push(row);flush();console.log('EARTHLINE_SWEEP '+JSON.stringify(Object.assign({},row)));
    }
  }
  await browser.close().catch(()=>{});
}
flush(true);
console.log('EARTHLINE_SWEEP_DONE '+tag+' rows='+rows.length+(meta.launchError?' launchError':''));
process.exit(0);
