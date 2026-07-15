import { analyzeBrandName, classifyLetters, type Verdict } from "./scorer";
import { decodeNameFromHash, encodeNameToHash } from "./urlState";

// Per-letter fade-in staggers ~40ms/letter, capped so even a long name
// finishes its reveal within ~600ms total (per docs/DESIGN.md).
const LETTER_STAGGER_MS = 40;
const MAX_LETTER_DELAY_MS = 480;

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
      <h1 class="wordmark">BrandCheck<span class="caret">_</span></h1>
      <p class="tagline">
        Paste a brand name from an Amazon listing to see its pseudo-brand signal score.
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

  input.value = decodeNameFromHash(location.hash);
  input.addEventListener("input", update);
  input.addEventListener("scroll", () => {
    highlightLayer.scrollLeft = input.scrollLeft;
  });
  update();
}

const root = document.getElementById("app");
if (root) renderApp(root);
