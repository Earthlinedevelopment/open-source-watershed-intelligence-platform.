import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1700,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});

const needle=`    for(const f of lines){\n      const coords=f.geometry.coordinates;if(coords.length<16)continue;\n      const fractions=coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68];\n      for(const frac of fractions){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),false);if(c)candidates.push(c);}\n    }`;

const replacement=`    const __earthlineSampleAttempts16611=[];\n    function diagnoseSample16611(coords,center,relaxed){\n      const half=Math.max(10,Math.min(52,Math.floor(coords.length*.18))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1),raw=coords.slice(start,end);\n      const out={rawLength:raw.length,segmentLength:0,lineLengthPixels:0,finiteSlope:0,invalidSlope:0,lowSlope:0,highSlope:0,channelExcluded:0,valid:0,reason:null,pass:false};\n      if(raw.length<10){out.reason='raw-short';return out;}\n      const segment=chaikin(raw,2,false);out.segmentLength=segment.length;out.lineLengthPixels=lineLengthPixels(hy,segment);\n      if(segment.length<10){out.reason='segment-short';return out;}\n      if(out.lineLengthPixels<10){\n        const strideShort16625=Math.max(1,Math.floor(segment.length/22)),vals16625=[];\n        for(let kk16625=1;kk16625<segment.length-1;kk16625+=strideShort16625){\n          const gg16625=llGrid(hy,segment[kk16625]),xx16625=Math.max(1,Math.min(hy.w-2,Math.round(gg16625.x))),yy16625=Math.max(1,Math.min(hy.h-2,Math.round(gg16625.y))),ii16625=yy16625*hy.w+xx16625,ss16625=Number(hy.slope[ii16625]);\n          if(Number.isFinite(ss16625))vals16625.push(ss16625);\n        }\n        out.shortSlopeMin=vals16625.length?Math.min(...vals16625):null;\n        out.shortSlopeMax=vals16625.length?Math.max(...vals16625):null;\n        out.shortSlopeMean=vals16625.length?vals16625.reduce((aa16625,bb16625)=>aa16625+bb16625,0)/vals16625.length:null;\n        out.shortSlopeAtOrAbove3=vals16625.filter(v16625=>v16625>=3).length;\n        out.shortSlopeSamples=vals16625.length;\n        out.reason='line-short';return out;\n      }\n      const stride=Math.max(1,Math.floor(segment.length/22)),minSlope=relaxed?.05:.20,maxSlope=relaxed?18:13.5;\n      for(let k=1;k<segment.length-1;k+=stride){\n        const g=llGrid(hy,segment[k]),x=Math.max(1,Math.min(hy.w-2,Math.round(g.x))),y=Math.max(1,Math.min(hy.h-2,Math.round(g.y))),i=y*hy.w+x;\n        const slope=hy.slope[i],acc=hy.acc[i];\n        if(!Number.isFinite(slope)){out.invalidSlope++;continue;}\n        out.finiteSlope++;\n        if(slope<minSlope){out.lowSlope++;continue;}\n        if(slope>maxSlope){out.highSlope++;continue;}\n        if(acc>=channel){out.channelExcluded++;continue;}\n        out.valid++;\n      }\n      if(out.valid<(relaxed?1:2)){\n        if(out.lowSlope>=out.highSlope&&out.lowSlope>=out.channelExcluded&&out.lowSlope>0)out.reason='low-slope';\n        else if(out.highSlope>=out.channelExcluded&&out.highSlope>0)out.reason='high-slope';\n        else if(out.channelExcluded>0)out.reason='channel';\n        else out.reason='insufficient-valid';\n        return out;\n      }\n      out.pass=true;out.reason='pass';return out;\n    }\n    let __earthlineLineIndex16611=0;\n    for(const f of lines){\n      const coords=f.geometry.coordinates,li16611=__earthlineLineIndex16611++;if(coords.length<16)continue;\n      let minX16611=Infinity,minY16611=Infinity,maxX16611=-Infinity,maxY16611=-Infinity;\n      for(const p16611 of coords){if(!Array.isArray(p16611)||!Number.isFinite(+p16611[0])||!Number.isFinite(+p16611[1]))continue;minX16611=Math.min(minX16611,+p16611[0]);minY16611=Math.min(minY16611,+p16611[1]);maxX16611=Math.max(maxX16611,+p16611[0]);maxY16611=Math.max(maxY16611,+p16611[1]);}\n      const fractions=coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68];\n      for(const frac of fractions){\n        const center16611=Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),strict16611=diagnoseSample16611(coords,center16611,false),relaxed16611=diagnoseSample16611(coords,center16611,true),c=sampleSegment(coords,center16611,false);\n        const centerLL16611=coords[center16611]||null;\n        __earthlineSampleAttempts16611.push({lineIndex:li16611,elevM:Number(f&&f.properties&&f.properties.elev_m),coordsLength:coords.length,lineBbox:Number.isFinite(minX16611)?[minX16611,minY16611,maxX16611,maxY16611]:null,fraction:frac,center:center16611,centerLL:centerLL16611,strict:strict16611,relaxedWouldPass:!!relaxed16611.pass,relaxed:relaxed16611});\n        if(c)candidates.push(c);\n      }\n    }\n    try{window.EARTHLINE_SAMPLE_REJECTION_16611=__earthlineSampleAttempts16611;}catch(_){}`;

let patchCount=0;
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();
  const text=await resp.text();
  patchCount=text.split(needle).length-1;
  const body=patchCount?text.split(needle).join(replacement):text;
  return route.fulfill({response:resp,body});
});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;
try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&Array.isArray(window.EARTHLINE_SAMPLE_REJECTION_16611));},{timeout:35000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(350);

const result=await page.evaluate(()=>{
  const attempts=Array.isArray(window.EARTHLINE_SAMPLE_REJECTION_16611)?window.EARTHLINE_SAMPLE_REJECTION_16611:[];
  const regions={
    panhandleNorth:{minX:-103.05,maxX:-100.0,minY:35.4,maxY:36.55},
    panhandleWestNM:{minX:-103.15,maxX:-102.45,minY:34.0,maxY:36.55},
    upperCoast:{minX:-96.2,maxX:-93.45,minY:28.4,maxY:30.7},
    midCoast:{minX:-98.2,maxX:-96.2,minY:26.6,maxY:29.7},
    lowerCoast:{minX:-98.8,maxX:-96.5,minY:25.75,maxY:27.6},
    eastInterior:{minX:-96.0,maxX:-93.45,minY:30.7,maxY:33.1}
  };
  const intersects=(b,r)=>Array.isArray(b)&&b[2]>=r.minX&&b[0]<=r.maxX&&b[3]>=r.minY&&b[1]<=r.maxY;
  const inside=(p,r)=>Array.isArray(p)&&+p[0]>=r.minX&&+p[0]<=r.maxX&&+p[1]>=r.minY&&+p[1]<=r.maxY;
  const summarize=(r)=>{
    const onLines=attempts.filter(a=>intersects(a.lineBbox,r)),centers=attempts.filter(a=>inside(a.centerLL,r));
    const uniqueLines=new Set(onLines.map(a=>a.lineIndex));
    const strictPass=centers.filter(a=>a.strict?.pass).length,strictFail=centers.length-strictPass;
    const relaxedAmongFails=centers.filter(a=>!a.strict?.pass&&a.relaxedWouldPass).length;
    const reasons={};let lowSlope=0,highSlope=0,channel=0,invalidSlope=0,validStrict=0,validRelaxed=0;
    for(const a of centers){const reason=String(a.strict?.reason||'unknown');reasons[reason]=(reasons[reason]||0)+1;lowSlope+=Number(a.strict?.lowSlope||0);highSlope+=Number(a.strict?.highSlope||0);channel+=Number(a.strict?.channelExcluded||0);invalidSlope+=Number(a.strict?.invalidSlope||0);validStrict+=Number(a.strict?.valid||0);validRelaxed+=Number(a.relaxed?.valid||0);}
    const shortSlopeEvidence=centers.filter(a=>a.strict?.reason==='line-short').reduce((o,a)=>{const s=a.strict||{};o.segments++;o.samples+=Number(s.shortSlopeSamples||0);o.atOrAbove3+=Number(s.shortSlopeAtOrAbove3||0);if(Number.isFinite(Number(s.shortSlopeMin)))o.min=Math.min(o.min,Number(s.shortSlopeMin));if(Number.isFinite(Number(s.shortSlopeMax)))o.max=Math.max(o.max,Number(s.shortSlopeMax));return o;},{segments:0,samples:0,atOrAbove3:0,min:Infinity,max:-Infinity});\n    if(!Number.isFinite(shortSlopeEvidence.min))shortSlopeEvidence.min=null;if(!Number.isFinite(shortSlopeEvidence.max))shortSlopeEvidence.max=null;\n    return {uniqueContourLinesTouching:uniqueLines.size,attemptsOnTouchingLines:onLines.length,centersInside:centers.length,strictPass,strictFail,relaxedWouldPassAmongStrictFails:relaxedAmongFails,reasons,shortSlopeEvidence,sampleCounters:{lowSlope,highSlope,channel,invalidSlope,validStrict,validRelaxed},samples:centers.slice(0,18)};
  };
  const out={};for(const [k,r] of Object.entries(regions))out[k]=summarize(r);
  const allReasons={};let allStrictFail=0,allRelaxedRescue=0;
  for(const a of attempts){if(!a.strict?.pass){allStrictFail++;const r=String(a.strict?.reason||'unknown');allReasons[r]=(allReasons[r]||0)+1;if(a.relaxedWouldPass)allRelaxedRescue++;}}
  return {attemptCount:attempts.length,allStrictFail,allRelaxedRescue,allReasons,regions:out,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()};
});

console.log('EARTHLINE_TX_SAMPLE_REJECTION '+JSON.stringify({patchCount,timedOut,result,errors:errors.slice(0,20)}));
await browser.close();
if(patchCount!==1||timedOut||result.lastError)process.exitCode=1;
