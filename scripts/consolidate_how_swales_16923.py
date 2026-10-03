from pathlib import Path

p = Path("index.html")
s = p.read_text(errors="ignore")

marker = "const HOW_BIOSWALES_REPORT_16388="
if marker not in s:
    raise SystemExit("HOW_BIOSWALES_REPORT_16388 not found")

anchor = "  const EARTHLINE_CORRECTIONS_REGISTRY_16513="
if anchor not in s:
    raise SystemExit("Corrections registry anchor not found")

canonical = """  function earthlineCanonicalHowBioswales16923(){
    return HOW_BIOSWALES_REPORT_16388.slice();
  }
  window.earthlineCanonicalHowBioswales16923=earthlineCanonicalHowBioswales16923;
"""
if "earthlineCanonicalHowBioswales16923" not in s:
    s = s.replace(anchor, canonical + anchor, 1)

old = "function howBioswalesReportPages16388(data){const found=[];const cleaned=HOW_BIOSWALES_REPORT_16388.map(body=>"
new = "function howBioswalesReportPages16388(data){const found=[];const cleaned=earthlineCanonicalHowBioswales16923().map(body=>"
if old in s:
    s = s.replace(old, new, 1)

needle = '      src=src.replace(\'</head>\',"<style id=\\\"earthline-swales-professional-16389\\\">'
if needle not in s:
    raise SystemExit("Swales page style injection anchor not found")

injection = """      try{
        const canonicalParts=earthlineCanonicalHowBioswales16923();
        const sourceStart=canonicalParts.findIndex(x=>/\\<h2\\>Sources\\<\\/h2\\>/i.test(String(x||'')));
        const bodyParts=(sourceStart>=0?canonicalParts.slice(0,sourceStart):canonicalParts).join('');
        const sourceParts=(sourceStart>=0?canonicalParts.slice(sourceStart):[]).join('');
        const canonicalBlock='<section id="earthlineCanonicalHowBioswales16923" class="earthline-canonical-how-16923"><div class="ehead"><h1>How Bioswales Work</h1><p>One complete explanation — mechanism, evidence, limits, precedents, and field use — without duplicated sections.</p></div>'+bodyParts+'</section>';
        const sourceBlock=sourceParts?'<section id="earthlineCanonicalHowBioswalesSources16923" class="earthline-canonical-sources-16923">'+sourceParts+'</section>':'';
        const mainOpen=src.indexOf('<main');
        const mainOpenEnd=mainOpen>=0?src.indexOf('>',mainOpen):-1;
        const matureStart=src.indexOf('<section aria-labelledby="swaleExamplesTitle"');
        const mainClose=src.lastIndexOf('</main>');
        if(mainOpenEnd>=0&&mainClose>mainOpenEnd){
          let preserved='';
          if(matureStart>=0&&matureStart<mainClose) preserved=src.slice(matureStart,mainClose);
          preserved=preserved
            .replace(/<section[^>]*id=["']earthlineSuccessfulSystems16149["'][\\s\\S]*?<\\/section>/gi,'')
            .replace(/<section[^>]*class=["'][^"']*el12-corrections[^"']*["'][\\s\\S]*?<\\/section>/gi,'')
            .replace(/<section[^>]*class=["'][^"']*el-precedent-16148[^"']*["'][\\s\\S]*?<\\/section>/gi,'');
          src=src.slice(0,mainOpenEnd+1)+canonicalBlock+preserved+sourceBlock+src.slice(mainClose);
        }
      }catch(e){console.warn('[Earthline 16923] canonical How Bioswales merge failed',e)}
"""
if "canonical How Bioswales merge failed" not in s:
    s = s.replace(needle, injection + needle, 1)

style_anchor = "html,body{background:#eef1ef!important;color:#17323d!important}"
style_add = """html,body{background:#eef1ef!important;color:#17323d!important}
.earthline-canonical-how-16923,.earthline-canonical-sources-16923{max-width:1180px;margin:0 auto 28px;padding:34px 42px;border:1px solid #c8d2cd;border-radius:20px;background:#f8f8f5;color:#253940}
.earthline-canonical-how-16923 h1,.earthline-canonical-how-16923 h2,.earthline-canonical-how-16923 h3,.earthline-canonical-sources-16923 h2{color:#17323d!important}
.earthline-canonical-how-16923 p,.earthline-canonical-how-16923 li,.earthline-canonical-sources-16923 p{color:#354a52!important;font-size:17px;line-height:1.72}
.earthline-canonical-how-16923 strong{color:#17323d!important}
.earthline-canonical-how-16923 hr{border:0;border-top:1px solid #cbd5d0;margin:30px 0}
"""
if ".earthline-canonical-how-16923" not in s and style_anchor in s:
    s = s.replace(style_anchor, style_add, 1)

p.write_text(s)
