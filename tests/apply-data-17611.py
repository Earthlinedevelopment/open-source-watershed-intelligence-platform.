from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

# Gauge contract: 0-100 score, no percent sign, exact label.
if "Recharge Potential" not in s:
    raise SystemExit("Recharge Potential source text not found")
s=s.replace("Recharge Potential","Recharge Suitability")

old="if(value)value.textContent=q==null?'—%':q+'%'"
new="if(value)value.textContent=q==null?'—':String(q)"
if s.count(old)!=1:
    raise SystemExit(f"gauge value owner count {s.count(old)}")
s=s.replace(old,new,1)

# Current Property driver science, relabeled truthfully and with an explicit no-invention canopy row.
oldp="""return [{name:'Aquifer permeability',basis:aqBasis,value:Math.round(aq/n*100),weight:.30,source:aqSource,weak:!gw.mappedMaterial},{name:'Soil infiltration',basis:soilLoaded?'SSURGO active':'model fallback',value:Math.round(soil/n*100),weight:.20,source:soilLoaded?'NRCS SSURGO':'No local infiltration test — Earthline model fallback',weak:!soilLoaded},{name:'Slope',basis:(slopeRaw/n).toFixed(1)+'% mean',value:Math.round(sl/n*100),weight:.18,source:demLabel16492()},{name:'Contributing flow',basis:'D8 accumulation',value:Math.round(flow/n*100),weight:.17,source:'Derived from the same elevation model'}]"""
newp="""return [{name:'Groundwater evidence',basis:aqBasis,value:Math.round(aq/n*100),weight:.30,source:aqSource,weak:!gw.mappedMaterial},{name:'Soil infiltration',basis:soilLoaded?'SSURGO active':'model fallback',value:Math.round(soil/n*100),weight:.20,source:soilLoaded?'NRCS SSURGO':'No local infiltration test — Earthline model fallback',weak:!soilLoaded},{name:'Slope',basis:(slopeRaw/n).toFixed(1)+'% mean',value:Math.round(sl/n*100),weight:.18,source:demLabel16492()},{name:'Flow',basis:'D8 accumulation',value:Math.round(flow/n*100),weight:.17,source:'Derived from the same elevation model'},{name:'Canopy evidence',basis:'not available · not scored',value:0,weight:0,source:'No canopy input is currently used in the Earthline Recharge Suitability score; no canopy value is invented.',weak:true}]"""
if s.count(oldp)!=1:
    raise SystemExit(f"property driver owner count {s.count(oldp)}")
s=s.replace(oldp,newp,1)

oldr="""return [{name:'Aquifer permeability',basis:'regional model fallback',value:Number(c.aquifer||45),weight:.30,source:'Earthline fallback value at regional screening scale; no parcel aquifer boundary implied',weak:true},{name:'Soil infiltration',basis:'regional model fallback',value:Number(c.soil||55),weight:.20,source:'No regional infiltration measurement — Earthline model fallback',weak:true},{name:'Slope',basis:'regional terrain mean',value:Number(c.slope||0),weight:.18,source:String(d&&d.terrain&&d.terrain.source||'Regional elevation model')},{name:'Contributing flow',basis:'D8 accumulation',value:Number(c.flow||0),weight:.17,source:'Derived from the same Regional elevation model'}]"""
newr="""return [{name:'Groundwater evidence',basis:'regional model fallback',value:Number(c.aquifer||45),weight:.30,source:'Earthline groundwater/aquifer fallback at regional screening scale; no parcel aquifer boundary implied',weak:true},{name:'Soil infiltration',basis:'regional model fallback',value:Number(c.soil||55),weight:.20,source:'No regional infiltration measurement — Earthline model fallback',weak:true},{name:'Slope',basis:'regional terrain mean',value:Number(c.slope||0),weight:.18,source:String(d&&d.terrain&&d.terrain.source||'Regional elevation model')},{name:'Flow',basis:'D8 accumulation',value:Number(c.flow||0),weight:.17,source:'Derived from the same Regional elevation model'},{name:'Canopy evidence',basis:'not available · not scored',value:0,weight:0,source:'No canopy input is currently used in the Earthline Recharge Suitability score; no canopy value is invented.',weak:true}]"""
if s.count(oldr)!=1:
    raise SystemExit(f"regional driver owner count {s.count(oldr)}")
s=s.replace(oldr,newr,1)

oldnote="Base weights are Aquifer 0.30, Soil 0.20, Slope 0.18, Flow 0.17, plus a 0.15 climate-need term centered at 50 before the rainfall multiplier. Rows are explanatory means from the same inputs; they are not a second independent calculation."
newnote="Base weights are Groundwater evidence 0.30, Soil 0.20, Slope 0.18, Flow 0.17, Canopy 0.00, plus a 0.15 climate-need term centered at 50 before the rainfall multiplier. Canopy is shown explicitly as not currently scored; Earthline does not invent canopy evidence. Rows are explanatory means from the same inputs; they are not a second independent calculation."
if s.count(oldnote)!=1:
    raise SystemExit(f"DATA note owner count {s.count(oldnote)}")
s=s.replace(oldnote,newnote,1)

oldformula="'Earthline base = Aquifer × 0.30 + Soil × 0.20 + Slope × 0.18 + Flow × 0.17 + (50 × 0.15). '"
newformula="'Earthline base = Groundwater evidence × 0.30 + Soil × 0.20 + Slope × 0.18 + Flow × 0.17 + Canopy × 0.00 + (50 × 0.15). '"
if s.count(oldformula)!=1:
    raise SystemExit(f"formula owner count {s.count(oldformula)}")
s=s.replace(oldformula,newformula,1)

p.write_text(s,encoding="utf-8")
print("Recharge Suitability DATA contract 17611 installed")
