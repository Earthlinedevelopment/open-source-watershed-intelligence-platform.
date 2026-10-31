import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['refinementTileBudget16782','lateBins16741=','chosenBins16730.length>=','parts16702=Math.min']){
  let from=0,n=0;
  while(true){const at=s.indexOf(term,from);if(at<0)break;
    console.log('M83BUDGET '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-800),Math.min(s.length,at+2200))}));
    from=at+term.length;if(++n>=8)break;
  }
}
