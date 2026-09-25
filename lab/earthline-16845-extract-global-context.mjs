import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
for(const needle of ['earthlineSelectPlaceCandidate16537','function earthlineSelectPlaceCandidate16537','earthlinePlaceLookupQuery16541','async function runSearch','function runSearch','location search did not resolve','async function findLoc','function findLoc']){
 const i=s.indexOf(needle); console.log('\n### '+needle+' @ '+i+'\n'); console.log(i>=0?s.slice(Math.max(0,i-2500),Math.min(s.length,i+13000)):'NOT FOUND');
}
