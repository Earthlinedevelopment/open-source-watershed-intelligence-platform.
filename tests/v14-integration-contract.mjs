import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
const html=readFileSync('index.html','utf8');
const adapter=readFileSync('tools/adapter-16600.js','utf8');
const reset='let earthlineStartupGlobeSettled16601=false';
assert.equal(html.split(reset).length-1,1,'exactly one startup-globe owner');
assert(html.includes('if(!m||earthlineStartupGlobeSettled16601)return false'),'globe must run at most once');
assert(html.includes('if(searchActive)return false'),'search must own camera after navigation');
const globeFnStart=html.indexOf('function initRealGlobe16233(){');
const globeFnEnd=html.indexOf('function ensureRegionalCorridorTabs16323(',globeFnStart);
assert(globeFnStart>0&&globeFnEnd>globeFnStart,'find existing startup globe owner');
const globeFunction=html.slice(globeFnStart,globeFnEnd);
assert(!globeFunction.includes('center:[0,18]'),'secondary idle-globe recenter must not survive');
assert(globeFunction.includes('core Mapbox owns the idle globe camera'),'core Mapbox is the only idle camera owner');
assert(adapter.includes('rawEngineSwales:out.swales.length,engineSwales:corridors.length,publishedSwales:corridors.length'),'raw count must not equal public count unless actually published');
assert(adapter.includes('message:finalMessage16601'),'public description derives from published count');
const start=html.lastIndexOf('  function evidence(){'),end=html.indexOf('\n  function render(){',start);
assert(start>0&&end>start,'existing status owner found');
const text=html.slice(start,end);
assert(text.includes('m.propertySwaleEngine16600'),'status reads clean-engine evidence');
assert(!text.includes('test-only'),'status remains real UI owner');
let m={searchGen:9,propertySwaleEngine16600:{
 searchGen:9,verified:true,acquisition:{sourceTier:'open-data',status:'features-found',counts:{roads:2,water:1}},
 publishedSwales:23,audit:{checked:23}
},vectorNoBuildCoverage:{sourceTier:'none',acquisitionResult:'failed',evidenceGrade:'OLD FAILURE',publicationAllowed:false}};
const evidence=new Function('model','BUILD',text+'; return evidence;')(()=>m,'EARTHLINE TEST');
let x=evidence();
assert.equal(x.publicationAllowed,true,'verified candidate must override stale old failed evidence');
assert.equal(x.kind,'open-data');
assert.equal(x.sourceFeatureCount,3);
assert(!x.detail.toLowerCase().includes('publication must remain blocked'),'cannot claim blocked beside published swales');
m.propertySwaleEngine16600={searchGen:9,verified:false,code:'test-failed',acquisition:{sourceTier:'open-data',status:'failed'}};
m.vectorNoBuildCoverage={sourceTier:'open-data',acquisitionResult:'features-found',publicationAllowed:true};
x=evidence();
assert.equal(x.publicationAllowed,false,'failed new engine cannot inherit old success');
assert.equal(x.kind,'failed');
m.propertySwaleEngine16600={searchGen:9,verified:true,acquisition:{sourceTier:'open-data',status:'screened-clear',counts:{}},publishedSwales:0,audit:{checked:0}};
x=evidence();
assert.equal(x.publicationAllowed,true,'verified empty exclusion response is allowed');
assert(/no mapped exclusions/i.test(x.label),'screened-clear is labeled');
// Refuse blank Search Orb and Run Analysis before touching the demo site.
{
 const from=html.indexOf('async function runSearch(options={})');
 const to=html.indexOf('// BUILD-CHECK-15774',from);
 assert(from>0&&to>from,'find runSearch in rebuilt page');
 const section=html.slice(from,to);
 assert(!section.includes('loc=M.loc||GAZ[0]'),'no default demo fallback');
 const doc={getElementById:()=>({value:'   '})};
 const demo={name:'Poudre Foothills Parcel',lat:40.6412,lng:-105.2237};
 const model={loc:demo,searchGen:0,analysisReady:true},notices=[];
 const search=new Function('document','M','earthlineNotice',
   section+';return runSearch;')(doc,model,msg=>notices.push(msg));
 assert.equal(await search(),false,'blank search must refuse');
 assert.equal(model.searchGen,0,'search generation unchanged');
 assert.equal(model.loc,demo,'no default-site side effects');
 assert(notices.at(-1)?.includes('Enter a place'),'clear visitor instruction');

 const start=html.indexOf('async function earthlineRunAnalysis(options={})');
 const end=html.indexOf('document.getElementById("runBtn").addEventListener("click",earthlineRunAnalysis);',start);
 assert(start>0&&end>start,'find Run Analysis handler');
 const analyze=new Function('document','M','earthlineNotice','earthlineAnalysisIsBusy15686',
   'let EARTHLINE_ACTIVE_ANALYSIS_15685=0;'+html.slice(start,end)+';return earthlineRunAnalysis;')(
   doc,model,msg=>notices.push(msg),()=>false);
 assert.equal(await analyze(),false,'blank Run Analysis must refuse');
 assert.equal(model.searchGen,0,'no generation started');
 assert.equal(model.loc,demo,'no implicit demo analysis');
}
console.log('V14_CONTRACT_PASS globe one-shot, final counts, status precedence and fail closed');
