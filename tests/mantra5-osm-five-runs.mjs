import {chromium} from 'playwright';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base='https://earthlinedevelopment.org/';
const html=readFileSync('index.html');
const hash=createHash('sha256').update(html).digest('hex');
const target={lat:42.13000,lng:-93.68000};
const folder='artifacts/mantra5-five-runs';mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
try{
for(let i=0;i<5;i++){
  const context=await browser.newContext({viewport:{width:1440,height:920},serviceWorkers:'block'});
  await context.route('https://earthlinedevelopment.org/**', async route=>{
    if(route.request().isNavigationRequest() && new URL(route.request().url()).pathname==='/'){
      return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
    }
    return route.continue();
  });
  const page=await context.newPage(); const errors=[],failed=[];
  page.on('pageerror',err=>errors.push(String(err)));
  page.on('requestfailed',req=>failed.push({url:req.url(),failure:req.failure()?.errorText}));
  const row={iteration:i+1,lat:target.lat,lng:target.lng,sha256:hash,errors,failed,conclusion:'UNVERIFIED'};
  try{
    await page.goto(base+'?mantra5='+i,{waitUntil:'domcontentloaded',timeout:65000});
    await page.locator('#searchInput').fill('Iowa',{timeout:30000});
    await page.locator('#searchInput').press('Enter',{timeout:30000});
    // Reproduce a normal user leaving the search field before starting Property:
    // no force-clicks or DOM removal; fail if suggestions still obstruct controls.
    await page.locator('#searchInput').press('Escape',{timeout:30000});
    await page.mouse.click(1350,850);
    row.searchSuggestionsBlocking=await page.locator('#earthlineSearchSuggestions15970.open').isVisible().catch(()=>false);
    if(row.searchSuggestionsBlocking)throw Error('Iowa search dropdown obstructs Property controls after Escape and outside click');
    await page.waitForFunction(()=>Boolean(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167 || window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020 || window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970),null,{timeout:80000}).catch(()=>null);
    await page.evaluate(t=>{
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      if(!m)throw Error('Map unavailable');
      m.stop();m.jumpTo({center:[t.lng,t.lat],zoom:17.7});
    },target);
    await page.waitForTimeout(2500);
    row.targeting=await page.evaluate(t=>({
      selected:typeof window.earthlineSetPropertyTarget16201==='function'?
        window.earthlineSetPropertyTarget16201({lng:t.lng,lat:t.lat,source:'mantra5-repeat-test'},{openPanel:false}):false,
      buttonPresent:!!document.getElementById('earthlineDeclareProperty16169')
    }),target);
    await page.locator('#earthlineDeclareProperty16169').click({timeout:15000});
    await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&document.documentElement.dataset.earthlinePropertyRunState!=='running',null,{timeout:140000});
    await page.waitForTimeout(1500);
    row.measured=await page.evaluate(()=>{
      const m=(typeof M!=='undefined'?M:window.M)||{};
      const p=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
      const f=m.authoritativeSafeSwales15815?.features;
      const v=m.vectorNoBuildCoverage||{};
      const e=m.noBuildProvenance15843||{};
      return {
        tier:document.documentElement.dataset.earthlineAnalysisTier,
        propertyRunState:document.documentElement.dataset.earthlinePropertyRunState,
        settled:p.settled,
        result:p.result,
        generatedSwales:Array.isArray(m.swales)?m.swales.length:null,
        publishedSwales:Array.isArray(f)?f.length:null,
        exclusionProvider:v.overpass?.provider||e.overpass?.provider||null,
        exclusionSourceComplete:v.overpass?.sourceComplete??e.overpass?.sourceComplete??null,
        exclusionAcquisition:v.acquisitionResult||e.acquisitionResult||null,
        exclusionCoverage:v,
        provenance:e,
        safetyAudit:m.safetyAudit15806||null,
        lastError:window.EARTHLINE_PROPERTY_LAST_ERROR_16173||null
      };
    });
    row.conclusion=row.measured?.settled===true&&row.measured?.publishedSwales>0&&row.measured?.lastError==null?'COMPLETE':'INCOMPLETE';
  }catch(err){row.error=String(err);row.conclusion='FAILED'}
  try{await page.screenshot({path:folder+'/iowa-'+(i+1)+'.png',timeout:12000})}catch(err){row.screenshotError=String(err)}
  results.push(row);
  console.log('MANTRA5_REPEAT '+JSON.stringify({iteration:row.iteration,conclusion:row.conclusion,published:row.measured?.publishedSwales,generated:row.measured?.generatedSwales,provider:row.measured?.exclusionProvider,error:row.error,lastError:row.measured?.lastError}));
  await context.close();
}
} finally {await browser.close();writeFileSync(folder+'/results.json',JSON.stringify(results,null,2))}
const complete=results.length===5&&results.every(x=>x.conclusion==='COMPLETE');
const counts=results.map(x=>x.measured?.publishedSwales);
const identical=counts.every(x=>x===counts[0]);
console.log('MANTRA5_FIVE_RUN_VERDICT '+JSON.stringify({complete,identical,counts,hash}));
if(!complete||!identical)process.exitCode=1;
