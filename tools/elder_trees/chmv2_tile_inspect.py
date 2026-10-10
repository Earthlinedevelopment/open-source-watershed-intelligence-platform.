#!/usr/bin/env python3
"""
Inspect one CHMv2 COG for scalable AOI-read design.
OFF-PRODUCTION ONLY.
"""
import json, os, sys
import rasterio

ROOT="https://dataforgood-fb-data.s3.amazonaws.com/forests/v2/global/dinov3_global_chm_v2_ml3/chm/"
q=sys.argv[1]
url=ROOT+q+".tif"
os.environ["GDAL_DISABLE_READDIR_ON_OPEN"]="EMPTY_DIR"
os.environ["CPL_VSIL_CURL_ALLOWED_EXTENSIONS"]=".tif"
with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR",CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif"):
    with rasterio.open("/vsicurl/"+url) as ds:
        print(json.dumps({
          "quadkey":q,"url":url,"width":ds.width,"height":ds.height,
          "crs":str(ds.crs),"transform":list(ds.transform),
          "resolution":[abs(ds.transform.a),abs(ds.transform.e)],
          "block_shapes":ds.block_shapes,
          "overviews":ds.overviews(1),
          "dtype":ds.dtypes[0],"nodata":ds.nodata,
          "bounds":list(ds.bounds)
        },indent=2))
