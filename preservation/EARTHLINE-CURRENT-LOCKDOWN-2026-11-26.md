# EARTHLINE — PERMANENT OWNER LOCKDOWN & INDEPENDENT RECOVERY (CURRENT)
**Date:** November 26, 2026 · **Goal:** preserve the best available existing Earthline source and keep it operable/recoverable if neither ChatGPT nor Claude is available. **No development or feature changes are authorized by this freeze.**

## THE ONE CURRENT SOURCE OF TRUTH
- GitHub repository: `Earthlinedevelopment/open-source-watershed-intelligence-platform.` — the trailing `.` is part of its actual name.
- Production deployment branch: `pages-live`.
- **Current pinned release branch:** `release/earthline-best-available-20261126`
- **Current release commit:** `dde749c431e3e0938d3d00dedfca067905f81b95`.
- **Current release tree:** `3d2175701f03ca4eb64d050ad9200650a89fe8d5`.
- **Current `index.html` Git blob SHA-1:** `cec59484c7678006c830e2655a094d61f9ef79e9` (not the SHA-256).
- The current release tree contains 902 tracked file blobs in 61 directory entries, per the GitHub tree API. Download/archive the **entire tree**, not merely the HTML.
- Important current file identities: Property engine `earthline-property-swales.js` blob `8e78b3d67d699f0d552bb7a6e36785ccbb30743d`; property bridge `earthline-property-swale-bridge.js` blob `3322f9465b1aa61f88b3dd0866c2a6af2e525e87`; Elder script `earthline-elder-restored-17097.js` blob `40fc8a69f2e710a2019f651aaef4c6cc222285b3`.
- Custom domain saved in `CNAME`: `earthlinedevelopment.org`. Previously used connected test URL: `https://live.earthlinedevelopment.org`. Verify DNS/origin separately.
- The commit `dde749c` was production before the Nov 26 recovery exercise and was restored afterward. No code was rewritten in this freeze; only the live branch pointer changed.
- **Historical alternate R1 snapshot** remains independently pinned at `release/earthline-frozen-20261126-r1`, commit `b926c9e512fe9fc09ddfea3c7ed51239e7d0b8fe`. It was not chosen as the present best available because it includes older 33% slope gates (for example `index.html` uses `slopePct(x,y)<=33`), whereas the dedicated engine in the current `dde749c` source declares `slopeMaxPct:4`. The historical R1 branch is for investigation/recovery only, **not** an authorized safer default.

## What 'lockdown' means — and what it does not
**DONE:** Exact current version pinned by a full immutable commit ID and a named release branch. The immediately previous source and a fallback source are preserved. Recovery instructions and source identity are stored in a separate `ops/earthline-preservation-20261126` branch. Production application files are not edited.
**NOT PROVEN:** Full browser acceptance, phone panel behavior, Elder Trees, repeated run determinism, water paths, contours, aquifer evidence, 50-state/global output accuracy, or safe science across all cases. The current source contains a dedicated Property swale engine with a **4% ceiling**, but legacy inline 33% logic still appears elsewhere in `index.html`; proving authoritative end-to-end behavior requires tests. Saving a version does not certify its outputs.
**MUST BE DONE BY OWNER:** Offline source backups and branch protection settings. A normal GitHub branch is movable/deletable without repository rules.

## Export source OFFLINE now
1. Sign in to GitHub. Open the Earthline repository. Choose branch `release/earthline-best-available-20261126`.
2. Select **Code → Download ZIP**. Save as `EARTHLINE-BEST-AVAILABLE-SOURCE-2026-11-26.zip`. This includes source files, not Git history.
3. Also obtain a Git clone including the `.git` directory, using the included `backup-earthline-current.ps1` on Windows with Git installed; the script checks the exact commit and HTML blob before creating a second ZIP and checksum manifest.
4. Keep **two independent complete copies** on different devices/media, including one offline; test you can open them. Keep this runbook with both.
5. Save private recovery information separately: GitHub login/2FA, registrar and domain expiration, DNS zone export, Mapbox account/public token URL restrictions/map style IDs, other hosting connections, and third-party service configuration. Use a secure password manager, not public GitHub or this document.
6. Confirm domain auto-renewal and login continuity. Without the domain, DNS, providers, or owner access, frozen code alone cannot keep the site online.

## Zero-AI local verification
For a Git checkout of the current release:
```sh
git rev-parse HEAD
# expected dde749c431e3e0938d3d00dedfca067905f81b95
git hash-object index.html
# expected cec59484c7678006c830e2655a094d61f9ef79e9
git hash-object earthline-property-swales.js
# expected 8e78b3d67d699f0d552bb7a6e36785ccbb30743d
git status --short
# expected empty for untouched checkout
```
Run `python -m http.server 8000` for a local static preview only. Production tests must be over HTTPS at the configured public origin because Mapbox token restrictions and remote data transport differ.

## Owner release policy
- Leave the current release `release/earthline-best-available-20261126` untouched. No force push, rebases, or edits on this branch.
- In GitHub, visit **Settings → Rules → Rulesets**. Add an active rule for that exact release branch preventing deletion and updates. Protect `pages-live` from unauthorized writes and force pushes; provide a documented break-glass path for the owner. **This admin action is pending**. It depends on GitHub repo/plan capabilities.
- Only the owner may approve changes. Build changes on separate candidate branches; do not silently update the frozen branch or live branch. Require checks, documented source/data provenance, actual browser testing and explicit approval before promotion.
- Preserve the approved original Earthline logo, Search Orb, exact slogan **"Slow it. Sink it. Spread it."**, native map navigation, no new features without approval, and a zero-cost stack except the domain.
- Swale acceptance must use **slope <=4%**, avoid roads/buildings/driveways, major water features and invalid dense forest, follow contour spacing 15–25 ft, and be verifiably modeled (not arbitrary visible lines).
- Swale science, regional watershed context, water paths, aquifer evidence, Elder Trees, DATA panel and the report remain product requirements. Do not assert site-specific professional design certainty.

## Minimal end-to-end regression checklist for any change or recovery
Write PASS/FAIL/NOT TESTED beside each on a dated record with a screenshot, selected place, source/data fingerprints and exact Git SHA:
1. Desktop fresh page and mobile fresh page: search loads, native pan/zoom works; phone map not obscured by panel.
2. Regional state/city search: watershed framing, water arrows, contours, aquifer evidence and plausible regional swale areas.
3. First Property run (10–20 acres): 4% slope rule, land/water exclusions, swales, water/contours, groundwater evidence, Elder Trees.
4. Property → Regional → same Property, at least two repeats: no lost layers, no unexpected empty output, gauge/data/report remain functional.
5. Another US region and one Southeast Asia region to exercise data-source differences; record any missing coverage as **UNVERIFIED**.
6. An independent scientific review before claiming engineering-grade advice. A green GitHub Pages workflow is necessary for delivery but not sufficient to pass these tests.

## Emergency restore with a human developer
1. Capture production's current `pages-live` full SHA, make a separate dated backup branch pointing to it, and do not delete prior release branches.
2. Confirm that `release/earthline-best-available-20261126` still points to `dde749c431e3e0938d3d00dedfca067905f81b95`. Verify `index.html` blob `cec59484c7678006c830e2655a094d61f9ef79e9`.
3. An authorized developer, ONLY after the owner's go-ahead, may revert `pages-live` using a **lease-protected push** after `git fetch origin`:
```sh
git rev-parse origin/pages-live
# Set EXPECTED to the full SHA from this command
git push --force-with-lease=refs/heads/pages-live:EXPECTED origin dde749c431e3e0938d3d00dedfca067905f81b95:refs/heads/pages-live
```
Replace `EXPECTED` with the observed SHA. Do not remove the lease. GitHub protections may prevent this; follow the owner's approved ruleset/break-glass process.
4. Check GitHub Actions → **pages build and deployment** for the intended commit, then test the live site on desktop and phone, and verify data fetches. If not working, do not guess or quietly switch to a different version; preserve evidence and seek owner's decision.
5. Historical recovery points: R1 `b926c9e...`; Nov 22 `67503f6...` (all source provenance retained in repository Git history). Do not treat these as equivalent to `dde749c`.

## Third-party dependencies — cannot be frozen with source
This is a GitHub Pages static publication that loads Mapbox and other remote data resources, including elevation and mapping services (e.g. AWS hosted elevation tiles, NRCS, ArcGIS, NOAA and Census resources). GitHub commits do not preserve external availability, quotas, terms, DNS, credentials, Mapbox tokens or browser caches. Inventory these with authorized owner access and maintain free-tier operation. Do not put secret tokens in a public repo.

## Handover without AI
Give an independent web/GIS developer this guide, the full-source archive (and optional Git clone), exact source identities above, the prior backups, the owner's locked scientific/UI rules, a dated acceptance log, domain/GitHub/Mapbox credentials through secure channels, and clear written approval rules. A developer can maintain/migrate/restore the static website without reliance on ChatGPT or Claude.

**Status at capture:** source frozen and current production reference verified; public end-to-end functional readiness not verified; owner offline copies and GitHub branch rulesets pending.
