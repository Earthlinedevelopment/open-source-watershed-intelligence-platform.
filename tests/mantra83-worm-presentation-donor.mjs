import {execFileSync} from 'node:child_process';
const sha='b8b69f00d3e68e1b77fdee48d196fa58a622b809';
const s=execFileSync('git',['show',sha+':index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});
for(const term of ['EARTHLINE_REGIONAL_CLEAN_PRESENTATION_17434','17434','corridor worms']){
 let from=0,n=0;
 while(true){const at=s.indexOf(term,from);if(at<0)break;
   const st=Math.max(s.lastIndexOf('<script',at),s.lastIndexOf('<style',at));
   const enScript=s.indexOf('</script>',at),enStyle=s.indexOf('</style>',at);
   const en=[enScript,enStyle].filter(v=>v>=0).sort((a,b)=>a-b)[0]??(at+7000);
   console.log('M83WORMDONOR '+JSON.stringify({term,at,op:st>=0?s.slice(st,s.indexOf('>',st)+1):'',text:s.slice(Math.max(0,at-2200),Math.min(s.length,at+9000))}));
   from=at+term.length;if(++n>=12)break;
 }
}
