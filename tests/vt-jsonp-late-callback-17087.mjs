import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE=String(process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/').replace(/\/?$/,'/');
const OUT='artifacts/vt-jsonp-late-callback-17087';
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({
  headless:true,
  args:['--host-resolver-rules=MAP earthlinedevelopment.org 127.0.0.1']
});
const context=await browser.newContext({
  viewport:{width:1440,height:900},
  ignoreHTTPSErrors:true
});
const page=await context.newPage();
const pageErrors=[];
const consoleErrors=[];
const requests=[];

page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});

await page.route(/(?:services1\.arcgis\.com|maps\.vcgi\.vermont\.gov)/,async route=>{
  const req=route.request();
  const u=new URL(req.url());
  const cb=u.searchParams.get('callback');
  requests.push({url:req.url(),callback:cb||null});
  if(cb){
    // Reproduce the real race deterministically: the JSONP script is accepted,
    // but its callback invocation occurs after Earthline's 6500 ms cleanup.
    const body=`setTimeout(function(){ ${cb}({"features":[]}); },7000);`;
    await route.fulfill({
      status:200,
      contentType:'application/javascript; charset=utf-8',
      body
    });
    return;
  }
  await route.fulfill({
    status:200,
    headers:{'access-control-allow-origin':'*'},
    contentType:'application/json; charset=utf-8',
    body:JSON.stringify({type:'FeatureCollection',features:[]})
  });
});

let result=null,fatal=null;
try{
  await page.goto(BASE+'?vt_jsonp_late_17087='+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>typeof window.earthlinePrefetchVermontAuthority16263==='function',{timeout:15000});
  result=await page.evaluate(async()=>{
    const rectangle=(typeof earthlineRectangleAround==='function')
      ?earthlineRectangleAround(-73.012909,44.513845,20)
      :null;
    if(!rectangle)throw new Error('earthlineRectangleAround unavailable');
    return await window.earthlinePrefetchVermontAuthority16263(rectangle,Number((typeof M!=='undefined'&&M&&M.searchGen)||0));
  });
  await page.waitForTimeout(7800);
}catch(e){fatal=String(e)}

const lateCallbackErrors=pageErrors.filter(e=>/__earthlineVtInfra16458_.*is not defined/i.test(e));
const expectReferenceError=process.env.EARTHLINE_EXPECT_JSONP_REFERENCE_ERROR!=='0';
const reproduced=lateCallbackErrors.length>0;
const pass=expectReferenceError?reproduced:(!reproduced&&result?.ok===true&&!fatal);
const evidence={
  build:'EARTHLINE JSONP LATE CALLBACK DIAGNOSTIC 17087',
  result,fatal,requests,
  pageErrors,consoleErrors,
  expectReferenceError,reproduced,pass,
  lateCallbackErrors
};
writeFileSync(`${OUT}/result.json`,JSON.stringify(evidence,null,2));
console.log('EARTHLINE_VT_JSONP_17087 '+JSON.stringify({
  expectReferenceError:evidence.expectReferenceError,
  reproduced:evidence.reproduced,
  pass:evidence.pass,
  fatal,
  requestCount:requests.length,
  jsonpCount:requests.filter(x=>x.callback).length,
  pageErrors,
  result
}));
await context.close();
await browser.close();
if(!evidence.pass)process.exitCode=1;
