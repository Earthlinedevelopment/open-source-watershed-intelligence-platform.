import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const needles=[
  'function earthlineMappedWaterSwaleGate16609',
  'const verified16609=',
  'function earthlineClipRegionalProducts16539',
  'regionalRecharge16492',
  'earthlineRenderRegionalOverlay16020',
  'function clearLive',
  'clearForSubmission',
  'earthlineClearPropertyPresentation16334',
  'function runProperty15778',
  'scheduleSafePropertyFallback16221',
  'settlePropertyMapVisibility16260',
  'earthlineDeliverPropertyResult15817',
  'earthlineApplyRendererOwnership15805',
  'earthline-swales-line',
  'el-live-swale-line-15970',
  'function earthlineAdministrativeCapability16539',
  'jurisdictionBoundaryPromise16539',
  'EARTHLINE_REGIONAL_VISUAL_DATA_16020'
];
for(const n of needles){
  let from=0,found=0;
  while(true){
    const i=s.indexOf(n,from); if(i<0)break;
    found++;
    const a=Math.max(0,i-2600),b=Math.min(s.length,i+5200);
    console.log(`\n===== ${n} #${found} @${i} =====\n${s.slice(a,b)}\n===== END =====`);
    from=i+n.length;
    if(found>=8)break;
  }
  if(!found)console.log(`\n===== ${n}: NOT FOUND =====`);
}
