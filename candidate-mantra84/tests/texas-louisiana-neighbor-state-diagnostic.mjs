import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e)}));
page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()});});

function bboxGeom(g){
  if(!g||!Array.isArray(g.coordinates))return null;
  let w=Infinity,s=Infinity,e=-Infinity,n=-Infinity,count=0;
  const walk=v=>{if(!Array.isArray(v))return;if(v.length>=2&&Number.isFinite(+v[0])&&Number.isFinite(+v[1])){w=Math.min(w,+v[0]);e=Math.max(e,+v[0]);s=Math.min(s,+v[1]);n=Math.max(n,+v[1]);count++;return;}for(const x of v)walk(x);};
  walk(g.coordinates);return count?{w,s,e,n,count}:null;
}

async function snap(label){
  return page.evaluate(label=>{
    const bboxGeom=g=>{if(!g||!Array.isArray(g.coordinates))return null;let w=Infinity,s=Infinity,e=-Infinity,n=-Infinity,count=0;const walk=v=>{if(!Array.isArray(v))return;if(v.length>=2&&Number.isFinite(+v[0])&&Number.isFinite(+v[1])){w=Math.min(w,+v[0]);e=Math.max(e,+v[0]);s=Math.min(s,+v[1]);n=Math.max(n,+v[1]);count++;return;}for(const x of v)walk(x);};walk(g.coordinates);return count?{w,s,e,n,count}:null;};
    const pkg=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null;
    const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const sw=Array.isArray(visual?.swales?.features)?visual.swales.features:[];
    const coords=[];for(const f of sw){const g=f?.geometry;if(!g)continue;const walk=v=>{if(!Array.isArray(v))return;if(v.length>=2&&Number.isFinite(+v[0])&&Number.isFinite(+v[1])){coords.push([+v[0],+v[1]]);return;}for(const x of v)walk(x);};walk(g.coordinates);}
    let west=Infinity,east=-Infinity,south=Infinity,north=-Infinity;for(const [x,y] of coords){west=Math.min(west,x);east=Math.max(east,x);south=Math.min(south,y);north=Math.max(north,y);} 
    const eastBins={eastOf96:0,eastOf95:0,eastOf94:0};
    for(const f of sw){let maxX=-Infinity;const walk=v=>{if(!Array.isArray(v))return;if(v.length>=2&&Number.isFinite(+v[0])&&Number.isFinite(+v[1])){maxX=Math.max(maxX,+v[0]);return;}for(const x of v)walk(x);};walk(f?.geometry?.coordinates);if(maxX>-96)eastBins.eastOf96++;if(maxX>-95)eastBins.eastOf95++;if(maxX>-94)eastBins.eastOf94++;}
    let center=null,zoom=null;try{const c=earthlineMap?.getCenter?.();center=c?{lng:+c.lng,lat:+c.lat}:null;zoom=+earthlineMap?.getZoom?.();}catch(_){}
    return {
      label,
      loc:{name:String(M?.loc?.name||''),fullName:String(M?.loc?.fullName||''),bbox:Array.isArray(M?.loc?.bbox)?M.loc.bbox:null,lng:+M?.loc?.lng||null,lat:+M?.loc?.lat||null},
      pkg:pkg?{id:pkg.id||null,query:pkg.query||null,abbr:pkg.abbr||null,bbox:pkg.bbox||pkg.regionalBbox||pkg.extent||null,boundaryBbox:bboxGeom(pkg.boundary?.geometry||pkg.boundary||null)}:null,
      generation:gen?{candidates:+gen.candidates||0,preferredJurisdictionEligibleCandidates:+gen.preferredJurisdictionEligibleCandidates||0,jurisdictionEligibleCandidates:+gen.jurisdictionEligibleCandidates||0,jurisdictionRejectedCandidates:+gen.jurisdictionRejectedCandidates||0,chosenBeforeTierGate:+gen.chosenBeforeTierGate||0,publishedFeatures:+gen.publishedFeatures||0,selectionOrder:gen.jurisdictionSelectionOrder||null}:null,
      swales:{count:sw.length,bbox:coords.length?{w:west,s:south,e:east,n:north}:null,eastBins},
      boundaryAudit:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
      center,zoom,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),
      lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
    };
  },label);
}

async function run(q,label){
  const start=Date.now();
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},q);
  let timedOut=false;
  try{await page.waitForFunction(q=>{const m=typeof M!=='undefined'?M:null;const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');const ident=String(m?.loc?.name||'')+' '+String(m?.loc?.fullName||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(new RegExp(q,'i').test(ident)&&/screening published\./i.test(status)&&!!window.EARTHLINE_REGIONAL_VISUAL_DATA_16020);},q,{timeout:30000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(400);
  return {elapsedMs:Date.now()-start,timedOut,state:await snap(label)};
}

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const texasFresh=await run('Texas','texas-fresh');
const louisiana=await run('Louisiana','louisiana');
const texasAfterLouisiana=await run('Texas','texas-after-louisiana');
const report={texasFresh,louisiana,texasAfterLouisiana,errors:errors.slice(0,30)};
console.log('EARTHLINE_TX_LA_NEIGHBOR '+JSON.stringify(report));
await browser.close();
if(texasFresh.timedOut||louisiana.timedOut||texasAfterLouisiana.timedOut||texasFresh.state.lastError||louisiana.state.lastError||texasAfterLouisiana.state.lastError)process.exitCode=1;
