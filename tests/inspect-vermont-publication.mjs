import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
for(const term of ['EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178','vermontRequest','clipVermont','VERMONT PRODUCT BOUNDARY','earthlineVermont']){
 let from=0,count=0;
 while(true){
  const i=s.indexOf(term,from);if(i<0)break;count++;
  console.log('EARTHLINE_VT_OWNER '+JSON.stringify({term,count,index:i,snippet:s.slice(Math.max(0,i-2500),Math.min(s.length,i+4500))}));
  from=i+term.length;if(count>=12)break;
 }
}
