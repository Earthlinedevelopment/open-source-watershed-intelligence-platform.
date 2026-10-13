import { EARTHLINE_V2_HYDROGEOLOGY_ADAPTER } from './hydrogeology-source-adapter.js';
import { EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT_OWNER } from './hydrogeology-transport.js';
import { EARTHLINE_V2_NAIP, buildNaipExportUrl, loadNaipImage } from './naip-imagery-adapter.js';

export const EARTHLINE_V2_BUILD = '17138';
const V2_STABILITY_CSS = './v2/stability-compat.css';

function ensureV2StabilityCss(){
  let link=document.getElementById('earthlineV2StabilityCss17138');
  if(link)return link;
  link=document.createElement('link');
  link.id='earthlineV2StabilityCss17138';
  link.rel='stylesheet';
  link.href=V2_STABILITY_CSS;
  (document.head||document.documentElement).appendChild(link);
  return link;
}

const frozen = value => Object.freeze(value);

function elderCapability() {
  const runtime = window.EARTHLINE_ELDER_TREES_V2_17118 || null;
  return frozen({
    available: !!runtime,
    scienceBaseline: '17118',
    method: 'earthline-elder-tree-aoi-chmv2-v0.7-high-recall-plateau-collapse',
    rechargeWeight: 0,
    runtime
  });
}

export function v2Capabilities() {
  return frozen({
    build: EARTHLINE_V2_BUILD,
    baseV1Commit: '4e80d2a5bfb1ba64661bcf5b9e5c91a0b677c398',
    hydrogeology: frozen({
      adapter: EARTHLINE_V2_HYDROGEOLOGY_ADAPTER,
      transport: EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT_OWNER
    }),
    elderTrees: elderCapability(),
    imagery: frozen({
      config: EARTHLINE_V2_NAIP,
      buildNaipExportUrl,
      loadNaipImage
    })
  });
}

export function installEarthlineV2() {
  ensureV2StabilityCss();
  if (window.EARTHLINE_V2?.build === EARTHLINE_V2_BUILD) return window.EARTHLINE_V2;
  const api = frozen({
    build: EARTHLINE_V2_BUILD,
    state: 'compatibility-shell',
    productionMutationAllowed: false,
    renderedPageIsAcceptanceAuthority: true,
    capabilities: v2Capabilities
  });
  window.EARTHLINE_V2 = api;
  document.documentElement.dataset.earthlineV2 = EARTHLINE_V2_BUILD;
  document.dispatchEvent(new CustomEvent('earthline:v2-ready', { detail: { build: EARTHLINE_V2_BUILD } }));
  return api;
}

if (typeof window !== 'undefined') installEarthlineV2();
