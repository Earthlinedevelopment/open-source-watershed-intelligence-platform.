// Mantra 83 live shadow runner — NON-PRODUCTION.
// Observes canonical publication, adapts legacy run state, runs unified engine, compares, never publishes.

import {legacyToScienceInput} from '../science/mantra83-legacy-adapter.mjs';
import {RunCoordinator} from '../science/mantra83-coordinator.mjs';
import {compareRuns} from '../science/mantra83-shadow.mjs';

const coordinator=new RunCoordinator();
const records=[];
let busy=false;

function getDisplayed(){
  return window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
}
function getModel(){
  try{return (typeof M!=='undefined'&&M)||window.M||null;}catch(_){return window.M||null;}
}
function getGrid(model){
  let gw=0,gh=0;
  try{if(typeof GW!=='undefined')gw=Number(GW)||0;}catch(_){}
  try{if(typeof GH!=='undefined')gh=Number(GH)||0;}catch(_){}
  gw=gw||Number(model&&model.GW)||0;
  gh=gh||Number(model&&model.GH)||0;
  return {gw,gh};
}
function legacySummary(displayed,model){
  return {
    runId:String(displayed?.runToken||''),
    target:displayed?.target||displayed?.location||model?.loc||null,
    swales:Array.isArray(model?.swales)?model.swales:[]
  };
}
async function shadowRun(ev){
  if(busy)return;
  busy=true;
  const displayed=getDisplayed(),model=getModel(),{gw,gh}=getGrid(model);
  const rec={at:new Date().toISOString(),eventRunToken:String(ev?.detail?.runToken||''),status:'started'};
  try{
    const input=legacyToScienceInput({displayed,model,gw,gh,cellM:Number(model?.cellM||1)});
    const newRun=await coordinator.run(input);
    if(newRun.status!=='published')throw new Error('unified shadow run did not publish internally');
    const comparison=compareRuns({legacy:legacySummary(displayed,model),newRun});
    rec.status='compared';
    rec.comparison=comparison;
    rec.newRunId=newRun.runId;
  }catch(error){
    rec.status='skipped';
    rec.reason=String(error?.message||error);
  }finally{
    records.push(Object.freeze(rec));
    if(records.length>100)records.splice(0,records.length-100);
    window.EARTHLINE_MANTRA83_SHADOW_COMPARISONS=records;
    window.EARTHLINE_MANTRA83_SHADOW_COMPARISON_LAST=rec;
    busy=false;
  }
}

document.addEventListener('earthline:analysis-complete',shadowRun,{passive:true});
window.EARTHLINE_MANTRA83_SHADOW_RUNNER=Object.freeze({
  version:'m83-shadow-runner-1',
  records:()=>records.slice(),
  runNow:()=>shadowRun({detail:{runToken:String(getDisplayed()?.runToken||'manual')}})
});
