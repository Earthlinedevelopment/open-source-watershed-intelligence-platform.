/* EARTHLINE 16602 — REGIONAL CAMERA OWNER AUDIT
   16584 already owns Regional camera framing through earthlineSetMapView().
   This sidecar intentionally adds no camera behavior, listener, timer, renderer, or science owner.
*/
(function(){
  'use strict';
  var owner=(typeof window.earthlineSetMapView==='function')?'earthlineSetMapView':'parent-camera-owner-not-exported';
  window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602={
    installed:true,
    auditOnly:true,
    owner:owner,
    behaviorAdded:false,
    reason:'16584 parent already fits Regional bbox before analysis; preserve single authoritative camera owner'
  };
})();
