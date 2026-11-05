import {validatePublication} from './publication-gate.mjs';

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}
function immutableCopy(value) { return deepFreeze(structuredClone(value)); }
const validTarget = target => target && typeof target === 'object' &&
  Number.isFinite(target.lon) && Number.isFinite(target.lat) &&
  target.lon >= -180 && target.lon <= 180 && target.lat >= -90 && target.lat <= 90;

/** One owner for current science and publication; renderer is a subscriber. */
export function createAnalysisOwner() {
  let sequence = 0;
  let active = null;
  function begin(tier, target) {
    if (!['regional', 'property'].includes(tier)) throw new TypeError('Invalid analysis tier');
    if (!validTarget(target)) throw new TypeError('Target lon/lat required');
    if (active) active.controller.abort('superseded');
    const controller = new AbortController();
    const id = 'run-' + (++sequence);
    active = {id, tier, target: immutableCopy(target), controller,
      status: 'running', publication: null, errors: []};
    return Object.freeze({id, tier, target: active.target, signal: controller.signal});
  }
  function isCurrent(token) {
    return !!active && !!token && active.id === token.id &&
      active.tier === token.tier && !active.controller.signal.aborted;
  }
  function publish(token, candidate) {
    if (!isCurrent(token)) return {accepted: false, status: 'stale'};
    if (active.status !== 'running') return {accepted: false, status: 'settled'};
    if (candidate?.runId !== token.id || candidate?.tier !== token.tier) {
      active.status = 'blocked';
      active.publication = null;
      active.errors = ['RUN_OR_TIER_MISMATCH'];
      return {accepted: false, status: 'blocked', errors: [...active.errors]};
    }
    const verdict = validatePublication(candidate);
    if (verdict.status === 'blocked') {
      active.status = 'blocked';
      active.publication = null;
      active.errors = [...verdict.errors];
      return {accepted: false, status: 'blocked', errors: [...active.errors]};
    }
    active.status = verdict.status;
    active.publication = immutableCopy(candidate);
    active.errors = [];
    return {accepted: true, status: verdict.status};
  }
  function cancel(token) {
    if (!isCurrent(token)) return false;
    active.controller.abort('cancelled');
    active.status = 'cancelled';
    active.publication = null;
    return true;
  }
  function snapshot() {
    return active ? immutableCopy({id: active.id, tier: active.tier,
      target: active.target, status: active.status,
      publication: active.publication, errors: active.errors}) : null;
  }
  return Object.freeze({begin, isCurrent, publish, cancel, snapshot});
}
