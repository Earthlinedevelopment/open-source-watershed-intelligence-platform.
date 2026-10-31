import fs from 'node:fs';
import assert from 'node:assert/strict';
const s=fs.readFileSync('index.html','utf8');
assert.ok(s.includes("const segment=raw;if(segment.length<10)return null;"));
assert.ok(s.includes("const slope=hy.slope[i],acc=hy.acc[i],minSlope=0,maxSlope=4;"));
assert.ok(s.includes("if(!Number.isFinite(slope)||slope<minSlope||slope>maxSlope||!Number.isFinite(acc)||acc>=channel)return null;"));
assert.ok(s.includes("if(focusMode||preferredEligibleCount16539<36){"));
assert.equal(s.includes("chaikin(raw,2,false)"),false);
console.log('M83_GEOMETRY_SOURCE_PASS');
