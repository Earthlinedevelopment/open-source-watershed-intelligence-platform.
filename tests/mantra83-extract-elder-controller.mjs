import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const s=execFileSync('git',['show','b8b69f00d3e68e1b77fdee48d196fa58a622b809:index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});
const needle='<script id="earthline-build-16178-state-identity-boundary-timeout">';
const st=s.indexOf(needle);if(st<0)throw new Error('script missing');
const en=s.indexOf('</script>',st);if(en<0)throw new Error('close missing');
const block=s.slice(st,en+9);
writeFileSync('forensics/elder-controller-donor.html',block);
console.log('M83_ELDER_CONTROLLER_EXTRACT '+JSON.stringify({bytes:block.length}));
