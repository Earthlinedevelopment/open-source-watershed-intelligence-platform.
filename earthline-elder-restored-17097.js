/* EARTHLINE_ELDER_TREES_V1_17097
   Authorized V1 Elder Tree GPS-point presentation.
   One evidence owner, one Mapbox source/layer owner, no polling/observer/styledata/camera-motion owner.
   Counts are evidence counts, not claims of true population. Confidence is structural-evidence confidence,
   not probability of age/ancient status. No recharge-score or swale-science changes. */
(function installEarthlineElderTrees17097(){
  if(window.EARTHLINE_ELDER_TREES_V1_17097)return;
  const MANIFEST='data/elder-trees/v2/manifest.json';
  const SOURCE='earthline-elder-trees-17097';
  const LAYER='earthline-elder-tree-points-17097';
  const state={loaded:false,loading:null,manifest:null,all:[],active:[],lastSummary:null,dynamic:{worker:null,seq:0,pending:new Map(),key:'',result:null,promise:null,error:null,warmPromise:null,warmed:false,tileWarmKey:'',tileWarmPromise:null}};

  function map(){try{return window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)}catch(_){return null}}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
  function clampConfidence(v){v=Number(v);return Number.isFinite(v)?Math.max(0,Math.min(100,Math.round(v))):null}
  function elderConfidence(p){return clampConfidence(p?.elder_tree_confidence_pct??p?.confidence_pct)}
  function isVerified(p){return String(p?.record_class||'').toUpperCase()==='VERIFIED_ELDER_TREE'||String(p?.record_class||'').toUpperCase()==='VERIFIED_EXTERNAL_TREE'||/verified/i.test(String(p?.verification_status||''))}
  function isLidar(p){return /LIDAR/i.test(String(p?.record_class||''))||/LIDAR/i.test(String(p?.source_class||''))||/LIDAR/i.test(String(p?.source_name||''))}
  function elderCohort(p){return String(p?.elder_cohort||'').trim().toUpperCase()}
  function isLegacyCandidate(p){return String(p?.record_class||'').toUpperCase()==='ELDER_TREE_CANDIDATE'&&!p?.science_baseline}
  function classify(p){
    if(isVerified(p))return 'VERIFIED ELDER TREE';
    if(isLidar(p))return 'LIDAR-CONFIRMED CANDIDATE';
    const c=elderCohort(p);
    if(c==='CURRENT_ELDER_CANDIDATE')return 'CURRENT ELDER CANDIDATE';
    if(c==='FUTURE_ELDER_CANDIDATE')return 'FUTURE ELDER CANDIDATE';
    if(c==='OUTSIDE_DENSITY_PRIOR')return 'MODELED CANDIDATE · OUTSIDE DENSITY PRIOR';
    if(isLegacyCandidate(p))return 'ELDER TREE CANDIDATE';
    return 'MODELED CANDIDATE';
  }
  function bounds(){
    const m=map();
    try{
      const b=m?.getBounds?.();
      if(b)return [Number(b.getWest()),Number(b.getSouth()),Number(b.getEast()),Number(b.getNorth())];
    }catch(_){}
    return null;
  }
  function hav(a,b){const R=6371008.8,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)))}
  function inBounds(f,b){
    const q=f?.geometry?.coordinates;
    if(!Array.isArray(q)||q.length<2||!b)return false;
    const x=Number(q[0]),y=Number(q[1]);
    if(!Number.isFinite(x)||!Number.isFinite(y))return false;
    const west=b[0],south=b[1],east=b[2],north=b[3];
    const lonOk=west<=east?(x>=west&&x<=east):(x>=west||x<=east);
    return lonOk&&y>=south&&y<=north;
  }
  function inPolygonLngLat(point,poly){
    if(!Array.isArray(point)||point.length<2||!Array.isArray(poly)||poly.length<3)return false;
    const x=Number(point[0]),y=Number(point[1]);if(!Number.isFinite(x)||!Number.isFinite(y))return false;
    let inside=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[i],b=poly[j];
      const xi=Number(a?.[0]),yi=Number(a?.[1]),xj=Number(b?.[0]),yj=Number(b?.[1]);
      if(![xi,yi,xj,yj].every(Number.isFinite))continue;
      const crosses=((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-12)+xi);
      if(crosses)inside=!inside;
    }
    return inside;
  }
  async function load(){
    if(state.loaded)return state;
    if(state.loading)return state.loading;
    state.loading=(async()=>{
      const manifest=await fetch(MANIFEST,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Elder Tree manifest '+r.status);return r.json()});
      /* M127 Elder I/O only: fetch independent evidence datasets concurrently
         (up to four), then publish in manifest order. No evidence/count changes. */
      const all=[],datasets=manifest.datasets||[];
      const responses=new Array(datasets.length);
      const slots=Math.min(4,datasets.length);
      await Promise.all(Array.from({length:slots},async(_,slot)=>{
        for(let i=slot;i<datasets.length;i+=slots){
          const d=datasets[i];
          try{
            const fc=await fetch(d.path,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()});
            responses[i]={features:fc.features||[]};
          }catch(err){
            responses[i]={error:String(err&&err.message||err)};
          }
        }
      }));
      for(let i=0;i<datasets.length;i++){
        const d=datasets[i],record=responses[i]||{};
        if(record.error){
          (manifest.load_errors||(manifest.load_errors=[])).push({dataset:d.id||d.path,error:record.error});
          continue;
        }
        for(const f of (record.features||[])){
          if(f?.geometry?.type!=='Point')continue;
          const copy={type:'Feature',geometry:f.geometry,properties:Object.assign({},f.properties||{},{
            elder_dataset_id:d.id||'',
            elder_dataset_label:d.label||d.id||'',
            elder_coverage_complete:d.coverage_complete===true
          })};
          all.push(copy);
        }
      }
      state.manifest=manifest;state.all=all;state.loaded=true;
      return state;
    })().finally(()=>{state.loading=null});
    return state.loading;
  }
  function datasetCoversBounds(d,b){
    const q=d?.bbox;
    if(!Array.isArray(q)||q.length<4||!b)return false;
    const dw=Number(q[0]),ds=Number(q[1]),de=Number(q[2]),dn=Number(q[3]);
    if(![dw,ds,de,dn].every(Number.isFinite))return false;
    const [west,south,east,north]=b;
    const latOverlap=dn>=south&&ds<=north;
    const lonOverlap=west<=east?(de>=west&&dw<=east):(de>=west||dw<=east);
    return latOverlap&&lonOverlap;
  }
  function coverageQueryBounds(){
    const tier=String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase();
    if(tier==='property'){
      try{
        const md=(typeof M!=='undefined'&&M)||window.M||null;
        const poly=Array.isArray(md?.analysisBoundaryLngLat)?md.analysisBoundaryLngLat.filter(p=>Array.isArray(p)&&p.length>=2):[];
        if(poly.length>=3){
          let west=Infinity,south=Infinity,east=-Infinity,north=-Infinity;
          for(const p of poly){
            const x=Number(p[0]),y=Number(p[1]);if(!Number.isFinite(x)||!Number.isFinite(y))continue;
            west=Math.min(west,x);east=Math.max(east,x);south=Math.min(south,y);north=Math.max(north,y);
          }
          if([west,south,east,north].every(Number.isFinite))return [west,south,east,north];
        }
        const loc=md?.loc||window.EARTHLINE_PROPERTY_TARGET_16201||null;
        const lng=Number(loc?.lng),lat=Number(loc?.lat);
        if(Number.isFinite(lng)&&Number.isFinite(lat)){
          const dy=350/111320,dx=350/(111320*Math.max(.05,Math.cos(lat*Math.PI/180)));
          return [lng-dx,lat-dy,lng+dx,lat+dy];
        }
      }catch(_){}
    }
    return bounds();
  }
  function activeCoverage(){
    const b=coverageQueryBounds();
    const tier=String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase();
    const datasets=state.manifest?.datasets||[];
    const covered=datasets.filter(d=>!(tier==='property'&&d?.property_eligible===false)&&datasetCoversBounds(d,b));
    return {
      known:covered.length>0,
      datasetIds:covered.map(d=>d.id||d.path||''),
      complete:covered.length>0&&covered.every(d=>d.coverage_complete===true)
    };
  }
  function summarize(features,coverage=activeCoverage()){
    let verified=0,lidar=0,modeled=0,legacyCandidate=0,current=0,future=0,outsidePrior=0,confSum=0,confN=0,partial=false;
    const sources=new Set();
    for(const f of features){
      const p=f.properties||{};
      if(isVerified(p))verified++;
      else if(isLidar(p))lidar++;
      else if(isLegacyCandidate(p))legacyCandidate++;
      else{
        modeled++;
        const c=elderCohort(p);
        if(c==='CURRENT_ELDER_CANDIDATE')current++;
        else if(c==='FUTURE_ELDER_CANDIDATE')future++;
        else if(c==='OUTSIDE_DENSITY_PRIOR')outsidePrior++;
      }
      const q=elderConfidence(p);
      if(q!=null){confSum+=q;confN++}
      if(p.elder_coverage_complete!==true)partial=true;
      const src=String(p.source_name||'').trim(),lic=String(p.source_license||'').trim();
      if(src)sources.add(src+(lic?' · '+lic:''));
    }
    const coverageKnown=coverage?.known===true;
    if(coverageKnown&&coverage?.complete!==true)partial=true;
    const candidates=lidar+legacyCandidate+modeled;
    const evidenceLabel=!coverageKnown
      ?'Coverage not yet processed for this area'
      :verified&&candidates
        ?verified+' verified · '+candidates+' candidate display points'
        :verified
          ?verified+' verified'
          :candidates
            ?candidates+' candidate display points'
            :'No Elder Tree display points fall inside this area in the current thinned map subset';
    return {
      total:features.length,verified,lidar,modeled,legacyCandidate,current,future,outsidePrior,candidates,
      meanConfidence:confN?Math.round(confSum/confN):null,
      partial,coverageKnown,coverageDatasetIds:coverage?.datasetIds||[],sources:[...sources],
      evidenceLabel
    };
  }
  function activeFeatures(){
    const b=bounds(),t=String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase();
    if(t==='property'){
      let boundary=[],center=null;
      try{
        const md=(typeof M!=='undefined'&&M)||window.M||null;
        boundary=Array.isArray(md?.analysisBoundaryLngLat)?md.analysisBoundaryLngLat.filter(p=>Array.isArray(p)&&p.length>=2):[];
        const loc=md?.loc||window.EARTHLINE_PROPERTY_TARGET_16201||null;
        const lng=Number(loc?.lng),lat=Number(loc?.lat);
        if(Number.isFinite(lng)&&Number.isFinite(lat))center=[lng,lat];
      }catch(_){}
      if(boundary.length>=3)return state.all.filter(f=>inPolygonLngLat(f?.geometry?.coordinates,boundary));
      if(center)return state.all.filter(f=>Array.isArray(f?.geometry?.coordinates)&&hav(center,f.geometry.coordinates)<=350);
    }
    return b?state.all.filter(f=>inBounds(f,b)):[];
  }
  /* M129: round brown trunk ring and green canopy, sourced points only.
     Marker geometry and colors affect presentation, never Elder evidence counts. */
  function elderPinImage(fill){
    const canvas=document.createElement('canvas');canvas.width=48;canvas.height=48;
    const ctx=canvas.getContext('2d');if(!ctx)return null;
    ctx.clearRect(0,0,48,48);
    ctx.beginPath();ctx.arc(24,24,20.5,0,Math.PI*2);
    ctx.fillStyle='#76502b';ctx.fill();
    ctx.lineWidth=2;ctx.strokeStyle='#d7bd83';ctx.stroke();
    ctx.beginPath();ctx.arc(24,24,15.5,0,Math.PI*2);
    ctx.fillStyle=fill;ctx.fill();
    for(const [x,y,r] of [[17,19,6],[28,17,7],[33,27,6],[23,31,7],[15,29,6]]){
      ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);
      ctx.fillStyle=fill;ctx.fill();
    }
    /* M139: distinguish the approved Elder tree canopy from a plain green disc.
       The small central brown trunk is visual-only; marker locations and evidence are unchanged. */
    ctx.beginPath();ctx.arc(24,24,3.4,0,Math.PI*2);
    ctx.fillStyle='#76502b';ctx.fill();
    ctx.beginPath();ctx.arc(22.8,22.8,1.2,0,Math.PI*2);
    ctx.fillStyle='rgba(210,245,185,.42)';ctx.fill();
    return ctx.getImageData(0,0,48,48);
  }
  function ensureElderPinImages(m){
    const pins=[
      ['earthline-elder-pin-verified','#174d2a'],
      ['earthline-elder-pin-lidar','#2f7d48'],
      ['earthline-elder-pin-modeled','#4f9b62']
    ];
    for(const [name,color] of pins){
      if(m.hasImage?.(name))continue;
      const img=elderPinImage(color);if(img)m.addImage(name,img,{pixelRatio:2});
    }
  }
  function publishMap(features){
    const m=map();if(!m||!m.getStyle?.())return false;
    const fc={type:'FeatureCollection',features};
    try{
      ensureElderPinImages(m);
      let src=m.getSource?.(SOURCE);
      if(src?.setData)src.setData(fc);
      else{
        m.addSource(SOURCE,{type:'geojson',data:fc});
        src=m.getSource?.(SOURCE);
      }
      if(!m.getLayer?.(LAYER)){
        m.addLayer({
          id:LAYER,type:'symbol',source:SOURCE,
          layout:{
            'icon-image':['case',
              ['any',['==',['get','record_class'],'VERIFIED_ELDER_TREE'],['==',['get','record_class'],'VERIFIED_EXTERNAL_TREE']],'earthline-elder-pin-verified',
              ['any',['==',['get','source_class'],'LIDAR'],['==',['get','record_class'],'LIDAR_CONFIRMED_ELDER_TREE_CANDIDATE']],'earthline-elder-pin-lidar',
              'earthline-elder-pin-modeled'
            ],
            /* M96: candidates must be legible on satellite imagery; labels never
               imply that an unverified modeled tree is known to be old. */
            'icon-size':['interpolate',['linear'],['zoom'],6,0.55,10,0.72,14,0.96,17,1.48,20,1.65],
            'icon-anchor':'center',
            'icon-allow-overlap':true,
            'icon-ignore-placement':true,
            /* Evidence is available in the interactive popup; repeated text
               labels obscured Property swales and are deliberately suppressed. */
            'text-field':'',
            'text-size':0,
            'text-allow-overlap':false,
            'text-ignore-placement':false,
            'visibility':'visible'
          },
          paint:{
            'text-color':'#f7fff6',
            'text-halo-color':'#12452d',
            'text-halo-width':2.2
          }
        });
        m.on('click',LAYER,e=>{
          const f=e?.features?.[0];if(!f)return;
          const p=f.properties||{},coords=f.geometry?.coordinates||[],verified=isVerified(p),conf=elderConfidence(p);
          const title=verified?'VERIFIED ELDER TREE':classify(p);
          const confidence=verified?'Verified external/field evidence':(conf==null?'Confidence not available':'Elder Tree Confidence '+conf+'%');
          const h=Number(p.height_m);
          const body='<div style="font:700 13px/1.25 system-ui,sans-serif;color:#17323d">'+esc(title)+'</div>'+
            '<div style="margin-top:5px;font:800 12px/1.2 system-ui,sans-serif;color:#2f6f46">'+esc(confidence)+'</div>'+
            (Number.isFinite(h)?'<div style="margin-top:4px;font:600 11px/1.35 system-ui,sans-serif">Canopy height: '+esc(h.toFixed(1))+' m</div>':'')+
            '<div style="margin-top:4px;font:500 10px/1.35 system-ui,sans-serif;color:#526159">'+esc(p.source_name||'Earthline Elder Tree evidence')+'</div>'+
            (!verified?'<div style="margin-top:6px;font:500 9.5px/1.35 system-ui,sans-serif;color:#6e766a">Elder Tree Confidence is the tree’s local structural-evidence percentile compared with other detected tree/canopy structures in the same analyzed source area; it is not a probability of age or ancient/veteran status.</div>':'');
          try{new mapboxgl.Popup({closeButton:true,closeOnClick:true,offset:8}).setLngLat(coords).setHTML(body).addTo(m)}catch(_){}
        });
      }
      try{
        if(m.getLayer?.(LAYER)){
          m.setLayoutProperty?.(LAYER,'visibility','visible');
          m.moveLayer?.(LAYER);
        }
        m.triggerRepaint?.();
      }catch(_){}
      return !!m.getLayer?.(LAYER);
    }catch(_){return false}
  }
  function gaugeLine(summary){
    const wrap=document.querySelector('.earthline-recharge-gauge-wrap-16488');if(!wrap)return false;
    let el=document.getElementById('earthlineElderTreesGauge17097');
    if(!el){el=document.createElement('div');el.id='earthlineElderTreesGauge17097';el.style.cssText='margin-top:3px;color:#2f5b3c;font:900 10.5px/1.25 "Noto Sans",system-ui,sans-serif;text-align:center;letter-spacing:.1px';wrap.appendChild(el)}
    el.textContent='Elder Trees: '+summary.evidenceLabel+(summary.coverageKnown&&summary.partial?' · current Earthline coverage':'');
    return true;
  }
  function propertyCard(summary){
    /* EARTHLINE 17149 — approved UI removal: no standalone Elder Property card above Bioswale Impact. */
    const el=document.getElementById('earthlineElderTreesProperty17126');
    if(el)el.remove();
    return false;
  }

  function dataBlock(summary){
    const content=document.getElementById('earthlineRechargeDataContent16488');if(!content)return false;
    let el=document.getElementById('earthlineElderTreesData17097');
    if(!el){
      el=document.createElement('div');el.id='earthlineElderTreesData17097';
      el.style.cssText='margin:0 0 16px;padding:10px 11px;border-left:2px solid #3d8152;background:rgba(61,129,82,.08);color:#344b3b;font:550 10px/1.45 "Noto Sans",Arial,sans-serif';
      const rain=content.querySelector('.earthline-data-rain16488');
      rain?.insertAdjacentElement('afterend',el);
    }
    el.innerHTML='<b style="color:#254d31">ELDER TREE EVIDENCE</b><br>'+esc(summary.evidenceLabel)+
      (summary.meanConfidence!=null?'<br>Mean candidate confidence: <b>'+esc(summary.meanConfidence)+'%</b>':'')+
      '<br><span style="color:#68756b">Displayed candidate counts are the approved thinned map subset; the high-recall structural pool remains the evidence-count owner. Elder Tree Confidence is a local structural-evidence percentile, not probability of age. Elder Trees have zero weight in Recharge Potential.</span>'+
      (summary.sources?.length?'<br><span style="color:#68756b">Source: '+summary.sources.map(esc).join(' · ')+'</span>':'')+
      (summary.coverageKnown&&summary.partial?'<br><span style="color:#7c6240">Counts reflect current Earthline Elder Tree coverage, not a complete natural-population census.</span>':'')+
      (!summary.coverageKnown?'<br><span style="color:#7c6240">No Elder Tree count is reported because this area has not yet been processed into the current Elder V2 evidence coverage.</span>':'');
    return true;
  }
  function reportBlock(summary){
    const panel=document.getElementById('earthlineVermontReportPanel16149');if(!panel?.classList?.contains('open'))return false;
    const page=panel.querySelector('.el49-page');if(!page)return false;
    let el=panel.querySelector('#earthlineElderTreesReport17097');
    if(!el){
      el=document.createElement('div');el.id='earthlineElderTreesReport17097';el.className='el49-callout';
      const meta=page.querySelector('.el49-cover-meta');
      if(meta)meta.insertAdjacentElement('afterend',el);else page.appendChild(el);
    }
    el.innerHTML='<b>Elder Tree evidence</b><br>'+esc(summary.evidenceLabel)+
      (summary.meanConfidence!=null?' · mean candidate confidence '+esc(summary.meanConfidence)+'%':'')+
      '<br><span style="font-size:10.5px">Displayed candidate counts are the approved thinned map subset; the high-recall structural pool remains the evidence-count owner. Elder Tree Confidence is a local structural-evidence percentile, not probability of age or ancient/veteran status.</span>'+
      (summary.sources?.length?'<br><span style="font-size:10.5px">Source: '+summary.sources.map(esc).join(' · ')+'</span>':'')+
      (summary.partial?'<br><span style="font-size:10.5px">Current Earthline coverage is partial; this is not a complete tree census.</span>':'');
    return true;
  }
  function pointSegM(p,a,b){
    const lat0=(p[1]+a[1]+b[1])/3*Math.PI/180,kx=111320*Math.cos(lat0),ky=110540;
    const px=p[0]*kx,py=p[1]*ky,ax=a[0]*kx,ay=a[1]*ky,bx=b[0]*kx,by=b[1]*ky,dx=bx-ax,dy=by-ay;
    const q=dx*dx+dy*dy?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy))):0;
    return Math.hypot(px-(ax+q*dx),py-(ay+q*dy))
  }
  function corridorNearby(feature){
    const coords=feature?.geometry?.type==='LineString'?feature.geometry.coordinates:[];
    if(coords.length<2)return [];
    return state.active.filter(tree=>{
      const p=tree?.geometry?.coordinates;if(!Array.isArray(p))return false;
      let d=Infinity;for(let i=1;i<coords.length;i++)d=Math.min(d,pointSegM(p,coords[i-1],coords[i]));
      return d<=100;
    });
  }
  function corridorBlock(feature){
    const panel=document.getElementById('earthlineCorridorDetail16149');if(!panel?.classList?.contains('open'))return false;
    const body=panel.querySelector('.el49-detail-body')||panel;if(!body)return false;
    let el=panel.querySelector('#earthlineElderTreesCorridor17097');
    if(!el){
      el=document.createElement('div');el.id='earthlineElderTreesCorridor17097';el.className='el49-detail-note';
      const actions=body.querySelector('.el49-detail-actions');
      if(actions)body.insertBefore(el,actions);else body.appendChild(el);
    }
    const nearby=feature?corridorNearby(feature):[],summary=summarize(nearby);
    const confs=nearby.map(f=>elderConfidence(f.properties||{})).filter(v=>v!=null),high=confs.length?Math.max(...confs):null;
    el.innerHTML='<b>Elder Tree display points within 100 m of this corridor.</b> '+esc(summary.evidenceLabel)+
      (high!=null?' · highest Elder Tree Confidence '+esc(high)+'%':'')+
      (summary.partial?' · current Earthline coverage':'')+'.';
    return true;
  }
  function howParagraph(){
    const page=document.getElementById('earthlineSwalesPage16125'),frame=page?.querySelector('iframe');if(!frame)return false;
    const apply=()=>{
      let doc=null;try{doc=frame.contentDocument}catch(_){}
      if(!doc||doc.getElementById('earthlineElderTreesHow17097'))return !!doc;
      const main=doc.querySelector('main');if(!main)return false;
      const el=doc.createElement('section');el.id='earthlineElderTreesHow17097';
      el.innerHTML='<h2>Elder Trees and water</h2><p><b>Water and forest structure are linked.</b> Bioswales slow, spread and sink runoff, helping soil retain moisture that supports roots, soil organisms and the long-lived trees that can become important structural anchors in forests. Earthline maps Verified Elder Trees where authoritative records exist and flags Elder Tree Candidates where remote-sensing evidence is strong. Elder Tree Confidence describes the tree’s relative structural rank in the local analyzed area; it is not proof of age or mycorrhizal-hub status.</p>';
      const first=main.querySelector('section');if(first)first.insertAdjacentElement('afterend',el);else main.prepend(el);
      return true;
    };
    if(apply())return true;
    frame.addEventListener('load',apply,{once:true});
    return false;
  }
  function refreshSurfaces(){
    const s=state.lastSummary||summarize(state.active);
    gaugeLine(s);propertyCard(s);dataBlock(s);reportBlock(s);
  }
  function dynamicKey(b){return Array.isArray(b)?b.map(v=>Number(v).toFixed(6)).join(','):''}
  function dynamicWorker(){
    if(state.dynamic.worker)return state.dynamic.worker;
    const w=new Worker('earthline-elder-worker-17129.js',{type:'module'});
    w.onmessage=e=>{
      const id=e.data?.id,p=state.dynamic.pending.get(id);
      if(!p)return;
      state.dynamic.pending.delete(id);
      if(e.data?.warm===true)state.dynamic.warmed=e.data?.ok===true;
      if(e.data?.ok)p.resolve(e.data?.warm===true?e.data:e.data.result);else p.reject(new Error(String(e.data?.error||'Elder worker failed')));
    };
    w.onerror=e=>{
      const err=new Error(String(e?.message||'Elder worker error'));
      for(const p of state.dynamic.pending.values())p.reject(err);
      state.dynamic.pending.clear();
      try{w.terminate()}catch(_){}
      state.dynamic.worker=null;
    };
    state.dynamic.worker=w;
    return w;
  }
  function prewarmDynamicWorker(){
    if(state.dynamic.warmed)return Promise.resolve(true);
    if(state.dynamic.warmPromise)return state.dynamic.warmPromise;
    const id='elder-warm-'+(++state.dynamic.seq);
    state.dynamic.warmPromise=new Promise((resolve,reject)=>state.dynamic.pending.set(id,{resolve,reject}))
      .then(()=>{state.dynamic.warmed=true;return true})
      .catch(err=>{state.dynamic.error=String(err&&err.message||err);return false})
      .finally(()=>{state.dynamic.warmPromise=null});
    dynamicWorker().postMessage({id,warm:true});
    return state.dynamic.warmPromise;
  }
  function propertyBounds17166(){
    try{
      const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
      const hasTarget=target&&target.lng!==null&&target.lng!==undefined&&target.lng!==''&&target.lat!==null&&target.lat!==undefined&&target.lat!=='';
      const lng=hasTarget?Number(target.lng):NaN,lat=hasTarget?Number(target.lat):NaN;
      if(Number.isFinite(lng)&&Number.isFinite(lat)&&Math.abs(lng)<=180&&Math.abs(lat)<=90){
        const areaM2=20*4046.8564224,wM=Math.sqrt(areaM2*1.15),hM=areaM2/wM;
        const dLat=hM/(2*111320),dLng=wM/(2*111320*Math.max(.05,Math.cos(lat*Math.PI/180)));
        return [lng-dLng,lat-dLat,lng+dLng,lat+dLat];
      }
      const md=(typeof M!=='undefined'&&M)||window.M||null;
      const poly=Array.isArray(md?.analysisBoundaryLngLat)?md.analysisBoundaryLngLat.filter(p=>Array.isArray(p)&&p.length>=2):[];
      if(poly.length>=3){
        let west=Infinity,south=Infinity,east=-Infinity,north=-Infinity;
        for(const p of poly){
          const x=Number(p[0]),y=Number(p[1]);if(!Number.isFinite(x)||!Number.isFinite(y))continue;
          west=Math.min(west,x);east=Math.max(east,x);south=Math.min(south,y);north=Math.max(north,y);
        }
        if([west,south,east,north].every(Number.isFinite))return [west,south,east,north];
      }
    }catch(_){}
    return null;
  }
  function propertyRunIdentity17166(b){
    const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const d=window.EARTHLINE_PROPERTY_DECLARATION_16169||null;
    const rawLng=t?.lng??d?.center?.lng,rawLat=t?.lat??d?.center?.lat;
    const lng=rawLng===null||rawLng===undefined||rawLng===''?NaN:Number(rawLng);
    const lat=rawLat===null||rawLat===undefined||rawLat===''?NaN:Number(rawLat);
    return [
      Number.isFinite(lng)?lng.toFixed(6):'',
      Number.isFinite(lat)?lat.toFixed(6):'',
      dynamicKey(b)
    ].join('|');
  }
  async function dynamicPropertyEvidence(forceProperty=false){
    const tier=String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase();
    const isProperty=tier==='property';
    if(!forceProperty&&!isProperty)return null;
    const b=(forceProperty||isProperty)?propertyBounds17166():coverageQueryBounds();
    const key=propertyRunIdentity17166(b);
    if(!b||!key)return null;
    if(state.dynamic.key===key&&state.dynamic.result)return state.dynamic.result;
    if(state.dynamic.key===key&&state.dynamic.promise)return state.dynamic.promise;
    const id='elder-'+(++state.dynamic.seq),requestKey=key;
    state.dynamic.key=requestKey;state.dynamic.result=null;state.dynamic.error=null;
    const promise=new Promise((resolve,reject)=>state.dynamic.pending.set(id,{resolve,reject}))
      .then(result=>{
        if(state.dynamic.key!==requestKey)return null;
        const features=(result?.features||[]).map(f=>({
          type:'Feature',geometry:f.geometry,
          properties:Object.assign({},f.properties||{},{
            elder_dataset_id:'dynamic-property-17130',
            elder_dataset_label:'On-demand Elder V2',
            elder_coverage_complete:false
          })
        }));
        const normalized=Object.assign({},result,{features});
        state.dynamic.result=normalized;state.dynamic.error=null;
        return normalized;
      })
      .catch(err=>{
        if(state.dynamic.key===requestKey)state.dynamic.error=String(err&&err.message||err);
        return null;
      })
      .finally(()=>{if(state.dynamic.promise===promise)state.dynamic.promise=null});
    state.dynamic.promise=promise;
    dynamicWorker().postMessage({id,bbox:b,options:{displayPerTile:24,maxPerTile:240}});
    return promise;
  }
  async function prefetchProperty17174(){
    try{
      const b=propertyBounds17166(),key=dynamicKey(b);
      if(!b||!key)return null;
      if(state.dynamic.tileWarmKey===key&&state.dynamic.tileWarmPromise)return state.dynamic.tileWarmPromise;
      const id='elder-tile-warm-'+(++state.dynamic.seq);
      state.dynamic.tileWarmKey=key;
      const promise=new Promise((resolve,reject)=>state.dynamic.pending.set(id,{resolve,reject}))
        .catch(()=>null)
        .finally(()=>{if(state.dynamic.tileWarmPromise===promise)state.dynamic.tileWarmPromise=null});
      state.dynamic.tileWarmPromise=promise;
      dynamicWorker().postMessage({id,warmBbox:true,bbox:b});
      return await promise;
    }catch(_){return null}
  } /* EARTHLINE_ELDER_IO_ONLY_PREFETCH_17211 */
  let regionalRefreshEpochM94=0;
  let deferredMapRetryM94=null;
  function elderTierM94(){return String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase()}
  function deferMapRetryM94(identity){
    const m=map();
    if(!m||typeof m.once!=='function')return false;
    const key=identity||'regional';
    if(deferredMapRetryM94?.map===m&&deferredMapRetryM94.key===key)return true;
    const retry={map:m,key};deferredMapRetryM94=retry;
    m.once('style.load',()=>{
      if(deferredMapRetryM94!==retry)return;
      deferredMapRetryM94=null;
      if(identity){
        if(elderTierM94()==='property'&&propertyRunIdentity17166(propertyBounds17166())===identity)void startProperty17166();
      }else if(elderTierM94()!=='property')void refresh();
    });
    return true;
  }
  async function startProperty17166(){
    ++regionalRefreshEpochM94; /* Invalidate any older asynchronous Regional refresh. */
    let runIdentity='';
    try{
      await load();
      const b=propertyBounds17166();runIdentity=propertyRunIdentity17166(b);
      if(!b||!runIdentity)return null;
      const pending17389=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      if(!(pending17389?.state==='property-pending'&&pending17389?.propertyRunIdentity===runIdentity&&pending17389?.visibleAt)){
        publishPropertyProvisional17389(b,runIdentity);
      }
      const dynamic=await dynamicPropertyEvidence(true); /* EARTHLINE_ELDER_GOVERNED_COMPUTE_17211 */
      if(!dynamic||elderTierM94()!=='property'||propertyRunIdentity17166(propertyBounds17166())!==runIdentity)return null;
      state.active=dynamic.features||[];
      const coverage={known:true,datasetIds:['dynamic-property-17130'],complete:false,dynamic:true,candidatePoolCount:Number(dynamic?.earthline?.candidate_pool_count||0)};
      state.lastSummary=summarize(state.active,coverage);
      const mapPublished=publishMap(state.active);
      if(!mapPublished){
        deferMapRetryM94(runIdentity);
        window.EARTHLINE_ELDER_TREE_LAST_17097={state:'publication-pending',propertyRunIdentity:runIdentity,featureCount:state.active.length,mapPublished:false,at:new Date().toISOString()};
        return null;
      }
      refreshSurfaces();
      window.EARTHLINE_ELDER_TREE_LAST_17097={
        state:'committed',mapPublished:true,propertyRunIdentity:runIdentity,
        summary:state.lastSummary,featureCount:state.active.length,
        dynamicCandidatePoolCount:Number(dynamic?.earthline?.candidate_pool_count||0),
        dynamicError:null,workerTimings:dynamic?.earthline?.worker_timings_ms||null,at:new Date().toISOString()
      };
      return state.lastSummary;
    }catch(err){
      if(elderTierM94()!=='property'||(runIdentity&&propertyRunIdentity17166(propertyBounds17166())!==runIdentity))return null;
      window.EARTHLINE_ELDER_TREE_LAST_17097={state:'failed',error:String(err&&err.message||err),featureCount:0,at:new Date().toISOString()};
      return null;
    }
  }
  async function refresh(){
    if(elderTierM94()==='property')return startProperty17166();
    const epoch=++regionalRefreshEpochM94;
    try{
      const pending17166=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      if(pending17166?.state==='property-pending'&&state.dynamic.promise)return pending17166.summary||null;
      await load();
      if(epoch!==regionalRefreshEpochM94||elderTierM94()==='property')return null;
      const pendingAfterLoad17166=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      if(pendingAfterLoad17166?.state==='property-pending'&&state.dynamic.promise)return pendingAfterLoad17166.summary||null;
      let coverage=activeCoverage(); /* EARTHLINE_ELDER_PROPERTY_PENDING_REFRESH_GUARD_17203 */
      const dynamic=await dynamicPropertyEvidence(false);
      if(epoch!==regionalRefreshEpochM94||elderTierM94()==='property')return null;
      if(dynamic){
        state.active=dynamic.features||[];
        coverage={known:true,datasetIds:['dynamic-property-17130'],complete:false,dynamic:true,candidatePoolCount:Number(dynamic?.earthline?.candidate_pool_count||0)};
      }else state.active=activeFeatures();
      state.lastSummary=summarize(state.active,coverage);
      const mapPublished=publishMap(state.active);
      if(!mapPublished){
        deferMapRetryM94('');
        window.EARTHLINE_ELDER_TREE_LAST_17097={state:'publication-pending',propertyRunIdentity:'',featureCount:state.active.length,mapPublished:false,at:new Date().toISOString()};
        return null;
      }
      refreshSurfaces();
      window.EARTHLINE_ELDER_TREE_LAST_17097={
        state:'committed',mapPublished:true,propertyRunIdentity:'',
        summary:state.lastSummary,featureCount:state.active.length,
        dynamicCandidatePoolCount:Number(dynamic?.earthline?.candidate_pool_count||0),
        dynamicError:state.dynamic.error||null,workerTimings:dynamic?.earthline?.worker_timings_ms||null,at:new Date().toISOString()
      };
      return state.lastSummary;
    }catch(err){
      if(epoch!==regionalRefreshEpochM94||elderTierM94()==='property')return null;
      window.EARTHLINE_ELDER_TREE_LAST_17097={state:'failed',error:String(err&&err.message||err),at:new Date().toISOString()};
      return null;
    }
  }
  function wrapCorridor(){
    const prior=window.earthlineOpenCorridorDetail16149;
    if(typeof prior!=='function'||prior.__earthlineElder17097)return false;
    const wrapped=function(f,index){
      const out=prior.apply(this,arguments);
      corridorBlock(f);
      try{void prefetchProperty17174()}catch(_){} /* EARTHLINE_ELDER_CORRIDOR_PREFETCH_17195 */
      return out;
    };
    wrapped.__earthlineElder17097=true;wrapped.__earthlineElder17097Original=prior;
    window.earthlineOpenCorridorDetail16149=wrapped;
    return true;
  }
  function click(e){
    const t=e.target?.closest?.('button,a,[role="button"],#earthlineRailData16488,#earthlineVermontReport16149');
    if(!t)return;
    if(t.id==='earthlineRailData16488')dataBlock(state.lastSummary||summarize(state.active));
    if(t.id==='earthlineVermontReport16149')reportBlock(state.lastSummary||summarize(state.active));
    const label=String(t.getAttribute?.('aria-label')||t.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    /* EARTHLINE 17133 — Elder is downstream of Property publication; Zoom no longer invokes Elder refresh. */
  }
  function hash(){if(location.hash==='#swales-explained')howParagraph()}
  let propertyPrimeTimer17212=0,propertyPrimeToken17212=0;
  function publishPropertyProvisional17389(b,identity){
    if(!state.loaded||!Array.isArray(state.all))return false;
    const datasets=(state.manifest?.datasets||[]).filter(d=>datasetCoversBounds(d,b));
    const coverage={known:datasets.length>0,datasetIds:datasets.map(d=>d.id||d.path||''),complete:false};
    const features=state.all.filter(f=>inBounds(f,b));
    state.active=features;state.lastSummary=summarize(features,coverage);
    const mapPublished=publishMap(features);
    if(!mapPublished)deferMapRetryM94(identity);
    refreshSurfaces();
    const visibleAt=mapPublished?new Date().toISOString():null;
    window.EARTHLINE_ELDER_TREE_LAST_17097={
      state:'property-pending',propertyRunIdentity:identity,
      summary:state.lastSummary,featureCount:features.length,
      dynamicCandidatePoolCount:0,dynamicError:null,
      provisional:true,mapPublished,visibleAt,at:new Date().toISOString()
    };
    return true;
  }
  function beginPropertyElderState17216(){
    const b=propertyBounds17166(),identity=propertyRunIdentity17166(b);
    if(!b||!identity)return null;
    if(!publishPropertyProvisional17389(b,identity)){
      state.active=[];state.lastSummary=null;publishMap([]);
      const gauge=document.getElementById('earthlineElderTreesGauge17097');
      if(gauge)gauge.textContent='Elder Trees: analyzing Property canopy…';
      window.EARTHLINE_ELDER_TREE_LAST_17097={
        state:'property-pending',propertyRunIdentity:identity,
        summary:null,featureCount:0,dynamicCandidatePoolCount:0,dynamicError:null,
        at:new Date().toISOString()
      };
    }
    return {b,identity};
  } /* EARTHLINE_ELDER_IMMEDIATE_VISIBLE_17389 */
  function schedulePropertyPrime17212(){
    const started=beginPropertyElderState17216();
    if(!started)return false;
    const {identity}=started,token=++propertyPrimeToken17212;
    clearTimeout(propertyPrimeTimer17212);
    propertyPrimeTimer17212=setTimeout(()=>{
      if(token!==propertyPrimeToken17212)return;
      const nowB=propertyBounds17166();
      if(propertyRunIdentity17166(nowB)!==identity)return;
      void startProperty17166();
    },0);
    return true;
  } /* EARTHLINE_ELDER_IMMEDIATE_PROPERTY_START_17386 */
  function install(){
    wrapCorridor();
    document.addEventListener('pointerdown',e=>{
      const b=e.target?.closest?.('#earthlineDeclareProperty16169');
      if(!b||b.disabled)return;
      schedulePropertyPrime17212();
    },true);
    document.addEventListener('click',click,false);
    window.addEventListener('hashchange',hash,false);
    document.addEventListener('earthline:analysis-complete',()=>{wrapCorridor();const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;const tier=String(d?.tier||d?.mode||document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase();if(tier==='property')void startProperty17166();else void refresh();},{passive:true});
    prewarmDynamicWorker();
    load().then(()=>{if(window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970)refresh()}).catch(()=>{});
    if(location.hash==='#swales-explained')howParagraph();
    window.EARTHLINE_ELDER_TREES_V1_17097={
      state:'approved-v2-17118',manifest:MANIFEST,source:SOURCE,layer:LAYER,scienceBaseline:'17118',
      refresh,startProperty:startProperty17166,prefetchPropertyTarget:prefetchProperty17174,summary:()=>state.lastSummary||summarize(state.active),
      features:()=>state.active.slice(),
      confidenceRule:'Elder Tree Confidence = local structural-evidence percentile within the analyzed source area; not age probability',
      rechargeWeight:0
    };
    window.EARTHLINE_ELDER_TREES_V2_17118=window.EARTHLINE_ELDER_TREES_V1_17097;
    window.earthlineElderTreeUiAudit17126=()=>({
      build:'17126',scienceBaseline:'17118',
      propertyBoundaryOwner:'M.analysisBoundaryLngLat with 350 m fallback only when boundary unavailable',
      coverageQueryOwner:'Property boundary/center bounds for false-zero protection; map bounds for non-Property',
      countOwner:'17118 high-recall structural pool; displayed points are a thinned map subset',
      propertyCardVisible:!!document.getElementById('earthlineElderTreesProperty17126')&&!document.getElementById('earthlineElderTreesProperty17126').hidden,
      summary:state.lastSummary||summarize(state.active),
      at:new Date().toISOString()
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
