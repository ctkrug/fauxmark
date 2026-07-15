import { analyzeBrandName, classifyLetters, type Verdict } from "./scorer";
import { decodeNameFromHash, encodeNameToHash } from "./urlState";

// Per-letter fade-in staggers ~40ms/letter, capped so even a long name
// finishes its reveal within ~600ms total (per docs/DESIGN.md).
const LETTER_STAGGER_MS = 40;
const MAX_LETTER_DELAY_MS = 480;

// No real brand name is anywhere near this long (Amazon listing titles cap
// around 200 characters). Bounding input length keeps the per-letter
// highlight layer's DOM node count sane and stops a pasted wall of text
// (or a maliciously huge shared link) from ballooning the URL hash.
const MAX_INPUT_LENGTH = 200;

function renderHighlightLayer(container: HTMLElement, value: string): void {
  container.textContent = "";
  classifyLetters(value).forEach(({ char, cls }, i) => {
    const span = document.createElement("span");
    span.className = `letter letter-${cls}`;
    span.style.animationDelay = `${Math.min(i * LETTER_STAGGER_MS, MAX_LETTER_DELAY_MS)}ms`;
    span.textContent = char;
    container.appendChild(span);
  });
}

const VERDICT_LABEL: Record<Verdict, string> = {
  checking: "checking…",
  insufficient: "not enough signal",
  green: "low risk",
  yellow: "review",
  red: "likely pseudo-brand",
};

const TESS_URL = "https://tmsearch.uspto.gov/search/search-information";

// Matches the .verdict.flip transition duration in style.css.
const VERDICT_FLIP_MS = 200;

function createVerdictSetter(verdictEl: HTMLElement) {
  // Matches the verdict baked into the initial markup, so a fresh page
  // load with an empty input doesn't trigger a pointless flip.
  let current: Verdict = "checking";
  let pendingFlip: ReturnType<typeof setTimeout> | undefined;

  return (next: Verdict) => {
    if (next === current) return;
    current = next;
    clearTimeout(pendingFlip);
    verdictEl.classList.add("flip");
    pendingFlip = setTimeout(() => {
      verdictEl.dataset.verdict = next;
      verdictEl.textContent = VERDICT_LABEL[next];
      verdictEl.classList.remove("flip");
    }, VERDICT_FLIP_MS);
  };
}

function renderApp(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page">
      <h1 class="wordmark">Fauxmark<span class="caret">_</span></h1>
      <p class="tagline">
        Paste a brand name from an Amazon listing and find out if it reads like
        a real company or a generated pseudo-brand, in about a second, before
        you buy.
      </p>
      <section class="panel">
        <span class="corner corner-tl" aria-hidden="true"></span>
        <span class="corner corner-tr" aria-hidden="true"></span>
        <span class="corner corner-bl" aria-hidden="true"></span>
        <span class="corner corner-br" aria-hidden="true"></span>
        <div class="input-row">
          <div class="input-field">
            <label for="brand-input">Brand name</label>
            <div class="input-wrap">
              <div class="highlight-layer" id="highlight-layer" aria-hidden="true"></div>
              <input
                id="brand-input"
                type="text"
                placeholder="e.g. KUAFYQ"
                autocomplete="off"
                spellcheck="false"
                maxlength="${MAX_INPUT_LENGTH}"
              />
            </div>
          </div>
          <div class="verdict" id="verdict" data-verdict="checking" role="status">
            checking…
          </div>
        </div>
        <ul class="metrics" id="metrics"></ul>
        <a
          class="cta"
          id="tess-link"
          href="${TESS_URL}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Check this name on USPTO TESS →
        </a>
      </section>
      <section class="how-it-works">
        <h2>How this works</h2>
        <p>
          Fauxmark runs four linguistic heuristics against the name you paste.
          No dictionary lookup, no trademark database, just pattern-matching
          against how ordinary English brand names read and sound. A high score
          means the name reads like a keyword-stuffed or randomly generated
          Amazon listing name. It is a starting signal, not a verdict on whether
          the name is trademarked or infringing.
        </p>
        <ul class="how-it-works-list">
          <li><strong>Vowel density</strong> real words land near 32-48% vowels.</li>
          <li><strong>Consonant clustering</strong> long consonant runs are rare in English.</li>
          <li><strong>All-caps ratio</strong> SHOUTY names are an Amazon keyword-stuffing tell.</li>
          <li><strong>Pronounceability</strong> awkward consonant pairs are hard to say aloud.</li>
        </ul>
      </section>
      <section class="faq">
        <h2>Is this a real brand on Amazon?</h2>
        <p>
          Real companies pick names a person can say and spell. Generated
          pseudo-brands leave fingerprints in the string itself: vowel ratios
          outside the normal band, long consonant runs, all-caps shouting, and
          letter pairs no English speaker says on the first try. Fauxmark scores
          those four signals so you can read the name the way you would read a
          drawing against spec, then check the trademark before you trust it.
        </p>
        <dl class="faq-list">
          <dt>How can I tell if a brand name on Amazon is real?</dt>
          <dd>
            Paste it above. A low score means the name reads like an ordinary
            word or an established brand. A high score means it looks
            machine-generated, which is a reason to check the seller and the
            trademark before you buy. The score reads the name only, so pair it
            with reviews and seller history.
          </dd>
          <dt>Is Fauxmark a fake Amazon brand checker?</dt>
          <dd>
            Yes, it is a free in-browser fake Amazon brand checker, but it reads
            linguistic signal rather than a registry. It cannot tell you a name
            is unregistered or counterfeit; it tells you whether the name looks
            generated. Every result links straight to the USPTO trademark search
            so you can confirm the real answer.
          </dd>
          <dt>What is an Amazon white-label or pseudo-brand name?</dt>
          <dd>
            Many sellers register a placeholder brand to meet Amazon's
            brand-registry and listing rules, so names like KUAFYQ, Vensiono, or
            MIDONE get generated to be unique and keyword-safe rather than
            memorable. An Amazon white-label brand name check is exactly this:
            flagging names that look assembled by a machine instead of chosen by
            a person.
          </dd>
          <dt>Does a high score mean the product is a scam?</dt>
          <dd>
            No. A generated-looking name is common for legitimate budget and
            private-label goods. Fauxmark measures how the name reads, not
            product quality or seller trust. Treat it as one signal among the
            reviews, the return policy, and the trademark record.
          </dd>
          <dt>Do you store the names I check?</dt>
          <dd>
            No. Everything runs in your browser with no backend. Nothing is sent
            to a server, and the shareable link encodes the name in the URL
            itself so you stay in control of it.
          </dd>
        </dl>
      </section>
      <footer class="site-footer">
        <a
          class="footer-link"
          href="https://github.com/ctkrug/brandcheck"
          target="_blank"
          rel="noopener noreferrer"
          >View Fauxmark on GitHub →</a
        >
        <a
          class="footer-link footer-muted"
          href="https://apps.charliekrug.com"
          target="_blank"
          rel="noopener noreferrer"
          >More by Charlie Krug → apps.charliekrug.com</a
        >
      </footer>
    </div>
  `;

  const input = root.querySelector<HTMLInputElement>("#brand-input")!;
  const highlightLayer = root.querySelector<HTMLElement>("#highlight-layer")!;
  const verdictEl = root.querySelector<HTMLElement>("#verdict")!;
  const metricsEl = root.querySelector<HTMLUListElement>("#metrics")!;
  const tessLink = root.querySelector<HTMLAnchorElement>("#tess-link")!;
  const setVerdict = createVerdictSetter(verdictEl);

  const update = () => {
    const result = analyzeBrandName(input.value);

    renderHighlightLayer(highlightLayer, input.value);

    setVerdict(result.verdict);

    metricsEl.innerHTML = !result.input
      ? `<li class="metrics-empty">Type a name above to see the vowel density, clustering, caps ratio, and pronounceability breakdown.</li>`
      : result.metrics
          .map(
            (m) => `
              <li class="metric-row">
                <div class="meta"><span>${m.label}</span><span>${m.score}</span></div>
                <div class="bar-track"><div class="bar-fill" style="width:${m.score}%"></div></div>
                <p class="detail">${m.detail}</p>
              </li>
            `,
          )
          .join("");

    tessLink.href = result.input
      ? `${TESS_URL}?searchText=${encodeURIComponent(result.input)}`
      : TESS_URL;

    const hash = encodeNameToHash(input.value);
    history.replaceState(null, "", `${location.pathname}${location.search}${hash}`);
  };

  // maxlength only constrains typed/pasted input, not this programmatic
  // assignment, so a crafted overlong shared link needs its own clamp.
  input.value = decodeNameFromHash(location.hash).slice(0, MAX_INPUT_LENGTH);
  input.addEventListener("input", update);
  input.addEventListener("scroll", () => {
    highlightLayer.scrollLeft = input.scrollLeft;
  });
  update();
}

const root = document.getElementById("app");
if (root) renderApp(root);
