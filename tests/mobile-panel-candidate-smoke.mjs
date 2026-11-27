import { chromium } from 'playwright';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const BASE='https://earthlinedevelopment.org/';
const root=process.cwd();
const origin=new URL(BASE).origin;
const browser=await chromium.launch({headless:true});
const results=[];
try {
  for (const {name,width,height,initialOpen} of [
    {name:'phone',width:390,height:844,initialOpen:false},
    {name:'desktop',width:1440,height:900,initialOpen:true}
  ]) {
    const ctx=await browser.newContext({viewport:{width,height}});
    const page=await ctx.newPage();
    try {
      await page.route('**/*',async route=>{
        const u=new URL(route.request().url());
        if(u.origin!==origin)return route.continue();
        let rel;
        try{rel=decodeURIComponent(u.pathname).slice(1)}catch{return route.abort()}
        if(!rel)rel='index.html';
        const f=path.resolve(root,rel);
        if(!f.startsWith(root+path.sep)||!existsSync(f)||!statSync(f).isFile())return route.continue();
        const e=path.extname(f).toLowerCase();
        const types={'.js':'application/javascript','.css':'text/css','.html':'text/html; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
        return route.fulfill({status:200,contentType:types[e]||'application/octet-stream',body:readFileSync(f)});
      });
      await page.goto(BASE+'?earthline_mobile_panel_candidate='+name,{waitUntil:'domcontentloaded',timeout:60000});
      await page.waitForFunction(()=>typeof window.earthlinePanelAudit16188==='function',null,{timeout:30000});
      const isOpen=()=>page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'));
      const start=await isOpen();
      assert.equal(start,initialOpen,name+' initial panel state');
      await page.locator('#earthlineRailSearch16188').click();
      assert.equal(await isOpen(),!initialOpen,name+' manual rail toggle');
      if(name==='phone'){
        await page.evaluate(()=>document.dispatchEvent(new CustomEvent('earthline:analysis-complete',{detail:{tier:'property',runToken:'smoke-only'}})));
        await page.waitForTimeout(350);
        assert.equal(await isOpen(),false,'phone map must be visible after completion');
        await page.locator('#earthlineRailSearch16188').click();
        assert.equal(await isOpen(),true,'phone panel must remain manually accessible');
        await page.locator('#earthlinePanelClose16188').click();
        assert.equal(await isOpen(),false,'phone close control must work');
      } else {
        await page.evaluate(()=>document.dispatchEvent(new CustomEvent('earthline:analysis-complete',{detail:{tier:'regional',runToken:'smoke-only'}})));
        await page.waitForTimeout(350);
        assert.equal(await isOpen(),false,'desktop manually closed panel must stay closed');
        await page.locator('#earthlineRailSearch16188').click();
        assert.equal(await isOpen(),true,'desktop panel manually reopens');
      }
      results.push({name,pass:true,start});
      console.log('PASS',name,'initial',start);
    } finally { await ctx.close(); }
  }
} finally { await browser.close(); }
console.log(JSON.stringify(results));
