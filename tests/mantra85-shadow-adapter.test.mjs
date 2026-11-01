import assert from 'node:assert/strict';
import {legacyAcquisitionToM85} from '../science/mantra85-legacy-shadow-adapter.mjs';
import {createRunRequest,createRunIdentity} from '../science/mantra85-contract.mjs';
import {buildScienceBundle} from '../science/mantra85-engine.mjs';
import {publishableSnapshot} from '../science/mantra85-publication.mjs';

const W=31,H=31,N=W*H,extent=[-73.02,44.50,-73.00,44.52];
const h=new Float64Array(N),inP=new Uint8Array(N),noBuildMask=new Uint8Array(N),canopy=new Float64Array(N);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){h[y*W+x]=100+x;inP[y*W+x]=1;canopy[y*W+x]=.1;}
const displayed={runToken:'legacy-r1',tier:'property'};
const target={lng:-73.01,lat:44.51};
const poly=[[-73.02,44.50],[-73.00,44.50],[-73.00,44.52],[-73.02,44.52]];
const model={h,inP,noBuildMask,analysisBoundaryLngLat:poly,cellM:50,loc:{...target}};
const elderIdentity='-73.010000|44.510000|bbox';
const acq=legacyAcquisitionToM85({mode:'property',displayed,model,gridWidth:W,gridHeight:H,target,propertyDeclaration:{center:target},propertyElderIdentity:elderIdentity,elderLast:{state:'committed',propertyRunIdentity:elderIdentity,featureCount:3,summary:{count:3}},canopyGrid:canopy,aquiferEvidence:{status:'unavailable'},coverage:{status:'ready'}});
assert.equal(acq.provenance.dem,'M.h');
assert.equal(acq.provenance.validMask,'M.inP');
assert.equal(acq.provenance.combinedNoBuild,'M.noBuildMask');
assert.equal(acq.elderEvidence.status,'ready');
assert.equal(acq.coverage.forestGateStatus,'ready');
assert.equal(acq.legacyRunToken,'legacy-r1');

const req=createRunRequest({runId:'shadow-r1',mode:'property',target,extent,policy:{contourIntervalM:2,minCandidateLengthM:80,maxCandidateLengthM:220,sampleStepM:20,minSpacingM:20,maxSwales:100,requireNoPendingEvidence:true},sourcePlanVersion:'legacy-shadow-test'});
const id=createRunIdentity(req,acq.acquisitionFingerprint);
const bundle=buildScienceBundle({request:req,identity:id,acquired:acq});
assert.ok(publishableSnapshot(bundle));

assert.throws(()=>legacyAcquisitionToM85({mode:'property',displayed,model:{...model,noBuildMask:null},gridWidth:W,gridHeight:H,target,propertyDeclaration:{center:target},propertyElderIdentity:elderIdentity,elderLast:{state:'committed',propertyRunIdentity:elderIdentity},canopyGrid:canopy}),/no-build mask/);
const noCanopy=legacyAcquisitionToM85({mode:'property',displayed,model,gridWidth:W,gridHeight:H,target,propertyDeclaration:{center:target},propertyElderIdentity:elderIdentity,elderLast:{state:'committed',propertyRunIdentity:elderIdentity},canopyGrid:null});
const id2=createRunIdentity(req,noCanopy.acquisitionFingerprint),bundle2=buildScienceBundle({request:req,identity:id2,acquired:noCanopy});
assert.throws(()=>publishableSnapshot(bundle2),/pending evidence/);
const elderFail=legacyAcquisitionToM85({mode:'property',displayed,model,gridWidth:W,gridHeight:H,target,propertyDeclaration:{center:target},propertyElderIdentity:elderIdentity,elderLast:{state:'failed',error:'boom'},canopyGrid:canopy});
const id3=createRunIdentity(req,elderFail.acquisitionFingerprint),bundle3=buildScienceBundle({request:req,identity:id3,acquired:elderFail});
assert.throws(()=>publishableSnapshot(bundle3),/failed required evidence/);

console.log('MANTRA85_SHADOW_ADAPTER_TESTS_PASS');
