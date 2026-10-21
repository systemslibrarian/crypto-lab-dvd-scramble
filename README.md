# DVD Scramble

## What It Is

Implements the bit-serial, two-LFSR Content Scrambling System generator in Boneh–Shoup v0.6 §3.8. A 16-bit guess of one register algebraically determines the other 24-bit seed; the attack verifies known bytes and a separate 32-byte future. This is the book’s teaching variant, not a DVD player or the deployed CSS key hierarchy. Not production crypto — a teaching demo. All material is generated in memory; this static site has no account, backend or key storage.

## Exhibits

1. Clock the 17-bit and 25-bit registers and watch their bytes, carry and output.
2. Supply three to eight known bytes; a worker enumerates 65,536 smaller-register seeds and counts the actual survivors.
3. Independently verify the recovered key against 32 unseen output bytes.
4. Measure search throughput and extrapolate a 2^40 brute-force time, labelled as an extrapolation.

## When to Use It

Use this to study the exact mechanism and its failure boundary. Do not use the toy implementation, keys or protocols in a deployed security system.

## Live Demo

[Open DVD Scramble](https://systemslibrarian.github.io/crypto-lab-dvd-scramble/) to drive the exhibits. The build uses Vite's `/crypto-lab-dvd-scramble/` base for GitHub Pages.

## What Can Go Wrong

Three known bytes leave 65,536 candidates. With more known bytes, the generator’s invertible adder lets a six-byte transcript often identify the entire 40-bit seed. The recovered-key verdict is an alarm, not a victory for the cipher.

## Real-World Usage

CSS was a historical DVD scrambling system. This repository does not use, parse, or decrypt DVD content. The book’s variant differs from deployed CSS in forced-bit placement and discarded early bytes.

## How to Run Locally

```sh
npm ci
npm run dev
```

## Related Demos

[LFSR Forge](https://github.com/systemslibrarian/crypto-lab-lfsr-forge) · [Export Grade](https://github.com/systemslibrarian/crypto-lab-export-grade) · [WEP Crack](https://github.com/systemslibrarian/crypto-lab-wep-crack)

## Build & Verify

```sh
npm test
npm run build
npx playwright install chromium
npm run test:a11y
npm run test:mutations
```

13 executed unit cases; 1,000 independently generated keys × 256 bytes checked across two implementations, plus key recovery under both byte conventions. The book variant has no published KAT, so the test routes are independent re-derivations. The replayable mutation harness contains 13 concrete source patches. Each run first passes its named baseline test, requires a non-empty diff, a successful build and changed JavaScript bundle hash, then requires the owning test to fail and restores the original hash. The Playwright suite contains nine claims tests plus two accessibility state drives at 1280px and 320px. It scans reachable desktop and mobile states for WCAG 2.1 A/AA issues and independently rederives displayed claims. GitHub Actions runs unit tests, production build and browser gate before deploying; it also gates Dependabot pull requests, groups minor/patch npm updates and dispatches a deploy after an automated merge.

## Performance

All runs are local to the browser. Work figures shown in the page are either actual counted operations or explicitly labelled mathematical estimates/extrapolations. Workers keep long searches cancellable where used. No speed number is a claim about a production deployment.

## Sources

- [Boneh–Shoup v0.6 §3.8](https://toc.cryptobook.us/)

---

*One of the browser demos in the [Crypto Lab](https://crypto-lab.systemslibrarian.dev/) suite.*

*"So whether you eat or drink or whatever you do, do it all for the glory of God." — 1 Corinthians 10:31*

## Deviations from the brief

- **Full carry is intentional (DV-BE1).** [Boneh–Shoup v0.6 §3.8](https://crypto.stanford.edu/~dabo/cryptobook/BonehShoup_0_6.pdf) prints an update based on x+y alone, omitting incoming carry. At x+y=255 with incoming carry=1, it contradicts the same section's mod-2^24 identity. This lab uses `sum=x+y+carry; z=sum&255; carry=sum>>>8`, consistent with the full addition in [libdvdcss css.c](https://people.freebsd.org/~wpaul/7_2_RELEASE/mplayer/css.c). No GPL source code was copied. A deterministic counterexample (s1=0x434c, s2=0x9cbcf2), plus 10,000 fresh random keys, checks the identity; a concrete book-rule mutation must fail.
- **Exhaustive counts are honest.** The displayed search actually enumerates all 65,536 guesses to count ambiguity. It cannot stop at the hidden true key without an oracle. The brief's “fewer than 65,536” fixture and average 2^15 conflate exhaustive enumeration with externally verified early stopping. The 200-random-key test retains and verifies the true key, records actual work of 65,536 per search, and separately measures its retrospective position. One measured run gave a mean position of 33,921.54; this is not a count claimed by the attack. Six public bytes usually identify one key, but can leave multiple candidates.
- **Private bytes verify, never select.** The original UI filtered all public candidates against 32 hidden bytes and could falsely announce recovery from only three public bytes. Recovery now requires exactly one candidate *before* private verification. Ambiguous sets stay undetermined. Typed public bytes have no private continuation and never receive a recovered-secret verdict.
- **Mutation runner hardening.** The old text-search runner could accept timeouts as kills. The structured-report runner rejects infrastructure failures, retries and wrong-test failures; checks actual build and bundle changes; and reruns the restored baseline. The obsolete no-worker-message mutation was replaced by an observation-loss mutation that fails an owning assertion instead of hanging.

## Audit verification

`src/css/audit.test.ts` checks the 10,000-key identity, 200 independently generated six-byte samples, ambiguity, impossible bytes, cancellation and worker boundaries. The 200-key test logs its measured mean and ambiguity count on each run (`npx vitest run src/css/audit.test.ts --reporter=verbose`). `e2e/reference.ts` independently implements the bit recurrence and enumerates survivors; browser tests recompute displayed keys, future bytes, counters, rate arithmetic and histogram counts. The full accessibility machinery is adapted from the Schnorr reference; no known non-text failures are exempted.

Counts: `npx vitest list --json` lists declarations; `npm test` expands parameter rows to 13 cases. `npx playwright test --list` lists 11 browser tests. `scripts/mutations.json` contains 13 entries. No tests are skipped.

Mutation restoration hashes the JavaScript files listed by each fresh Vite build manifest. Unreferenced files left by browser artifact collection are excluded; baseline, mutant and restored builds still have to satisfy every assertion and hash check.
