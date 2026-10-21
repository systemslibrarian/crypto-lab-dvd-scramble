# Build brief — `crypto-lab-dvd-scramble`

**2026-10-20. Brief only; no repository exists yet.** Written against
`audits/_MASTER-TEMPLATE.md` (catalog `20cb434d89e4`) — §0 through §6 apply unchanged.
Source of the gap: Boneh–Shoup, *A Graduate Course in Applied Cryptography*, v0.6 (Jan. 2023),
§3.8 "Case study: cryptanalysis of the DVD encryption system" (Figs. 3.10, 3.11).

**Verdict: new repository** — reasoning under "New lab or LFSR Forge panel?" below.

```
NEW DEMO BRIEF
- Repo name:         crypto-lab-dvd-scramble
- Short name (H1):   DVD Scramble
- Subtitle:          CSS stream cipher · two LFSRs and an adder · 2^16 instead of 2^40
- One-liner:         Runs the Content Scrambling System's keystream generator — a 17-bit and a
                     25-bit LFSR added byte by byte with a carry — and recovers its 40-bit key
                     from six known output bytes by guessing only the 16 free bits of the
                     small register.
- Concept to teach:  Adding two registers together does not add their key lengths. Because
                     subtraction undoes the adder, guessing the small register hands you the
                     big one, so a 40-bit key falls to 65,536 guesses.
- Primitives/spec:   Boneh–Shoup §3.8 CSS PRG (taps {14,0} and {12,4,3,0}; 1 prepended to each
                     seed; z = x + y + c mod 256); Stevenson 1999 for the deployed cipher's
                     differences (prose only)
- Accent (--accent): [central assignment]
- Favicon emoji:     [central assignment]
- Category:          [central assignment]
- Level (suggested): Beginner opening, Intermediate overall — placement suggestion only
- Section (suggested): historical  (cryptanalysis is the alternative)
- In scope:          the book's CSS PRG, bit-level LFSR stepping, the byte adder with carry,
                     the 2^16 divide-and-conquer key recovery, the known-bytes vs
                     false-candidates experiment, a measured-rate extrapolation of 2^40
                     exhaustive search
- Non-goals:         the deployed CSS key hierarchy (player, disc and title keys), the
                     authentication handshake, the key "mangling" and hash attacks, the
                     sector substitution table, MPEG/VOB parsing, any DVD content
```

## Overlap check — what I read, and what I found

Opened from source at the commits shown. I also ran
`grep -rliE "content scramble|\bcss\b.{0,20}(dvd|cipher)|dvd|divide.and.conquer|17.?bit lfsr"`
across every clone in `/home/claude/labs/` and inspected each hit.

- **LFSR Forge** (`f3ce77fea93a`, Intermediate). `src/lfsr/lfsr.ts`, `src/lfsr/bm.ts`
  (Berlekamp–Massey) and `src/geffe/{geffe,correlation,attack.worker}.ts`. Its fifth panel already
  runs a **divide-and-conquer correlation attack** on a Geffe combiner of three LFSRs (README lines
  15–17). CSS breaks by a different mechanism — no statistics at all: the adder is invertible, so a
  guess of one register *determines* the other (guess-and-determine). The README warns readers not
  to "generalize the result to every nonlinear combiner" — CSS is exactly a combiner it does not
  cover. Its Trivium extension (Katz–Lindell batch) is in flight.
- **Export Grade** (`54ad8845ac2d`). TETRA TEA1's export-era key reduction, with a measured search
  rate and keyspace extrapolation in `src/attack/rate.ts` (`measureRate` at :47, `KEYSPACE_TARGETS`
  at :113, Julian-year constant at :7). Reuse the *approach* (measure the attack's own rate, then
  extrapolate 2^40 and label it an extrapolation); it is a separate repo, so port with attribution.
- **Air Stream** (`09529a8de623`) — SNOW 3G / ZUC, word-oriented LFSR designs; no CSS.
- **WEP Crack** (`0b2433ccb143`) — RC4 (Boneh–Shoup §3.9 is the very next case study); no CSS.
- **Iron Letter** (`0d6257cdad49`) — its one "dvd" hit is inside a base64 test fixture
  (`src/__tests__/fixtures.ts:31`). Not CSS.

No lab in the clones I searched implements CSS (scope: the grep above over the clones at the
commits pinned here — re-run it before building).

### New lab or LFSR Forge panel?

A panel in LFSR Forge would be the cheaper home, and it shares the LFSR vocabulary. I recommend
a new repository anyway, for three reasons: (1) the mechanism is new to that lab — algebraic
guess-and-determine, where LFSR Forge's combiner panel is statistical; (2) the attack is
arithmetic a newcomer can follow (column addition with a carry, then subtraction, then counting
65,536 tries), so this can open at Beginner, while LFSR Forge is Intermediate and leads with
recurrences and Berlekamp–Massey; (3) LFSR Forge already carries five panels plus an in-flight
Trivium extension. If Paul prefers the panel, this brief's SCOPE acts 2–4 drop in as one panel and
the history act becomes a disclosure.

## The seven §1 sections

### SCOPE

1. **What was on the disc (plain language, no maths).** Movies on DVD were scrambled with a
   40-bit key — the book: "CSS was designed in the 1980's when exportable encryption was
   restricted to 40-bit keys." 40 bits is about a trillion keys. Then the twist this lab exists to
   show: the real cost was about 65,536.
   *Self-correction:* the commissioning note called CSS "a 1996 cipher"; I did not verify a date,
   so the page uses the book's sentence and Stevenson's 8 Nov 1999 analysis date only.
2. **Two registers and an adder.** Step the 17-bit LFSR (taps {14, 0}) and the 25-bit LFSR
   (taps {12, 4, 3, 0}) bit by bit (Fig. 3.10 semantics: output b0, feedback = XOR of tapped
   bits, shift right). Key s = s1 ‖ s2 with s1 16 bits and s2 24 bits; load 1‖s1 and 1‖s2 (the
   forced 1 keeps a register from the all-zero state). Eight clocks give a byte from each; output
   z = x + y + carry mod 256. Show the column addition with the carry visibly moving.
3. **The break.** Given known output bytes z1…zk: for each of the 65,536 values of s1, compute
   the 17-bit register's first three bytes, then
   (2^16·y3 + 2^8·y2 + y1) = (2^16·z3 + 2^8·z2 + z1) − (2^16·x3 + 2^8·x2 + x1) mod 2^24,
   which under this lab's in-byte bit order (Invariant 1) is exactly s2 — the 25-bit register's
   first 24 output bits are its loaded seed bits (under the other order it is s2 with each byte
   bit-reversed; still determined). Run the
   candidate key forward and compare with the remaining known bytes. Live counter, the surviving
   candidate, and the recovered key checked against the generator's real continuation.
4. **How many bytes do you need?** A slider for k known bytes, the measured number of keys that
   survive each run. With three bytes every one of the 65,536 guesses survives (the subtraction
   always produces a consistent s2) — a deterministic fact the page asserts. With four, a few
   hundred survive; with six, usually one. (Brief author's prototype on one random key: 65,536 /
   248 / 3 / 1 at k = 3 / 4 / 5 / 6.) Stevenson: six known bytes give "a trivial 2^16 attack".
5. **Against brute force.** The attack's own measured candidates-per-second, extrapolated to 2^40
   and labelled an extrapolation (the Export Grade approach). The book's expected cost: 2^15
   guesses on average, against 2^40.
6. **What the real CSS changed (prose, no implementation).** The book: the deployed cipher "inserts
   the 1 in bit position 9 for the 17-bit LFSR and in bit position 22 for the 25-bit LFSR" and
   "discards the first byte output by the 17-bit LFSR and the first two bytes output by the 25-bit
   LFSR" — "Neither issue affects the analysis." Stevenson adds four modes set by two output
   inverter switches. One history line (see Honesty notes).

Non-goal notes (one line each, in-page): the deployed key hierarchy and authentication ("how
players got the title key — not shown"); Stevenson's disc-key hash attack (2^25, cited, not run);
sector descrambling and the substitution table; the RC4 case study (→ WEP Crack).

### SECURITY / CORRECTNESS INVARIANTS

1. **The generator is the book's, exactly.** Taps, seeding, carry rule and byte assembly follow
   §3.8 as quoted above. Bit order inside a byte is not stated by the book: this lab defines the
   first output bit as bit 0 (least significant) of the byte and says so on the page. The attack's
   identity holds under either convention, and a test proves it by running the attack under both.
2. **A recovered key is shown only after regeneration** reproduces every known byte *and* the next
   32 bytes of the real keystream, which the attack module never receives.
3. **Candidate counts are counted, not computed.** The k-bytes experiment reports the number of
   guesses that actually survived; the three-byte "always 65,536" line is asserted in a test.
4. **No canned verdicts** — every rendered verdict carries a §4.1c mutation.
5. **No real-world artefact.** No DVD data, no player or disc keys, no sector format. Keys and
   keystreams are generated in-session from `crypto.getRandomValues`.

### ARCHITECTURE

```
src/css/lfsr.ts        bit-serial Fibonacci LFSR (n, taps) with step trace — hand-rolled
src/css/css.ts         the §3.8 PRG: seeding 1‖s1, 1‖s2, byte assembly, adder with carry
src/css/byteStep.ts    an independent byte-at-a-time implementation (precomputed per-state
                       transition built from the polynomial, not from lfsr.ts) for tests
src/attack/divide.ts   the 2^16 guess-and-determine search (Worker), cancellable, counted
src/attack/rate.ts     measured rate → 2^40 extrapolation (pattern from Export Grade)
src/verify/verify.ts   regenerates keystream from a candidate key; imports css/*, never attack/*
src/ui/*.ts
```

### UI

Act 2: two register strips with the tapped cells marked, a "clock 8×" button per byte, the two
bytes and the column addition with the carry. Act 3: "Generate a secret key" (hidden), the first
six keystream bytes shown, "Break it" with a counter to 65,536, the one surviving key, then its
next 32 bytes beside the real ones. Act 4: the k slider and a histogram of surviving candidates
over repeated runs. Act 5: measured rate, the 2^40 extrapolation and the factor between them.
Stacks below 640px.

### VISUAL SEMANTICS

Key recovered = **ALARM** (the 40-bit protection failed), never success-green. The 2^40
extrapolation is neutral and carries an "extrapolated, not run" label. In Act 4, "65,536
candidates" at k = 3 reads as "undetermined", not as an attack failure. Icon + text + colour.

### EDGE CASES

- Fewer than three known bytes → the search refuses: the mod 2^24 identity needs three.
- Known bytes that no key produces (typed by hand) → zero survivors, stated plainly.
- An all-zero s1 or s2 is a valid key (the forced 1 prevents a dead register); include it in tests.
- Cancelled search → partial count shown, no key claimed.
- The bit-order toggle (if exposed) re-runs the generator and retires every earlier verdict.

### EXTENSION SEAMS

- `// [extension] point` in `src/css/css.ts`: a **deployed-CSS keystream variant** (insertion
  positions, discarded bytes, inverter modes). Gated on two things the brief author could not settle:
  a reference whose licence allows test-vector generation without copying code into this
  MIT-licensed repo — the libdvdcss `css.c` is GPL-2.0-or-later — and Paul's call on including it.
  The book's insertion positions ("bit position 9" / "22"), Stevenson's ("most significant bit";
  "bit 4") and libdvdcss's code (`| 0x100`; `* 2 + 8 − (t & 7)`) appear to describe the same
  insertion in three different bit-numbering conventions. Pin it from the reference, never from
  any one of these descriptions.
- `// [extension] point` in `src/attack/`: Stevenson's five-byte variant (guess-and-verify with
  fewer known bytes), cited, if wanted.

## Tests

- **No published test vectors exist for the book's CSS PRG** (it is the book's own variant), so
  correctness comes from independent re-derivations; the page and README say so.
- **Two implementations agree.** `css.ts` (bit-serial) and `byteStep.ts` (independent route)
  produce identical keystreams for at least 1,000 random keys × 256 bytes — far past any
  one-register period boundary at the byte level. Include s1 = 0 and s2 = 0.
- **Periods.** Measure the 17-bit LFSR period directly (2^17 − 1 = 131,071 expected). For the
  25-bit register, check by an independent route that x has order 2^25 − 1 modulo
  x^25 + x^12 + x^4 + x^3 + 1 (2^25 − 1 = 31·601·1801). The brief author checked that both
  characteristic polynomials (x^17 + x^14 + 1 and that one) are primitive; re-verify rather than trust.
- **The identity.** For random keys, the mod 2^24 relation of §3.8 holds on the first three bytes.
- **The attack.** For 200 random keys with six known bytes, the recovered key regenerates the
  next 32 bytes; mean guesses ≈ 2^15 (report the measured mean, assert only that it is below 2^16).
- **Bit order.** The attack recovers the key under both in-byte conventions.

`e2e/claims.spec.ts` (§4.1b): parse the displayed recovered key and six known bytes, regenerate
the keystream in the test from its own re-implementation of §3.8, and compare; the displayed
guess count equals the counter's final value; the extrapolated time equals 2^40 / displayed rate
in the displayed unit; at k = 3 the displayed survivors equal 65,536.

§4.1c mutations: carry dropped from the adder; subtraction done mod 2^16 instead of 2^24;
verification compares only five bytes; the forced 1 omitted from one register; rate extrapolated
to 2^39; survivor count computed as 2^16 / 256^(k−3) instead of counted. Each turns a NAMED test
red, with baseline, non-empty diff and moved bundle hash asserted first.

§4.1d negative claim — scoped to this construction: **"A 40-bit key here does not cost 2^40 to
recover: six known keystream bytes and at most 2^16 guesses are enough."** Evidence fixture:
every check is green — a 40-bit key from the CSPRNG, both registers non-zero, keystream matched
by both implementations — and the key is recovered in fewer than 65,536 guesses. Verdict text:
`40-BIT KEY — 16-BIT WORK`.

## Honesty notes for the page

- This is Boneh–Shoup's CSS PRG, which the book calls "a minor variation of CSS … [with] the same
  security"; the page states the deployed cipher's differences and does not claim to implement it.
- The key hierarchy, authentication and disc/title-key attacks that made real DVDs readable are
  not here. This lab breaks a keystream generator, nothing more.
- History line, if Paul wants one (his call): Stevenson published the analysis on 8 Nov 1999; the
  DeCSS litigation followed (Universal City Studios v. Corley, 273 F.3d 429 (2d Cir. 2001)).
- Not production crypto — a teaching demo.

## Links out

**LFSR Forge** (recurrences, Berlekamp–Massey, the Geffe correlation attack — the other way to
divide and conquer), **Export Grade** (another export-era key cut short), **WEP Crack** (the next
case study, RC4), **Air Stream** (LFSR-based designs in deployment today).

## Sources

- D. Boneh, V. Shoup, *A Graduate Course in Applied Cryptography*, v0.6, Jan. 2023 —
  https://toc.cryptobook.us/. §3.8, Figs. 3.10–3.11 (taps, seeding, carry, the 2^16 attack, the
  real-CSS differences, "an expected 2^15 guesses").
- F. A. Stevenson, "Cryptanalysis of Contents Scrambling System", 8 Nov 1999 (LFSR sizes, seeding,
  adder with carry, two inverter switches, "a trivial 2^16 attack" with six known bytes, 2^25
  disc-key attack) — mirror at https://cyber.harvard.edu/openlaw/DVD/resources/crypto.gq.nu.html
- libdvdcss `src/css.c` (VideoLAN; GPL-2.0-or-later; credits Stevenson's divide-and-conquer
  attack) — read via the FreeBSD-hosted copy
  https://people.freebsd.org/~wpaul/7_2_RELEASE/mplayer/css.c ($Id 2008-08-29). Reference for the
  extension seam only; do not copy code.
- Universal City Studios, Inc. v. Corley, 273 F.3d 429 (2d Cir. 2001) — cited only if the history
  line is used.
