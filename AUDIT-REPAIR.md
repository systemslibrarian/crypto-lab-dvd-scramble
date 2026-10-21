# Audit repair verification

Audited baseline: `f3d4bad6c5cf660ebea5306460481099521d927d`. Repair scope: this repository only.

The supplied handoff and repair proposal were checked against the repository and its brief. The full numbered audit reports were not attached; descriptive labels are used where the supplied material did not establish a finding number. No unprovided finding is claimed resolved.

Dependencies were installed with `npm ci --offline --ignore-scripts` from the available cache. Local browser runs used `CHROMIUM_PATH=/tmp/chromium`; CI retains its normal Playwright browser installation. Builds include TypeScript checking. No tests were skipped.

## Findings and decisions

| Finding | Verified disposition and evidence |
| --- | --- |
| DV-BE1: incoming carry | Kept the correct full addition. `src/css/audit.test.ts` checks 10,000 random identities; the deterministic all-ones middle-sum browser test kills both carry mutations. See README source citations and counterexample. |
| Exhaustive search count / 200 keys | Replaced the constant report with an incremented actual counter, including cancellation. The search still exhausts 65,536 guesses to measure ambiguity. The 200-key test independently checks continuation bytes and separately logs the true key's retrospective position. Stopping at the hidden key would introduce an oracle. |
| Private continuation selected the key | Additional verified defect: three public bytes produced 65,536 candidates, then hidden bytes secretly selected a winner. `assess` now requires public uniqueness before private verification; the three-byte browser test kills the old selection behavior. |
| Exact verdict, final counter and extrapolated time | Browser tests independently regenerate the displayed key/continuation, compare the final counter and calculate displayed days from the displayed rate, allowing only its rounding precision. |
| Survivor histogram | Each displayed count is independently enumerated from the displayed public bytes. A formula replacement is killed. |
| Zero, cancel and manual input | Impossible bytes yield no key; cancellation keeps partial work and no result; a manual unique candidate remains unverified without a private continuation. Short input is refused. Named browser tests and source mutations exercise these branches. |
| Worker boundary | Browser inspection checks the actual public request; the source boundary test rejects private verification state in the worker. Replacing the request with one fewer public observation is killed. |
| Accessibility and links | Full Schnorr-derived oracles and a lab-specific reachable-state driver cover 1280px and 320px, including error/ambiguity states. AirStream's related link was added. |
| Mutation evidence | Structured results replace permissive text matching. Crashes/timeouts do not count as kills. The obsolete mutation that only hung the worker was replaced by the public-observation assertion above. |

The original full-carry algorithm and exhaustive ambiguity policy were correct. The repair explicitly rejects the proposal to fabricate a count below 65,536 or use the secret key to stop the attack.

## Executed validation

| Check | Observed result |
| --- | --- |
| `npm test` | 13 passed |
| `npm run build` | Passed |
| `npx playwright test` | 9 claims + 2 accessibility drives passed |
| `npm run test:mutations` | 13/13 killed and restored |

A mutation kill means a passing baseline, a non-empty source patch, a successful changed bundle, an assertion failure in the named owning test, an identical restored bundle and a passing restored test. Setup failures, crashes and test timeouts are rejected. Reproducible patches and test ownership are below. These local results do not claim a future hosted deployment or a formal security proof.

## Executable finding matrix

The descriptive finding IDs below identify concrete regressions; they do not invent the missing numbered audit report. Each row was observed failing only under its source patch. Other verified decisions and primitive checks are detailed above.

| Finding ID / regression | Verified | Fix (file:line) | Named test | Mutation name | Status |
| --- | --- | --- | --- | --- | --- |
| DV / adder carry omitted | Yes | `src/css/css.ts:18` | carry propagates across an all-ones middle sum | adder carry omitted | Fixed and verified |
| DV / forced high bit omitted | Yes | `src/css/css.ts:11` | rendered 40-bit recovery regenerates both the known and independent future bytes | forced high bit omitted | Fixed and verified |
| DV / subtraction uses only sixteen bits | Yes | `src/attack/divide.ts:15` | rendered 40-bit recovery regenerates both the known and independent future bytes | subtraction uses only sixteen bits | Fixed and verified |
| DV / verifier ignores sixth public byte and continuation | Yes | `src/verify/verify.ts:5` | verifies every public and private continuation byte before a key claim | verifier ignores sixth public byte and continuation | Fixed and verified |
| DV / brute rate uses 2^39 | Yes | `src/attack/rate.ts:4` | displayed extrapolated days equal 2^40 divided by the displayed rate | brute rate uses 2^39 | Fixed and verified |
| DV / search worker loses one public observation | Yes | `src/main.ts:103` | search worker receives exactly the public bytes and no private continuation | search worker loses one public observation | Fixed and verified |
| DV / book carry rule ignores incoming carry | Yes | `src/css/css.ts:20` | carry propagates across an all-ones middle sum | book carry rule ignores incoming carry | Fixed and verified |
| DV / survivor count computed rather than counted | Yes | `src/attack/profile.worker.ts:20` | survivor histogram counts actual public matches rather than a formula | survivor count computed rather than counted | Fixed and verified |
| DV / private continuation secretly selects among public candidates | Yes | `src/verify/verify.ts:12` | three public bytes stay undetermined even when private bytes would identify a key | private continuation secretly selects among public candidates | Fixed and verified |
| DV / final counter understates actual tested candidates | Yes | `src/main.ts:88` | rendered 40-bit recovery regenerates both the known and independent future bytes | final counter understates actual tested candidates | Fixed and verified |
| DV / zero survivor result misreported as ambiguity | Yes | `src/verify/verify.ts:11` | impossible public bytes give zero survivors without a key claim | zero survivor result misreported as ambiguity | Fixed and verified |
| DV / cancelled search claims completion | Yes | `src/main.ts:54` | cancelled search keeps its partial counter and claims no key | cancelled search claims completion | Fixed and verified |
| DV / manual unique public candidate misreported as ambiguous | Yes | `src/verify/verify.ts:13` | manual unique candidate remains unverified without private bytes and short input refuses | manual unique public candidate misreported as ambiguous | Fixed and verified |

## Preserved scope

The brief files, deployment workflows, registered Playwright port, shared header and theme pin were not edited. Supporting catalog and reference repositories were read only. See README “Deviations from the brief” for source-backed corrections and the intentional mutation-runner hardening.

## Final command excerpts

```text

npm test
Test Files  2 passed (2)
Tests  13 passed (13)

npm run build
> tsc --noEmit && vite build
✓ built in 117ms

CHROMIUM_PATH=/tmp/chromium npx playwright test
11 passed (24.4s)

CHROMIUM_PATH=/tmp/chromium npm run test:mutations
13 / 13 mutations killed and restored
```

Mutation restoration uses each freshly generated Vite manifest to identify emitted scripts. It excludes unreferenced stale browser artifacts while retaining the successful-build, changed-bundle, exact owning-assertion and identical-restoration requirements.
