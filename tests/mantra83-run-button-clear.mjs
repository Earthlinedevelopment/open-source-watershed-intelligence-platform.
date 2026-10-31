import {chromium,devices} from 'playwright';
const OLD1="function positionMenu16201(){const r=box.getBoundingClientRect(),w=Math.max(320,Math.min(620,window.innerWidth-r.left-18));menu.style.setProperty('left',r.left+'px','important');menu.style.setProperty('top',(r.bottom+8)+'px','important');menu.style.setProperty('width',w+'px','important');}";
const NEW1="function positionMenu16201(){const r=box.getBoundingClientRect(),run=document.getElementById('runBtn')?.getBoundingClientRect(),w=Math.max(320,Math.min(620,window.innerWidth-r.left-18)),top=run&&Number.isFinite(run.bottom)?run.bottom+8:r.bottom+8;menu.style.setProperty('left',r.left+'px','important');menu.style.setProperty('top',top+'px','important');menu.style.setProperty('width',w+'px','important');}";
const OLD2="function positionSuggestions16233(){const input=document.getElementById('searchInput'),menu=document.getElementById('earthlineSearchSuggestions15970');if(!input||!menu)return;const r=input.closest('.searchbox')?.getBoundingClientRect()||input.getBoundingClientRect();menu.style.left=Math.round(r.left)+'px';menu.style.top=Math.round(r.bottom+7)+'px';menu.style.width=Math.round(r.width)+'px'}";
const NEW2="function positionSuggestions16233(){const input=document.getElementById('searchInput'),menu=document.getElementById('earthlineSearchSuggestions15970');if(!input||!menu)return;const r=input.closest('.searchbox')?.getBoundingClientRect()||input.getBoundingClientRect(),run=document.getElementById('runBtn')?.getBoundingClientRect(),top=run&&Number.isFinite(run.bottom)?run.bottom+8:r.bottom+7;menu.style.left=Math.round(r.left)+'px';menu.style.top=Math.round(top)+'px';menu.style.width=Math.round(r.width)+'px'}";

const browser=await chromium.launch({headless:true});
const cases=[
  {name:'desktop',opts:{viewport:{width:1440,height:900}},q:'Vermont',touch:false},
  {name:'iPhone',opts:{...devices['iPhone 13']},q:'Vermont',touch:true},
  {name:'Pixel',opts:{...devices['Pixel 7']},q:'Vermont',touch:true},
  {name:'Pixel',opts:{...devices['Pixel 7']},q:'Arizona',touch:true}
];
const out=[];
for(const c of cases){
 const ctx=await browser.newContext(c.opts),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.route('https://earthlinedevelopment.org/',async route=>{const response=await route.fetch();let body=await response.text();if(!body.includes(OLD1)||!body.includes(OLD2))throw new Error('position owner missing');body=body.replace(OLD1,NEW1).replace(OLD2,NEW2);await route.fulfill({response,body});});
 await p.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});await p.waitForTimeout(1500);
 await p.locator('#searchInput').fill(c.q);await p.waitForTimeout(200);
 const geom=await p.evaluate(()=>{const m=document.getElementById('earthlineSearchSuggestions15970')?.getBoundingClientRect(),b=document.getElementById('runBtn')?.getBoundingClientRect();return {menuTop:m?.top,runBottom:b?.bottom,open:document.getElementById('earthlineSearchSuggestions15970')?.classList.contains('open')};});
 const button=p.locator('#runBtn');
 const before=await p.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));const t=Date.now();
 try{
   if(c.touch)await button.tap({timeout:10000});else await button.click({timeout:10000});
   await p.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:120000});
   const result=await p.evaluate(({name,q,t,geom,errors})=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return {name,q,completed:true,wallMs:Date.now()-t,tier:d?.tier||d?.mode,swales:Number(d?.derived?.swaleOpportunityLines||0),geom,errors};},{name:c.name,q:c.q,t,geom,errors});
   out.push(result);
 }catch(e){out.push({name:c.name,q:c.q,completed:false,error:String(e?.message||e),geom,errors});}
 await ctx.close();
}
await browser.close();
const failures=out.filter(r=>!r.completed||!(r.geom.menuTop>=r.geom.runBottom+6)||String(r.tier||'').toLowerCase()!=='regional'||!(r.swales>0));
console.log('M83_RUN_BUTTON_CLEAR '+JSON.stringify({out,failures}));
if(failures.length)process.exitCode=2;