import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['suggestions.style','earthlineSearchSuggestions15970.classList','renderSuggestions','showSuggestions','hideSuggestions','suggestionBox','suggestions15970']){
 let from=0,n=0;
 while(true){const at=s.indexOf(term,from);if(at<0)break;
  console.log('M83SUGJS '+JSON.stringify({term,at,text:s.slice(Math.max(0,at-1800),Math.min(s.length,at+5000))}));
  from=at+term.length;if(++n>=20)break;
 }
}
