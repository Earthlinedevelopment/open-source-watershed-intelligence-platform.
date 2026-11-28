// Read-only deterministic unit tests for the Elder Tree worker's transient startup recovery.
import {readFileSync} from 'node:fs';
import {strict as assert} from 'node:assert';

const worker=readFileSync('earthline-elder-worker-17129.js','utf8');
const page=readFileSync('earthline-elder-restored-17097.js','utf8');
const start=worker.indexOf('async function ensurePy(){');
const end=worker.indexOf('function f32(values){',start);
assert(start>=0&&end>start,'Could not isolate worker startup');

async function testRetryAfterFailure(){
  let boots=0;
  const stub={loadPackage:async()=>{},runPythonAsync:async()=>{}};
  const loadPyodide=async()=>{
    boots++;
    if(boots===1)throw new Error('simulated CDN outage');
    return stub;
  };
  const fetch=async()=>({ok:true,text:async()=>''});
  const ensurePy=new Function('loadPyodide','fetch',
    'let pyReady=null;'+worker.slice(start,end)+'return ensurePy;'
  )(loadPyodide,fetch);
  await assert.rejects(ensurePy(),/simulated CDN outage/);
  assert.equal(await ensurePy(),stub,'Second attempt must recover');
  assert.equal(await ensurePy(),stub,'Successful state remains cached');
  assert.equal(boots,2,'Failed start retried exactly once');
}

async function testTransientConcurrentFailure(){
  let attempts=0;
  const stub={loadPackage:async()=>{},runPythonAsync:async()=>{}};
  const loadPyodide=async()=>{
    attempts++;
    await Promise.resolve();
    if(attempts===1)throw new Error('simulated transient');
    return stub;
  };
  const fetch=async()=>({ok:true,text:async()=>''});
  const ensurePy=new Function('loadPyodide','fetch',
    'let pyReady=null;'+worker.slice(start,end)+'return ensurePy;'
  )(loadPyodide,fetch);
  const first=await Promise.allSettled([ensurePy(),ensurePy(),ensurePy()]);
  assert(first.every(x=>x.status==='rejected'),'All simultaneous readers must see initial failure');
  assert.equal(attempts,1,'Concurrent readers share one boot attempt');
  assert.equal(await ensurePy(),stub,'Next explicit attempt recovers');
  assert.equal(attempts,2,'At most one new boot on retry');
}

function testPageGuards(){
  new Function(page);
  new Function(worker.replace(/^import .+;\s*$/gm,''));
  assert(page.includes('Retry ONCE'),'Single bounded retry is documented');
  assert(page.includes('let dynamic=await dynamicPropertyEvidence(true);'),'Property first attempt is awaited');
  assert(page.includes('propertyRunIdentity17166(propertyBounds17166())===runIdentity'),'Retry must remain tied to exact Property run');
  assert(page.includes("error:state.dynamic.error||'no tree-finder result'"),'Worker failure reason must reach diagnostic state');
  assert(!page.includes('Elder Trees: 24 candidates (recovered)'),'No fabricated fallback counts');
}

await testRetryAfterFailure();
await testTransientConcurrentFailure();
testPageGuards();
console.log('ELDER_RECOVERY_TEST_PASS startup failure retry, concurrent dedupe, candidate identity guard and syntax');
