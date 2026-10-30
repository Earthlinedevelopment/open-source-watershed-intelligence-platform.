export function applyWormSuppression17434(html){
  let s=String(html);
  const active="function activeTier16168(){const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||null;return String(d&&((d.tier||d.mode))||'regional').toLowerCase();}";
  const fn=active+"\n  function corridorGeometryVisible17434(map){const tier=activeTier16168();if(tier==='focus')return true;if(tier==='property')return false;const published=window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337||null;const publishedZoom=Number(published&&published.zoom),currentZoom=Number(map?.getZoom?.());if(!Number.isFinite(currentZoom)||!Number.isFinite(publishedZoom))return false;return currentZoom>=publishedZoom+0.85;}";
  if(!s.includes('function corridorGeometryVisible17434(')){
    if(!s.includes(active))throw new Error('active tier owner missing');
    s=s.replace(active,fn);
  }
  const oldRender="function render(data){lastData=data||lastData;if(!lastData)return false;const map=m(),el=overlay();if(!map||!el)return false;const resizeRunToken16020=";
  const newRender="function render(data){lastData=data||lastData;if(!lastData)return false;const map=m(),el=overlay();if(!map||!el)return false;const corridorGeometryVisible17434Now=corridorGeometryVisible17434(map);const resizeRunToken16020=";
  if(s.includes(oldRender))s=s.replace(oldRender,newRender);
  else if(!s.includes("corridorGeometryVisible17434Now=corridorGeometryVisible17434(map)"))throw new Error('render owner missing');
  const oldElse="      }else{\n        const casing=grade==='A'?15:grade==='B'?12:9,core=grade==='A'?9.2:grade==='B'?7.2:5.2;";
  const newElse="      }else if(corridorGeometryVisible17434Now){\n        const regionalZoom=Number(map?.getZoom?.()||6),regionalScale=regionalZoom<7?0.46:(regionalZoom<8?0.62:(regionalZoom<9?0.78:1)),casing=(grade==='A'?15:grade==='B'?12:9)*regionalScale,core=(grade==='A'?9.2:grade==='B'?7.2:5.2)*regionalScale;";
  if(s.includes(oldElse))s=s.replace(oldElse,newElse);
  else if(!s.includes("else if(corridorGeometryVisible17434Now)"))throw new Error('regional corridor branch missing');
  return s;
}
