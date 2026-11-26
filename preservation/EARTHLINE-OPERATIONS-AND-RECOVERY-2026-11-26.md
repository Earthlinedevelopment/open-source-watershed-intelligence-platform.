# EARTHLINE — OWNER'S INDEPENDENT OPERATIONS & RECOVERY GUIDE
**Preservation date:** 2026-11-26. **Purpose:** operate and recover Earthline without ChatGPT, Claude, or any other AI assistant.

## 1. Status: freeze means reproducible, not certified
- The `pages-live` branch was reset on 2026-11-26 to the saved R1 source commit `b926c9e512fe9fc09ddfea3c7ed51239e7d0b8fe`.
- The immutable *commit ID* above, not a mutable branch name, is the source identity.
- The release pointer `release/earthline-frozen-20261126-r1` currently points exactly to that commit.
- The immediately preceding production head `dde749c431e3e0938d3d00dedfca067905f81b95` is separately preserved at `backup/pre-r1-recovery-20261126`.
- The earlier November 22 recovery commit is `67503f620b000cff41a4ef7c86d311661e2ce563`; it remains reachable in repository history (and the existing `backup/recovery-pre-restoration-20261122` was also present).
- GitHub Pages build/deployment for the R1 restore reported **success** on Nov 26; no real-browser desktop/mobile end-to-end acceptance was verified in this preservation session. Do not call any of these builds scientifically certified, fully functional, or stable without separate tests.
- No new features, UI edits, or hydrology algorithm changes are part of this preservation. This operations guide is on an independent `ops/` branch, not the live or frozen branch.

## 2. Source of truth, owners, and addresses
- Public GitHub repository: `Earthlinedevelopment/open-source-watershed-intelligence-platform.` (**the terminal period is part of the repository name**).
- Website source branch: `pages-live`; public deployment uses GitHub Pages.
- Custom domain in the saved `CNAME` file: `earthlinedevelopment.org`; the prior connected test address was `https://live.earthlinedevelopment.org`. Independently verify DNS routing before relying on either domain.
- Exact frozen Git commit: `b926c9e512fe9fc09ddfea3c7ed51239e7d0b8fe`.
- Exact `index.html` Git blob hash: `745de00dcfafc3aeb6607497fd8a4830c34555b2` (a **Git blob SHA-1**, NOT the file's SHA-256).
- The frozen commit has 916 tracked blobs and 62 directory entries according to the GitHub recursive tree API; archive the entire tree, not only `index.html`. GitHub's commit object preserves the complete tree even when optional files are not used by the homepage.
- Other important frozen root assets: `earthline-elder-restored-17097.js`, `earthline-elder-worker-17129.js`, `earthline-launch-16872.js`, `earthline-language-hotfix-16890.js`, `earthline-launch-16872.css`, `CNAME`, `README.md`.
- The frozen `index.html` directly loads Mapbox GL JS 3.4.0 and `earthline-elder-restored-17097.js`; external online map/data sources remain operational dependencies even if all source files have been preserved.
- Current freeze is a **recovery point**, not proof it is better than previous versions. The 2026-11-24 `dde749c` release has additional property-swale module changes; comparing versions is a separate scientific/browser validation task, NOT an automatic reason to change the frozen release.

## 3. One-time OFFLINE backup — essential for AI independence
1. Open the GitHub repository as its owner. From the branch selector, choose `release/earthline-frozen-20261126-r1`.
2. Select **Code → Download ZIP**. Save it as `EARTHLINE-FROZEN-SOURCE-2026-11-26.zip`; do not rename files inside the ZIP. This ZIP captures source files, but NOT full Git history.
3. For full version-control recovery, also clone the repository with Git and retain the `.git` folder. The companion `backup-earthline.ps1` automates a verified one-commit archive and retains a checkout.
4. Make at least TWO independent backups: one external disk / USB and one separate secure cloud account or physically separate disk. Keep a copy of this operations guide with them. Check that the ZIP can be opened.
5. Separately export key **non-code** operational items: domain registrar and renewal details, DNS zone records, GitHub account and Pages settings, Mapbox account and **public** token restrictions and style IDs, data source inventories, and any external service configurations. Do NOT put private tokens, passwords, recovery codes, or secrets into the public GitHub repository or this guide.
6. Keep account recovery methods and 2FA codes in a secure password manager, with owner-designated succession access. Source-code backup alone does not preserve credentials, data API availability, DNS, hosting access, or legal control of the domain.

## 4. Independent verification (no AI required)
On a clean Windows computer with Git installed, use `backup-earthline.ps1`. Or in any Git checkout of the frozen commit, run:

```sh
git rev-parse HEAD
# Must equal b926c9e512fe9fc09ddfea3c7ed51239e7d0b8fe
git hash-object index.html
# Must equal 745de00dcfafc3aeb6607497fd8a4830c34555b2
git status --short
# Must be empty for an untouched checked-out release
```

Local preview from the root checkout: `python -m http.server 8000` and open `http://127.0.0.1:8000/`. This is a static preview, not a production-equivalent test: HTTPS, Mapbox token URL restrictions, and third-party networks may behave differently. For release acceptance, check desktop plus an actual phone over HTTPS, and use the checklist below.

## 5. Minimum acceptance checklist for any future release
Record **PASS / FAIL / NOT TESTED**, date, location, screenshot, and the exact Git commit for each:
- First opening: map loads and navigates with ordinary drag, wheel/pinch, and on-screen zoom; no obstructing phone panel.
- Regional search: city/watershed framing, terrain-derived water-path arrows, numbered contours, aquifer/groundwater context, and reasonable swale opportunity coverage.
- Property run: 10–20 acre scale, contours, water paths, real swale corridors, proper recharge/aquifer evidence; no swales across buildings, roads, driveways, mapped waterways, excluded areas, or forest invalid under the model.
- Enforce slope suitability at **4% or less**, not a 3–4% band, and never silently substitute 33% or other invalid slope limits.
- Repeat **Property → Regional → same Property** and run multiple consecutive Property analyses. Confirm repeatability, visible layers, gauge/data button, Elder Trees, no re-entrant blank or timeout.
- Mobile: no map-covering panel, touch interaction and layer visibility, search and report controls usable.
- Water-sidecar evidence and source provenance accurate; missing/unverified data must not be represented as measured certainty.
- PDF/report, warnings, and local language functionality work.
- Check live origin on user devices; a JavaScript parse test or GitHub Pages "deployed" badge does not pass these.

## 6. Release lock and change control
- Treat `release/earthline-frozen-20261126-r1` as historical/read-only. **Never add a commit, rebase, or force-push it.** A Git branch alone is not technically immutable: a repository owner can still delete/move it.
- In **GitHub Settings → Rules → Rulesets**, create an active rule for `release/earthline-frozen-20261126-r1` preventing branch deletion and updates. Protect `pages-live` from unauthorized direct/forced changes and require an approved release process. These repository-admin settings could not be applied by the assistant; an owner must verify them. Ruleset availability and enforcement depend on GitHub plan and repository settings.
- No changes to search orb, approved Earthline logo, locked phrase **"Slow it. Sink it. Spread it."**, native map navigation, scientific thresholds, or new functionality without express owner approval.
- Every change must go to a SEPARATE candidate branch, with full backup, exact diff, regression checks, and documented owner approval before a production update.
- Do not store credentials or Mapbox private token scopes in the repository. Preserve zero-cost operations (domain fee excepted).

## 7. Emergency recovery without ChatGPT / Claude
If production fails, first identify the live commit:
1. In GitHub, open branch `pages-live` and record the full HEAD SHA. Archive or branch it as `backup/pre-emergency-YYYYMMDD` before any change.
2. Check the historical frozen release branch still points to `b926c9e512fe9fc09ddfea3c7ed51239e7d0b8fe`. Verify the expected `index.html` blob hash above.
3. A developer with push privileges may restore the exact commit to `pages-live` with a **lease-protected forced ref update** (the old history must already have a backup):
```sh
git fetch origin --prune
git rev-parse origin/pages-live
# Set EXPECTED to the full SHA just checked, then:
git push --force-with-lease=refs/heads/pages-live:EXPECTED origin b926c9e512fe9fc09ddfea3c7ed51239e7d0b8fe:refs/heads/pages-live
```
Replace `EXPECTED` with the actual 40-character HEAD, and only execute as the emergency restore operator. Never omit the lease. A protected branch may reject this; a ruleset-authorized operator can follow the documented emergency process.
4. Inspect **GitHub Actions → pages build and deployment** and verify it successfully published the intended commit. Then check live HTTPS on desktop + phone. DNS, browser caches, and third-party data providers can independently prevent success.
5. If the frozen R1 fails acceptance, **do not silently iterate code**. The prior `dde749c` release is saved as `backup/pre-r1-recovery-20261126`, and `67503f6` is another historical rollback; choose a new target only with owner direction and evidence.
6. Report accurately what was restored and what is or is not verified.

## 8. Dependencies and ongoing survival
The frozen HTML refers to Mapbox GL JS 3.4.0 and online endpoints including Mapbox, Google Fonts, AWS elevation tiles, NRCS, ArcGIS, USGS-adjacent/state sources, NOAA, Census, and IGRAC/WRI sources. These external services are *not* preserved by freezing GitHub and may change or rate-limit. Keep inventories and inspect service terms annually; no paid dependency should be added without owner approval. GitHub Pages and account access must also remain active, with a correctly renewed domain and DNS. Source-code preservation is not a guarantee of perpetual functionality.

## 9. Handover to any independent developer
Give the developer: this file, the frozen release branch (and an offline ZIP), the exact commit and index blob above, the previous-production backup branch, the accepted requirements and PASS/FAIL checklist, GitHub/DNS/Mapbox owner access via a secure channel, and a written instruction **do not modify production until explicitly authorized**. A competent web/GIS developer can audit, redeploy, or migrate the static site without either AI assistant.

## 10. Unresolved at preservation
- Real-user functional acceptance of the restored R1 is **NOT VERIFIED**.
- Real-phone panel behavior, repeated swales/Elder Trees, aquifer evidence, water paths/contours, and scientific accuracy are **NOT VERIFIED**.
- GitHub deployment succeeded, but the external public site was not independently tested through a full browser in this session.
- Branch ruleset protection and owner-side offline backups remain to be completed by the account owner.
