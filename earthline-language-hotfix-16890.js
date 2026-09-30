(function(){
'use strict';
const KEY='earthlineLanguage16488';
const VALID=['en','es','vi','th'];
const D={
  en:{language:'Language',search:'Search',property:'Property Modelling',report:'Bioswale Impact Report',status:'Status',results:'Results',swales:'Swales Explained',process:'The Earthline Process',data:'DATA',contact:'CONTACT',login:'LOGIN',run:'RUN ANALYSIS',runFirst:'RUN ANALYSIS FIRST',runRegion:'RUN REGION',runProperty:'RUN PROPERTY',placeholder:'Search a location',gauge:'Recharge Potential',rain:'Average yearly rainfall:',sentence:'Earthline analyzes slope and water paths to identify optimum aquifer recharge locations — in any location.',note:'All sites need to be verified by a professional landscape expert.'},
  es:{language:'Idioma',search:'Buscar',property:'Modelado de propiedad',report:'Informe de impacto de bioswales',status:'Estado',results:'Resultados',swales:'Bioswales explicados',process:'El proceso Earthline',data:'DATOS',contact:'CONTACTO',login:'INICIAR SESIÓN',run:'EJECUTAR ANÁLISIS',runFirst:'EJECUTE EL ANÁLISIS PRIMERO',runRegion:'EJECUTAR REGIÓN',runProperty:'EJECUTAR PROPIEDAD',placeholder:'Buscar una ubicación',gauge:'Potencial de recarga',rain:'Precipitación media anual:',sentence:'Earthline analiza la pendiente y las rutas del agua para identificar ubicaciones óptimas de recarga de acuíferos — en cualquier lugar.',note:'Todos los sitios deben ser verificados por un profesional del paisaje.'},
  vi:{language:'Ngôn ngữ',search:'Tìm kiếm',property:'Mô hình hóa khu đất',report:'Báo cáo tác động rãnh sinh học',status:'Trạng thái',results:'Kết quả',swales:'Giải thích rãnh sinh học',process:'Quy trình Earthline',data:'DỮ LIỆU',contact:'LIÊN HỆ',login:'ĐĂNG NHẬP',run:'CHẠY PHÂN TÍCH',runFirst:'CHẠY PHÂN TÍCH TRƯỚC',runRegion:'CHẠY KHU VỰC',runProperty:'CHẠY KHU ĐẤT',placeholder:'Tìm kiếm địa điểm',gauge:'Tiềm năng bổ cập',rain:'Lượng mưa trung bình năm:',sentence:'Earthline phân tích độ dốc và đường đi của nước để xác định vị trí tối ưu cho bổ cập tầng chứa nước — ở bất kỳ nơi nào.',note:'Mọi địa điểm cần được chuyên gia cảnh quan xác minh.'},
  th:{language:'ภาษา',search:'ค้นหา',property:'การจำลองพื้นที่',report:'รายงานผลกระทบร่องชีวภาพ',status:'สถานะ',results:'ผลลัพธ์',swales:'อธิบายร่องชีวภาพ',process:'กระบวนการ Earthline',data:'ข้อมูล',contact:'ติดต่อ',login:'เข้าสู่ระบบ',run:'เรียกใช้การวิเคราะห์',runFirst:'เรียกใช้การวิเคราะห์ก่อน',runRegion:'เรียกใช้ภูมิภาค',runProperty:'เรียกใช้พื้นที่',placeholder:'ค้นหาสถานที่',gauge:'ศักยภาพการเติมน้ำ',rain:'ปริมาณฝนเฉลี่ยต่อปี:',sentence:'Earthline วิเคราะห์ความลาดชันและเส้นทางน้ำเพื่อระบุตำแหน่งที่เหมาะสมที่สุดสำหรับการเติมน้ำลงสู่ชั้นหินอุ้มน้ำ — ในทุกพื้นที่',note:'ทุกพื้นที่ควรได้รับการตรวจสอบโดยผู้เชี่ยวชาญด้านภูมิทัศน์'}
};
const exact=v=>VALID.includes(String(v||'').toLowerCase())?String(v).toLowerCase():'en';
const setText=(q,v)=>{const e=document.querySelector(q);if(e)e.textContent=v;};
function normalizeRunText(t){return String(t||'').replace(/\s+/g,' ').trim()}
function desiredRunText(code,current){
  const d=D[code], t=normalizeRunText(current), all=Object.values(D);
  if(all.some(x=>t===x.runFirst))return d.runFirst;
  if(all.some(x=>t===x.runRegion))return d.runRegion;
  if(all.some(x=>t===x.runProperty))return d.runProperty;
  if(all.some(x=>t===x.run)||!t)return d.run;
  return null;
}
function syncRun(code){
  const run=document.getElementById('runBtn');
  if(!run)return;
  const next=desiredRunText(code,run.textContent);
  if(next&&normalizeRunText(run.textContent)!==next)run.textContent=next;
}
function apply(code,persist=true){
  code=exact(code); const d=D[code];
  window.EARTHLINE_LANGUAGE_16488=code;
  document.documentElement.lang=code;
  document.documentElement.dataset.earthlineLanguageApplied16890=code;
  if(persist){try{localStorage.setItem(KEY,code)}catch(_){}}
  const sel=document.getElementById('earthlineLanguage16488'); if(sel&&sel.value!==code)sel.value=code;
  setText('#earthlineLanguageLabel16488',d.language);
  setText('#earthlineSearchSection16188 .el-panel-label-16188',d.search);
  setText('#earthlinePropertySection16188 .el-panel-label-16188',d.property);
  setText('#earthlineReportSection16188 .el-panel-label-16188',d.report);
  setText('#earthlineStatusSection16188 .el-panel-label-16188',d.status);
  setText('#earthlineResultsSection16188 .el-panel-label-16188',d.results);
  setText('#earthlineRailData16488 .earthline-data-label-16488',d.data);
  setText('#earthlineRailContact16512 .earthline-contact-label-16512',d.contact);
  setText('#earthlineLaunchLogin16872',d.login);
  const input=document.getElementById('searchInput'); if(input)input.placeholder=d.placeholder;
  setText('.earthline-recharge-gauge-label-16488',d.gauge);
  setText('.earthline-rainfall-label-16488',d.rain);
  setText('.earthline-engine-sentence-16488',d.sentence);
  setText('.earthline-professional-note-16488',d.note);
  const links=document.querySelectorAll('#earthlineHamburgerMenu16233 a');
  if(links[0]){const s=links[0].querySelector('span:last-child');if(s)s.textContent=d.swales;}
  if(links[1]){const s=links[1].querySelector('span:last-child');if(s)s.textContent=d.process;}
  syncRun(code);
  try{if(typeof window.renderAccount==='function')window.renderAccount()}catch(_){}
  return code;
}
function bindRunGuard(){
  const run=document.getElementById('runBtn');
  if(!run||run.dataset.earthlineLanguageGuard16891==='1')return;
  run.dataset.earthlineLanguageGuard16891='1';
  const mo=new MutationObserver(()=>syncRun(exact(window.EARTHLINE_LANGUAGE_16488||'en')));
  mo.observe(run,{childList:true,subtree:true,characterData:true});
}
function bind(){
  const sel=document.getElementById('earthlineLanguage16488');
  if(!sel)return false;
  if(sel.dataset.earthlineExactOwner16890!=='1'){
    sel.dataset.earthlineExactOwner16890='1';
    sel.addEventListener('change',function(ev){
      ev.stopImmediatePropagation();
      apply(sel.value,true);
      try{document.dispatchEvent(new CustomEvent('earthline:language-changed',{detail:{language:exact(sel.value),owner:'16891'}}))}catch(_){}
    },true);
  }
  bindRunGuard();
  let saved='en';try{saved=localStorage.getItem(KEY)||sel.value||'en'}catch(_){saved=sel.value||'en'}
  apply(saved,false);
  return true;
}
window.earthlineApplyUiLanguage16871=function(next){return apply(next,false)};
window.earthlineApplyLanguage16890=apply;
window.earthlineLanguageOwner16890=Object.freeze({build:'EARTHLINE 16891',rule:'exact selector value is sole language authority; late run-state repaint is translated by the same owner'});
function boot(){bind();apply(window.EARTHLINE_LANGUAGE_16488||document.getElementById('earthlineLanguage16488')?.value||'en',false)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
document.addEventListener('earthline:analysis-complete',()=>apply(window.EARTHLINE_LANGUAGE_16488||'en',false),{passive:true});
document.addEventListener('earthline:analysis-failed',()=>apply(window.EARTHLINE_LANGUAGE_16488||'en',false),{passive:true});
})();
