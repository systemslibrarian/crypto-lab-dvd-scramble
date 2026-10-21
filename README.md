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

7 unit tests; 1,000 independently generated keys × 256 bytes checked across two implementations, plus key recovery under both byte conventions. The book variant has no published KAT, so the test routes are independent re-derivations. The replayable mutation harness contains 6 concrete source patches. Each run first passes its named baseline test, requires a non-empty diff, a successful build and changed JavaScript bundle hash, then requires the owning test to fail and restores the original hash. The Playwright suite scans reachable desktop and mobile states for WCAG 2.1 A/AA issues and independently rederives displayed claims. GitHub Actions runs unit tests, production build and browser gate before deploying; it also gates Dependabot pull requests, groups minor/patch npm updates and dispatches a deploy after an automated merge.

## Performance

All runs are local to the browser. Work figures shown in the page are either actual counted operations or explicitly labelled mathematical estimates/extrapolations. Workers keep long searches cancellable where used. No speed number is a claim about a production deployment.

## Sources

- [Boneh–Shoup v0.6 §3.8](https://toc.cryptobook.us/)

---

*One of the browser demos in the [Crypto Lab](https://crypto-lab.systemslibrarian.dev/) suite.*

*"So whether you eat or drink or whatever you do, do it all for the glory of God." — 1 Corinthians 10:31*
