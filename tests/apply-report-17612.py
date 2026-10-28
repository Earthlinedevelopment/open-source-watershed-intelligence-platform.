from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_visual="function visual(){return window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null}"
new_visual="""function visual(){
    const d=snapshot()||{},tier=String(d.tier||d.mode||d.extentClass||'').toLowerCase();
    if(tier.includes('property')||tier.includes('parcel')||tier.includes('site')){
      const m=(typeof M!=='undefined'?M:null)||{},empty={type:'FeatureCollection',features:[]};
      let contourFC=empty;
      try{if(typeof earthlineContoursGeoJSON==='function'){const q=earthlineContoursGeoJSON();if(q&&Array.isArray(q.features))contourFC=q}}catch(_){}
      const regional=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||{};
      return {
        bounds:Array.isArray(d.bounds)?d.bounds:(m.authoritativePropertyFrame15821&&m.authoritativePropertyFrame15821.bounds)||regional.bounds||null,
        swales:(m.authoritativeSafeSwales15815&&Array.isArray(m.authoritativeSafeSwales15815.features))?m.authoritativeSafeSwales15815:empty,
        flows:(m.authoritativeWaterPaths15824&&Array.isArray(m.authoritativeWaterPaths15824.features))?m.authoritativeWaterPaths15824:empty,
        contours:contourFC,
        aquifers:regional.aquifers||empty,
        propertyAuthoritative:true
      };
    }
    return window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null
  }"""
if s.count(old_visual)!=1:
    raise SystemExit(f"report visual owner count {s.count(old_visual)}")
s=s.replace(old_visual,new_visual,1)

marker="function buildReport(data){"
if s.count(marker)!=1:
    raise SystemExit(f"report build owner count {s.count(marker)}")

helper="""function buildPropertyReport17612(data){
    const m=(typeof M!=='undefined'?M:null)||{},safe=(m.authoritativeSafeSwales15815&&m.authoritativeSafeSwales15815.features)||[],water=(m.authoritativeWaterPaths15824&&m.authoritativeWaterPaths15824.features)||[],recharge=Array.isArray(m.rechZones)?m.rechZones:[],elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    const native=Array.isArray(m.swales)?m.swales:[],slopes=native.map(x=>Number(x&&x.slope)).filter(Number.isFinite),maxSlope=slopes.length?Math.max.apply(null,slopes):null;
    const spacingM=Number(m.swaleMeta&&m.swaleMeta.measuredMedianSpacingM),rain=Number(m.loc&&m.loc.precipIn),rainText=Number.isFinite(rain)?(Math.round(rain*10)/10)+' in':'not available for this run';
    const aq=reportAquifers(),ev=data.exclusionEvidence||null,elderText=elder&&elder.summary&&elder.summary.evidenceLabel?String(elder.summary.evidenceLabel):'No Elder Tree evidence summary was attached to this run.';
    const decision=safe.length
      ?safe.length+' Property bioswale corridor'+(safe.length===1?'':'s')+' passed the current terrain, slope, exclusion, water-channel and Property-frame publication gates in this 20-acre analysis.'
      :'No Property bioswale corridor passed every current publication gate in this 20-acre analysis. A zero result is retained rather than replaced with weaker geometry.';
    const next=safe.length
      ?'Field-check the published corridor'+(safe.length===1?'':'s')+' for exact contour, soil infiltration, utilities, overflow, access and local permitting before any earthwork.'
      :'Review terrain resolution, soils, exclusions and field hydrology before considering another intervention or a revised project area.';
    const finding=safe.length
      ?safe.length+' authoritative safe corridor'+(safe.length===1?' is':'s are')+' published from this Property run; '+water.length+' modeled water path'+(water.length===1?'':'s')+' and '+recharge.length+' recharge verification target'+(recharge.length===1?'':'s')+' are retained with the same run.'
      :'No authoritative safe corridor was published from this Property run.';
    const process='<div class="el49-process"><div class="el49-step"><b>1 · Locate</b>One governed 20-acre Property frame</div><div class="el49-step"><b>2 · Terrain</b>Elevation, contours and slope</div><div class="el49-step"><b>3 · Water</b>Flow direction and accumulation</div><div class="el49-step"><b>4 · Exclude</b>Roads, structures, mapped water and unsafe channels</div><div class="el49-step"><b>5 · Prescribe</b>Contour-following corridors at ≤4% slope</div><div class="el49-step"><b>6 · Publish</b>Only frame-contained safe geometry</div></div>';
    return '<div class="el49-report">'+
      '<section class="el49-page el49-cover"><div class="el91-report-top"><div class="el91-report-logo">'+reportLogo16391()+'</div><div class="el90-cover-issued">'+esc(data.issued)+'</div></div><div class="el49-kicker el90-cover-kicker">PROPERTY · 20-ACRE ANALYSIS</div><h1>Bioswale <span class="el53-blue">Impact Report</span></h1><div class="el49-location">'+esc(data.query)+'</div><p class="el49-purpose">A Property-scale decision-support screening report built from the authoritative published Property run. It separates modeled findings, evidence limits and required field verification.</p>'+((typeof window.earthlineExclusionEvidenceReportHtml16516==='function'&&ev)?window.earthlineExclusionEvidenceReportHtml16516(ev):'')+'<div class="el91-cover-below"><div class="el49-cover-meta"><div><span>REPORT ID</span><strong>'+esc(data.reportId)+'</strong></div><div><span>METHOD</span><strong>'+esc(METHOD)+'</strong></div><div><span>RUN SIGNATURE</span><strong>'+esc(data.signature)+'</strong></div><div><span>ISSUED</span><strong>'+esc(data.issued)+'</strong></div></div>'+coverStamp16388(data)+'</div>'+footer(data,'Cover')+'</section>'+
      '<section class="el49-page"><div class="el49-kicker">01 · Executive Decision</div><h2>What this Property report supports</h2><div class="el49-decision">'+esc(decision)+'</div><div class="el49-metrics">'+metric('Published Property corridors',safe.length,'Authoritative safe geometry')+metric('Modeled water paths',water.length,'Current Property run')+metric('Recharge targets',recharge.length,'Verification targets, not confirmed aquifers')+metric('Maximum corridor slope',Number.isFinite(maxSlope)?maxSlope.toFixed(2)+'%':'—','Acceptance limit ≤4%')+'</div><div class="el49-callout warn"><b>Decision boundary:</b> this is screening evidence, not a construction instruction or professional engineering seal.</div>'+footer(data,'01')+'</section>'+
      '<section class="el49-page"><div class="el49-kicker">02 · Hydrology and Aquifer Context</div><h2>Property Hydrology and Aquifer Context</h2><figure class="el49-figure">'+mapSvg(data.d,false)+'<figcaption>Figure 1. Property-scale modeled water movement and mapped groundwater context from the current published run. The analysis frame is authoritative for this report.</figcaption></figure><div class="el49-grid"><div class="el49-panel"><h3>Water</h3><p>'+water.length+' modeled Property water path'+(water.length===1?'':'s')+' are retained. Published bioswales are excluded from mapped water and protected channel cells.</p></div><div class="el49-panel"><h3>Groundwater context</h3><p>'+aq.length+' mapped aquifer-context feature'+(aq.length===1?' is':'s are')+' available to this report. Aquifer context does not establish parcel-scale transmissivity, storage, depth to water or well yield.</p></div></div>'+footer(data,'02')+'</section>'+
      '<section class="el49-page"><div class="el49-kicker">03 · Method</div><h2>The Earthline Process</h2>'+process+'<div class="el49-callout"><b>Scientific ownership.</b> Property placement is governed by terrain, hydrology, exclusions, slope, contour geometry and the declared Property frame. Presentation cannot create or substitute a corridor.</div>'+footer(data,'03')+'</section>'+
      '<section class="el49-page"><div class="el49-kicker">04 · Property Findings</div><h2>What the current Property run produced</h2><div class="el49-decision">'+esc(finding)+'</div><div class="el49-metrics">'+metric('Safe corridors',safe.length,'Published geometry')+metric('Water paths',water.length,'Terrain-derived')+metric('Recharge targets',recharge.length,'Field verification required')+metric('Median spacing',Number.isFinite(spacingM)?(spacingM*3.28084).toFixed(1)+' ft':'—','Target ≈15–25 ft')+'</div><div class="el49-panel"><h3>Exclusion evidence</h3><p>'+esc(ev&&ev.label||'Property exclusion evidence is attached to the current run.')+'</p><p>'+esc(ev&&ev.detail||'Field verification remains required before siting.')+'</p></div>'+footer(data,'04')+'</section>'+
      '<section class="el49-page"><div class="el49-kicker">05 · Mechanism</div><h2>How Bioswales Work</h2><p>Contour bioswales slow runoff, spread it laterally along level contour, and increase residence time so water has more opportunity to infiltrate instead of concentrating downslope.</p><p>The excavated swale receives and temporarily stores runoff while the downslope berm slows release, supports vegetation and helps stabilize soil. A safe overflow route is required for rainfall that exceeds storage and infiltration capacity.</p><p>Beaver activity can slow, spread and retain water in ways that complement watershed restoration, while site-specific conflicts and infrastructure risks still require field review.</p><p><b>Climate-change modeling note:</b> future design should test multiple rainfall intensities, seasonal conditions and plausible climate scenarios; this Earthline run is a screening model, not a guarantee of future performance.</p><p><b>Average yearly rainfall:</b> '+esc(rainText)+'.</p><div class="el49-callout warn"><b>All sites need to be verified by a professional landscape expert.</b> Field infiltration, exact contour, overflow, utilities, property limits, roads, structures, waterways and permitting must be confirmed before earthwork.</div>'+footer(data,'05')+'</section>'+
      '<section class="el49-page"><div class="el49-kicker">06 · Safety and Exclusions</div><h2>Why a corridor was allowed to publish</h2><p>Published Property corridors must remain at or below 4% modeled slope, follow contour, remain inside the declared Property frame, and avoid the current mapped road, driveway, structure, pond, mapped-water and protected-channel exclusions.</p><div class="el49-callout"><b>Evidence grade:</b> '+esc(ev&&ev.label||'Current Property screening evidence')+'</div><div class="el49-callout warn">No open-data screening result replaces field verification. Missing mapped features are not proof that a feature is absent on the ground.</div>'+footer(data,'06')+'</section>'+
      '<section class="el49-page"><div class="el49-kicker">07 · Ecology</div><h2>Elder Tree Evidence</h2><div class="el49-decision">'+esc(elderText)+'</div><p>Elder Tree evidence is an independent ecological evidence layer. It has zero weight in Recharge Suitability and does not change swale eligibility.</p><p>'+esc(elder&&elder.summary&&elder.summary.partial?'Current Earthline Elder Tree coverage is partial; displayed counts are not a complete natural-population census.':'No additional Elder Tree coverage limitation was recorded for this run.')+'</p>'+footer(data,'07')+'</section>'+
      '<section class="el49-page"><div class="el49-kicker">08 · Data Gaps and Reliance Limits</div><h2>What still requires field evidence</h2><table class="el49-table"><thead><tr><th>Item</th><th>Required before design</th></tr></thead><tbody><tr><td>Bare-earth terrain</td><td>Survey or suitable DTM where canopy/buildings can affect surface elevation.</td></tr><tr><td>Soils and infiltration</td><td>Field infiltration and soil-profile verification.</td></tr><tr><td>Infrastructure</td><td>Utilities, septic, access, property boundaries and unmapped improvements.</td></tr><tr><td>Overflow</td><td>Stable emergency overflow route and downstream impact review.</td></tr><tr><td>Groundwater</td><td>Local hydrogeology/well evidence where recharge claims require it.</td></tr></tbody></table><div class="el49-callout warn">Earthline does not quantify guaranteed recharge volume, flood reduction, erosion reduction, carbon sequestration or habitat gain unless the required input chain is present and stated.</div>'+footer(data,'08')+'</section>'+
      '<section class="el49-page"><div class="el49-kicker">09 · Recommended Next Step</div><h2>Move from screening to field-verified design</h2><div class="el49-decision">'+esc(next)+'</div><div class="el49-grid"><div class="el49-panel"><h3>1 · Survey</h3><p>Confirm true contour and grade along each published corridor.</p></div><div class="el49-panel"><h3>2 · Test</h3><p>Verify soil infiltration and groundwater context.</p></div><div class="el49-panel"><h3>3 · Exclude</h3><p>Walk roads, structures, utilities, waterways and property boundaries.</p></div><div class="el49-panel"><h3>4 · Design</h3><p>Size the swale, berm, planting and overflow with a qualified local professional.</p></div></div>'+footer(data,'09')+'</section>'+
      finalSourcesPage16864(data)+
      '</div>';
  }  """

s=s.replace(marker,helper+marker,1)
s=s.replace("function buildReport(data){const {d,sum}=data,decision=","function buildReport(data){const tier17612=String(data&&data.d&&(data.d.tier||data.d.mode||data.d.extentClass)||'').toLowerCase();if(tier17612.includes('property')||tier17612.includes('parcel')||tier17612.includes('site'))return buildPropertyReport17612(data);const {d,sum}=data,decision=",1)

# Regional report headings must also match the approved information architecture.
s=s.replace("<h2>How the screening was produced</h2>","<h2>The Earthline Process</h2>",1)
s=s.replace("<h2>Evidence for the mechanism—not validation of this map</h2>","<h2>How Bioswales Work</h2>",1)

p.write_text(s,encoding="utf-8")
print("report tier ownership 17612 installed")
