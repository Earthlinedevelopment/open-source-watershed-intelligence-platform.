import assert from 'node:assert/strict';
import {createRunRequest,createRunIdentity,assertSameIdentity,stableHash} from '../science/mantra85-contract.mjs';
import {generateContours} from '../science/mantra85-contours.mjs';
import {polylineLengthM} from '../science/mantra85-candidates.mjs';
import {buildScienceBundle} from '../science/mantra85-engine.mjs';
import {publishableSnapshot} from '../science/mantra85-publication.mjs';
import {toRendererModel} from '../science/mantra85-renderer-adapter.mjs';
import {RunCoordinator} from '../science/mantra85-coordinator.mjs';

const W=31,H=31,extent=[-73.02,44.50,-73.00,44.52],cellM=50;
function planeDEM(){const a=new Float64Array(W*H);for(let y=0;y<H;y++)for(let x=0;x<W;x++)a[y*W+x]=100+x*1;return a;}
function basePolicy(over={}){return {contourIntervalM:2,minCandidateLengthM:80,maxCandidateLengthM:220,sampleStepM:20,minSpacingM:20,maxSwales:100,requireNoPendingEvidence:true,...over};}
function request(id='r1',over={}){return createRunRequest({runId:id,mode:'regional',target:{lat:44.51,lng:-73.01},extent,policy:basePolicy(over),sourcePlanVersion:'test-v1'});}
function acquired(over={}){const validMask=new Uint8Array(W*H);validMask.fill(1);return {acquisitionFingerprint:stableHash({dem:'plane',v:1,...(over.fingerprintSalt||{})}),dem:{source:'synthetic',resolutionM:cellM,width:W,height:H,elevation:planeDEM()},cellXM:cellM,cellYM:cellM,validMask,aquiferFallback:.5,soilFallback:.5,annualPrecipIn:30,elderEvidence:{status:'ready',rechargeWeight:0},aquiferEvidence:{status:'ready'},coverage:{status:'ready'},exclusionEvidence:{status:'ready'},waterPaths:[],...over};}

// 1. Identity is immutable and mismatch fails closed.
{
 const req=request('identity');const id=createRunIdentity(req,'acq-1');
 assert.throws(()=>assertSameIdentity(id,{...id,runId:'other'}),/identity mismatch/);
}

// 2. Marching squares remains local on an ambiguous saddle.
{
 const z=Float64Array.from([0,2,0,2,0,2,0,2,0]);
 const cs=generateContours({elevation:z,width:3,height:3,extent:[0,0,.002,.002],intervalM:1});
 assert.ok(cs.length>0);assert.ok(Math.max(...cs.map(c=>polylineLengthM(c.coordinates)))<500,'saddle contour became nonlocal');
}

// 3. Deterministic engine, local geometry, <=4%, exact renderer geometry.
{
 const req=request('deterministic'),acq=acquired(),id=createRunIdentity(req,acq.acquisitionFingerprint);
 const a=buildScienceBundle({request:req,identity:id,acquired:acq});const b=buildScienceBundle({request:req,identity:id,acquired:acq});
 const pa=publishableSnapshot(a),pb=publishableSnapshot(b);assert.equal(stableHash(pa),stableHash(pb));assert.ok(pa.swales.length>0);
 for(const s of pa.swales){assert.ok(s.lengthM<=req.policy.maxCandidateLengthM+.01);assert.ok(s.maxSlopePct<=4);}
 const render=toRendererModel(a);assert.equal(render.scienceGeometryFingerprint,render.renderGeometryFingerprint);
 assert.deepEqual(render.swales.map(s=>s.coordinates),pa.swales.map(s=>s.coordinates));
}

// 4. An exclusion crossing cannot survive dense sampling.
{
 const road=new Uint8Array(W*H);for(let x=0;x<W;x++)road[15*W+x]=1;
 const req=request('road'),acq=acquired({roadOrDrivewayMask:road}),id=createRunIdentity(req,acq.acquisitionFingerprint),p=publishableSnapshot(buildScienceBundle({request:req,identity:id,acquired:acq}));
 for(const s of p.swales)for(const sample of s.samples)assert.equal(sample.roadOrDriveway,false);
}

// 5. Strong forest gate blocks candidates rather than cosmetically hiding them.
{
 const canopy=new Float64Array(W*H);canopy.fill(.9);const req=request('forest'),acq=acquired({canopyGrid:canopy}),id=createRunIdentity(req,acq.acquisitionFingerprint),p=publishableSnapshot(buildScienceBundle({request:req,identity:id,acquired:acq}));assert.equal(p.swales.length,0);
}

// 6. Pending evidence is not allowed to publish.
{
 const req=request('pending'),acq=acquired({elderEvidence:{status:'pending',rechargeWeight:0}}),id=createRunIdentity(req,acq.acquisitionFingerprint),bundle=buildScienceBundle({request:req,identity:id,acquired:acq});assert.throws(()=>publishableSnapshot(bundle),/pending evidence/);
}

// 7. Single coordinator cancels stale run and commits only the active run.
{
 const commits=[];const c=new RunCoordinator({commit:async x=>commits.push(x.identity.runId)});let release;const gate=new Promise(r=>release=r);
 const p1=c.run({runId:'slow',mode:'regional',target:{lat:44.51,lng:-73.01},extent,policy:basePolicy(),sourcePlanVersion:'test'},async()=>{await gate;return acquired();});
 const p2=c.run({runId:'fast',mode:'regional',target:{lat:44.51,lng:-73.01},extent,policy:basePolicy(),sourcePlanVersion:'test'},async()=>acquired({acquisitionFingerprint:'fast-acq'}));
 const r2=await p2;release();const r1=await p1;assert.equal(r2.status,'published');assert.equal(r1.status,'cancelled');assert.deepEqual(commits,['fast']);
}

console.log('MANTRA85_CLOCK_TESTS_PASS');
