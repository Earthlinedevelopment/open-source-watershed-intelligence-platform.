import fs from 'node:fs';
const s=fs.readFileSync('index.html','utf8');
const needles=[
 'regionalRecharge16492',
 'earthlineRenderRegionalOverlay16020',
 'function earthlineClipRegionalProducts16539',
 'function earthlineClipFeatureCollection16539',
 'function earthlineMappedWaterSwaleGate16609',
 'EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609',
 'EARTHLINE-LAB-16601-SHARED-VECTOR-WATER',
 'EARTHLINE_REGIONAL_SWALE_WATER_AUDIT_16601',
 'sharedRegionalSwales16601',
 'earthlineRegionalSegmentValid16584',
 'function makeSwales',
 'waterPolygonParts',
 'rawWaterFeatures',
 'queryRenderedFeatures',
 'querySourceFeatures',
 'jurisdictionCapability16539',
 'el-live-basin-15970',
 'el-live-aquifer-15970',
 'earthlineSyncAquiferLayer',
 'watershed',
 'recharge'
];
for(const n of needles){
 let from=0,k=0;
 while(true){const i=s.indexOf(n,from); if(i<0)break; k++; const a=Math.max(0,i-7000),b=Math.min(s.length,i+14000); console.log(`\n### ${n} #${k} @${i}\n${s.slice(a,b)}\n### END ${n} #${k}`); from=i+n.length; if(k>=12)break;}
 if(!k)console.log(`\n### ${n}: NOT FOUND`);
}
