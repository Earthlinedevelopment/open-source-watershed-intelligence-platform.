"""Elder Tree bar test: synthetic canopy surfaces run through the detector exactly as the page's worker does.
Usage: python3 tests/elder-bar-test.py <candidate_detector.py> [baseline_detector.py]
Exit code 0 only if every check passes. No network, no map, no page."""
import sys, json, math, importlib.util, tempfile, os
import numpy as np

def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

R = 6378137.0
def lonlat_to_merc(lon, lat):
    return R * math.radians(lon), R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))

def blob(shape, r, c, height, radius):
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    return height * np.exp(-(((yy - r) ** 2 + (xx - c) ** 2) / (2 * (radius / 2.0) ** 2)))

def run(det, native, label):
    """native: float32 grid at 1 m; screen = 2x2 max-pool (screen pixel = 2 m)."""
    n = native.shape[0]; s = n // 2
    screen = native.reshape(s, 2, s, 2).max(axis=(1, 3)).astype(np.float32)
    ox, oy = lonlat_to_merc(-111.93067, 34.21568)
    w_lon, n_lat = det.mercator_to_lonlat(ox, oy)
    e_lon, s_lat = det.mercator_to_lonlat(ox + n, oy - n)
    meta = {"bbox": [w_lon, s_lat, e_lon, n_lat], "quadkey": "test", "source_url": "synthetic", "res_x": 1.0, "res_y": -1.0,
            "screen_col0": 0, "screen_row0": 0, "screen_ww": n, "screen_wh": n, "native_col0": 0, "native_row0": 0,
            "origin_x": ox, "origin_y": oy}
    with tempfile.TemporaryDirectory() as d:
        sp, np_ = os.path.join(d, "s.bin"), os.path.join(d, "n.bin")
        screen.astype("<f4").tofile(sp); native.astype("<f4").tofile(np_)
        out = det.detect_from_files(sp, s, s, np_, n, n, json.dumps(meta), 240, True)
    return out

def scene_scrub_with_trees(seed=7):
    rng = np.random.default_rng(seed); n = 300; g = np.zeros((n, n), np.float32)
    for _ in range(260):                                   # desert scrub: 1.8-4.5 m shrubs over most of the lot
        g = np.maximum(g, blob(g.shape, rng.integers(0, n), rng.integers(0, n), rng.uniform(1.8, 4.5), rng.uniform(2, 5)))
    tall = [(60, 70, 18), (80, 230, 22), (150, 40, 15), (210, 150, 20), (250, 250, 17), (40, 160, 14)]
    for r, c, h in tall: g = np.maximum(g, blob(g.shape, r, c, h, 8))
    for r, c, h in [(120, 120, 5.5), (180, 80, 6.0), (100, 200, 6.5)]:   # mid-size trees below the 8 m bar
        g = np.maximum(g, blob(g.shape, r, c, h, 6))
    return g, tall

def scene_dense_forest(seed=3):
    rng = np.random.default_rng(seed); n = 300
    g = (22 + rng.normal(0, .6, (n, n))).astype(np.float32)             # closed canopy about 22 m
    emergent = [(70, 70, 31), (150, 200, 30), (230, 110, 33)]
    for r, c, h in emergent: g = np.maximum(g, blob(g.shape, r, c, h, 9) + 0 * g)
    return g, emergent

def main():
    cand = load(sys.argv[1], "cand"); base = load(sys.argv[2], "base") if len(sys.argv) > 2 else None
    ok = True
    def check(name, cond, detail=""):
        nonlocal ok; ok &= bool(cond); print(("PASS  " if cond else "FAIL  ") + name + (("  — " + detail) if detail else ""))

    g, tall = scene_scrub_with_trees()
    out = run(cand, g, "cand"); H = [f["properties"]["height_m"] for f in out["features"]]; E = [f["properties"]["emergent_height_m"] for f in out["features"]]
    if base is not None:
        bo = run(base, g, "base"); bh = [f["properties"]["height_m"] for f in bo["features"]]
        check("baseline reproduces the problem (candidates under 8 m are shown)", sum(h < 8 for h in bh) > 0,
              f"baseline shows {len(bh)} candidates, {sum(h < 8 for h in bh)} under 8 m, lowest {min(bh):.1f} m")
    check("no candidate under 8 m", all(h >= 8 for h in H), f"{len(H)} candidates, heights {sorted(round(h) for h in H)}")
    check("every candidate stands 3 m or more above its surroundings", all(e >= 3 for e in E), f"lowest {min(E):.1f} m" if E else "none")
    check("all 6 real trees (14-22 m) are kept", len(H) >= 6 and sum(h >= 13 for h in H) >= 6, f"{sum(h >= 13 for h in H)} of 6")
    check("no mid-size tree (5-6.5 m) is shown", not any(5 <= h < 8 for h in H))
    t = out["tile"]; check("rejections are counted in the tile summary", t.get("below_elder_bar_count", 0) > 0 and t.get("elder_min_height_m") == 8.0,
                           f"below_elder_bar_count={t.get('below_elder_bar_count')}")
    runs = {json.dumps(run(cand, g, "c")["features"], sort_keys=True) for _ in range(5)}
    check("five runs give identical output", len(runs) == 1)

    flat = np.full((300, 300), 2.0, np.float32) + np.random.default_rng(1).normal(0, .05, (300, 300)).astype(np.float32)
    fo = run(cand, flat, "flat"); check("an all-shrub 2 m lot shows no Elder candidates", len(fo["features"]) == 0, f"{len(fo['features'])} shown")

    f, em = scene_dense_forest(); fo = run(cand, f, "forest"); fh = [x["properties"]["height_m"] for x in fo["features"]]
    check("dense 22 m forest: the 3 emergent crowns (30-33 m) are kept", sum(h >= 29 for h in fh) >= 3, f"heights {sorted(round(h) for h in fh)[-5:]}")
    check("dense 22 m forest: ordinary canopy trees are not shown", all(h >= 25 for h in fh), f"{len(fh)} shown")
    print("\nALL PASS" if ok else "\nFAILED"); sys.exit(0 if ok else 1)

main()
