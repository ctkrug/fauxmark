# BrandCheck — Design Direction

## Aesthetic direction

**Blueprint / technical.** BrandCheck is an inspection tool — you're checking a
name the way an engineer checks a drawing against spec. The page reads like a
drafting sheet: deep navy "paper," cyan ink annotations, a faint grid,
corner-bracket callouts pointing at the letters being measured. Nothing
playful or rounded; every element earns its place like a dimension line on a
blueprint.

## Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0b1220` | page background |
| `--surface-1` | `#12203a` | primary panels (input card, breakdown panel) |
| `--surface-2` | `#1a2d4d` | raised/hover surface, verdict badge shell |
| `--text` | `#e8eef7` | primary text |
| `--text-muted` | `#8fa3c4` | secondary/annotation text |
| `--accent` | `#4fc3f7` | ink cyan — highlights, focus rings, active metric bars |
| `--accent-support` | `#ffb74d` | amber — callouts, yellow verdict |
| `--success` | `#4caf50` | green verdict |
| `--danger` | `#f16b69` | red verdict |
| Display font | **Space Grotesk** (Google Fonts) | wordmark, headings; system fallback `ui-sans-serif, system-ui` |
| UI font | **JetBrains Mono** (Google Fonts) | body, labels, metric readouts, input; system fallback `ui-monospace, SFMono-Regular, Menlo, monospace` |
| Spacing unit | 8px scale (8/16/24/32/48/64) | all padding/margin/gaps |
| Corner radius | 4px | sharp, drafting-table feel — never pill-shaped |
| Shadow/glow | `0 0 0 1px rgba(79,195,247,.15)` hairline border + soft `0 8px 24px rgba(0,0,0,.35)` drop, cyan glow (`0 0 16px rgba(79,195,247,.35)`) on focus/active only | panels get depth without looking like generic cards |
| Motion | UI transitions 160ms ease-out; per-letter score reveal staggers ~40ms/letter, capped at 600ms total | consistent with a "measurement sweeping across the name" feel |

## Layout intent

The hero is the **name input + live letter analysis**, centered in a single
drafting-sheet panel that takes ~65% of viewport height on desktop
(1440×900): a large mono input where letters individually re-color as
vowel/consonant/awkward-cluster once scoring starts, with thin cyan
"dimension line" annotations dropping down to a metric breakdown strip below
it (four labeled bars: vowel density, consonant clustering, all-caps ratio,
pronounceability). The verdict badge sits to the right of the input on
desktop (stacks below on mobile), a bordered stamp-like rectangle that flips
text/color between CHECKING… / LOW RISK / REVIEW / LIKELY PSEUDO-BRAND. Below
the fold: a compact "how this works" strip and the TESS trademark search CTA.

At 390×844 phone: input card full-width, metric bars stack vertically full
width, verdict badge becomes a full-width strip under the input so it's the
first thing seen after typing. No dead margins — the grid background fills
the viewport edge-to-edge behind the centered content column (max 70ch).

## Signature detail

A faint animated **blueprint grid** (1px lines, very low opacity, slow
20s linear drift) fills the background, with a corner-bracket frame
(`⌐...¬`-style drafting corners rendered in CSS) around the main panel — like
the name is pinned to a technical drawing for inspection. The wordmark
"BrandCheck" is set in Space Grotesk with a small cyan caret/cursor glyph
after it that blinks slowly, reinforcing "actively measuring."

## Juice plan (live-scoring feedback, not a game, but the interaction is the whole product)

- **Input → visible response:** every keystroke re-runs scoring and updates
  letter highlighting within one animation frame (well under 100ms).
- **Letter-by-letter reveal:** as the score computes, each letter's
  vowel/consonant/cluster-flag color fades in with a ~40ms stagger
  left-to-right (capped ~600ms for long names) — a tween, not an instant swap.
- **Verdict flip:** the badge cross-fades + slides between CHECKING… and its
  final color/label over 200ms ease-out, never an instant hard cut.
- **Metric bars:** each of the four bars animates its fill width over 200ms
  ease-out when the score changes, so the breakdown feels measured, not
  teleported.
- **Sound (optional, muted by default):** a single soft WebAudio blip
  (short sine tone, pitch mapped to verdict — low/calm for green, sharp for
  red) plays once when the verdict first resolves from CHECKING…, rate-
  throttled to once per settle. A mute toggle (speaker icon) persists its
  state in `localStorage`. AudioContext is created lazily on first keystroke,
  guarded for environments where it's unavailable.
- Respect `prefers-reduced-motion`: disable the stagger/cross-fade in favor of
  instant state changes; keep the sound and function intact.

## Portfolio variety note

This is the first design direction logged for this factory run; no sibling
DESIGN.md history was available to check against. Blueprint/technical was
chosen deliberately over the more common "dark cards + one accent" default —
it's a distinct palette family (navy/cyan ink) and a distinct type pairing
(geometric display + mono body) from a generic dashboard look.
