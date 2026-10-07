(function(){
  'use strict';
  const IMG_UP='earthline-swale-natural-uphill-16174';
  const IMG_FLIP='earthline-swale-natural-uphill-flipped-16174';
  const SOURCE_URL='/index.html';
  let sourcePromise=null;

  function map(){try{return window.earthlineMap||earthlineMap||null}catch(_){return window.earthlineMap||null}}
  function load(uri){return new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=uri})}
  function sourceTiles(){
    if(sourcePromise)return sourcePromise;
    sourcePromise=fetch(SOURCE_URL+'?textureSource='+Date.now(),{cache:'no-store'}).then(r=>r.text()).then(text=>{
      const up=text.match(/const TILE_UP='(data:image\/webp;base64,[^']+)'/);
      const flip=text.match(/const TILE_FLIP='(data:image\/webp;base64,[^']+)'/);
      if(!up||!flip)throw new Error('16584 texture constants not found');
      return {up:up[1],flip:flip[1]};
    });
    return sourcePromise;
  }
  async function enhance(uri,flipped){
    const img=await load(uri);if(!img)return null;
    const c=document.createElement('canvas');c.width=img.naturalWidth||512;c.height=img.naturalHeight||128;
    const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0,c.width,c.height);
    const data=x.getImageData(0,0,c.width,c.height),p=data.data;
    for(let y=0;y<c.height;y++){
      if((!flipped&&y>43)||(flipped&&y<84))continue;
      for(let xx=0;xx<c.width;xx++){
        const i=(y*c.width+xx)*4,r=p[i],g=p[i+1],b=p[i+2];
        if(b>r+25&&g>r+20&&g>55){p[i]=20;p[i+1]=156;p[i+2]=255;}
      }
    }
    x.putImageData(data,0,0);
    const segs=[[0,101],[111,235],[248,361],[378,512]];
    x.save();x.lineCap='round';
    const mid=flipped?103:24;
    x.strokeStyle='rgba(20,156,255,.52)';x.lineWidth=12;
    for(const [a,b] of segs){x.beginPath();x.moveTo(a+3,mid);x.lineTo(b-3,mid);x.stroke()}
    x.strokeStyle='#63c7ff';x.lineWidth=2.4;x.setLineDash([10,8]);
    const ys=flipped?[99,107]:[20,28];
    for(const y of ys)for(const [a,b] of segs){x.beginPath();x.moveTo(a+5,y);x.lineTo(b-5,y);x.stroke()}
    x.restore();
    return await load(c.toDataURL('image/png'));
  }
  async function apply(){
    const mp=map();if(!mp||typeof mp.updateImage!=='function')return false;
    try{
      const src=await sourceTiles();
      const [up,flip]=await Promise.all([enhance(src.up,false),enhance(src.flip,true)]);
      if(!up||!flip)return false;
      if(mp.hasImage?.(IMG_UP))mp.updateImage(IMG_UP,up);else mp.addImage(IMG_UP,up,{pixelRatio:2});
      if(mp.hasImage?.(IMG_FLIP))mp.updateImage(IMG_FLIP,flip);else mp.addImage(IMG_FLIP,flip,{pixelRatio:2});
      mp.triggerRepaint?.();
      window.EARTHLINE_LAB_BLUE_16598={applied:true,at:new Date().toISOString()};
      return true;
    }catch(e){window.EARTHLINE_LAB_BLUE_16598={applied:false,error:String(e),at:new Date().toISOString()};return false}
  }
  document.addEventListener('earthline:analysis-complete',()=>setTimeout(apply,220),{passive:true});
  setTimeout(apply,1200);
})();
