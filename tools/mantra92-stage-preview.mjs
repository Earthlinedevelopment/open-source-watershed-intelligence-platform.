import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
// Preview-only: production homepage is untouched. The approved candidate
// is copied verbatim except for a relative-assets base URL on same origin.
const source=readFileSync('artifacts/mantra92-preview-source/index.html','utf8');
const head=source.match(/<head\b[^>]*>/i)?.[0]||null;
if(!head)throw Error('Missing HTML head');
const headPos=source.indexOf(head);
if(/<base\s/i.test(source.slice(headPos,headPos+2500)))throw Error('Source already has base href');
const version=process.env.M92_PREVIEW_SHA||'';
if(!/^[0-9a-f]{40}$/.test(version))throw Error('Missing immutable preview SHA');
const out=source.slice(0,headPos+head.length)+'\n<base href="/">'+source.slice(headPos+head.length);
mkdirSync('candidate-mantra92',{recursive:true});
writeFileSync('candidate-mantra92/index.html',out);
const hash=x=>createHash('sha256').update(x).digest('hex');
writeFileSync('candidate-mantra92/RELEASE-CANDIDATE.json',JSON.stringify({
 previewOfCandidateSha:version,
 exactCandidateHtmlSHA256:hash(source),
 previewHtmlSHA256:hash(out),
 onlyTransform:'head relative-assets base href',
 status:'TEST CANDIDATE — NOT A CERTIFIED PRODUCTION RELEASE'
},null,2)+'\n');
console.log('EARTHLINE_M92_PREVIEW '+JSON.stringify({sha:version,sourceHash:hash(source),previewHash:hash(out)}));
