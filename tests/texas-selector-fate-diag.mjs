import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1700,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});

const needle=`    candidates.sort((a,b)=>b.score-a.score);\n    const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));\n    for(const c of candidates){\n      if(chosen.length>=80)break;\n      const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));\n      if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<spacing))continue;\n      chosen.push(c);\n    }`;
const replacement=`    candidates.sort((a,b)=>b.score-a.score);\n    const __selectorFates16607=[];\n    const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));\n    for(let __ri16607=0;__ri16607<candidates.length;__ri16607++){\n      const c=candidates[__ri16607];\n      const __seg16607=c&&c.segment||[],__mid16607=__seg16607[Math.floor((__seg16607.length-1)/2)]||null;\n      if(chosen.length>=80){__selectorFates16607.push({rank:__ri16607+1,fate:'cap',mid:__mid16607,x:c.x,y:c.y,score:c.score,chosenBefore:chosen.length,spacing:null,blocker:null});continue;}\n      const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));\n      let __block16607=null,__dist16607=Infinity;\n      for(let __bi16607=0;__bi16607<chosen.length;__bi16607++){const p=chosen[__bi16607],d=Math.hypot(p.x-c.x,p.y-c.y);if(d<__dist16607){__dist16607=d;const ps=p&&p.segment||[],pm=ps[Math.floor((ps.length-1)/2)]||null;__block16607={chosenIndex:__bi16607+1,mid:pm,x:p.x,y:p.y,score:p.score,distance:d};}}\n      if(__block16607&&__dist16607<spacing){__selectorFates16607.push({rank:__ri16607+1,fate:'spacingReject',mid:__mid16607,x:c.x,y:c.y,score:c.score,chosenBefore:chosen.length,spacing,blocker:__block16607});continue;}\n      chosen.push(c);\n      __selectorFates16607.push({rank:__ri16607+1,fate:'selected',selectedIndex:chosen.length,mid:__mid16607,x:c.x,y:c.y,score:c.score,chosenBefore:chosen.length-1,spacing,blocker:__block16607});\n    }\n    try{window.EARTHLINE_SELECTOR_FATES_16607=__selectorFates16607;}catch(_){}`;

let patchCount=0;
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();
  const text=await resp.text();
  patchCount=text.split(needle).length-1;
  return route.fulfill({response:resp,body:patchCount?text.split(needle).join(replacement):text});
});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;
try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&Array.isArray(window.EARTHLINE_SELECTOR_FATES_16607));},{timeout:35000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(500);

const result=await page.evaluate(()=>{
  const f=Array.isArray(window.EARTHLINE_SELECTOR_FATES_16607)?window.EARTHLINE_SELECTOR_FATES_16607:[];
  const regs={
    panhandleCore:(x,y)=>x>=-103.05&&x<=-100.0&&y>=34.0&&y<=36.5,
    panhandleNorth:(x,y)=>x>=-103.05&&x<=-100.0&&y>=35.4&&y<=36.55,
    northOKTexasSide:(x,y)=>x>-100.0&&x<=-94.4&&y>=33.5&&y<=36.5,
    eastInterior:(x,y)=>x>-96&&x<=-93.5&&y>=29.5&&y<=33.6,
    upperCoast:(x,y)=>x>-96&&x<=-93.5&&y>=28.7&&y<31.1,
    midCoast:(x,y)=>x>-99&&x<=-96&&y>=27&&y<30.5,
    lowerCoast:(x,y)=>x>-99.5&&x<=-97&&y>=25.8&&y<28.1,
    westCentral:(x,y)=>x<=-99&&y>=28&&y<=35
  };
  const summaries={};
  for(const [name,pred] of Object.entries(regs)){
    const rows=f.filter(r=>Array.isArray(r.mid)&&pred(+r.mid[0],+r.mid[1]));
    summaries[name]={total:rows.length,selected:rows.filter(r=>r.fate==='selected').length,spacingReject:rows.filter(r=>r.fate==='spacingReject').length,cap:rows.filter(r=>r.fate==='cap').length,rows:rows.slice(0,30)};
  }
  const rejects=f.filter(r=>r.fate!=='selected');
  return {
    count:f.length,
    selected:f.filter(r=>r.fate==='selected').length,
    spacingReject:f.filter(r=>r.fate==='spacingReject').length,
    cap:f.filter(r=>r.fate==='cap').length,
    summaries,
    allRejects:rejects,
    generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()
  };
});
console.log('EARTHLINE_TX_SELECTOR_FATE '+JSON.stringify({patchCount,timedOut,result,errors:errors.slice(0,20)}));
await browser.close();
if(!patchCount||timedOut||result.lastError)process.exitCode=1;
