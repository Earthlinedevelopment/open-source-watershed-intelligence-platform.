/* Topology checks only. Scientific corridor geometry must come from the hydrology engine. */
const EPS = 1e-12;

export function validLonLat(point) {
  return Array.isArray(point) && point.length === 2 &&
    point.every(Number.isFinite) && point[0] >= -180 && point[0] <= 180 &&
    point[1] >= -90 && point[1] <= 90;
}
function turn(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) -
    (b[1] - a[1]) * (c[0] - a[0]);
}
function between(a, b, x) {
  return x >= Math.min(a, b) - EPS && x <= Math.max(a, b) + EPS;
}
function onSegment(a, b, p) {
  return Math.abs(turn(a, b, p)) <= EPS &&
    between(a[0], b[0], p[0]) && between(a[1], b[1], p[1]);
}
function intersects(a, b, c, d) {
  const t1 = turn(a, b, c), t2 = turn(a, b, d);
  const t3 = turn(c, d, a), t4 = turn(c, d, b);
  if (((t1 > EPS && t2 < -EPS) || (t1 < -EPS && t2 > EPS)) &&
      ((t3 > EPS && t4 < -EPS) || (t3 < -EPS && t4 > EPS))) return true;
  return (Math.abs(t1) <= EPS && onSegment(a, b, c)) ||
    (Math.abs(t2) <= EPS && onSegment(a, b, d)) ||
    (Math.abs(t3) <= EPS && onSegment(c, d, a)) ||
    (Math.abs(t4) <= EPS && onSegment(c, d, b));
}
export function validatePolyline(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2)
    return ['GEOMETRY_TOO_SHORT'];
  if (!coordinates.every(validLonLat)) return ['GEOMETRY_INVALID_COORDINATES'];
  for (let i = 1; i < coordinates.length; i++) {
    if (coordinates[i][0] === coordinates[i - 1][0] &&
        coordinates[i][1] === coordinates[i - 1][1])
      return ['GEOMETRY_DUPLICATE_VERTEX'];
  }
  if (coordinates.length > 2 &&
      coordinates[0][0] === coordinates.at(-1)[0] &&
      coordinates[0][1] === coordinates.at(-1)[1])
    return ['GEOMETRY_CLOSED_LOOP'];
  // A planar topological screen, not projected/geodesic scientific validation.
  for (let i = 0; i < coordinates.length - 1; i++)
    for (let j = i + 2; j < coordinates.length - 1; j++)
      if (intersects(coordinates[i], coordinates[i + 1], coordinates[j], coordinates[j + 1]))
        return ['GEOMETRY_SELF_INTERSECTS'];
  return [];
}
export function svgPolylinePath(points) {
  if (!Array.isArray(points) || points.length < 2 ||
      !points.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)))
    throw new TypeError('Valid projected points required');
  return points.map((p, i) => (i ? 'L ' : 'M ') + p[0] + ' ' + p[1]).join(' ');
}
