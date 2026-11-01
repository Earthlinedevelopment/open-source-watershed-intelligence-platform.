import {readFileSync,writeFileSync} from 'node:fs';
const p='earthline-elder-restored-17097.js';
let s=readFileSync(p,'utf8');
const old=`  async function dynamicPropertyEvidence(forceProperty=false){
    const tier=String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase();
    if(!forceProperty&&tier!=='property')return null;
    if(!forceProperty){
      const coverage=activeCoverage();
      if(coverage.known)return null;
    }
    const b=forceProperty?propertyBounds17166():coverageQueryBounds();`;
const neu=`  async function dynamicPropertyEvidence(forceProperty=false){
    const tier=String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase();
    const isProperty=tier==='property';
    if(!forceProperty&&!isProperty)return null;
    const b=(forceProperty||isProperty)?propertyBounds17166():coverageQueryBounds();`;
if(s.includes(old))s=s.replace(old,neu);
else if(!s.includes(neu))throw new Error('Property Elder false-zero owner not found');
writeFileSync(p,s);
console.log('M83_ELDER_PROPERTY_FIRST_RUN_FIXED');
