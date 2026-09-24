import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra47-16833-source-extract';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();
let body='';
await context.route('https://earthlinedevelopment.org/**',async route=>{
  if(route.request().resourceType()!=='document') return route.continue();
  const resp=await route.fetch(); body=await resp.text(); await route.fulfill({response:resp,body});
});
await page.goto(BASE+'?m47_16833='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
const markers=['16787','16788','16780','fine-terrain','refinement'];
let out='';
for(const marker of markers){
  out+='\n===== MARKER '+marker+' =====\n';
  let at=0,count=0;
  while((at=body.indexOf(marker,at))>=0&&count<12){
    out+=`\n--- ${marker} occurrence ${count+1} @ ${at} ---\n`;
    out+=body.slice(Math.max(0,at-7000),Math.min(body.length,at+18000));
    out+='\n'; at+=marker.length; count++;
  }
  out+=`\nCOUNT_SHOWN=${count}\n`;
}
writeFileSync(OUT+'/source-excerpts.txt',out);
writeFileSync(OUT+'/meta.json',JSON.stringify({bytes:body.length,markers:Object.fromEntries(markers.map(m=>[m,body.split(m).length-1]))},null,2));
console.log(JSON.stringify({bytes:body.length,markers:Object.fromEntries(markers.map(m=>[m,body.split(m).length-1]))}));
await browser.close();
