// Earthline scientific release gate. A green workflow must mean scientific assertions passed.
// Read five browser result files; write GATE.md and GATE.json. Never publish this candidate on failure.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root=process.argv[2]||'collected';
const browsers=['desktop-chrome','desktop-firefox','desktop-safari','iphone','android'];
const failures=[],summaries=[],bySite=new Map();
const fail=(p,site,message)=>failures.push({browser:p,site,reason:message});
for(const p of browsers){
 const file=join(root,p,'results.json');
 if(!existsSync(file)){fail(p,'workflow','Missing browser results');continue;}
 let result;
 try{result=JSON.parse(readFileSync(file,'utf8'));}catch(e){fail(p,'workflow','Unreadable results: '+e.message);continue;}
 if(result.launchError)fail(p,'workflow','Browser launch error: '+result.launchError);

 // Independent provenance and ordinary-visitor startup acceptance.
 const expectedHash=process.env.EARTHLINE_EXPECTED_INDEX_SHA||'';
 if(result.candidateMode!==true)fail(p,'provenance','Browser did not load the pinned candidate');
 if(expectedHash&&result.candidateIndexSha256!==expectedHash)
   fail(p,'provenance','Candidate page hash '+String(result.candidateIndexSha256)+' != '+expectedHash);
 for(const label of ['at4s','at9s']){
   const a=result.startupGlobe?.[label];
   if(!a?.mapPresent||a.projection!=='globe'||!Number.isFinite(a.zoom)||a.zoom>3.4||
      !Number.isFinite(a.center?.lat)||!Number.isFinite(a.center?.lng)||
      Math.abs(a.center.lat-20)>0.005||Math.abs(a.center.lng+102)>0.005)
     fail(p,'startup','Idle globe at '+label+' is not the one stable [-102,20] camera: '+JSON.stringify(a||null));
 }

 const properties=(result.rows||[]).filter(x=>x.kind==='property');
 if(properties.length<10)fail(p,'workflow','Incomplete property coverage: '+properties.length+' (<10)');
 for(const row of result.rows||[])if(row.couldNotRun)fail(p,row.site||row.query||'workflow','Could not run: '+row.couldNotRun);
 for(const row of properties){
  const site=row.site||row.query||'unnamed';
  const runs=[row.run1,row.run2];
  if(row.sameResultBothRuns!==true)fail(p,site,'Two Property runs disagree');
  if(row.sameEngineHashBothRuns!==true)fail(p,site,'Engine input/result hash changed on repeat');
  if(row.sameStableIdsBothRuns!==true)fail(p,site,'Swale IDs differ on repeat');
  if(row.shownEqualsPublishedBothRuns!==true)fail(p,site,'Drawn swale counts differ from published counts');
  for(let n=0;n<2;n++){
   const a=runs[n],t='run '+(n+1);
   if(!a){fail(p,site,t+': missing result');continue;}
   if(a.tier!=='property'||a.propertyAudit?.result!==true)fail(p,site,t+': Property result not successfully published');
   // Compare to independent user-requested numeric coordinates, not solely the
   // page's camera-vs-own-anchor check (both can be consistently wrong).
   const requested=String(row.query||'').match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
   if(requested){
     const lat=Number(requested[1]),lng=Number(requested[2]);
     const c=a.center||null,selected=row['targetBeforeRun'+(n+1)]?.target||null;
     if(!c||!Number.isFinite(c.lat)||!Number.isFinite(c.lng)||
        Math.abs(c.lat-lat)>0.0003||Math.abs(c.lng-lng)>0.0003)
       fail(p,site,t+': camera differs from requested Property coordinates '+JSON.stringify(c));
     if(row.reachedBy==='map moved to coordinate'&&(!selected||
        Math.abs(selected.lat-lat)>0.0003||Math.abs(selected.lng-lng)>0.0003))
       fail(p,site,t+': saved Property target differs from requested crosshair '+JSON.stringify(selected));
   }

   // Final Elder state and identity are required before the test can claim stability.
   const elder=a.elderFinal;
   if(!elder||!['committed','failed'].includes(elder.state))
     fail(p,site,t+': Elder worker never reached a final state');
   else if(elder.state==='failed'&&!String(elder.error||'').trim())
     fail(p,site,t+': Elder worker refused without naming the failure');
   else if(elder.state==='committed'&&(elder.mapPublished!==true||
       !Number.isFinite(elder.featureCount)||
       (Number.isFinite(elder.sourceFeatures)&&elder.sourceFeatures!==elder.featureCount)))
     fail(p,site,t+': Elder committed without matching visible map evidence');
   const loc=String(elder?.propertyRunIdentity||'').split('|');
   const match=String(row.query||'').match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
   if(match&&elder){
     const latitude=Number(match[1]),longitude=Number(match[2]);
     if(!Number.isFinite(Number(loc[0]))||!Number.isFinite(Number(loc[1]))||
       Math.abs(Number(loc[0])-longitude)>0.0002||Math.abs(Number(loc[1])-latitude)>0.0002)
       fail(p,site,t+': Elder result belongs to wrong Property coordinates '+(elder.propertyRunIdentity||'unknown'));
   }


   // Reviewer-visible count must match final geometry, not pre-audit proposals.
   const swaleMessage=String(a.engine16600?.message||'');
   const claimed=swaleMessage.match(/\b(\d+)\s+proposed swale alignments\b/i);
   if(a.engine16600?.verified===true&&a.shownSwales===0&&
      !/^No qualifying swales on this property\b/i.test(swaleMessage))
     fail(p,site,t+': zero-swale Property did not provide an explicit refusal');
   if(a.engine16600?.verified===true&&a.shownSwales>0&&!claimed)
     fail(p,site,t+': verified positive-swale engine did not provide an auditable count');
   if(claimed&&Number(claimed[1])!==a.shownSwales)
     fail(p,site,t+': message claims '+claimed[1]+' swales but rendered '+a.shownSwales);
   if(!Number.isFinite(a.engineSwales)||!Number.isFinite(a.shownSwales))fail(p,site,t+': missing swale count');
   else if(a.engineSwales!==a.shownSwales)fail(p,site,t+': '+a.engineSwales+' engine vs '+a.shownSwales+' displayed');
   if((a.swalesOver4pct||0)>0)fail(p,site,t+': '+a.swalesOver4pct+' slopes exceed 4%');
   if(a.closestPairM!=null&&a.closestPairM<4.572-0.005)fail(p,site,t+': swale separation '+a.closestPairM+'m below 4.572m');
   if(a.shownSwales>0){
    if(a.engine16600?.verified!==true)fail(p,site,t+': candidate evidence not verified');
    if(a.engine16600?.publishedSwales!==a.shownSwales)fail(p,site,t+': candidate publication count mismatch');
    if(/publication must remain blocked|publication blocked|stopped safely/i.test(a.statusText||''))fail(p,site,t+': contradictory blocked status beside published swales');
   }
   if((a.geometry?.swaleOutput?.roadCrossings||0)>0)fail(p,site,t+': swale crosses mapped road');
   if((a.geometry?.swaleOutput?.withinRoadSetback||0)>0)fail(p,site,t+': swale inside 10ft mapped road setback');
   if((a.geometry?.swaleOutput?.tightPairs||0)>0)fail(p,site,t+': independently measured tight swale pairs');
  }
  const a=runs[0];
  if(a?.tier==='property'&&a?.propertyAudit?.result===true){
   if(!bySite.has(site))bySite.set(site,[]);
   bySite.get(site).push({browser:p,ids:(a.engine16600?.stableIds||[]).slice().sort(),hash:a.engine16600?.hash||null,shown:a.shownSwales});
  }
 }
 summaries.push({browser:p,propertyCount:properties.length});
}
// Exactly ten shared benchmark properties run on all five profiles. Three
// additional regional-coverage sites run on Chrome only and are checked there,
// not incorrectly demanded from other browsers.
const commonSites=[
 'arkansas-your-screenshot-1','arkansas-your-screenshot-2',
 'newyork-your-screenshot-1','newyork-your-screenshot-2',
 'iowa-farmland','iowa-creek','vermont','arizona','darling-mine','essex'
];
for(const site of commonSites){
 const values=bySite.get(site)||[];
 if(values.length!==browsers.length)fail('cross-browser',site,'Only '+values.length+' of '+browsers.length+' profiles produced valid Property output');
 if(!values.length)continue;
 const base=values[0];
 for(const v of values.slice(1))if(v.shown!==base.shown||JSON.stringify(v.ids)!==JSON.stringify(base.ids))
   fail('cross-browser',site,`${v.browser} has ${v.shown} swales vs ${base.browser} ${base.shown} / different IDs`);
}
const uniqueSites=new Set([...bySite.keys()]);
if(commonSites.some(site=>!bySite.has(site)))fail('cross-browser','coverage','One or more mandatory shared sites missing');
if((summaries.find(x=>x.browser==='desktop-chrome')?.propertyCount||0)<13)
 fail('desktop-chrome','coverage','Three additional Chrome-only state-coverage properties missing');
const output={passed:failures.length===0,runId:process.env.GITHUB_RUN_ID||null,commit:process.env.GITHUB_SHA||null,round:Number(process.env.EARTHLINE_GATE_ROUND||0),candidateIndexSha256:process.env.EARTHLINE_EXPECTED_INDEX_SHA||null,profiles:browsers.length,sites:uniqueSites.size,summaries,failures};
writeFileSync(join(root,'GATE.json'),JSON.stringify(output,null,2)+'\n');
const md=['# Earthline candidate scientific release gate','',output.passed?'**PASS Round '+output.round+'/3 — NOT YET AUTHORIZED FOR PRODUCTION**':'**FAIL Round '+output.round+'/3 — DO NOT PROMOTE CANDIDATE**','',`Commit: ${output.commit} | Run: ${output.runId} | Candidate page SHA-256: ${output.candidateIndexSha256} | Round: ${output.round}/3`, '',`Browsers required: ${browsers.length}; valid sites seen: ${uniqueSites.size}; failures: ${failures.length}`,'',...failures.map(f=>'- **'+f.browser+' / '+f.site+':** '+f.reason),''];
writeFileSync(join(root,'GATE.md'),md.join('\n'));
console.log('EARTHLINE_SCIENTIFIC_GATE '+JSON.stringify({passed:output.passed,failures:failures.length,sites:output.sites}));
if(failures.length)process.exitCode=1;
