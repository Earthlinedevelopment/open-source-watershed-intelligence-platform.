import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
for(const needle of ['function analysisBounds(loc)','async function earthlineResolveAtomicCountryPackage16845','const earthlineBoundaryCapabilities16539','async function earthlineResolveJurisdictionBoundary16539','async function runRegional(q,loc,runToken)','location search did not resolve','await runRegional(','runRegional(raw','runRegional(q','function findLoc','async function findLoc']){
 const i=s.indexOf(needle); console.log('\n### '+needle+' @ '+i+'\n'); console.log(i>=0?s.slice(Math.max(0,i-1200),Math.min(s.length,i+9000)):'NOT FOUND');
}
