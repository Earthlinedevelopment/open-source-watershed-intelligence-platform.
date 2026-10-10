const fs=require('fs');
const src=fs.readFileSync('earthline-launch-16872.js','utf8');

function must(re,msg){ if(!re.test(src)) throw new Error(msg); }

must(/function activeCoverage\(\)/,'missing authoritative Elder coverage owner');
must(/known:covered\.length>0/,'coverage state does not distinguish processed from unprocessed');
must(/Coverage not yet processed for this area/,'unprocessed area does not fail closed');
must(/No Elder Tree candidates detected in current Earthline coverage/,'processed zero-candidate state missing');
must(/!summary\.coverageKnown\?'[^']*No Elder Tree count is reported because this area has not yet been processed into the current V1 evidence coverage\./,'DATA surface lacks false-zero explanation');
must(/summary\.coverageKnown&&summary\.partial\?' · current Earthline coverage'/,'gauge partial label is not coverage-gated');

if(/evidenceLabel[^\n]*\b0\s+(?:Elder Trees|candidates)/i.test(src)) throw new Error('numeric false-zero Elder label present');

const manifest=JSON.parse(fs.readFileSync('data/elder-trees/v1/manifest.json','utf8'));
const ids=(manifest.datasets||[]).map(d=>String(d.id||''));
if(ids.some(id=>/alaska/i.test(id))) throw new Error('test assumption invalid: Alaska dataset now exists; update gate to test a different unprocessed geography');

console.log(JSON.stringify({
  pass:true,
  rule:'unprocessed Elder Tree coverage must never become a biological zero',
  alaska_dataset_present:false,
  unprocessed_label:'Coverage not yet processed for this area'
},null,2));
