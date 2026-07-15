# BrandCheck — Backlog

Epics and stories for the build. Every story lists concrete, checkable
acceptance criteria — no vibes. Story 1.1 is the wow moment and must land
first: a working demo before anything else gets built.

## Epic 1 — Live Scoring Experience

- [x] **1.1 (WOW MOMENT) Letter-by-letter live scoring with verdict flip**
  - Typing in the brand-name input updates letter highlighting and the
    metric bars within one animation frame of each keystroke (no visible lag).
  - The verdict badge transitions from "checking…" to a green/yellow/red call
    within 1 second of the last keystroke settling.
  - Clearing the input returns the verdict to "checking…", not a stale score.

- [x] **1.2 Per-letter vowel/consonant/cluster highlighting**
  - Vowels, plain consonants, and letters inside a flagged consonant cluster
    each render in a visually distinct color.
  - Highlighting re-renders on every keystroke without a full-page flicker or
    layout shift.

- [x] **1.3 Verdict badge animation**
  - The badge cross-fades or slides between states over ~200ms — never an
    instant hard cut.
  - With `prefers-reduced-motion` enabled, the transition is disabled but the
    correct end state still renders.

- [x] **1.4 (Design polish) Apply DESIGN.md direction to the scoring panel**
  - The panel matches `docs/DESIGN.md` tokens (colors, fonts, spacing,
    corner radius) rather than default browser styling.
  - The grid background and corner-bracket frame signature detail are present.
  - Layout composes correctly at 390px, 768px, and 1440px with no horizontal
    scroll or overlapping elements.

## Epic 2 — Scoring Engine Accuracy & Trust

- [x] **2.1 Validate metrics against a reference name set**
  - A fixture file lists at least 15 known-real brand/word names and at
    least 15 known-invented Amazon-style names.
  - Running `analyzeBrandName` over the fixture correctly verdicts (green for
    real, yellow/red for invented) at least 80% of each group.

- [x] **2.2 Metric breakdown transparency**
  - Each of the 4 metrics displays its label, numeric score, and a one-line
    plain-English explanation of what it measured.
  - Focusing or hovering a metric row surfaces its detail text (tooltip or
    inline expansion) without requiring a click.

- [x] **2.3 Edge case handling**
  - Empty input renders the "checking…" state, not an error or a crash.
  - Non-alphabetic characters (digits, emoji, punctuation) are filtered
    before scoring and never throw an unhandled exception.
  - Names under 3 letters show a "not enough signal" note instead of a
    misleadingly confident verdict.

- [x] **2.4 (Design polish) Empty, loading, and edge-case states designed**
  - The pre-input empty state shows a designed placeholder (sample name or
    prompt), not a blank panel.
  - The "not enough signal" state uses the muted-text token and panel
    styling from `docs/DESIGN.md`, not a raw browser default.

## Epic 3 — Trademark Check & Distribution

- [x] **3.1 One-click TESS lookup**
  - The result view shows a link/button that opens USPTO TESS in a new tab,
    pre-filled with the currently typed name.
  - The link's target updates live as the user edits the name.

- [x] **3.2 Shareable result**
  - Scoring a name updates the page URL (query param or hash) so the result
    is linkable and bookmarkable.
  - Loading the app with that URL pre-fills the input and renders the score
    on load without requiring the user to retype the name.

- [x] **3.3 Static deploy readiness**
  - `npm run build` produces a single self-contained `dist/` directory using
    only relative asset paths (no leading `/`).
  - The built `dist/` renders and functions correctly when served from a
    non-root subpath (verified with a local static server mounted at a
    subpath, e.g. `/brandcheck/`).

- [x] **3.4 (Design polish) Responsive and accessibility pass**
  - Every interactive control has a visible focus-visible state and meets a
    44px minimum touch target on mobile widths.
  - Text contrast for both verdict colors against their backgrounds measures
    at least 4.5:1.
