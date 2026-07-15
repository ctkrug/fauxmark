---
title: "I built a fake-Amazon-brand checker that scores a name letter by letter"
published: false
tags: typescript, webdev, showdev, vite
---

If you shop on Amazon you have met names like `KUAFYQ`, `Vensiono`, and
`MIDONE`. They are placeholder brands, generated to satisfy a listing
requirement or squat on a keyword. You can feel that they are fake, but it is
hard to say exactly why. I wanted a tool that answers "is this a real brand?"
for one name, in the open, in under a second. That is Fauxmark.

It is a static TypeScript app with no backend and no framework. You paste a
name, and it scores four linguistic signals live as you type, then links you to
the USPTO trademark search to confirm. Here are the two parts that were more
interesting to build than I expected.

## Scoring a name without a dictionary

The whole premise is that generated names leave fingerprints in the string
itself, so the scorer never needs a word list. It runs four pure functions:

- **Vowel density.** Real English words sit near 32 to 48 percent vowels.
  Instead of a threshold I score distance from that band, so both vowel-starved
  strings (`kzvblqm`) and vowel-stuffed ones get penalized.
- **Consonant clustering.** The longest run of consecutive consonants is one of
  the sharpest tells. Real words rarely pass three (`strength`); generated ones
  string together four or more.
- **All-caps ratio.** Measured on the letters after the first, so a normal
  capitalized brand does not trip it but `KUAFYQ` does.
- **Pronounceability.** This one was the fun problem. I hand-curated a set of
  consonant-consonant bigrams that are legitimate English onsets, codas, and
  digraphs (`ch`, `str` via `st`, `nd`, `mp`, and so on). Any consonant pair
  outside that set counts as awkward, and the ratio of awkward pairs is a good
  proxy for "an English speaker would stumble reading this aloud."

The four scores are blended with weights (pronounceability and clustering carry
the most) into a single 0 to 100 number, which maps to a green, yellow, or red
verdict. To keep myself honest I built a fixture of 20 real names and 20
invented ones and a test that fails if the scorer does not verdict at least 80
percent of each group correctly. It currently gets 100 percent of the real ones
and 90 percent of the invented ones.

## The letter-by-letter highlight overlay

The effect I wanted: as you type, each letter colors itself as a vowel, a plain
consonant, or part of a flagged cluster. A text input cannot color individual
characters, so I used a two-layer trick. The real `<input>` has transparent
text but a visible caret (`color: transparent; caret-color: var(--text)`).
Behind it sits a positioned `<div>` that renders one `<span>` per character with
the right class. On every keystroke I re-run the classifier and rebuild that
layer, and I sync its `scrollLeft` to the input so long names stay aligned. The
classifier reuses the exact same three-in-a-row threshold as the clustering
metric, so what you see highlighted matches what the score penalizes.

## One bug worth mentioning

The scorer only recognizes ASCII letters, so I originally left the verdict on
"checking" until a score resolved. That meant a name in another script, or pure
emoji, sat on "checking" forever because no score would ever arrive. The fix was
to reserve "checking" for truly empty input and return an explicit "not enough
signal" state for anything non-empty that the heuristic cannot read. Small, but
it is the difference between a tool that feels broken and one that feels honest.

## What I would do differently

The pronounceable-bigram set is hand-picked and English-centric. A more
principled version would learn bigram frequencies from a real corpus and score
against that distribution, which would also travel better to other languages. I
would also like a phonotactic syllable check rather than just letter pairs.

Fauxmark is live at https://apps.charliekrug.com/brandcheck/ and the source is
at https://github.com/ctkrug/brandcheck. It is MIT licensed. If you find a real
brand it misreads, I would genuinely like to know.
