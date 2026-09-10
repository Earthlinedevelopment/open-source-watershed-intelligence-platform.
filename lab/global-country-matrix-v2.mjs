import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const srcPath='lab/global-country-matrix.mjs';
const outPath='lab/.global-country-matrix-v2-runtime.mjs';
let src=await fs.readFile(srcPath,'utf8');

const chooseV2=String.raw`async function chooseCountry(frame,target){
  const typedAt=Date.now();
  await frame.evaluate(q=>{
    const i=document.getElementById('searchInput');
    if(!i)throw new Error('search input unavailable');
    i.focus();i.value=q;
    i.dispatchEvent(new Event('input',{bubbles:true}));
  },target.search);
  await frame.waitForTimeout(120);
  return {typed:target.search,typedAt,selectedBefore:await frame.evaluate(snap)};
}

async function waitRunEnabled`;

const regionalV2=String.raw`async function regional(frame,target){
  const sel=await chooseCountry(frame,target);
  if(!(await waitRunEnabled(frame)))return {pass:false,classification:'RUN_CONTROL_TIMEOUT',analysisMs:0,selectionMs:Date.now()-sel.typedAt,...sel,s:await frame.evaluate(snap)};
  const analysisStarted=Date.now();
  if(!(await clickRun(frame)))return {pass:false,classification:'RUN_CONTROL_UNAVAILABLE',analysisMs:0,selectionMs:analysisStarted-sel.typedAt,...sel,s:await frame.evaluate(snap)};
  let timeout=false;
  try{
    await frame.waitForFunction(()=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
      const b=[...document.querySelectorAll('button')].find(x=>/\brun\s+analysis\b/i.test(String(x.textContent||'')))||document.getElementById('runBtn');
      const busy=!!(b&&(b.getAttribute('aria-busy')==='true'||b.dataset.busy==='1'));
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
      return /analysis failed/i.test(status)||(!busy&&String(d.tier||d.mode||'').toLowerCase()==='regional');
    },null,{timeout:WAIT_LIMIT_MS,polling:150});
  }catch(_){timeout=true;}
  const s=await frame.evaluate(snap);
  const analysisMs=Date.now()-analysisStarted;
  const selectionMs=analysisStarted-sel.typedAt;
  const identity=[s.loc?.name,s.loc?.fullName,s.loc?.q,s.loc?.sub].filter(Boolean).join(' ');
  const placeType=String(s.loc?.placeType||'').toLowerCase();
  const geographicPass=placeType==='country'&&hasAlias(identity,target);
  const failed=/analysis failed/i.test(s.status);
  const settled=!timeout&&String(s.displayed?.tier||'').toLowerCase()==='regional'&&!s.runControl?.busy;
  const pass=geographicPass&&settled&&!failed&&analysisMs<=HARD_CEILING_MS&&!s.debugVisible;
  const classification=pass?'REGIONAL_PASS':!geographicPass?'GEO_FAIL':failed?'REGIONAL_APP_FAIL':timeout?'REGIONAL_TIMEOUT':analysisMs>HARD_CEILING_MS?'REGIONAL_SLOW':'REGIONAL_FAIL';
  return {pass,classification,analysisMs,elapsedMs:analysisMs,selectionMs,timeout,geographicPass,...sel,s};
}

async function property`;

const choosePattern=/async function chooseCountry\(frame,target\)\{[\s\S]*?\n\}\n\nasync function waitRunEnabled/;
const regionalPattern=/async function regional\(frame,target\)\{[\s\S]*?\n\}\n\nasync function property/;
if(!choosePattern.test(src))throw new Error('v2 patch could not locate chooseCountry');
src=src.replace(choosePattern,chooseV2);
if(!regionalPattern.test(src))throw new Error('v2 patch could not locate regional');
src=src.replace(regionalPattern,regionalV2);
src=src.replace('currentPublicSurfaceV2:true','currentPublicSurfaceV2:true,directCountryRunV2:true');
await fs.writeFile(outPath,src);
await import(pathToFileURL(process.cwd()+'/'+outPath).href+'?v2='+Date.now());
