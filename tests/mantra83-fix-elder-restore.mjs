import {readFileSync,writeFileSync} from 'node:fs';
import {applyElderRestore} from './mantra83-elder-transform.mjs';
const p='index.html';writeFileSync(p,applyElderRestore(readFileSync(p,'utf8')));
console.log('M83_ELDER_RESTORE_APPLIED');
