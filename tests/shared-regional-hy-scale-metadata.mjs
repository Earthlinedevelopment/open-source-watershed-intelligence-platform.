import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const cases=['Texas','Oklahoma','New York','Louisiana'];
const browser=await chromium.launch({headless:true});
for(const query of cases){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  let patched=0;
  await page.route('**/*',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch(); let text=await resp.text();
    const needle='if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;';
    const inject=`if(!window.EARTHLINE_HY_SCALE_DIAG){try{const h=hy||{},o={};for(const k of Object.keys(h)){const v=h[k],t=typeof v;if(v==null||t==='number'||t==='string'||t==='boolean'){o[k]=v;}else if(Array.isArray(v)){o[k]={type:'array',len:v.length,head:v.length<=8?v:null};}else if(t==='object'){const keys=Object.keys(v).slice(0,40),small={};for(const kk of keys){const vv=v[kk],tt=typeof vv;if(vv==null||tt==='number'||tt==='string'||tt==='boolean')small[kk]=vv;else if(Array.isArray(vv)&&vv.length<=8)small[kk]=vv;}o[k]={type:'object',keys,small};}}window.EARTHLINE_HY_SCALE_DIAG=o;}catch(e){window.EARTHLINE_HY_SCALE_DIAG={error:String(e)}}}if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;`;
    patched=text.split(needle).length-1;
    text=text.split(needle).join(inject);
    return route.fulfill({response:resp,body:text});
  });
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  try{await page.waitForFunction(()=>window.EARTHLINE_HY_SCALE_DIAG||window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:30000,polling:100});}catch(_){}
  await page.waitForTimeout(250);
  const state=await page.evaluate(()=>({hy:window.EARTHLINE_HY_SCALE_DIAG||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,gen:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
  console.log('EARTHLINE_HY_SCALE '+JSON.stringify({query,patched,state}));
  await page.close();
}
await browser.close();
