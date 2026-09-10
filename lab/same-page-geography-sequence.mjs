import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const WAIT_MS=28000;
const TESTS=[
  {q:'Nevada',kind:'state',box:[-121,-113,34,43]},
  {q:'California',kind:'state',box:[-126,-113,31,43]},
  {q:'Texas',kind:'state',box:[-108,-92,24,38]},
  {q:'Florida',kind:'state',box:[-89,-79,23,32]},
  {q:'Hawaii',kind:'state',box:[-162,-153,17,24]},
  {q:'Alaska',kind:'state',box:null,alaska:true},
  {q:'Iceland',kind:'country',box:[-26,-12,62,68]}
];
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
function inExpected(p,t){
  if(!Array.isArray(p)||p.length<2)return false;
  const x=Number(p[0]),y=Number(p[1]);if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  if(t.alaska)return y>=50&&y<=73&&(x<=-129||x>=169);
  const [w,e,s,n]=t.box;return x>=w&&x<=e&&y>=s&&y<=n;
}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
let frame=page;const host=await page.$('#earthline-lab-frame');if(host){frame=await host.contentFrame()||page;}
await frame.waitForSelector('#searchInput',{timeout:30000});

async function choose(q,kind){
  await frame.evaluate(q=>{const i=document.getElementById('searchInput');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));},q);
  await frame.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  return frame.evaluate(({q,kind})=>{
    const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const qn=n(q);
    const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
    const name=b=>n(b.dataset.query||'')===qn||n(b.textContent||'').includes(qn);
    const type=b=>kind==='country'?/country/i.test(b.textContent||''):/state|region/i.test(b.textContent||'');
    const b=opts.find(x=>name(x)&&type(x))||opts.find(name);if(!b)return null;
    const r={text:String(b.textContent||'').trim(),query:String(b.dataset.query||''),typeMatched:type(b)};b.click();return r;
  },{q,kind});
}

async function snap(t){return frame.evaluate(({q,box,alaska})=>{
  function walk(c,out){if(!Array.isArray(c))return;if(c.length>=2&&Number.isFinite(Number(c[0]))&&Number.isFinite(Number(c[1]))){out.push([Number(c[0]),Number(c[1])]);return;}for(const v of c)walk(v,out)}
  function good(p){const x=p[0],y=p[1];if(alaska)return y>=50&&y<=73&&(x<=-129||x>=169);return x>=box[0]&&x<=box[1]&&y>=box[2]&&y<=box[3]}
  const m=typeof M!=='undefined'&&M||null,map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const style=map?.getStyle?.()||{},sourceRows=[];
  for(const id of Object.keys(style.sources||{})){
    if(!/(swale|flow|aquifer|contour|basin|recharge)/i.test(id))continue;
    const src=map.getSource?.(id),data=src?._data||src?._options?.data||null,pts=[];for(const f of data?.features||[])walk(f?.geometry?.coordinates,pts);
    const inside=pts.filter(good).length;
    sourceRows.push({id,features:Number(data?.features?.length||0),points:pts.length,inside,outside:Math.max(0,pts.length-inside),insideRatio:pts.length?inside/pts.length:null,first:pts.slice(0,3)});
  }
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const pkg=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null;
  const center=map?.getCenter?.();
  return {query:q,loc:m?.loc?{name:m.loc.name||'',countryCode:m.loc.countryCode||'',lat:m.loc.lat,lng:m.loc.lng,bbox:m.loc.bbox||null,profile:m.loc.jurisdictionProfileId16556||null}:null,
    statePackage:m?.jurisdictionPackage16556?{profileId:m.jurisdictionPackage16556.profileId||null,stateName:m.jurisdictionPackage16556.stateName||null}:null,
    activePackage:pkg?{profileId:pkg.profileId||null,stateName:pkg.stateName||null}:null,
    displayed:d?{tier:d.tier||d.mode||'',token:d.runToken||d.token||'',name:d.name||d.location||''}:null,
    center:center?[Number(center.lng),Number(center.lat)]:null,zoom:map?.getZoom?.(),sources:sourceRows,
    visualCount:Number(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features?.length||0),
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,900),
    busy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true'};
},{q:t.q,box:t.box||[-180,180,-90,90],alaska:!!t.alaska})}

const results=[];let prior=null;
for(const t of TESTS){
  const errorStart=errors.length;const picked=await choose(t.q,t.kind);if(!picked){results.push({query:t.q,pass:false,reason:'suggestion missing'});continue;}
  await frame.waitForTimeout(80);
  const during=await snap(t);
  let timedOut=false;try{await frame.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true'&&/screening published|analysis failed/i.test(s);},null,{timeout:WAIT_MS,polling:150});}catch{timedOut=true}
  const after=await snap(t),locIdentity=norm(after.loc?.name).includes(norm(t.q))||(t.q==='Iceland'&&norm(after.loc?.countryCode)==='is');
  const centerOK=after.center?inExpected(after.center,t):false;
  const localSources=after.sources.filter(x=>x.points>0&&/(swale|flow|contour|aquifer|recharge)/i.test(x.id));
  const wrongLocal=localSources.filter(x=>x.insideRatio!==null&&x.insideRatio<0.50);
  const failed=/analysis failed/i.test(after.status);
  const previousToken=prior?.displayed?.token||'';const tokenFresh=!previousToken||!after.displayed?.token||after.displayed.token!==previousToken;
  const previousClearedDuring=!prior||during.sources.filter(x=>x.features>0).length===0||during.displayed?.token!==previousToken;
  const pass=!timedOut&&locIdentity&&centerOK&&tokenFresh&&wrongLocal.length===0&&(failed?after.sources.every(x=>x.features===0):true);
  results.push({query:t.q,pass,timedOut,picked,locIdentity,centerOK,tokenFresh,previousClearedDuring,failed,wrongLocal:wrongLocal.map(x=>({id:x.id,features:x.features,insideRatio:x.insideRatio,first:x.first})),during,after,errors:errors.slice(errorStart,errorStart+8)});
  console.log(`${t.q}: ${pass?'PASS':'FAIL'} loc=${after.loc?.name||''} center=${JSON.stringify(after.center)} terminal=${failed?'FAIL':'PUBLISHED'} wrongSources=${wrongLocal.length}`);
  prior=after;
}
await fs.mkdir('lab-results',{recursive:true});
const report={generatedAt:new Date().toISOString(),url:URL,acceptedParent:16584,sequence:TESTS.map(x=>x.q),summary:{pass:results.filter(x=>x.pass).length,fail:results.filter(x=>!x.pass).length},results,browserErrors:errors.slice(0,50)};
await fs.writeFile('lab-results/same-page-geography-sequence.json',JSON.stringify(report,null,2));
await page.screenshot({path:'lab-results/same-page-geography-sequence.png',fullPage:true});
console.log('EARTHLINE_SAME_PAGE_GEOGRAPHY '+JSON.stringify(report));
await browser.close();if(report.summary.fail)process.exitCode=1;
