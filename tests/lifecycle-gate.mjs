// Independent Property -> Regional -> Property lifecycle acceptance.
// Long lifecycle tests must not erase ordinary swale/property evidence.
import {readFileSync,existsSync} from 'node:fs';
const profile=process.env.EARTHLINE_PROFILE,region=process.env.EARTHLINE_LIFECYCLE_REGION;
const path='lifecycle-results/'+profile+'/results.json';
const issues=[];
if(!existsSync(path)){console.error('LIFECYCLE_FAIL missing checkpoint '+path);process.exit(1);}
const j=JSON.parse(readFileSync(path,'utf8'));
if(j.launchError)issues.push('browser launch '+j.launchError);
if(j.candidateMode!==true)issues.push('not running candidate');
const expected=process.env.EARTHLINE_EXPECTED_INDEX_SHA||'';
if(expected&&j.candidateIndexSha256!==expected)issues.push('candidate page SHA mismatch');
const rows=(j.rows||[]).filter(r=>r.kind==='lifecycle'&&r.query===region);
if(rows.length!==1)issues.push('expected exactly one lifecycle result for '+region);
for(const r of rows){
 if(r.couldNotRun)issues.push('lifecycle execution error '+r.couldNotRun);
 const names=['regional 1','property 1','regional 2','property 2'];
 for(const label of names){
  const step=(r.steps||[]).find(x=>x.step===label);
  if(!step){issues.push('missing '+label);continue;}
  if(label.startsWith('regional')){
   if(step.tier!=='regional'||step.finished!==true)issues.push(label+': incomplete regional run');
   if((step.blankedAfterRefillThisRun||0)>0)issues.push(label+': aquifer emptied after refill');
   if(step.regionalError)issues.push(label+': regional error '+step.regionalError);
  }else{
   if(step.tier!=='property'||step.timedOut===true||step.propertyAudit?.result!==true)
    issues.push(label+': Property analysis did not pass');
   if(step.swalesOver4pct>0)issues.push(label+': swale above 4%');
   if(step.shownSwales!==step.engineSwales)issues.push(label+': mismatch published vs visible count');
  }
 }
 if(r.propertySameBothRounds!==true)issues.push('Property geometry differs after Regional cycle');
 if(r.regionalSameBothRounds!==true)issues.push('Regional results differ across repeat');
}
const result={profile,region,candidateSHA:j.candidateIndexSha256,passed:issues.length===0,issues};
console.log('EARTHLINE_LIFECYCLE_GATE '+JSON.stringify(result));
if(issues.length)process.exit(1);
