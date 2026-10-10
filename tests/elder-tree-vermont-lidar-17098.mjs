import fs from 'node:fs';

const fc=JSON.parse(fs.readFileSync('data/elder-trees/v1/vermont.geojson','utf8'));
const expected=new Map([
  ['-73.21961224079132,44.46938896465844',99],
  ['-73.21147978305817,44.47416634005954',100],
  ['-73.21075022220612,44.504345103542484',100],
  ['-73.20929110050201,44.49986098987354',100],
  ['-73.2092696428299,44.45487835220653',100],
  ['-73.20924818515778,44.50332740834088',100],
  ['-73.2090014219284,44.459304662697704',100],
  ['-73.20689857006074,44.495789789361815',99],
  ['-73.2047528028488,44.50295246352503',99],
  ['-73.19840133190155,44.48989675885477',99],
  ['-73.19113790988922,44.492935187907264',99],
  ['-73.1861811876297,44.49615712739033',99]
]);

if((fc.features||[]).length!==12) throw new Error('Expected 12 Vermont features');
for(const [i,f] of fc.features.entries()){
  const p=f.properties||{};
  const k=(f.geometry?.coordinates||[]).map(Number).join(',');
  if(!expected.has(k)) throw new Error('Unexpected/moved GPS point '+k);
  if(Number(p.elder_tree_confidence_pct)!==expected.get(k)) throw new Error('17097 confidence changed at '+k);
  if(p.method_version!=='earthline-elder-tree-aoi-chmv2-v0.3-local-relative') throw new Error('17097 candidate method changed at '+k);
  if(p.record_class!=='LIDAR_CONFIRMED_ELDER_TREE_CANDIDATE') throw new Error('Not LiDAR-confirmed at '+k);
  if(p.lidar_source_ql!=='QL 1') throw new Error('Not QL1 at '+k);
  if(!String(p.lidar_source_workunit||'').startsWith('VT_Statewide_')) throw new Error('Missing exact statewide workunit at '+k);
  if(!(Number(p.lidar_point_count_within_8m)>0)) throw new Error('No direct 8m returns at '+k);
  if(!(Number(p.lidar_canopy_evidence_points_within_8m)>0)) throw new Error('No direct 8m canopy evidence at '+k);
  if(!(Number(p.height_m)>=2)) throw new Error('Invalid measured height at '+k);
  if(!(Number(p.modeled_height_m)>=2)) throw new Error('Missing preserved modeled height at '+k);
  if(p.height_source!=='USGS 3DEP 2023 QL1 measured local canopy') throw new Error('Measured-height provenance missing at '+k);
}
console.log(JSON.stringify({
  status:'PASS',
  geometry_identity:'12/12 exact 17097 GPS points',
  confidence_identity:'12/12 exact 17097 confidence values',
  candidate_method_identity:'v0.3 retained',
  lidar_class:'12/12',
  lidar_quality:'QL 1',
  measured_height_range_m:[
    Math.min(...fc.features.map(f=>Number(f.properties.height_m))),
    Math.max(...fc.features.map(f=>Number(f.properties.height_m)))
  ]
},null,2));
