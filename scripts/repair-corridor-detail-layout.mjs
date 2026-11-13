// Scoped repair of the original corridor detail owner. No swale/engine logic changed.
// Input must be the October production index blob 70a7a63b... or the staging equivalent.
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const file='index.html';
let html=readFileSync(file,'utf8');
function replaceOnce(before,after,label){
  const occurrences=html.split(before).length-1;
  assert.equal(occurrences,1,label+' expected once, found '+occurrences);
  html=html.replace(before,after);
}
replaceOnce(
 '.el49-detail-shell{width:min(680px,96vw);max-height:90vh;overflow:auto;border:1px solid #36576b;border-radius:20px;background:#0c1720;color:#eaf4f8}',
 '.el49-detail-shell{box-sizing:border-box;display:flex;flex-direction:column;width:min(680px,96vw);max-height:min(90dvh,calc(100vh - 24px));overflow:hidden;border:1px solid #36576b;border-radius:20px;background:#0c1720;color:#eaf4f8}',
 'detail-shell');
replaceOnce(
 '.el49-detail-body{padding:24px}',
 '.el49-detail-body{padding:24px;overflow-y:auto;overscroll-behavior:contain;flex:1 1 auto;min-height:0}',
 'detail-body');
replaceOnce(
 '.el49-detail-actions{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}',
 '.el49-detail-actions{display:flex;gap:10px;flex-wrap:wrap;flex:0 0 auto;align-items:center;padding:14px 24px calc(14px + env(safe-area-inset-bottom));border-top:1px solid #294353;background:#0c1720}.el49-detail-actions .el49-tool{max-width:100%;white-space:normal;line-height:1.25}',
 'detail-actions');
replaceOnce(
 '<p class="el49-id">${esc(stable)}</p><div class="el49-detail-actions">',
 '<p class="el49-id">${esc(stable)}</p></div><div class="el49-detail-actions">',
 'detail-footer-start');
replaceOnce(
 'data-action="report">Open full impact report</button></div></div></article>`;',
 'data-action="report">Open full impact report</button></div></article>`;',
 'detail-footer-end');
replaceOnce(
 '/* Full-screen map. */',
 `/* Existing corridor-detail owner hides obsolete launch buttons during its modal. */
html:has(#earthlineCorridorDetail16149.open) #earthlineLaunchLogin16872,
html:has(#earthlineCorridorDetail16149.open) #earthlineLaunchDonate16872,
html:has(#earthlineCorridorDetail16149.open) #earthlineLaunchMerch16872{display:none!important;visibility:hidden!important;pointer-events:none!important}

/* Full-screen map. */`,
 'legacy-left-rail');
assert(html.includes('data-action="zoom">ZOOM TO THIS LOCATION</button>'));
writeFileSync(file,html);
console.log('PASS: six targeted owner edits; zoom action remains in non-scrolling footer');
