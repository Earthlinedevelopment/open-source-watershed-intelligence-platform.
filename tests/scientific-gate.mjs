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
   const requested=String(row.query||'').match(/^\\s*(-?\\d+(?:\\.\\d+)?)\\s*,\\s*(-?\\d+(?:\\.\\d+)?)\\s*$/);
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
for(const [site,values] of bySite){
 if(values.length!==browsers.length)fail('cross-browser',site,'Only '+values.length+' of '+browsers.length+' profiles produced valid Property output');
 const base=values[0];
 for(const v of values.slice(1))if(v.shown!==base.shown||JSON.stringify(v.ids)!==JSON.stringify(base.ids))
   fail('cross-browser',site,`${v.browser} has ${v.shown} swales vs ${base.browser} ${base.shown} / different IDs`);
}
const uniqueSites=new Set([...bySite.keys()]);
if(uniqueSites.size<10)fail('cross-browser','coverage','Only '+uniqueSites.size+' common sites (<10)');
const output={passed:failures.length===0,profiles:browsers.length,sites:uniqueSites.size,summaries,failures};
writeFileSync(join(root,'GATE.json'),JSON.stringify(output,null,2)+'\n');
const md=['# Earthline candidate scientific release gate','',output.passed?'**PASS — candidate eligible for further release review**':'**FAIL — DO NOT PROMOTE CANDIDATE**','',`Browsers required: ${browsers.length}; valid sites seen: ${uniqueSites.size}; failures: ${failures.length}`,'',...failures.map(f=>'- **'+f.browser+' / '+f.site+':** '+f.reason),''];
writeFileSync(join(root,'GATE.md'),md.join('\n'));
console.log('EARTHLINE_SCIENTIFIC_GATE '+JSON.stringify({passed:output.passed,failures:failures.length,sites:output.sites}));
if(failures.length)process.exitCode=1;
