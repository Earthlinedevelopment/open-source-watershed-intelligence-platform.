/* EARTHLINE_ELDER_TREE_UI_17100
   Off-live V1 integration candidate.
   One authoritative Elder Tree count owner for UI presentation.
   No hydrology, recharge, swale, terrain, exclusion, ranking, or map-science changes.
*/
(function installEarthlineElderTreeUi17100(){
  if(window.EARTHLINE_ELDER_TREE_UI_17100)return;

  let context=null;

  function finiteCount(v){
    const n=Number(v);
    return Number.isFinite(n)&&n>=0?Math.round(n):null;
  }
  function normalize(raw){
    raw=raw&&typeof raw==='object'?raw:{};
    return Object.freeze({
      analysisCandidateCount:finiteCount(raw.analysisCandidateCount),
      analysisVerifiedCount:finiteCount(raw.analysisVerifiedCount),
      stateCandidateCount:finiteCount(raw.stateCandidateCount),
      stateVerifiedCount:finiteCount(raw.stateVerifiedCount),
      tier:String(raw.tier||'').toLowerCase(),
      query:String(raw.query||''),
      jurisdiction:String(raw.jurisdiction||''),
      sourceClass:String(raw.sourceClass||''),
      sourceLabel:String(raw.sourceLabel||''),
      methodVersion:String(raw.methodVersion||''),
      boundsHash:String(raw.boundsHash||''),
      generatedAt:String(raw.generatedAt||new Date().toISOString())
    });
  }
  function get(){return context}
  function countLabel(n,singular,plural){return n===1?singular:plural}
  function analysisText(){
    const c=get(),n=finiteCount(c?.analysisCandidateCount),v=finiteCount(c?.analysisVerifiedCount);
    if(n==null&&v==null)return '';
    const parts=[];
    if(n!=null)parts.push(n+' '+countLabel(n,'Elder Tree Candidate','Elder Tree Candidates'));
    if(v!=null&&v>0)parts.push(v+' '+countLabel(v,'Verified Elder Tree','Verified Elder Trees'));
    return parts.join(' · ');
  }
  function stateText(){
    const c=get(),n=finiteCount(c?.stateCandidateCount),v=finiteCount(c?.stateVerifiedCount);
    if(n==null&&v==null)return '';
    const parts=[];
    if(n!=null)parts.push(n+' '+countLabel(n,'Elder Tree Candidate','Elder Tree Candidates')+' mapped statewide');
    if(v!=null&&v>0)parts.push(v+' '+countLabel(v,'Verified Elder Tree','Verified Elder Trees'));
    return parts.join(' · ');
  }
  function analysisMetricHtml(){
    const c=get(),n=finiteCount(c?.analysisCandidateCount);
    if(n==null)return '';
    return '<div class="el49-detail-metric earthline-elder-metric-17100"><b>'+n+'</b><span>Elder Tree Candidates in analyzed area</span></div>';
  }
  function dataHtml(){
    const t=analysisText();if(!t)return '';
    return '<div class="earthline-data-elder-17100"><strong>Elder Trees:</strong> '+escapeHtml(t)+'<div class="earthline-data-elder-note-17100">GPS evidence layer · candidates are not field-verified age or mycorrhizal-hub determinations.</div></div>';
  }
  function reportHtml(ctx){
    const c=ctx&&typeof ctx==='object'?normalize(ctx):get();
    const n=finiteCount(c?.analysisCandidateCount),v=finiteCount(c?.analysisVerifiedCount);
    if(n==null&&v==null)return '';
    const bits=[];
    if(n!=null)bits.push(n+' '+countLabel(n,'Elder Tree Candidate','Elder Tree Candidates'));
    if(v!=null&&v>0)bits.push(v+' '+countLabel(v,'Verified Elder Tree','Verified Elder Trees'));
    return '<div class="el49-callout earthline-report-elder-17100"><b>Elder Tree evidence:</b> '+escapeHtml(bits.join(' · '))+' mapped within the analyzed area. Candidate points are screening evidence and do not by themselves verify tree age or mycorrhizal hub status.</div>';
  }
  function escapeHtml(v){
    return String(v==null?'':v).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  }
  function refresh(){
    const stateEl=document.getElementById('earthlineElderStateCount17100');
    if(stateEl){
      const t=stateText();
      stateEl.textContent=t?('Elder Trees: '+t):'';
      stateEl.hidden=!t;
    }
    const propertyEl=document.getElementById('earthlinePropertyElderCount17100');
    if(propertyEl){
      const t=analysisText();
      propertyEl.textContent=t?('Elder Trees · '+t+' in this analyzed area'):'';
      propertyEl.hidden=!t;
    }
    const detail=document.getElementById('earthlineCorridorDetail16149');
    if(detail?.classList?.contains('open')){
      const holder=detail.querySelector('.earthline-elder-detail-slot-17100');
      if(holder)holder.innerHTML=analysisMetricHtml();
    }
  }
  function set(raw){
    context=normalize(raw);
    refresh();
    try{document.dispatchEvent(new CustomEvent('earthline:elder-tree-context',{detail:context}))}catch(_){}
    return context;
  }
  function clear(){context=null;refresh();return true}

  window.earthlineSetElderTreeContext17100=set;
  window.earthlineGetElderTreeContext17100=get;
  window.earthlineClearElderTreeContext17100=clear;
  window.earthlineElderTreeAnalysisText17100=analysisText;
  window.earthlineElderTreeStateText17100=stateText;
  window.earthlineElderTreeAnalysisMetricHtml17100=analysisMetricHtml;
  window.earthlineElderTreeDataHtml17100=dataHtml;
  window.earthlineElderTreeReportHtml17100=reportHtml;
  window.earthlineRefreshElderTreeUi17100=refresh;
  window.EARTHLINE_ELDER_TREE_UI_17100={
    build:'17100',
    state:'ready',
    role:'single Elder Tree count presentation owner',
    liveDataRequired:true,
    fakeZeroForbidden:true,
    observers:0,
    pollingLoops:0
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();
})();
