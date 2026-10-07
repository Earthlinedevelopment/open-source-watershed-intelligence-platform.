import fs from 'node:fs';

const path='index.html';
let s=fs.readFileSync(path,'utf8');

const oldBlock=`        let safeOk=count===0;
        try{const safe=syncSafePropertyFallback16221('bounded-postpublish-16521-'+delay);safeOk=count===0||!!(safe&&safe.ok);last=Object.assign({},last||{},{safe})}catch(_){ }
        try{if(typeof window.earthlineSchedulePropertyWater15823==='function')window.earthlineSchedulePropertyWater15823('bounded-postpublish-16521-'+delay)}catch(_){ }
        try{if(typeof window.earthlineRenderDirectWater15824==='function')window.earthlineRenderDirectWater15824(true)}catch(_){ }
        try{if(typeof window.earthlineSyncAquiferLayer==='function')window.earthlineSyncAquiferLayer()}catch(_){ }
        try{if(typeof window.earthlineApplyRendererOwnership15805==='function')window.earthlineApplyRendererOwnership15805('property')}catch(_){ }
        try{if(typeof window.earthlineQueueAnalysisBoundary15827==='function')window.earthlineQueueAnalysisBoundary15827()}catch(_){ }`;

const newBlock=`        let safeOk=count===0,textureOk=count===0;
        try{const safe=syncSafePropertyFallback16221('bounded-postpublish-16521-'+delay);safeOk=count===0||!!(safe&&safe.ok);last=Object.assign({},last||{},{safe})}catch(_){ }
        try{
          const syncTexture=window.earthlineSyncPropertyTexture16169;
          if(count>0&&typeof syncTexture==='function'){
            textureOk=(await Promise.resolve(syncTexture('bounded-postpublish-16521-'+delay+'-force')))===true;
            const textureAudit=typeof window.earthlinePropertyTextureAudit16169==='function'?window.earthlinePropertyTextureAudit16169():null;
            const textureState=textureAudit?.texture||window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||null;
            last=Object.assign({},last||{},{texture:{ok:textureOk,sourceFeatures:Number(textureAudit?.sourceFeatures??textureState?.features??0),audit:textureAudit||textureState||null}});
          }
        }catch(error){
          last=Object.assign({},last||{},{texture:{ok:false,error:String(error&&error.message||error)}});
        }
        try{if(typeof window.earthlineSchedulePropertyWater15823==='function')window.earthlineSchedulePropertyWater15823('bounded-postpublish-16521-'+delay)}catch(_){ }
        try{if(typeof window.earthlineRenderDirectWater15824==='function')window.earthlineRenderDirectWater15824(true)}catch(_){ }
        try{if(typeof window.earthlineSyncAquiferLayer==='function')window.earthlineSyncAquiferLayer()}catch(_){ }
        try{if(typeof window.earthlineApplyRendererOwnership15805==='function')window.earthlineApplyRendererOwnership15805('property')}catch(_){ }
        try{if(typeof window.earthlineQueueAnalysisBoundary15827==='function')window.earthlineQueueAnalysisBoundary15827()}catch(_){ }`;

const oldSuccess=`        if(safeOk&&waterOk&&boundaryOk){window.EARTHLINE_PROPERTY_PRESENTATION_SETTLE_AUDIT_16521={build:'EARTHLINE 16521',ok:true,searchGen:Number(searchGen),corridors:Number(count||0),delay,last,at:new Date().toISOString()};return}`;

const newSuccess=`        if(safeOk&&waterOk&&boundaryOk&&textureOk){window.EARTHLINE_PROPERTY_PRESENTATION_SETTLE_AUDIT_16521={build:'EARTHLINE 16521',ok:true,searchGen:Number(searchGen),corridors:Number(count||0),delay,last,textureOk:true,at:new Date().toISOString()};return}`;

function occurrences(haystack,needle){return haystack.split(needle).length-1}
if(occurrences(s,oldBlock)!==1)throw new Error('expected exactly one Property settle body');
if(occurrences(s,oldSuccess)!==1)throw new Error('expected exactly one Property settle success gate');

s=s.replace(oldBlock,newBlock).replace(oldSuccess,newSuccess);

if(!s.includes("syncTexture('bounded-postpublish-16521-'+delay+'-force')"))throw new Error('texture retry missing');
if(!s.includes('safeOk&&waterOk&&boundaryOk&&textureOk'))throw new Error('texture settle gate missing');
if(s.includes('restrainDenseTexture'))throw new Error('dense rendering override must remain absent');

fs.writeFileSync(path,s);
console.log(JSON.stringify({ok:true,bytes:s.length,repair:'post-publication natural texture retry only'}));
