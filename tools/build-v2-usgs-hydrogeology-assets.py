#!/usr/bin/env python3
"""
Build Earthline V2 web assets from the official USGS 2025 Hydrogeologic Regions
ScienceBase release.

This is a build-time converter only. It does not alter source geometry,
simplify coordinates, or change Earthline hydrology.
"""
from __future__ import annotations

import hashlib
import io
import json
import shutil
import tempfile
import urllib.request
import zipfile
from pathlib import Path

import shapefile

ITEM_ID = "6863356fd4be025653d31f4d"
SCIENCEBASE = f"https://www.sciencebase.gov/catalog/item/{ITEM_ID}?format=json"
EXPECTED_FIELDS = ["HR_Type", "HR_Name", "HR_Code", "HR_ID", "HR_Litholo"]
EXPECTED_COUNTS = {"PA": 57, "SHR": 69}
EXPECTED_RECORDS = 126
OUT = Path("v2/data/usgs-hydrogeology-2025")


def fetch(url: str) -> bytes:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Earthline-V2-USGS-asset-builder/1.0"},
    )
    with urllib.request.urlopen(req, timeout=90) as response:
        return response.read()


def minjson(value) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n"


def main() -> None:
    item = json.loads(fetch(SCIENCEBASE))
    files = item.get("files") or []
    source = next(
        (
            f
            for f in files
            if str(f.get("name", "")).lower() == "hydrogeologicregions.zip"
        ),
        None,
    )
    if not source:
        raise SystemExit("Official HydrogeologicRegions.zip not found in ScienceBase item")

    download = source.get("downloadUri") or source.get("url")
    if not download:
        raise SystemExit("Official HydrogeologicRegions.zip has no download URL")

    archive = fetch(download)
    archive_sha256 = hashlib.sha256(archive).hexdigest()

    with tempfile.TemporaryDirectory() as td:
        with zipfile.ZipFile(io.BytesIO(archive)) as zf:
            zf.extractall(td)

        shp = Path(td) / "HydrogeologicRegions.shp"
        if not shp.exists():
            raise SystemExit("HydrogeologicRegions.shp missing from official archive")

        reader = shapefile.Reader(str(shp))
        fields = [f[0] for f in reader.fields if f[0] != "DeletionFlag"]
        if fields != EXPECTED_FIELDS:
            raise SystemExit(f"USGS schema drift: expected {EXPECTED_FIELDS}, got {fields}")
        if len(reader) != EXPECTED_RECORDS:
            raise SystemExit(
                f"USGS record-count drift: expected {EXPECTED_RECORDS}, got {len(reader)}"
            )

        staged = Path(td) / "web"
        features_dir = staged / "features"
        features_dir.mkdir(parents=True)

        type_counts = {}
        ids = set()
        index_features = []

        for sr in reader.iterShapeRecords():
            props = dict(zip(fields, list(sr.record)))
            hr_type = str(props.get("HR_Type", "")).strip()
            hr_id = str(props.get("HR_ID", "")).strip()

            if hr_type not in EXPECTED_COUNTS:
                raise SystemExit(f"Unknown USGS HR_Type: {hr_type!r}")
            if not hr_id:
                raise SystemExit("USGS feature missing HR_ID")
            if hr_id in ids:
                raise SystemExit(f"Duplicate USGS HR_ID: {hr_id}")
            ids.add(hr_id)
            type_counts[hr_type] = type_counts.get(hr_type, 0) + 1

            feature = {
                "type": "Feature",
                "properties": props,
                "geometry": sr.shape.__geo_interface__,
            }
            (features_dir / f"{hr_id}.json").write_text(
                minjson(feature), encoding="utf-8"
            )

            bbox = [float(x) for x in sr.shape.bbox]
            index_features.append(
                {
                    "id": hr_id,
                    "type": hr_type,
                    "name": str(props.get("HR_Name", "")).strip(),
                    "code": str(props.get("HR_Code", "")).strip(),
                    "lithology": str(props.get("HR_Litholo", "")).strip(),
                    "bbox": bbox,
                    "file": f"features/{hr_id}.json",
                }
            )

        if type_counts != EXPECTED_COUNTS:
            raise SystemExit(
                f"USGS type-count drift: expected {EXPECTED_COUNTS}, got {type_counts}"
            )

        index_features.sort(key=lambda x: x["id"])
        index = {
            "earthline_asset": "usgs-hydrogeologic-regions-2025",
            "source_title": item.get("title"),
            "sciencebase_item_id": ITEM_ID,
            "doi": "10.5066/P1F39LHM",
            "archive": source.get("name"),
            "source_zip_sha256": archive_sha256,
            "source_modified": item.get("lastUpdated") or item.get("dateUpdated"),
            "schema": {
                "type": "HR_Type",
                "name": "HR_Name",
                "code": "HR_Code",
                "id": "HR_ID",
                "lithology": "HR_Litholo",
            },
            "counts": {
                "records": EXPECTED_RECORDS,
                "PA": EXPECTED_COUNTS["PA"],
                "SHR": EXPECTED_COUNTS["SHR"],
            },
            "geometry": {
                "simplified": False,
                "coordinate_rounding": False,
                "note": "Feature geometry is emitted from the official shapefile without Earthline simplification.",
            },
            "features": index_features,
        }
        (staged / "index.json").write_text(minjson(index), encoding="utf-8")

        if OUT.exists():
            shutil.rmtree(OUT)
        OUT.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(staged, OUT)

    total = sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())
    print(
        json.dumps(
            {
                "status": "PASS",
                "records": EXPECTED_RECORDS,
                "types": EXPECTED_COUNTS,
                "source_zip_sha256": archive_sha256,
                "asset_bytes": total,
                "index": str(OUT / "index.json"),
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
