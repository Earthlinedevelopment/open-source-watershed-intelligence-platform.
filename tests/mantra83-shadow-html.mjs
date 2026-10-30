import {readFileSync,writeFileSync} from 'node:fs';
const html=readFileSync('index.html','utf8');
const tag='<script src="/shadow/mantra83-shadow-live.js"></script>';
const marker='</body>';
const at=html.toLowerCase().lastIndexOf(marker);
if(at<0)throw new Error('body close not found');
const out=html.slice(0,at)+tag+'\n'+html.slice(at);
writeFileSync('shadow-index.html',out);
console.log('M83_SHADOW_HTML_READY '+out.length);
