import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';
let s=readFileSync(p,'utf8');
const old=`    async function jurisdictionEligibleCount16539(list16539){
      if(focusMode||!jurisdictionGeometry16539)return list16539.length;
      let count16539=0,yieldCount16661=0;
      for(const candidate16539 of list16539){if(screenJurisdictionCandidate16539(candidate16539))count16539++;if((++yieldCount16661%12)===0)await earthlineCooperativeYield16661();}
      return count16539;
    }`;
const neu=`    async function jurisdictionEligibleCount16539(list16539){
      if(focusMode||!jurisdictionGeometry16539)return list16539.length;
      let count16539=0,yieldCount16661=0;
      for(const candidate16539 of list16539){
        if(screenJurisdictionCandidate16539(candidate16539)&&++count16539>=36)return 36;
        if((++yieldCount16661%12)===0)await earthlineCooperativeYield16661();
      }
      return count16539;
    }`;
if(s.includes(old))s=s.replace(old,neu);
else if(!s.includes(neu))throw new Error('jurisdiction threshold owner not found');
writeFileSync(p,s);
console.log('M83_JURISDICTION_THRESHOLD_FIXED');
