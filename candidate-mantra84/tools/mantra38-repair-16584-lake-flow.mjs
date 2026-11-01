import fs from 'node:fs';
const path='index.html';
let s=fs.readFileSync(path,'utf8');

const oldPoint=`  function earthlineRegionalPointValid16584(hy16584,ll16584){
    if(!hy16584||!hy16584.validityMask16584)return true;
    const g16584=llGrid(hy16584,ll16584),
          x16584=Math.max(0,Math.min(hy16584.w-1,Math.round(g16584.x))),
          y16584=Math.max(0,Math.min(hy16584.h-1,Math.round(g16584.y)));
    return !!hy16584.validityMask16584[y16584*hy16584.w+x16584];
  }`;
const newPoint=`  function earthlineRegionalPointValid16584(hy16584,ll16584){
    if(!hy16584||!hy16584.validityMask16584)return true;
    const g16584=llGrid(hy16584,ll16584),
          x16584=Math.max(0,Math.min(hy16584.w-1,Math.round(g16584.x))),
          y16584=Math.max(0,Math.min(hy16584.h-1,Math.round(g16584.y)));
    if(!hy16584.validityMask16584[y16584*hy16584.w+x16584])return false;
    const waterParts16584=Array.isArray(hy16584.waterParts16584)?hy16584.waterParts16584:[];
    if(waterParts16584.length&&ll16584&&Number.isFinite(Number(ll16584[0]))&&Number.isFinite(Number(ll16584[1]))){
      const lng16584=Number(ll16584[0]),lat16584=Number(ll16584[1]);
      for(const part16584 of waterParts16584){
        if(!part16584||!part16584.bbox||!part16584.rings)continue;
        if(lng16584<part16584.bbox[0]||lng16584>part16584.bbox[2]||lat16584<part16584.bbox[1]||lat16584>part16584.bbox[3])continue;
        if(earthlinePointInPolygon16584(lng16584,lat16584,part16584.rings))return false;
      }
    }
    return true;
  }`;
if(!s.includes(oldPoint))throw new Error('earthlineRegionalPointValid16584 source block not found');
s=s.replace(oldPoint,newPoint);

const oldSmooth=`  function earthlineRegionalSmoothFlow16584(hy16584,raw16584){
    const base16584=cleanLine(raw16584);if(base16584.length<2)return [];
    const smooth16584=chaikin(base16584,2,false);
    let safe16584=smooth16584.length>=2;
    if(safe16584){
      for(let i16584=0;i16584<smooth16584.length;i16584++){
        if(!earthlineRegionalPointValid16584(hy16584,smooth16584[i16584])){safe16584=false;break;}
        if(i16584>0&&!earthlineRegionalSegmentValid16584(hy16584,smooth16584[i16584-1],smooth16584[i16584])){safe16584=false;break;}
      }
    }
    return safe16584?smooth16584:base16584;
  }`;
const newSmooth=`  function earthlineRegionalSmoothFlow16584(hy16584,raw16584){
    const base16584=cleanLine(raw16584);if(base16584.length<2)return [];
    const smooth16584=chaikin(base16584,2,false);
    const trim16584=coords16584=>{
      const out16584=[];
      for(const p16584 of (coords16584||[])){
        if(!earthlineRegionalPointValid16584(hy16584,p16584))break;
        if(out16584.length&&!earthlineRegionalSegmentValid16584(hy16584,out16584[out16584.length-1],p16584))break;
        out16584.push(p16584);
      }
      return out16584;
    };
    const smoothSafe16584=trim16584(smooth16584);
    if(smoothSafe16584.length>=8)return smoothSafe16584;
    return trim16584(base16584);
  }`;
if(!s.includes(oldSmooth))throw new Error('earthlineRegionalSmoothFlow16584 source block not found');
s=s.replace(oldSmooth,newSmooth);

const oldHydro=`          hy=await hydrology(dem,validityGrid16584.mask);`;
const newHydro=`          hy=await hydrology(dem,validityGrid16584.mask);
          hy.waterParts16584=Array.isArray(landValidity16584.waterParts)?landValidity16584.waterParts:[];`;
if(!s.includes(oldHydro))throw new Error('governed hydrology assignment not found');
s=s.replace(oldHydro,newHydro);

const oldFallback=`    if(!hy)hy=await hydrology(dem,validityGrid16584&&validityGrid16584.mask||null);const regionalRecharge16492=regionalRechargeModel16492(hy,loc);const contoursStarted16245=performance.now();`;
const newFallback=`    if(!hy){hy=await hydrology(dem,validityGrid16584&&validityGrid16584.mask||null);if(landValidity16584&&Array.isArray(landValidity16584.waterParts))hy.waterParts16584=landValidity16584.waterParts;}const regionalRecharge16492=regionalRechargeModel16492(hy,loc);const contoursStarted16245=performance.now();`;
if(!s.includes(oldFallback))throw new Error('late hydrology assignment not found');
s=s.replace(oldFallback,newFallback);

fs.writeFileSync(path,s);
console.log('Updated existing 16584 owner: exact vector lake check + shoreline truncation; no new map/render owner.');
