import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const sequences=[
  {name:'texas-to-salida',queries:['Texas','salida, co']},
  {name:'new-mexico-to-salida',queries:['New Mexico','salida, co']},
  {name:'salida-repeat',queries:['salida, co','salida, co']},
  {name:'colorado-to-salida',queries:['Colorado','salida, co']}
];
const browser=await chromium.launch({headless:true});
const all=[];

async function runQuery(page,query){
  const before=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));
  const started=Date.now();
  await page.evaluate(q=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.focus(); i.value=q; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); b.click();
  },query);
  let timedOut=false;
  try{
    await page.waitForFunction(prev=>{
      const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'');
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      return (!!at&&at!==prev)||!!err;
    },before,{timeout:30000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(700);
  return await page.evaluate(({query,started,timedOut})=>{
    const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const ov=document.getElementById('earthlineRegionalVectorOverlay16020');
    return {
      query,timedOut,elapsedMs:Date.now()-started,
      generated:g?.publishedFeatures??null,chosen:g?.chosenBeforeTierGate??null,
      displaySwales:d?.swaleLines??null,pubOverlaySwales:pub?.overlaySwaleLines??null,
      sourceFeatures:pub?.sourceFeatures??null,totalMs:p?.totalMs??null,
      outside:b?.outsideAfterClip??null,
      svgChildren:ov?ov.children.length:null,svgDisplay:ov?getComputedStyle(ov).display:null,
      lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()
    };
  },{query,started,timedOut});
}

for(const seq of sequences){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e))); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(URL+'?salida_lifecycle='+seq.name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const rows=[];
  for(const q of seq.queries){
    const row=await runQuery(page,q);
    rows.push(row);
    console.log('EARTHLINE_SALIDA_LIFECYCLE_STEP '+JSON.stringify({sequence:seq.name,...row}));
  }
  const out={sequence:seq.name,rows,errors:errors.slice(0,20)};
  all.push(out);
  console.log('EARTHLINE_SALIDA_LIFECYCLE '+JSON.stringify(out));
  await page.close();
}
console.log('EARTHLINE_SALIDA_LIFECYCLE_SUMMARY '+JSON.stringify(all.map(x=>({sequence:x.sequence,final:x.rows[x.rows.length-1],errors:x.errors.length}))));
await browser.close();
