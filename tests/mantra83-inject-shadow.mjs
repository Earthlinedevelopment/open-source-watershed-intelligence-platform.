import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';
let s=readFileSync(p,'utf8');
const marker='<!-- MANTRA83 SHADOW LIVE -->';
if(!s.includes(marker)){
  const tag=marker+'\n<script type="module" src="/shadow/mantra83-shadow-runner.mjs"></script>\n<script src="/shadow/mantra83-shadow-live.js"></script>\n';
  const at=s.toLowerCase().lastIndexOf('</body>');
  if(at<0)throw new Error('body close not found');
  s=s.slice(0,at)+tag+s.slice(at);
  writeFileSync(p,s);
}
console.log('M83_SHADOW_INJECTED');
