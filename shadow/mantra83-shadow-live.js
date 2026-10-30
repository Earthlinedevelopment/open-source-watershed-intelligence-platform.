(function(){
  'use strict';
  const SHADOW='m83-shadow-live-1';
  const rows=[];
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(_){return null;}}
  function displayed(){return window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;}
  function captureModel(){
    try{
      const m=(typeof M!=='undefined'&&M)||window.M||null;
      const gw=(typeof GW!=='undefined'&&Number(GW))||Number(m&&m.GW)||0;
      const gh=(typeof GH!=='undefined'&&Number(GH))||Number(m&&m.GH)||0;
      return {
        available:!!m,
        analysisReady:!!(m&&m.analysisReady),
        searchGen:Number(m&&m.searchGen||0),
        gw,gh,
        cellM:Number(m&&m.cellM||0),
        swaleCount:Array.isArray(m&&m.swales)?m.swales.length:0,
        hasElevation:!!(m&&m.h&&m.h.length),
        elevationLength:Number(m&&m.h&&m.h.length||0)
      };
    }catch(e){return {available:false,error:String(e&&e.message||e)};}
  }
  async function observe(ev){
    const before=displayed();
    const row={
      shadowVersion:SHADOW,
      eventRunToken:String(ev&&ev.detail&&ev.detail.runToken||''),
      tier:String(ev&&ev.detail&&ev.detail.tier||''),
      displayedBefore:clone(before),
      model:captureModel(),
      at:new Date().toISOString()
    };
    // Observer invariant: do not call Earthline publication, renderer, map, or model writers.
    await Promise.resolve();
    const after=displayed();
    row.displayedAfter=clone(after);
    row.identityUnchanged=JSON.stringify(row.displayedBefore)===JSON.stringify(row.displayedAfter);
    rows.push(Object.freeze(row));
    window.EARTHLINE_MANTRA83_SHADOW_ROWS=rows;
    window.EARTHLINE_MANTRA83_SHADOW_LAST=row;
    document.dispatchEvent(new CustomEvent('earthline:mantra83-shadow-observed',{detail:{eventRunToken:row.eventRunToken,tier:row.tier,identityUnchanged:row.identityUnchanged}}));
  }
  document.addEventListener('earthline:analysis-complete',observe,{passive:true});
  window.EARTHLINE_MANTRA83_SHADOW={version:SHADOW,rows:()=>rows.slice(),captureModel};
})();