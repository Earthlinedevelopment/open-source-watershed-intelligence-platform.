#!/usr/bin/env python3
"""Builds a Mapbox-Vector-Tile fixture with an encoder written independently of the bridge's decoder.
Writes tests/fixtures/tile.pbf and tests/fixtures/fixture.json (features in lng/lat, tile coordinates)."""
import json, math, os, sys
Z = 15
EXTENT = 4096
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'fixtures')

def varint(n):
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            return bytes(out)

def zz(n):
    return (n << 1) ^ (n >> 63) if n < 0 else n << 1

def tag(field, wt):
    return varint((field << 3) | wt)

def ld(field, payload):
    return tag(field, 2) + varint(len(payload)) + payload

def vint(field, n):
    return tag(field, 0) + varint(n)

def ll_to_tilepx(lng, lat, tx, ty):
    n = 2 ** Z
    x = (lng + 180.0) / 360.0 * n
    s = math.sin(math.radians(lat))
    y = (0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)) * n
    return round((x - tx) * EXTENT), round((y - ty) * EXTENT)

def tile_of(lng, lat):
    n = 2 ** Z
    x = (lng + 180.0) / 360.0 * n
    s = math.sin(math.radians(lat))
    y = (0.5 - math.log((1 + s) / (1 - s)) / (4 * math.pi)) * n
    return int(math.floor(x)), int(math.floor(y))

def geom_cmds(parts, closed):
    cmds = []
    cx = cy = 0
    for part in parts:
        pts = part[:-1] if (closed and part[0] == part[-1]) else part
        cmds.append((1 & 7) | (1 << 3))
        cmds += [zz(pts[0][0] - cx), zz(pts[0][1] - cy)]
        cx, cy = pts[0]
        if len(pts) > 1:
            cmds.append((2 & 7) | ((len(pts) - 1) << 3))
            for p in pts[1:]:
                cmds += [zz(p[0] - cx), zz(p[1] - cy)]
                cx, cy = p
        if closed:
            cmds.append((7 & 7) | (1 << 3))
    return cmds

def value_msg(v):
    if isinstance(v, bool):
        return ld(4 + 3, b'')  # not used
    if isinstance(v, str):
        return ld(1, v.encode('utf-8'))
    if isinstance(v, int):
        return vint(5, v)
    raise ValueError(v)

def layer_msg(name, feats):
    keys, vals, kidx, vidx = [], [], {}, {}
    body = ld(1, name.encode()) + vint(15, 2)
    fmsgs = b''
    for f in feats:
        tags = []
        for k, v in f['props'].items():
            if k not in kidx:
                kidx[k] = len(keys); keys.append(k)
            if (k, v) not in vidx:
                vidx[(k, v)] = len(vals); vals.append(v)
            tags += [kidx[k], vidx[(k, v)]]
        fb = b''
        if tags:
            fb += ld(2, b''.join(varint(t) for t in tags))
        fb += vint(3, f['type'])
        fb += ld(4, b''.join(varint(c) for c in f['cmds']))
        fmsgs += ld(2, fb)
    body += fmsgs
    for k in keys:
        body += ld(3, k.encode())
    for v in vals:
        body += ld(4, value_msg(v))
    body += vint(5, EXTENT)
    return ld(3, body)

def main():
    lng0, lat0 = -93.68, 42.13
    tx, ty = tile_of(lng0, lat0)
    # centre the property on the tile so it is fully inside this one tile
    n = 2 ** Z
    lng0 = (tx + 0.5) / n * 360.0 - 180.0
    yc = (ty + 0.5) / n
    lat0 = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * yc))))
    dlat = 1.0 / 111320.0
    dlng = 1.0 / (111320.0 * math.cos(math.radians(lat0)))
    def P(east_m, north_m):
        return (lng0 + east_m * dlng, lat0 + north_m * dlat)
    def rect(e0, n0, e1, n1):
        return [P(e0, n0), P(e1, n0), P(e1, n1), P(e0, n1), P(e0, n0)]
    spec = {
        'road': [
            {'type': 2, 'props': {'class': 'street', 'structure': 'none'}, 'coords': [[P(-400, -120), P(400, -120)]]},
            {'type': 2, 'props': {'class': 'service', 'type': 'driveway', 'structure': 'none'}, 'coords': [[P(-60, -120), P(-60, -40)]]},
            {'type': 2, 'props': {'class': 'primary', 'structure': 'tunnel'}, 'coords': [[P(-400, 300), P(400, 300)]]},
            {'type': 2, 'props': {'class': 'ferry', 'structure': 'none'}, 'coords': [[P(-400, 320), P(400, 320)]]},
        ],
        'building': [
            {'type': 3, 'props': {'height': 6}, 'coords': [rect(60, 20, 72, 32)]},
        ],
        'landuse': [
            {'type': 3, 'props': {'class': 'parking'}, 'coords': [rect(-120, -90, -90, -70)]},
            {'type': 3, 'props': {'class': 'park'}, 'coords': [rect(-300, 200, -200, 260)]},
        ],
        'water': [
            {'type': 3, 'props': {'class': 'lake'}, 'coords': [rect(-250, 90, -190, 140)]},
        ],
        'waterway': [
            {'type': 2, 'props': {'class': 'stream'}, 'coords': [[P(150, -200), P(150, 0), P(130, 200)]]},
        ],
        'landuse_overlay': [
            {'type': 3, 'props': {'class': 'wetland'}, 'coords': [rect(-30, 150, 10, 190)]},
            {'type': 3, 'props': {'class': 'national_park'}, 'coords': [rect(300, 300, 350, 350)]},
        ],
    }
    msgs = b''
    sidecar = {'z': Z, 'x': tx, 'y': ty, 'center': [lng0, lat0], 'extent': EXTENT, 'features': {}}
    for lname, feats in spec.items():
        enc = []
        side = []
        for f in feats:
            parts = []
            for part in f['coords']:
                parts.append([ll_to_tilepx(lng, lat, tx, ty) for (lng, lat) in part])
            closed = f['type'] == 3
            if closed:
                parts = [p if p[0] == p[-1] else p + [p[0]] for p in parts]
            enc.append({'type': f['type'], 'props': f['props'], 'cmds': geom_cmds(parts, closed)})
            side.append({'type': f['type'], 'props': f['props'], 'lnglat': f['coords']})
        msgs += layer_msg(lname, enc)
        sidecar['features'][lname] = side
    # a second tile with an empty (but present) water layer, for the "all decoded, nothing mapped" case
    empty = layer_msg('water', [])
    os.makedirs(OUT, exist_ok=True)
    open(os.path.join(OUT, 'tile.pbf'), 'wb').write(msgs)
    open(os.path.join(OUT, 'tile-empty-layer.pbf'), 'wb').write(empty)
    json.dump(sidecar, open(os.path.join(OUT, 'fixture.json'), 'w'), indent=1)
    print('fixture tile', Z, tx, ty, 'bytes', len(msgs))

main()
