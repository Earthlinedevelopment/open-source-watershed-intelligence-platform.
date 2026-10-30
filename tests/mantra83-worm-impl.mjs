import {execFileSync} from 'node:child_process';
const s=execFileSync('git',['show','b8b69f00d3e68e1b77fdee48d196fa58a622b809:index.html'],{encoding:'utf8',maxBuffer:80*1024*1024});
const lines=s.split(/\r?\n/);
console.log('M83_WORM_IMPL '+JSON.stringify({text:lines.slice(30795,30870).join('\n')}));
