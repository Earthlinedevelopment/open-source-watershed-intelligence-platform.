from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""  async function fetchImageData(url,signal){
    let image=null,revoke='';
    try{
      const r=await fetch(url,{mode:'cors',cache:'force-cache',signal});if(!r.ok)throw new Error('terrain tile HTTP '+r.status);
      const blob=await r.blob();if(typeof createImageBitmap==='function')image=await createImageBitmap(blob);else{revoke=URL.createObjectURL(blob);image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('terrain tile decode failed'));img.src=revoke;});}
    }catch(first){
      if(signal&&signal.aborted)throw first;
      image=await new Promise((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>reject(first);img.src=url;});
    }
    const c=document.createElement('canvas');c.width=image.width||image.naturalWidth;c.height=image.height||image.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);let data;
    try{data=ctx.getImageData(0,0,c.width,c.height);}catch(_){throw new Error('terrain tile blocked by cross-origin policy');}
    image.close&&image.close();if(revoke)setTimeout(()=>{try{URL.revokeObjectURL(revoke)}catch(_){}},800);return {width:c.width,height:c.height,data:data.data};
  }"""
new="""  async function fetchImageData(url,signal){
    let image=null,revoke='';
    try{
      image=await new Promise((resolve,reject)=>{
        const img=new Image();img.crossOrigin='anonymous';let done=false;
        const cleanup=()=>{try{signal&&signal.removeEventListener('abort',onAbort)}catch(_){}};
        const finish=(fn,v)=>{if(done)return;done=true;cleanup();fn(v);};
        const onAbort=()=>{try{img.src=''}catch(_){};finish(reject,signal?.reason instanceof Error?signal.reason:new Error('terrain tile aborted'));};
        img.onload=()=>finish(resolve,img);img.onerror=()=>finish(reject,new Error('terrain tile direct image decode failed'));
        try{signal&&signal.addEventListener('abort',onAbort,{once:true})}catch(_){}
        img.src=url;
      });
    }catch(first){
      if(signal&&signal.aborted)throw first;
      const r=await fetch(url,{mode:'cors',cache:'force-cache',signal});if(!r.ok)throw new Error('terrain tile HTTP '+r.status);
      const blob=await r.blob();if(typeof createImageBitmap==='function')image=await createImageBitmap(blob);else{revoke=URL.createObjectURL(blob);image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(first);img.src=revoke;});}
    }
    const c=document.createElement('canvas');c.width=image.width||image.naturalWidth;c.height=image.height||image.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);let data;
    try{data=ctx.getImageData(0,0,c.width,c.height);}catch(_){throw new Error('terrain tile blocked by cross-origin policy');}
    image.close&&image.close();if(revoke)setTimeout(()=>{try{URL.revokeObjectURL(revoke)}catch(_){}},800);return {width:c.width,height:c.height,data:data.data};
  }"""
n=s.count(old);print("image loader anchors",n)
if n!=1: raise SystemExit(f"expected one image loader anchor, found {n}")
s=s.replace(old,new,1)
s="/* EARTHLINE_NATIVE_IMAGE_DECODE_17286 — decode the same CORS Terrarium PNG directly in the browser image pipeline first; existing fetch/blob path remains fail-soft fallback. */\n"+s
p.write_text(s,encoding="utf-8")
print("17286 native image decode applied")
