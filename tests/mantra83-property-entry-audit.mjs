import {readFileSync} from 'node:fs';
const s=readFileSync('index.html','utf8');
for(const term of ['runDirectAddressProperty16291','earthlineDeclareProperty16169','propertyPublication15816','earthlineFocusRunEngine16158','runProperty15778']){
  let at=s.indexOf(term);
  console.log('M83PROPAUDIT '+JSON.stringify({term,at,text:at<0?'':s.slice(Math.max(0,at-2400),Math.min(s.length,at+6500))}));
}
