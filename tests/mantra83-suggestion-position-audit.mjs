import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['getBoundingClientRect();','getBoundingClientRect()','searchInput','suggestionsEl','suggestionsBox','suggestions']){
 let from=0,n=0;
 while(true){const at=s.indexOf(term,from);if(at<0)break;
  const t=s.slice(Math.max(0,at-1300),Math.min(s.length,at+3200));
  if(/earthlineSearchSuggestions15970|searchInput|suggest/i.test(t))console.log('M83POS '+JSON.stringify({term,at,text:t}));
  from=at+term.length;if(++n>=80)break;
 }
}
