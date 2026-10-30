import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['function prescribeSwales15778','maxS=33','ELDER TREE CONFIDENCE','earthlineElder','elder tree','MODELED_ELDER_TREE_CANDIDATE']){
  let from=0,n=0;
  while(true){const at=s.indexOf(term,from);if(at<0)break;
    console.log('M83FOCUS '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-2200),Math.min(s.length,at+7000))}));
    from=at+term.length;if(++n>=10)break;
  }
}
