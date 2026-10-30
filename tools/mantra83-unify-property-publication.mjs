import {readFileSync,writeFileSync} from 'node:fs';
const path='index.html';
let s=readFileSync(path,'utf8');
const before=s;

s=s.replace(/\s*earthlineMap\.on\("(?:idle|styledata|moveend|zoomend)",\(\)=>\{\}\);\s*\/\/[^\n]*/g,'');
s=s.replaceAll("map.on('styledata',()=>{});",'');

const helper=String.raw`
  /* MANTRA 83 — ONE PROPERTY PUBLICATION OWNER.
     Every Property entry path must finish through this function so the visible target,
     model center, run token, exclusion evidence and displayed result share one identity. */
  function earthlineDistanceM83(a,b){
    if(!a||!b)return Infinity;
    const lat1=Number(a.lat),lng1=Number(a.lng),lat2=Number(b.lat),lng2=Number(b.lng);
    if(![lat1,lng1,lat2,lng2].every(Number.isFinite))return Infinity;
    const r=Math.PI/180,dlat=(lat2-lat1)*r,dlng=(lng2-lng1)*r;
    const q=Math.sin(dlat/2)**2+Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dlng/2)**2;
    return 6371000*2*Math.atan2(Math.sqrt(q),Math.sqrt(Math.max(0,1-q)));
  }
  function earthlinePropertyIdentity83(loc){
    const md=state(),t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    let target=null;
    if(t&&Number.isFinite(Number(t.lng))&&Number.isFinite(Number(t.lat)))target={lng:Number(t.lng),lat:Number(t.lat),source:String(t.source||'property-target'),code:String(t.code||''),parentRunToken:String(t.parentRunToken||'')};
    else if(loc&&Number.isFinite(Number(loc.lng))&&Number.isFinite(Number(loc.lat)))target={lng:Number(loc.lng),lat:Number(loc.lat),source:'resolved-location',code:'',parentRunToken:''};
    else {try{const c=map()?.getCenter?.();if(c&&Number.isFinite(Number(c.lng))&&Number.isFinite(Number(c.lat)))target={lng:Number(c.lng),lat:Number(c.lat),source:'map-center',code:'',parentRunToken:''};}catch(_){}}
    const modelCenter=md&&Number.isFinite(Number(md.centerLng))&&Number.isFinite(Number(md.centerLat))?{lng:Number(md.centerLng),lat:Number(md.centerLat)}:null;
    return {target,modelCenter,driftM:earthlineDistanceM83(target,modelCenter)};
  }
  function earthlinePublishProperty83(runToken,q,loc,out){
    if(out===false)throw new Error('property analysis returned no verified result');
    if(!isCurrentRun(runToken))return false;
    const md=state(),identity=earthlinePropertyIdentity83(loc);
    if(!identity.target||!identity.modelCenter)throw new Error('property identity incomplete — output blocked');
    if(!Number.isFinite(identity.driftM)||identity.driftM>250)throw new Error('property identity mismatch — target and science frame differ by '+Math.round(identity.driftM)+' m; output blocked');
    const evidence16516=(typeof window.earthlineGetExclusionEvidence16516==='function'?window.earthlineGetExclusionEvidence16516():null);
    const authoritative16516=!!(evidence16516&&evidence16516.sourceTier==='authoritative-local');
    const propertySnapshot=Object.freeze({
      build:BUILD,runToken,query:q||String(md&&md.appliedSearchText||''),tier:'property',mode:'property',publishedAt:new Date().toISOString(),
      location:Object.freeze({...identity.target}),modelCenter:Object.freeze({...identity.modelCenter}),identityDriftM:Number(identity.driftM.toFixed(2)),
      derived:{swaleOpportunityLines:Array.isArray(md&&md.swales)?md.swales.length:0},
      exclusionEvidence:evidence16516,
      sourceRule:authoritative16516?'Vermont E911/VCGI first; exclusions fail closed; Overpass disabled':(evidence16516&&evidence16516.label?evidence16516.label:'Exclusion evidence not recorded')
    });
    publishDisplayedRun16151(propertySnapshot);
    try{if(typeof window.earthlineApplyRendererOwnership15805==='function')window.earthlineApplyRendererOwnership15805('property');}catch(_){}
    recordRun('property_run_published',runToken,{query:propertySnapshot.query,swaleCount:propertySnapshot.derived.swaleOpportunityLines,location:propertySnapshot.location,identityDriftM:propertySnapshot.identityDriftM,exclusionEvidence:evidence16516});
    if(typeof window.earthlineRenderExclusionEvidence16516==='function')window.earthlineRenderExclusionEvidence16516();
    window.EARTHLINE_PROPERTY_IDENTITY_MANTRA83={runToken,query:propertySnapshot.query,target:propertySnapshot.location,modelCenter:propertySnapshot.modelCenter,driftM:propertySnapshot.identityDriftM,verified:true,at:new Date().toISOString()};
    return propertySnapshot;
  }
`;

function once(oldText,newText,label){
  const n=s.split(oldText).length-1;
  if(n!==1)throw new Error(label+' expected once, found '+n);
  s=s.replace(oldText,newText);
}
once('  async function runPropertyDirect(q){',helper+'\n  async function runPropertyDirect(q){','helper insertion');

once(`      const out=await Promise.resolve(governed());
      if(input)input.value=q;st.appliedSearchText=q;
      if(out===false)throw new Error('governed Property analysis did not publish a verified result');
      recordRun('direct_address_property_published',runToken,{query:q,lng:target.lng,lat:target.lat});
      document.documentElement.dataset.earthlineDirectAddress16291='published';
      return true;`,
`      const out=await Promise.resolve(governed());
      if(input)input.value=q;st.appliedSearchText=q;
      const published83=earthlinePublishProperty83(runToken,q,loc,out);
      if(!published83)throw new Error('governed Property analysis was superseded before publication');
      recordRun('direct_address_property_published',runToken,{query:q,lng:target.lng,lat:target.lat,identityDriftM:published83.identityDriftM});
      document.documentElement.dataset.earthlineDirectAddress16291='published';
      return true;`,'direct address terminal');

once(`        const out=await runPropertyDirect(q);if(!isCurrentRun(runToken))return false;
        if(out===false)throw new Error('property analysis did not publish. The preserved Property target returned no verified result.');
        return true;`,
`        const out=await runPropertyDirect(q);if(!isCurrentRun(runToken))return false;
        const published83=earthlinePublishProperty83(runToken,q,null,out);
        if(!published83)throw new Error('property analysis was superseded before publication');
        return true;`,'same property terminal');

once(`        if(z>=15.5){setBusy(true,'ANALYZING PROPERTY');const out=await runPropertyDirect('');if(!isCurrentRun(runToken))return false;return out!==false;}`,
`        if(z>=15.5){setBusy(true,'ANALYZING PROPERTY');const out=await runPropertyDirect('');if(!isCurrentRun(runToken))return false;return !!earthlinePublishProperty83(runToken,'',null,out);}`,'blank property terminal');

once(`      const out=await runPropertyDirect(q);if(!isCurrentRun(runToken))return false;
      if(out===false)throw new Error('property analysis did not publish. The address resolved, but the property engine returned no verified result; confirm the declared analysis boundary and exclusion data.');
      const md=state(),evidence16516=(typeof window.earthlineGetExclusionEvidence16516==='function'?window.earthlineGetExclusionEvidence16516():null),authoritative16516=!!(evidence16516&&evidence16516.sourceTier==='authoritative-local'),propertySnapshot=Object.freeze({build:BUILD,runToken,query:q,tier:'property',mode:'property',publishedAt:new Date().toISOString(),derived:{swaleOpportunityLines:Array.isArray(md&&md.swales)?md.swales.length:0},exclusionEvidence:evidence16516,sourceRule:authoritative16516?'Vermont E911/VCGI first; exclusions fail closed; Overpass disabled':(evidence16516&&evidence16516.label?evidence16516.label:'Exclusion evidence not recorded')});
      publishDisplayedRun16151(propertySnapshot);recordRun('property_run_published',runToken,{query:q,swaleCount:propertySnapshot.derived.swaleOpportunityLines,exclusionEvidence:evidence16516});setRunStatus(authoritative16516?('Vermont property analysis published for '+q+' — verify bare-earth terrain, exclusions and field conditions before construction.'):('Property terrain analysis published for '+q+' — '+(evidence16516&&evidence16516.label?evidence16516.label:'verify local exclusions')+'.'),'published');if(typeof window.earthlineRenderExclusionEvidence16516==='function')window.earthlineRenderExclusionEvidence16516();notify('Property analysis complete.');return true;`,
`      const out=await runPropertyDirect(q);if(!isCurrentRun(runToken))return false;
      const propertySnapshot=earthlinePublishProperty83(runToken,q,loc,out);
      if(!propertySnapshot)throw new Error('property analysis was superseded before publication');
      const evidence16516=propertySnapshot.exclusionEvidence,authoritative16516=!!(evidence16516&&evidence16516.sourceTier==='authoritative-local');
      setRunStatus(authoritative16516?('Vermont property analysis published for '+q+' — verify bare-earth terrain, exclusions and field conditions before construction.'):('Property terrain analysis published for '+q+' — '+(evidence16516&&evidence16516.label?evidence16516.label:'verify local exclusions')+'.'),'published');notify('Property analysis complete.');return true;`,'resolved property terminal');

if(!s.startsWith('<!-- MANTRA 83 — UNIFIED PROPERTY PUBLICATION IDENTITY. CANDIDATE / NOT ACCEPTED. -->')){
  s='<!-- MANTRA 83 — UNIFIED PROPERTY PUBLICATION IDENTITY. CANDIDATE / NOT ACCEPTED. -->\n'+s;
}
writeFileSync(path,s);
console.log(JSON.stringify({changed:s!==before,bytesBefore:Buffer.byteLength(before),bytesAfter:Buffer.byteLength(s),propertyOwnerCalls:(s.match(/earthlinePublishProperty83/g)||[]).length,deadNoopListeners:(s.match(/earthlineMap\.on\("(?:idle|styledata|moveend|zoomend)",\(\)=>\{\}\);/g)||[]).length}));
