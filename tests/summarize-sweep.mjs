// Reads every results.json under a folder and writes SUMMARY.md + summary.json next to them.
// Usage: node tests/summarize-sweep.mjs collected
// It reports what was observed. It does not decide what is acceptable: flags are plain-language observations.
import {readdirSync,readFileSync,writeFileSync,statSync,existsSync} from 'node:fs';
import {join} from 'node:path';

const ROOT=process.argv[2]||'collected';
const files=[];
const starts=[];
(function walk(d){for(const n of readdirSync(d)){const p=join(d,n);const s=statSync(p);if(s.isDirectory())walk(p);else if(n==='results.json')files.push(p);else if(/^BUILD-AT-START/.test(n))starts.push(p);}})(ROOT);

const docs=files.map(f=>({file:f,...JSON.parse(readFileSync(f,'utf8'))}));
const sweeps=[...new Set(docs.map(d=>d.sweep))];
const out=[];const summary={generatedAt:new Date().toISOString(),jobs:docs.length,incompleteJobs:docs.filter(d=>!d.complete).map(d=>d.file),sweeps:{}};
const build=existsSync(join(ROOT,'BUILD.txt'))?readFileSync(join(ROOT,'BUILD.txt'),'utf8').trim():'(BUILD.txt missing)';
const stamp=new Set();for(const f of starts){for(const l of readFileSync(f,'utf8').split('\n'))if(/^(sha256|pages-live head)/.test(l))stamp.add(l.trim());}
const byFile={};for(const l of stamp){const k=l.replace(/:.*$/,'');(byFile[k]=byFile[k]||[]).push(l);}
const changed=Object.entries(byFile).filter(([k,v])=>v.length>1).map(([k])=>k);
out.push('# Earthline live sweep — results','',"```",build,"```",'',
  starts.length?(changed.length?`**WARNING: the live site changed while this phase was running** (different values seen at job start for: ${changed.join('; ')}). Results below mix builds.`:`Build check: all ${starts.length} jobs saw the same live files at start.`):'Build check: no BUILD-AT-START stamps found.','',
  `Result files read: ${docs.length}. Jobs that did not finish cleanly: ${summary.incompleteJobs.length}${summary.incompleteJobs.length?' → '+summary.incompleteJobs.join(', '):''}.`,'');
const num=v=>(v===null||v===undefined||Number.isNaN(v))?'–':String(v);

// Plain-language observations from one geometry audit (see tests/geometry-audit.mjs for exact definitions and thresholds).
function geomFlags(g){
  const o=[];
  if(!g)return o;
  if(g.ok===false){o.push('geometry audit did not run: '+(g.error||'unknown'));return o;}
  if(g.roadCheckValid===false)o.push('no basemap road lines were readable, so road checks are NOT valid for this item');
  const sw=g.swaleOutput;
  if(sw){
    if(sw.withinRoadSetback>0)o.push(`published swales within 3.05 m (10 ft) of a road: ${sw.withinRoadSetback} of ${sw.lines}`);
    if(sw.roadCrossings>0)o.push(`published swales that cross a road: ${sw.roadCrossings}`);
    if(sw.tightPairs>0)o.push(`published swales closer than 4.572 m to a neighbour: ${sw.tightPairs} pair(s)`);
  }
  const ro=g.rechargeOverlap;
  if(ro&&ro.error)o.push('recharge-target overlap check did not run: '+ro.error);
  else if(ro&&ro.swalesTouchingTargets>0)o.push(`published swales lying (partly) inside an orange recharge target: ${ro.swalesTouchingTargets} of ${ro.swalesChecked} swales, about ${ro.shareOfSwaleLengthInsideTargetsPct}% of swale length, ${ro.targetsTouchedBySwales} of ${ro.targets} targets touched`);
  for(const l of (g.drawnLayers||[])){
    if(l.roadCrossings>0)o.push(`layer ${l.layer}: ${l.roadCrossings} line(s) cross a road`);
    if(l.rulerStraightLong>0)o.push(`layer ${l.layer}: ${l.rulerStraightLong} ruler-straight line(s) ≥ 100 m`);
    if(l.largestTightCluster>=4)o.push(`layer ${l.layer}: stack of ${l.largestTightCluster} near-touching parallel lines`);
  }
  return o;
}

function boundaryFlags(b){
  if(!b)return [];
  if(b.ok===false)return ['state-outline check did not run: '+(b.error||'unknown')];
  if(b.vertices===0)return ['state-outline check: no corridor vertices were readable'];
  if(b.outsideBeyond500m>0)return [`${b.outsideBeyond500m} corridor vertex/vertices more than 500 m outside the state outline (worst ${b.worstOutsideM} m, near ${b.worstAt&&b.worstAt.join(', ')}); ${b.featuresWithOutsideVertices} corridor(s) have vertices outside`];
  return [];
}
function geomWhere(g){
  const o=[];if(!g||g.ok===false)return o;
  const add=(layer,rec)=>{for(const [k,arr] of Object.entries(rec.examples||{}))for(const e of arr)if(['roadCrossings','rulerStraightLong','tightPairs','withinRoadSetback'].includes(k))o.push(`${layer} · ${k} · near ${e.near[1]}, ${e.near[0]}`);};
  if(g.swaleOutput)add('swale engine output',g.swaleOutput);
  if(g.rechargeOverlap&&g.rechargeOverlap.examples)for(const e of g.rechargeOverlap.examples)o.push(`swale inside recharge target · near ${e.near[1]}, ${e.near[0]} (${e.sharePctOfThisSwaleInside}% of that swale)`);
  for(const l of g.drawnLayers||[])add(l.layer,l);
  return o.slice(0,8);
}


// ---------- primary ----------
function primary(ds){
  const lines=['## Primary states','','Regional run 1 / run 2 = swale corridors drawn (aquifer patches). Property run 1 / run 2 = swales shown. Lifecycle = Regional → Property → Regional → Property.','',
    '| State | Browser | Regional run1 | Regional run2 | Property site | Property run1 | Property run2 | Same both runs | Lifecycle same | Page errors | Observations |','|---|---|---|---|---|---|---|---|---|---|---|'];
  const flagsAll=[];
  for(const d of ds.sort((a,b)=>(a.only||'').localeCompare(b.only||'')||a.profile.localeCompare(b.profile))){
    const st=d.only||'(all)';const reg=d.rows.find(r=>r.kind==='regional');
    const props=d.rows.filter(r=>r.kind==='property');const life=d.rows.find(r=>r.kind==='lifecycle');
    const rg=r=>r&&r.finished!==undefined?`${num(r.regionalSwaleFeatures)} (${num(r.aquiferFeatures)})${r.finished?'':' NOT FINISHED'}`:'–';
    const jobFlags=[];
    if(d.launchError)jobFlags.push('browser would not start: '+d.launchError);
    if(!d.complete)jobFlags.push('job did not finish');
    if(reg&&reg.couldNotRun)jobFlags.push('regional could not run: '+reg.couldNotRun);
    if(reg&&reg.run1&&reg.run2&&reg.run1.regionalSwaleFeatures===0&&reg.run1.aquiferFeatures===0)jobFlags.push('Regional run 1 drew nothing');
    if(reg)for(const rn of ['run1','run2']){for(const x of boundaryFlags(reg[rn]&&reg[rn].boundary))jobFlags.push(`Regional ${rn}: ${x}`);}
    if(reg&&reg.run1&&reg.run2&&reg.run2.regionalSwaleFeatures<reg.run1.regionalSwaleFeatures)jobFlags.push('Regional run 2 drew fewer corridors than run 1');
    const errs=d.rows.reduce((n,r)=>n+(r.pageErrors?r.pageErrors.length:0),0);
    const first=props[0];
    if(!props.length)jobFlags.push('no Property rows');
    for(const p of props){
      if(p.couldNotRun)jobFlags.push(`${p.site}: could not run (${p.couldNotRun.slice(0,90)})`);
      else{
        if(p.run1&&p.run2&&p.run2.shownSwales<p.run1.shownSwales)jobFlags.push(`${p.site}: repeat run LOST swales (${p.run1.shownSwales} → ${p.run2.shownSwales})`);
        else if(p.sameResultBothRuns===false)jobFlags.push(`${p.site}: repeat run gave a different result`);
        if(p.run1&&p.run1.shownSwales===0)jobFlags.push(`${p.site}: first run showed 0 swales`);
        for(const rn of ['run1','run2']){const x=p[rn];if(!x)continue;
          if(x.shownSwales===0&&x.integrity&&x.integrity.ok===false)jobFlags.push(`${p.site} (${rn}): Property blocked by the page's own location-integrity check: ${(x.integrity.reasons||[]).join('; ')||'no reason recorded'}${x.integrity.mapDeltaM!=null?` (map ${Math.round(x.integrity.mapDeltaM)} m from the analysis anchor)`:''}`);
          else if(x.shownSwales===0&&x.propertyFailure)jobFlags.push(`${p.site} (${rn}): Property stopped at stage "${x.propertyFailure.stage}": ${x.propertyFailure.reason}`);
          if(x.swalesOver4pct>0&&x.slopesMeasured>0)jobFlags.push(`${p.site} (${rn}): ${x.swalesOver4pct} of ${x.slopesMeasured} published swales are steeper than 4% by the page's own slope figure (steepest ${x.steepestSwalePct}%)`);
          if(x.engineSwales>0&&x.shownSwales<x.engineSwales)jobFlags.push(`${p.site} (${rn}): engine produced ${x.engineSwales} swales, the display showed ${x.shownSwales}`);
        }
        if((p.run1&&p.run1.timedOut)||(p.run2&&p.run2.timedOut))jobFlags.push(`${p.site}: Property did not settle in time`);
        const seenG=new Set();for(const rn of ['run1','run2']){const g=p[rn]&&p[rn].geometry;for(const x of geomFlags(g)){const k=x;if(!seenG.has(k)){seenG.add(k);jobFlags.push(`${p.site} (${rn}): ${x}`);}}}
      }
    }
    if(life){if(life.couldNotRun)jobFlags.push('lifecycle could not run');else{if(life.propertySameBothRounds===false)jobFlags.push('lifecycle: Property differs between rounds');if(life.regionalSameBothRounds===false)jobFlags.push('lifecycle: Regional differs between rounds');}}
    if(errs)jobFlags.push(errs+' page error line(s)');
    flagsAll.push({state:st,profile:d.profile,flags:jobFlags});
    const rowsP=props.length?props:[null];
    rowsP.forEach((p,i)=>{
      lines.push(`| ${i===0?st:''} | ${i===0?d.profile:''} | ${i===0?rg(reg&&reg.run1):''} | ${i===0?rg(reg&&reg.run2):''} | ${p?p.site:'–'} | ${p&&p.run1?num(p.run1.shownSwales)+(p.run1.engineSwales!=null&&p.run1.engineSwales!==p.run1.shownSwales?` (engine ${p.run1.engineSwales})`:''):'–'} | ${p&&p.run2?num(p.run2.shownSwales):'–'} | ${p?(p.sameResultBothRuns?'yes':'NO'):'–'} | ${i===0?(life?(life.propertySameBothRounds&&life.regionalSameBothRounds?'yes':(life.couldNotRun?'did not run':'NO')):'–'):''} | ${i===0?errs:''} | ${i===0?(jobFlags.join('; ')||'none'):''} |`);
    });
  }
  summary.sweeps.primary={rows:flagsAll};
  return lines;
}
// ---------- states / countries ----------
function sweepTable(title,ds,kmFlag,withProperty){
  const rows=[];for(const d of ds)for(const r of d.rows)rows.push({...r,_job:d});
  const lines=[`## ${title}`,''];
  const assigned=new Set();for(const d of ds)for(const n of (d.assigned||[]))assigned.add(d.profile+'|'+n);
  const seen=new Set(rows.map(r=>r.profile+'|'+r.name));
  const missing=[...assigned].filter(k=>!seen.has(k));
  const tally={items:rows.length,couldNotRun:0,notFinished:0,drewNothing:0,drew:0,wrongPlace:0,propertyTimedOut:0,propertyZero:0,propertyHasSwales:0,propertySkipped:0,swalesNearRoad:0,outsideState:0,linesCrossRoad:0,rulerStraight:0,stacks:0,roadCheckInvalid:0};
  const geomLocs=[];
  const flagged=[];
  const body=[];
  for(const r of rows.sort((a,b)=>a.name.localeCompare(b.name)||a.profile.localeCompare(b.profile))){
    const g=r.regional||{};const p=r.property;const f=[];
    if(r.couldNotRun){tally.couldNotRun++;f.push('could not run: '+r.couldNotRun.slice(0,90));}
    else{
      if(g.finished===false){tally.notFinished++;f.push('Regional did not finish');}
      if(g.regionalError)f.push('Regional error: '+String(g.regionalError).slice(0,80));
      const sw=g.regionalSwaleFeatures||0,aq=g.aquiferFeatures||0;
      if(g.finished!==false){if(sw===0&&aq===0){tally.drewNothing++;f.push('drew nothing');}else tally.drew++;}
      if(g.distanceFromExpectedKm!=null&&g.distanceFromExpectedKm>kmFlag){tally.wrongPlace++;f.push(`map ended ${g.distanceFromExpectedKm} km from expected centre ("${g.location||'?'}")`);}
      if(g.center==null)f.push('no map centre read');
      for(const x of boundaryFlags(g.boundary)){f.push(x);if(g.boundary&&g.boundary.outsideBeyond500m>0)tally.outsideState++;}
      if(withProperty){
        if(p&&p.skipped){tally.propertySkipped++;f.push('Property skipped: '+p.skipped);}
        else if(p){if(p.timedOut){tally.propertyTimedOut++;f.push('Property did not settle');}
          if(p.shownSwales===0){tally.propertyZero++;f.push('Property showed 0 swales');}else if(p.shownSwales>0)tally.propertyHasSwales++;}
        const gf=geomFlags(p&&p.geometry);for(const x of gf)f.push('geometry — '+x);
        const gg=p&&p.geometry&&p.geometry.ok?p.geometry:null;if(gg){if((gg.swaleOutput&&gg.swaleOutput.withinRoadSetback>0))tally.swalesNearRoad++;if((gg.drawnLayers||[]).some(l=>l.roadCrossings>0))tally.linesCrossRoad++;if((gg.drawnLayers||[]).some(l=>l.rulerStraightLong>0))tally.rulerStraight++;if((gg.drawnLayers||[]).some(l=>l.largestTightCluster>=4))tally.stacks++;if(gg.roadCheckValid===false)tally.roadCheckInvalid++;for(const w of geomWhere(gg))geomLocs.push(`${r.name}: ${w}`);}
      }
    }
    if(r.pageErrors&&r.pageErrors.length)f.push(r.pageErrors.length+' page error line(s)');
    if(f.length)flagged.push(`- **${r.name}** (${r.profile}): ${f.join('; ')}`);
    body.push(`| ${r.name} | ${r.profile} | ${g.finished===undefined?'–':(g.finished?'yes':'NO')} | ${num(g.seconds)} | ${g.location?String(g.location).slice(0,28):'–'} | ${num(g.distanceFromExpectedKm)} | ${num(g.regionalSwaleFeatures)} | ${num(g.aquiferFeatures)} |${withProperty?` ${p&&!p.skipped?num(p.shownSwales)+(p.engineSwales!=null&&p.engineSwales!==p.shownSwales?` (engine ${p.engineSwales})`:''):(p&&p.skipped?'skipped':'–')} | ${p&&!p.skipped?(p.timedOut?'no':'yes'):'–'} |`:''} ${f.length?f.join('; '):''} |`);
  }
  lines.push('| Summary | |','|---|---|',`| Items with a result | ${tally.items} |`,`| Regional drew corridors/aquifers | ${tally.drew} |`,`| Regional finished but drew nothing | ${tally.drewNothing} |`,`| Regional did not finish | ${tally.notFinished} |`,`| Could not run / abandoned | ${tally.couldNotRun} |`,`| Map ended > ${kmFlag} km from expected centre | ${tally.wrongPlace} |`);
  if(withProperty)lines.push(`| Property showed swales | ${tally.propertyHasSwales} |`,`| Property showed 0 swales | ${tally.propertyZero} |`,`| Property did not settle in time | ${tally.propertyTimedOut} |`,`| Property skipped (no corridor) | ${tally.propertySkipped} |`,`| Items where Regional corridors lie > 500 m outside the state outline | ${tally.outsideState} |`,`| Items where published swales sit within 3.05 m of a road | ${tally.swalesNearRoad} |`,`| Items where a drawn line crosses a road | ${tally.linesCrossRoad} |`,`| Items with a ruler-straight line ≥ 100 m | ${tally.rulerStraight} |`,`| Items with a stack of ≥ 4 near-touching parallel lines | ${tally.stacks} |`,`| Items where road checks were not valid (no road lines readable) | ${tally.roadCheckInvalid} |`);
  lines.push(`| Assigned but no result row (job died) | ${missing.length} |`,'');
  if(missing.length)lines.push('**No result for:** '+missing.map(k=>k.replace('|',' / ')).join(', '),'');
  if(withProperty&&geomLocs.length)lines.push('### Where to look (lat, lng of a few flagged lines per item)','',...geomLocs.slice(0,120).map(x=>'- '+x),'');
  lines.push('### Observations','',flagged.length?flagged.join('\n'):'None.','','### Every item','',
    `| Name | Browser | Finished | Seconds | Map location | km from expected | Swale corridors | Aquifer patches |${withProperty?' Property swales | Property settled |':''} Observations |`,`|---|---|---|---|---|---|---|---|${withProperty?'---|---|':''}---|`,...body,'');
  summary.sweeps[ds[0]&&ds[0].sweep]={tally,missing,flagged};
  return lines;
}

for(const s of ['primary','states','countries']){
  const ds=docs.filter(d=>d.sweep===s);if(!ds.length)continue;
  if(s==='primary')out.push(...primary(ds));
  else if(s==='states')out.push(...sweepTable('All 50 states',ds,500,true));
  else out.push(...sweepTable('All countries',ds,1500,false));
}
writeFileSync(join(ROOT,'SUMMARY.md'),out.join('\n'));
writeFileSync(join(ROOT,'summary.json'),JSON.stringify(summary,null,1));
console.log(out.slice(0,6).join('\n'));
