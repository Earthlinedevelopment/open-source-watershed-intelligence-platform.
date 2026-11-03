from pathlib import Path
import hashlib
p=Path('index.html');s=p.read_text(encoding='utf-8')
prior=hashlib.sha256(s.encode()).hexdigest()
assert prior=='9b378812b36d98b71f13df23a6aa6e27646513d55c8904d672ffee6335c5b2bb',f'Unexpected M96 source: {prior}'
old="""for(const id of ['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221','earthline-property-safe-water-second-m96']){try{if(mp.getLayer?.(id))mp.setPaintProperty(id,'line-opacity',0)}catch(_){}}"""
new="""/* M96: do not hide scientifically screened swales when texture layers merely
   exist; the optional texture images may still be missing. Keep both approved
   blue strips visible even when natural texture is fully available. */
const naturalReadyM96=!!(mp.hasImage?.(IMG_UP)&&mp.hasImage?.(IMG_FLIP));
for(const id of ['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221','earthline-property-safe-water-second-m96']){
  try{
    if(mp.getLayer?.(id)){
      const blueM96=id==='earthline-property-safe-water-16221'||id==='earthline-property-safe-water-second-m96';
      mp.setPaintProperty(id,'line-opacity',blueM96||!naturalReadyM96?.98:0);
    }
  }catch(_){}
}"""
# JS ternary syntax typo? string 'blueM96||!naturalReadyM96?.98:0' correctly parses optional chaining? ambiguous
new=new.replace("blueM96||!naturalReadyM96?.98:0","(blueM96||!naturalReadyM96)?0.98:0")
assert s.count(old)==1,f'Natural owner hide point duplicated/missing: {s.count(old)}'
s=s.replace(old,new,1)
old2="""for(const id of ['earthline-swale-planting-shadow-15806','earthline-swale-planting-layer-15806'])if(mp.getLayer?.(id))mp.moveLayer(id);if(typeof window.earthlineApplyRendererOwnership15805==='function')window.earthlineApplyRendererOwnership15805('property')"""
new2="""for(const id of ['earthline-swale-planting-shadow-15806','earthline-swale-planting-layer-15806'])if(mp.getLayer?.(id))mp.moveLayer(id);
/* M96: genuine blue-water swale stripes must stay over optional texture. */
for(const id of ['earthline-property-safe-water-16221','earthline-property-safe-water-second-m96'])if(mp.getLayer?.(id))mp.moveLayer(id);
if(typeof window.earthlineApplyRendererOwnership15805==='function')window.earthlineApplyRendererOwnership15805('property')"""
assert s.count(old2)==1,f'Natural layer ordering point: {s.count(old2)}'
s=s.replace(old2,new2,1)
p.write_text(s,encoding='utf-8')
print('M96_VISIBLE_BLUE_OPACITY_PATCH',hashlib.sha256(s.encode()).hexdigest())
