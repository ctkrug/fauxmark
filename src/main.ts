import { analyzeBrandName, type Verdict } from "./scorer";
import { decodeNameFromHash, encodeNameToHash } from "./urlState";

const VERDICT_LABEL: Record<Verdict, string> = {
  checking: "checking…",
  insufficient: "not enough signal",
  green: "low risk",
  yellow: "review",
  red: "likely pseudo-brand",
};

const TESS_URL = "https://tmsearch.uspto.gov/search/search-information";

function renderApp(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page">
      <h1 class="wordmark">BrandCheck<span class="caret">_</span></h1>
      <p class="tagline">
        Paste a brand name from an Amazon listing to see its pseudo-brand signal score.
      </p>
      <section class="panel">
        <div>
          <label for="brand-input">Brand name</label>
          <input id="brand-input" type="text" placeholder="e.g. KUAFYQ" autocomplete="off" />
        </div>
        <div class="verdict" id="verdict" data-verdict="checking" role="status">
          checking…
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
  const verdictEl = root.querySelector<HTMLElement>("#verdict")!;
  const metricsEl = root.querySelector<HTMLUListElement>("#metrics")!;
  const tessLink = root.querySelector<HTMLAnchorElement>("#tess-link")!;

  const update = () => {
    const result = analyzeBrandName(input.value);

    verdictEl.dataset.verdict = result.verdict;
    verdictEl.textContent = VERDICT_LABEL[result.verdict];

    metricsEl.innerHTML = result.metrics
      .map(
        (m) => `
          <li class="metric-row">
            <div class="meta"><span>${m.label}</span><span>${m.score}</span></div>
            <div class="bar-track"><div class="bar-fill" style="width:${m.score}%"></div></div>
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
  update();
}

const root = document.getElementById("app");
if (root) renderApp(root);
