import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});

const snap=()=>{
  const m=(typeof M!=='undefined'&&M)||null,r=window.earthlineRegional15778||{},d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{},a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),ov=document.getElementById('earthlineRegionalVectorOverlay16020'),audit=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
  const c=mp?.getCenter?.();
  return {searchGen:Number(m?.searchGen||0),locName:String(m?.loc?.name||''),displayedTier:String(d.tier||d.mode||''),regionalActive:!!r.active,propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),propertyAudit:a,analysisReady:!!m?.analysisReady,propertyReady:document.documentElement.classList.contains('earthline-property-ready-16188'),propertyButton:!!document.getElementById('earthlineDeclareProperty16169'),propertyDisabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,swales:Number(m?.swales?.length||0),regionalVisualSwales:Number(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features?.length||0),overlaySwales:Number(audit?.swaleLines||0),labels:Number(audit?.swaleGradeLabels||0),zoom:Number(mp?.getZoom?.()||0),center:c?{lng:Number(c.lng),lat:Number(c.lat)}:null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().replace(/\s+/g,' ').slice(0,1000),runError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,overlayDisplay:ov?getComputedStyle(ov).display:null};
};
async function regional(q,label){
 const before=await page.evaluate(snap),start=Date.now();
 await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},q);
 const shots=[];for(const ms of [3000,3000,4000,5000]){await page.waitForTimeout(ms);const s=await page.evaluate(snap);shots.push({t:Date.now()-start,s});if(!s.regionalActive&&s.regionalVisualSwales>0&&s.overlaySwales>0)break;}
 return {stage:label,elapsedMs:Date.now()-start,before,after:await page.evaluate(snap),shots,errors:errors.slice(-10)};
}
async function property(){
 try{await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&!b.disabled;},null,{timeout:10000,polling:150})}catch(_){}
 const before=await page.evaluate(snap),start=Date.now();
 const clicked=await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b||b.disabled)return false;b.click();return true});
 const shots=[];if(clicked){for(const ms of [3000,3000,4000,5000]){await page.waitForTimeout(ms);const s=await page.evaluate(snap);shots.push({t:Date.now()-start,s});if(s.propertyAudit?.settled===true&&s.propertyState!=='running')break;}}
 return {stage:'NY Property',clicked,elapsedMs:Date.now()-start,before,after:await page.evaluate(snap),shots,errors:errors.slice(-10)};
}
const first=await regional('New York','NY Regional 1');
const prop=await property();
const second=await regional('New York','NY Regional reclaim');
console.log('MANTRA38_NY_RECLAIM '+JSON.stringify({first,prop,second,allErrors:errors.slice(0,30)}));
await browser.close();
