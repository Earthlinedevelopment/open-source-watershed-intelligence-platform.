// A small stand-in for the live page, used only by the self-test. Not the live page: it has no real services.
/* ---- the stand-in page. mapMode: 'let' (like the live page), 'window', 'none'. runMode: 'ok' | 'stale' | 'drop' | 'undrawn' | 'drift' | 'wrongplace' | 'silent' ---- */
export function pageHtml(mapMode,runMode){return `<!doctype html><meta charset=utf-8><title>stand-in</title>
<div id=mapboxBase style="width:800px;height:600px;position:relative"><canvas class="mapboxgl-canvas" width=800 height=600></canvas></div>
<input id=searchInput><button id=runBtn>Run Analysis</button>
<button id=earthlineDeclareProperty16169 style="display:none;width:120px;height:30px">Declare property</button>
<script>
${mapMode==='window'?'var':'let'} earthlineMap=null;
const M={analysisReady:false,swales:[],layers:{swales:{on:false}},loc:{name:'stand-in'},centerLat:0,centerLng:0};
let runs=0,first=null,drawn=0,firstC=null;
class FakeMap{constructor(){this.c={lng:-100,lat:40};this.z=3;this.h={};}
  on(t,f){(this.h[t]=this.h[t]||[]).push(f);return this}fire(t){(this.h[t]||[]).forEach(f=>f())}
  getCenter(){return {lng:this.c.lng,lat:this.c.lat}}getZoom(){return this.z}jumpTo(o){if(o.center)this.c={lng:o.center[0],lat:o.center[1]};if(o.zoom!=null)this.z=o.zoom}
  getStyle(){return {layers:[{id:'bioswale-lines'}]}}getLayoutProperty(){return 'visible'}queryRenderedFeatures(){return new Array(drawn).fill({})}}
${mapMode==='none'?'':(mapMode==='window'?'earthlineMap=window.earthlineMap=new FakeMap();':'earthlineMap=new FakeMap();')}
const button=()=>document.getElementById('earthlineDeclareProperty16169');
${mapMode==='none'?'':"earthlineMap.on('dragend',()=>{button().style.display='block'});"}
function featuresAt(lng,lat){const f=[];for(let i=0;i<4;i++){f.push({geometry:{coordinates:[[lng+i*0.0003,lat],[lng+i*0.0003+0.0002,lat+0.0004]]}});}return f;}
button().addEventListener('click',()=>{
  runs++;const de=document.documentElement,n=runs,c=earthlineMap.getCenter();
  de.dataset.earthlinePropertyRunState='running';de.dataset.earthlineAnalysisTier='property';M.analysisReady=false;
  setTimeout(()=>{
    if('${runMode}'==='drop'&&n>=2)return;                       /* the search never finishes */
    let feats=featuresAt(c.lng+('${runMode}'==='drift'?n*0.00001:0),c.lat);          /* 'drift': the same place gives a different answer each time */
    if('${runMode}'==='silent'&&n>=2)feats=[];                                       /* 'silent': no swales and no reason */
    if('${runMode}'==='stale'){if(!first)first=feats;else feats=first;}   /* a later search reuses the first search's swales */
    const at=('${runMode}'==='wrongplace'&&n>=2)?firstC:c;if(!firstC)firstC={lng:c.lng,lat:c.lat};   /* 'wrongplace': publishes at the previous place */
    M.centerLng=at.lng;M.centerLat=at.lat;M.swales=feats;M.layers.swales.on=true;
    drawn=('${runMode}'==='undrawn'&&n>=2)?0:feats.length;
    window.__EARTHLINE_SWALE_ENGINE_HOOK_16600={result:()=>({engineVersion:'stand-in',verified:'${runMode}'!=='silent'||n<2,features:feats,engineSwales:feats.length,publishedSwales:feats.length})};
    M.analysisReady=true;de.dataset.earthlinePropertyRunState='done';
  },200);
});
</script>`;}
