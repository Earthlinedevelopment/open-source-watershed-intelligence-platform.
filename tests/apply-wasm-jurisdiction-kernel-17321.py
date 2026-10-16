from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_ring="""  function earthlinePointInRingIndexed16722(p16722,ring16722){
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
new_ring="""  const earthlineJurWasm17321=(()=>{
    try{
      if(typeof WebAssembly!=='object'||typeof atob!=='function')return null;
      const raw17321=atob('AGFzbQEAAAABEgJgBHx8f38Bf2AFfHx/f38BfwMDAgABBAUBcAEBAQUFAQECgBAGDwJ/AUGAiAQLfwBBgIgECwdBBAZtZW1vcnkCAA5wb2ludF9pbl9lZGdlcwAAFXBvaW50X2luX2p1cmlzZGljdGlvbgABC19faGVhcF9iYXNlAwEKqQ0CtgICAX8KfEEAIQQCQCADQQFIDQADQCAAIAIrAwAiBaEhBiABIAJBCGorAwAiB6EhCCACQRhqKwMAIQkgAkEQaisDACEKAkACQCACQTBqKwMAIgtEI0KSDKGcxztjRQ0AIAYgBqIgCCAIoqBEI0KSDKGcxztjRQ0BQQEPCyAGIAJBKGorAwAiDKIgAkEgaisDACINIAiioSIOmiAOIA5EAAAAAAAAAABjG0S7vdfZ33zbPWVFDQAgBiANoiAIIAyioCIGRAAAAAAAAAAAZkUNACAGIAtlRQ0AQQEPCwJAIAcgAWQgCSABZEYNACAKIAUgCqEgASAJoaIgByAJoSIJRBZW556vA9I8IAlEAAAAAAAAAABiG6OgIABkRQ0AIARFIQQLIAJBOGohAiADQX9qIgMNAAsLIAQL7goEAXwJfwl8AX8CQCAEQQFODQBBAEEBcQ8LAkACQCABRAAAAAAAABBAoiIFmUQAAAAAAADgQWNFDQAgBaohBgwBC0GAgICAeCEGCyAGIAVEAAAAAAAAAABjIAUgBrdicWshB0EAIQZBASEIAkADQAJAIAMgBkEDdGoiCUEEaigCACIKQQFIDQAgAiAJKAIAIgtBBnRqIgkrAwAgAGQNACAJKwMQIABjDQAgCSsDCCABZA0AIAkrAxggAWMNAAJAAkAgCSsDICIFmUQAAAAAAADgQWNFDQAgBaohDAwBC0GAgICAeCEMCyAHIAxIIQ0CQAJAIAkrAygiBZlEAAAAAAAA4EFjRQ0AIAWqIQ4MAQtBgICAgHghDgsgDQ0AIAcgDkoNACAHIAxrQQJ0IQ0CQAJAIAkrAzgiBUQAAAAAAADwQWMgBUQAAAAAAAAAAGZxRQ0AIAWrIQwMAQtBACEMCyAMIA1qKAIAIQwCQAJAIAkrAzAiBUQAAAAAAADwQWMgBUQAAAAAAAAAAGZxRQ0AIAWrIQkMAQtBACEJCyAJIA1qKAIAIglFDQAgDEUNACAMQQFIDQBBACENAkADQCAAIAkrAwAiD6EhECABIAlBCGorAwAiEaEhEiAJQRhqKwMAIQUgCUEQaisDACETAkACQCAJQTBqKwMAIhREI0KSDKGcxztjRQ0AIBAgEKIgEiASoqBEI0KSDKGcxztjRQ0BDAULIBAgCUEoaisDACIVoiAJQSBqKwMAIhYgEqKhIheaIBcgF0QAAAAAAAAAAGMbRLu919nffNs9ZUUNACAQIBaiIBIgFaKgIhBEAAAAAAAAAABmRQ0AIBAgFGUNAgsCQCARIAFkIAUgAWRGDQAgEyAPIBOhIAEgBaGiIBEgBaEiBUQWVueerwPSPCAFRAAAAAAAAAAAYhujoCAAZEUNACANRSENCyAJQThqIQkgDEF/aiIMDQALIA1FDQELIApBAUYNAiAKQQIgCkECShshDEEBIQkDQAJAIAIgCSALakEGdGoiCisDACAAZA0AIAorAxAgAGMNACAKKwMIIAFkDQAgCisDGCABYw0AAkACQCAKKwMgIgWZRAAAAAAAAOBBY0UNACAFqiENDAELQYCAgIB4IQ0LIAcgDUghDgJAAkAgCisDKCIFmUQAAAAAAADgQWNFDQAgBaohGAwBC0GAgICAeCEYCyAODQAgByAYSg0AIAcgDWtBAnQhDgJAAkAgCisDOCIFRAAAAAAAAPBBYyAFRAAAAAAAAAAAZnFFDQAgBashDQwBC0EAIQ0LIA0gDmooAgAhDQJAAkAgCisDMCIFRAAAAAAAAPBBYyAFRAAAAAAAAAAAZnFFDQAgBashCgwBC0EAIQoLIAogDmooAgAiCkUNACANRQ0AIA1BAUgNAEEAIQ4DQCAAIAorAwAiD6EhECABIApBCGorAwAiEaEhEiAKQRhqKwMAIQUgCkEQaisDACETAkACQCAKQTBqKwMAIhREI0KSDKGcxztjRQ0AIBAgEKIgEiASoqBEI0KSDKGcxztjRQ0BDAULIBAgCkEoaisDACIVoiAKQSBqKwMAIhYgEqKhIheaIBcgF0QAAAAAAAAAAGMbRLu919nffNs9ZUUNACAQIBaiIBIgFaKgIhBEAAAAAAAAAABmRQ0AIBAgFGUNBAsCQCARIAFkIAUgAWRGDQAgEyAPIBOhIAEgBaGiIBEgBaEiBUQWVueerwPSPCAFRAAAAAAAAAAAYhujoCAAZEUNACAORSEOCyAKQThqIQogDUF/aiINDQALIA4NAgsgCUEBaiIJIAxHDQAMAwsLIAZBAWoiBiAESCEIIAYgBEcNAAsLIAhBAXELAFgEbmFtZQATEmVhcnRobGluZV9qdXIud2FzbQEoAgAOcG9pbnRfaW5fZWRnZXMBFXBvaW50X2luX2p1cmlzZGljdGlvbgcSAQAPX19zdGFja19wb2ludGVyAH8JcHJvZHVjZXJzAQxwcm9jZXNzZWQtYnkBBWNsYW5nXzE3LjAuMCAoaHR0cHM6Ly9naXRodWIuY29tL3N3aWZ0bGFuZy9sbHZtLXByb2plY3QuZ2l0IDEwOTk5YjZkMDM0ZmUzMThmM2Q1NmM4M2JkZGI2NTcyNTkzYThiYjApAEkPdGFyZ2V0X2ZlYXR1cmVzBCsKbXVsdGl2YWx1ZSsPbXV0YWJsZS1nbG9iYWxzKw9yZWZlcmVuY2UtdHlwZXMrCHNpZ24tZXh0'),bytes17321=new Uint8Array(raw17321.length);
      for(let i17321=0;i17321<raw17321.length;i17321++)bytes17321[i17321]=raw17321.charCodeAt(i17321);
      const module17321=new WebAssembly.Module(bytes17321),instance17321=new WebAssembly.Instance(module17321,{}),
            memory17321=instance17321.exports.memory,pointEdges17321=instance17321.exports.point_in_edges,
            pointJur17321=instance17321.exports.point_in_jurisdiction;
      if(!memory17321||typeof pointEdges17321!=='function'||typeof pointJur17321!=='function')return null;
      const heapGlobal17321=instance17321.exports.__heap_base;
      let next17321=((Number(heapGlobal17321&&heapGlobal17321.value!==undefined?heapGlobal17321.value:heapGlobal17321)||65536)+7)&~7;
      function alloc17321(bytes17321){
        const ptr17321=next17321;next17321=(next17321+bytes17321+7)&~7;
        if(next17321>memory17321.buffer.byteLength)memory17321.grow(Math.ceil((next17321-memory17321.buffer.byteLength)/65536));
        return ptr17321;
      }
      return {memory:memory17321,pointEdges:pointEdges17321,pointJur:pointJur17321,alloc:alloc17321};
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
      if(earthlineJurWasm17321){
        for(const [bin16722,list16722] of bins16722){
          const count16722=list16722.length,ptr16722=earthlineJurWasm17321.alloc(count16722*56),
                flat16722=new Float64Array(earthlineJurWasm17321.memory.buffer,ptr16722,count16722*7);
          let k16722=0;for(const edge16722 of list16722)for(let q16722=0;q16722<7;q16722++)flat16722[k16722++]=edge16722[q16722];
          bins16722.set(bin16722,{ptr:ptr16722,count:count16722,edges:list16722});
        }
      }
      idx16722={scale:scale16722,bins:bins16722,wasm:!!earthlineJurWasm17321};earthlineRingIndexCache16722.set(ring16722,idx16722);
    }
    const x16722=Number(p16722[0]),y16722=Number(p16722[1]),entry16722=idx16722.bins.get(Math.floor(y16722*idx16722.scale));
    if(!entry16722)return false;
    if(idx16722.wasm&&entry16722&&Number.isInteger(entry16722.ptr))return !!earthlineJurWasm17321.pointEdges(x16722,y16722,entry16722.ptr,entry16722.count);
    const edges16722=entry16722.edges||entry16722;let inside16722=false;
    for(const edge16722 of edges16722){
      const x116722=edge16722[0],y116722=edge16722[1],x216722=edge16722[2],y216722=edge16722[3],dx16722=edge16722[4],dy16722=edge16722[5],len16722=edge16722[6];
      if(len16722<1e-20){if((x16722-x116722)*(x16722-x116722)+(y16722-y116722)*(y16722-y116722)<1e-20)return true;}
      else{const cross16722=Math.abs((x16722-x116722)*dy16722-(y16722-y116722)*dx16722);if(cross16722<=1e-10){const dot16722=(x16722-x116722)*dx16722+(y16722-y116722)*dy16722;if(dot16722>=0&&dot16722<=len16722)return true;}}
      if(((y216722>y16722)!==(y116722>y16722))&&(x16722<(x116722-x216722)*(y16722-y216722)/((y116722-y216722)||1e-15)+x216722))inside16722=!inside16722;
    }
    return inside16722;
  }"""
if s.count(old_ring)!=1: raise SystemExit(f"ring anchor count {s.count(old_ring)}")
s=s.replace(old_ring,new_ring,1)

old_prepare="""  function earthlinePrepareJurisdiction16539(g){
    if(!g)return null;if(g.prepared16539===true)return g;
    const rawPolys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
    const polygons=[];for(const rings of rawPolys){if(!Array.isArray(rings)||!rings.length)continue;const outer=rings[0],bbox=earthlineRingBounds16539(outer);if(!bbox)continue;const holes=[];for(let i=1;i<rings.length;i++){const hb=earthlineRingBounds16539(rings[i]);if(hb)holes.push({ring:rings[i],bbox:hb});}polygons.push({outer,bbox,holes});}
    return {prepared16539:true,polygons};
  }"""
new_prepare="""  const earthlinePreparedJurisdictionCache17321=new WeakMap(),earthlineJurisdictionMetaCache17321=new WeakMap();
  function earthlinePrepareJurisdiction16539(g){
    if(!g)return null;if(g.prepared16539===true)return g;
    if((typeof g==='object'||typeof g==='function')&&earthlinePreparedJurisdictionCache17321.has(g))return earthlinePreparedJurisdictionCache17321.get(g);
    const rawPolys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
    const polygons=[];for(const rings of rawPolys){if(!Array.isArray(rings)||!rings.length)continue;const outer=rings[0],bbox=earthlineRingBounds16539(outer);if(!bbox)continue;const holes=[];for(let i=1;i<rings.length;i++){const hb=earthlineRingBounds16539(rings[i]);if(hb)holes.push({ring:rings[i],bbox:hb});}polygons.push({outer,bbox,holes});}
    const prepared17321={prepared16539:true,polygons};
    if(typeof g==='object'||typeof g==='function')earthlinePreparedJurisdictionCache17321.set(g,prepared17321);
    return prepared17321;
  }
  function earthlineEnsureJurisdictionMeta17321(prepared17321){
    if(!earthlineJurWasm17321||!prepared17321||!Array.isArray(prepared17321.polygons))return null;
    if(earthlineJurisdictionMetaCache17321.has(prepared17321))return earthlineJurisdictionMetaCache17321.get(prepared17321);
    const ringRows17321=[],polyRows17321=[];
    for(const poly17321 of prepared17321.polygons){
      const ringStart17321=ringRows17321.length,rings17321=[{ring:poly17321.outer,bbox:poly17321.bbox},...(poly17321.holes||[])];
      for(const row17321 of rings17321){
        const ring17321=row17321.ring,bbox17321=row17321.bbox;if(!ring17321||!bbox17321)continue;
        if(!earthlineRingIndexCache16722.has(ring17321))earthlinePointInRingIndexed16722([Number(bbox17321[0]),Number(bbox17321[1])],ring17321);
        const idx17321=earthlineRingIndexCache16722.get(ring17321);if(!idx17321||!idx17321.wasm){earthlineJurisdictionMetaCache17321.set(prepared17321,null);return null;}
        const keys17321=Array.from(idx17321.bins.keys());if(!keys17321.length)continue;
        const minBin17321=Math.min(...keys17321),maxBin17321=Math.max(...keys17321),span17321=maxBin17321-minBin17321+1,
              ptrsPtr17321=earthlineJurWasm17321.alloc(span17321*4),countsPtr17321=earthlineJurWasm17321.alloc(span17321*4),
              ptrs17321=new Uint32Array(earthlineJurWasm17321.memory.buffer,ptrsPtr17321,span17321),
              counts17321=new Uint32Array(earthlineJurWasm17321.memory.buffer,countsPtr17321,span17321);
        for(let bin17321=minBin17321;bin17321<=maxBin17321;bin17321++){
          const entry17321=idx17321.bins.get(bin17321),k17321=bin17321-minBin17321;
          if(entry17321&&Number.isInteger(entry17321.ptr)){ptrs17321[k17321]=entry17321.ptr;counts17321[k17321]=entry17321.count||0;}
        }
        ringRows17321.push([Number(bbox17321[0]),Number(bbox17321[1]),Number(bbox17321[2]),Number(bbox17321[3]),minBin17321,maxBin17321,ptrsPtr17321,countsPtr17321]);
      }
      polyRows17321.push([ringStart17321,ringRows17321.length-ringStart17321]);
    }
    if(!ringRows17321.length||!polyRows17321.length)return null;
    const ringPtr17321=earthlineJurWasm17321.alloc(ringRows17321.length*64),polyPtr17321=earthlineJurWasm17321.alloc(polyRows17321.length*8),
          ringFlat17321=new Float64Array(earthlineJurWasm17321.memory.buffer,ringPtr17321,ringRows17321.length*8),
          polyFlat17321=new Int32Array(earthlineJurWasm17321.memory.buffer,polyPtr17321,polyRows17321.length*2);
    let ri17321=0;for(const row17321 of ringRows17321)for(const v17321 of row17321)ringFlat17321[ri17321++]=v17321;
    let pi17321=0;for(const row17321 of polyRows17321)for(const v17321 of row17321)polyFlat17321[pi17321++]=v17321;
    const meta17321={ringPtr:ringPtr17321,polyPtr:polyPtr17321,polyCount:polyRows17321.length};
    earthlineJurisdictionMetaCache17321.set(prepared17321,meta17321);return meta17321;
  }"""
if s.count(old_prepare)!=1: raise SystemExit(f"prepare anchor count {s.count(old_prepare)}")
s=s.replace(old_prepare,new_prepare,1)

old_point="""  function earthlinePointInJurisdiction16539(p,g){
    if(!g)return false;
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return false;
    for(const poly of prepared.polygons||[]){if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInRingIndexed16722(p,poly.outer))continue;let inHole=false;for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInRingIndexed16722(p,h.ring)){inHole=true;break;}}if(!inHole)return true;}
    return false;
  }"""
new_point="""  function earthlinePointInJurisdiction16539(p,g){
    if(!g||!earthlineFinitePoint16539(p))return false;
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return false;
    const meta17321=earthlineEnsureJurisdictionMeta17321(prepared);
    if(meta17321)return !!earthlineJurWasm17321.pointJur(Number(p[0]),Number(p[1]),meta17321.ringPtr,meta17321.polyPtr,meta17321.polyCount);
    for(const poly of prepared.polygons||[]){if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInRingIndexed16722(p,poly.outer))continue;let inHole=false;for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInRingIndexed16722(p,h.ring)){inHole=true;break;}}if(!inHole)return true;}
    return false;
  }"""
if s.count(old_point)!=1: raise SystemExit(f"point owner anchor count {s.count(old_point)}")
s=s.replace(old_point,new_point,1)

s="<!-- EARTHLINE_WASM_JURISDICTION_KERNEL_17321: prepared geometry cached by source object; exact bbox/outer/hole jurisdiction classification executes in synchronous WASM using the same latitude-bin edges and tolerances; JS fallback preserved. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed full WASM jurisdiction kernel + prepared cache 17321")
