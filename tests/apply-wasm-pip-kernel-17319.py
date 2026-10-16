from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""  function earthlinePointInRingIndexed16722(p16722,ring16722){
    if(!earthlineFinitePoint16539(p16722)||!Array.isArray(ring16722)||ring16722.length<3)return false;
    let idx16722=earthlineRingIndexCache16722.get(ring16722);
    if(!idx16722){
      const scale16722=4,bins16722=new Map();
      for(let i16722=0,j16722=ring16722.length-1;i16722<ring16722.length;j16722=i16722++){
        const a16722=ring16722[j16722],b16722=ring16722[i16722];
        if(!earthlineFinitePoint16539(a16722)||!earthlineFinitePoint16539(b16722))continue;
        const lo16722=Math.floor(Math.min(Number(a16722[1]),Number(b16722[1]))*scale16722);
        const hi16722=Math.floor(Math.max(Number(a16722[1]),Number(b16722[1]))*scale16722);
        const edge16722=[a16722,b16722];
        for(let bin16722=lo16722;bin16722<=hi16722;bin16722++){
          let list16722=bins16722.get(bin16722);if(!list16722)bins16722.set(bin16722,list16722=[]);list16722.push(edge16722);
        }
      }
      idx16722={scale:scale16722,bins:bins16722};earthlineRingIndexCache16722.set(ring16722,idx16722);
    }
    const x16722=Number(p16722[0]),y16722=Number(p16722[1]),edges16722=idx16722.bins.get(Math.floor(y16722*idx16722.scale))||[];
    let inside16722=false;
    for(const edge16722 of edges16722){
      const a16722=edge16722[0],b16722=edge16722[1];
      if(earthlinePointOnSegment16539(p16722,a16722,b16722))return true;
      const xi16722=Number(b16722[0]),yi16722=Number(b16722[1]),xj16722=Number(a16722[0]),yj16722=Number(a16722[1]);
      if(((yi16722>y16722)!==(yj16722>y16722))&&(x16722<(xj16722-xi16722)*(y16722-yi16722)/((yj16722-yi16722)||1e-15)+xi16722))inside16722=!inside16722;
    }
    return inside16722;
  }"""
new="""  const earthlinePipWasm17319=(()=>{
    try{
      if(typeof WebAssembly!=='object'||typeof atob!=='function')return null;
      const raw17319=atob('AGFzbQEAAAABCQFgBHx8f38BfwMCAQAEBQFwAQEBBQUBAQKACAYPAn8BQYCIBAt/AEGAiAQLBykDBm1lbW9yeQIADnBvaW50X2luX2VkZ2VzAAALX19oZWFwX2Jhc2UDAQq5AgG2AgIBfwp8QQAhBAJAIANBAUgNAANAIAAgAisDACIFoSEGIAEgAkEIaisDACIHoSEIIAJBGGorAwAhCSACQRBqKwMAIQoCQAJAIAJBMGorAwAiC0QjQpIMoZzHO2NFDQAgBiAGoiAIIAiioEQjQpIMoZzHO2NFDQFBAQ8LIAYgAkEoaisDACIMoiACQSBqKwMAIg0gCKKhIg6aIA4gDkQAAAAAAAAAAGMbRLu919nffNs9ZUUNACAGIA2iIAggDKKgIgZEAAAAAAAAAABmRQ0AIAYgC2VFDQBBAQ8LAkAgByABZCAJIAFkRg0AIAogBSAKoSABIAmhoiAHIAmhIglEFlbnnq8D0jwgCUQAAAAAAAAAAGIbo6AgAGRFDQAgBEUhBAsgAkE4aiECIANBf2oiAw0ACwsgBAsAQQRuYW1lABMSZWFydGhsaW5lX3BpcC53YXNtAREBAA5wb2ludF9pbl9lZGdlcwcSAQAPX19zdGFja19wb2ludGVyAH8JcHJvZHVjZXJzAQxwcm9jZXNzZWQtYnkBBWNsYW5nXzE3LjAuMCAoaHR0cHM6Ly9naXRodWIuY29tL3N3aWZ0bGFuZy9sbHZtLXByb2plY3QuZ2l0IDEwOTk5YjZkMDM0ZmUzMThmM2Q1NmM4M2JkZGI2NTcyNTkzYThiYjApAEkPdGFyZ2V0X2ZlYXR1cmVzBCsKbXVsdGl2YWx1ZSsPbXV0YWJsZS1nbG9iYWxzKw9yZWZlcmVuY2UtdHlwZXMrCHNpZ24tZXh0'),bytes17319=new Uint8Array(raw17319.length);
      for(let i17319=0;i17319<raw17319.length;i17319++)bytes17319[i17319]=raw17319.charCodeAt(i17319);
      const module17319=new WebAssembly.Module(bytes17319),instance17319=new WebAssembly.Instance(module17319,{}),
            memory17319=instance17319.exports.memory,point17319=instance17319.exports.point_in_edges;
      if(!memory17319||typeof point17319!=='function')return null;
      const heapGlobal17319=instance17319.exports.__heap_base;
      let next17319=((Number(heapGlobal17319&&heapGlobal17319.value!==undefined?heapGlobal17319.value:heapGlobal17319)||65536)+7)&~7;
      function alloc17319(bytes17319){
        const ptr17319=next17319;next17319=(next17319+bytes17319+7)&~7;
        if(next17319>memory17319.buffer.byteLength){
          const need17319=next17319-memory17319.buffer.byteLength,pages17319=Math.ceil(need17319/65536);
          memory17319.grow(pages17319);
        }
        return ptr17319;
      }
      return {memory:memory17319,point:point17319,alloc:alloc17319};
    }catch(_){return null;}
  })();
  function earthlinePointInRingIndexed16722(p16722,ring16722){
    if(!earthlineFinitePoint16539(p16722)||!Array.isArray(ring16722)||ring16722.length<3)return false;
    let idx16722=earthlineRingIndexCache16722.get(ring16722);
    if(!idx16722){
      const scale16722=4,bins16722=new Map();
      for(let i16722=0,j16722=ring16722.length-1;i16722<ring16722.length;j16722=i16722++){
        const a16722=ring16722[j16722],b16722=ring16722[i16722];
        if(!earthlineFinitePoint16539(a16722)||!earthlineFinitePoint16539(b16722))continue;
        const x116722=Number(a16722[0]),y116722=Number(a16722[1]),x216722=Number(b16722[0]),y216722=Number(b16722[1]),
              dx16722=x216722-x116722,dy16722=y216722-y116722,len16722=dx16722*dx16722+dy16722*dy16722,
              lo16722=Math.floor(Math.min(y116722,y216722)*scale16722),hi16722=Math.floor(Math.max(y116722,y216722)*scale16722),
              edge16722=[x116722,y116722,x216722,y216722,dx16722,dy16722,len16722];
        for(let bin16722=lo16722;bin16722<=hi16722;bin16722++){
          let list16722=bins16722.get(bin16722);if(!list16722)bins16722.set(bin16722,list16722=[]);list16722.push(edge16722);
        }
      }
      if(earthlinePipWasm17319){
        for(const [bin16722,list16722] of bins16722){
          const count16722=list16722.length,ptr16722=earthlinePipWasm17319.alloc(count16722*56),
                flat16722=new Float64Array(earthlinePipWasm17319.memory.buffer,ptr16722,count16722*7);
          let k16722=0;for(const edge16722 of list16722)for(let q16722=0;q16722<7;q16722++)flat16722[k16722++]=edge16722[q16722];
          bins16722.set(bin16722,{ptr:ptr16722,count:count16722,edges:list16722});
        }
      }
      idx16722={scale:scale16722,bins:bins16722,wasm:!!earthlinePipWasm17319};earthlineRingIndexCache16722.set(ring16722,idx16722);
    }
    const x16722=Number(p16722[0]),y16722=Number(p16722[1]),entry16722=idx16722.bins.get(Math.floor(y16722*idx16722.scale));
    if(!entry16722)return false;
    if(idx16722.wasm&&entry16722&&Number.isInteger(entry16722.ptr))return !!earthlinePipWasm17319.point(x16722,y16722,entry16722.ptr,entry16722.count);
    const edges16722=entry16722.edges||entry16722,insideStart16722=false;
    let inside16722=insideStart16722;
    for(const edge16722 of edges16722){
      const x116722=edge16722[0],y116722=edge16722[1],x216722=edge16722[2],y216722=edge16722[3],dx16722=edge16722[4],dy16722=edge16722[5],len16722=edge16722[6];
      if(len16722<1e-20){if((x16722-x116722)*(x16722-x116722)+(y16722-y116722)*(y16722-y116722)<1e-20)return true;}
      else{const cross16722=Math.abs((x16722-x116722)*dy16722-(y16722-y116722)*dx16722);if(cross16722<=1e-10){const dot16722=(x16722-x116722)*dx16722+(y16722-y116722)*dy16722;if(dot16722>=0&&dot16722<=len16722)return true;}}
      if(((y216722>y16722)!==(y116722>y16722))&&(x16722<(x116722-x216722)*(y16722-y216722)/((y116722-y216722)||1e-15)+x216722))inside16722=!inside16722;
    }
    return inside16722;
  }"""
if s.count(old)!=1: raise SystemExit(f"ring owner anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_WASM_PIP_KERNEL_17319: exact point-in-ring arithmetic moved to synchronous WASM with identical numeric edges/tolerances; JS fallback retained; no geometry/science change. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed exact WASM point-in-ring kernel 17319")
