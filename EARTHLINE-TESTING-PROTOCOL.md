# Earthline Testing Protocol

## Mandatory cross-browser production verification

**Standing rule:** Earthline production must be tested **five times every day** across all supported browser engines.

Each scheduled verification must test the live production site in:

- Chromium — Chrome/Edge engine class
- Firefox
- WebKit — Safari engine class

Each run must record, at minimum:

- browser engine
- production URL tested
- Regional analysis result
- Regional elapsed time
- Property handoff result
- Property publication/render result
- Property elapsed time
- corridor/swale count
- exact failing stage or timeout point
- pass/fail verdict

A browser failure is a real release defect until reproduced, explained, and repaired. A Chromium pass does **not** override a Firefox or WebKit failure.

Cross-browser failures must be diagnosed at the common owner before state-specific or science-specific changes are made. Hydrology, exclusions, scoring, swale geometry, and Property science must not be changed merely to compensate for browser runtime behavior.

Production remains frozen during diagnosis. Repairs are proven on a repair branch first and are promoted only after the required browser checks pass without regression.

**Cadence:** five checks per calendar day, distributed across the day. This rule is continuous and remains in force after launch.
