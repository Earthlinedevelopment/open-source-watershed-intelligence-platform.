/* EARTHLINE 16602 — REGIONAL CAMERA PRESENTATION-SCALE GATE
   Repair only: strengthen the existing exported Regional camera-ready gate.
   No science, corridor geometry, renderer, listener, timer, polling, or UI owner added.
*/
(function(){
  'use strict';
  var prior=window.earthlineRegionalCameraReady16336;
  if(typeof prior!=='function'){
    window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602={installed:false,reason:'camera-ready-gate-unavailable'};
    return;
  }
  if(prior.__earthline16602)return;

  function validBBox(b){
    return Array.isArray(b)&&b.length===4&&b.every(Number.isFinite)&&b[2]>b[0]&&b[3]>b[1];
  }
  function scaleAudit(b,m){
    try{
      if(!validBBox(b)||!m||typeof m.project!=='function')return null;
      var c=m.getContainer&&m.getContainer();
      var cw=Number(c&&c.clientWidth)||0,ch=Number(c&&c.clientHeight)||0;
      if(!(cw>0&&ch>0))return null;
      var sw=m.project([b[0],b[1]]),ne=m.project([b[2],b[3]]);
      var pxW=Math.abs(Number(ne.x)-Number(sw.x));
      var pxH=Math.abs(Number(sw.y)-Number(ne.y));
      return {pxW:pxW,pxH:pxH,containerW:cw,containerH:ch,widthFraction:pxW/cw,heightFraction:pxH/ch,zoom:Number(m.getZoom&&m.getZoom())};
    }catch(_){return null;}
  }
  function presentationScale(a){
    return !!(a&&Number.isFinite(a.widthFraction)&&Number.isFinite(a.heightFraction)&&a.widthFraction>=0.18&&a.heightFraction>=0.22);
  }
  function pause(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}

  async function cameraReady16602(b,m,timeoutMs){
    var before=scaleAudit(b,m),forcedFit=false,fitError=null;
    if(validBBox(b)&&m&&!presentationScale(before)){
      try{
        if(m.stop)m.stop();
        if(m.setProjection)m.setProjection('mercator');
        if(typeof m.fitBounds==='function'){
          m.fitBounds([[b[0],b[1]],[b[2],b[3]]],{
            padding:{top:70,bottom:145,left:80,right:80},
            maxZoom:9,
            duration:0,
            linear:true
          });
          forcedFit=true;
          await pause(90);
        }
      }catch(e){fitError=String(e&&e.message||e);}
    }
    var delegated=false;
    try{delegated=!!(await prior.call(this,b,m,timeoutMs));}catch(_){delegated=false;}
    var after=scaleAudit(b,m);
    var scaleReady=presentationScale(after);
    var ready=delegated&&scaleReady;
    window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602={installed:true,forcedFit:forcedFit,fitError:fitError,before:before,after:after,delegated:delegated,scaleReady:scaleReady,ready:ready};
    return ready;
  }
  cameraReady16602.__earthline16602=true;
  cameraReady16602.__earthlinePrior=prior;
  window.earthlineRegionalCameraReady16336=cameraReady16602;
  window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602={installed:true,armed:true};
})();
