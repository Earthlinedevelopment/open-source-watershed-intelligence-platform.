// First-run camera regression contract. Reads actual Playwright property outputs.
// A startup globe reset MUST NOT turn a selected parcel into (0,18).
import {readFileSync,existsSync} from 'node:fs';
import {strict as assert} from 'node:assert';
const profiles=['desktop-chrome','desktop-safari','iphone'];
const sites={
  'newyork-your-screenshot-1':[42.78781,-75.76996],
  'arkansas-your-screenshot-1':[34.77042,-92.12943]
};
const issues=[];
for(const profile of profiles){
 const p='v14-camera-results/'+profile+'/results.json';
 if(!existsSync(p)){issues.push(profile+': missing results');continue;}
 const r=JSON.parse(readFileSync(p,'utf8'));
 if(r.launchError)issues.push(profile+': browser launch error '+r.launchError);
 for(const [site,want] of Object.entries(sites)){
  const row=r.rows?.find(x=>x.kind==='property'&&x.site===site);
  if(!row){issues.push(profile+'/'+site+': missing Property run');continue;}
  for(const n of [1,2]){
   const selected=row['targetBeforeRun'+n];
   const target=selected?.target;
   if(!target||!Number.isFinite(target.lat)||!Number.isFinite(target.lng)||
       Math.abs(target.lat-want[0])>0.0003||Math.abs(target.lng-want[1])>0.0003)
     issues.push(profile+'/'+site+'/'+n+': STALE PROPERTY TARGET '+JSON.stringify(selected||null));
   const run=row['run'+n],c=run?.center;
   if(!c||!Number.isFinite(c.lat)||!Number.isFinite(c.lng)||
       Math.abs(c.lat-want[0])>0.0003||Math.abs(c.lng-want[1])>0.0003)
     issues.push(profile+'/'+site+'/'+n+': WRONG PROPERTY CAMERA '+JSON.stringify(c||null));
   if(run?.propertyAudit?.result!==true)issues.push(profile+'/'+site+'/'+n+': Property safety gate did not complete '+String(run?.propertyAudit?.error||''));
   const elder=run?.elderFinal;
   if(!elder||!['committed','failed'].includes(elder.state))issues.push(profile+'/'+site+'/'+n+': Elder not terminal');
   if(elder?.state==='committed'&&!(elder?.propertyRunIdentity||'').startsWith(want[1].toFixed(6)+'|'+want[0].toFixed(6)))
      issues.push(profile+'/'+site+'/'+n+': Elder ran against wrong location '+elder.propertyRunIdentity);
  }
 }
}
console.log('V14_GLOBE_TEST '+JSON.stringify({passed:issues.length===0,issues}));
if(issues.length)process.exit(1);
