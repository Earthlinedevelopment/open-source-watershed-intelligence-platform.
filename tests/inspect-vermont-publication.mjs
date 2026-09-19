import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
for(const term of ['window.earthlineClipVermontProducts16178','earthlineClipVermontProducts16178=','function earthlineClipVermontProducts16178','EARTHLINE 16178']){
 let from=0,count=0;
 while(true){const i=s.indexOf(term,from);if(i<0)break;count++;console.log('EARTHLINE_VT_CLIP_SOURCE '+JSON.stringify({term,count,index:i,snippet:s.slice(Math.max(0,i-3500),Math.min(s.length,i+7500))}));from=i+term.length;if(count>=8)break;}
}
