import { COPY, QUOTES, SETTINGS, SPEED_SETTINGS, THEMES } from "../config.js";
import { getNextQuoteIndex } from "../utils/messages.js";

function createButton(label, action, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "control-button";
  button.dataset.action = action;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

export function createOverlay(root, store) {
  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const hero = document.createElement("section");
  hero.className = "hero";
  hero.innerHTML = `
    <h1>${COPY.title}</h1>
    <p class="subtitle">${COPY.subtitle}</p>
    <p class="hint">${COPY.hint}</p>
  `;

  const status = document.createElement("div");
  status.className = "status";

  const panel = document.createElement("section");
  panel.className = "control-panel";
  panel.innerHTML = `<h2>${COPY.panelTitle}</h2>`;

  const speedGroup = document.createElement("div");
  speedGroup.className = "button-row";
  const speedButtons = Object.entries(SPEED_SETTINGS).map(([key, value]) =>
    createButton(value.label, `speed:${key}`, () => store.setSpeed(key))
  );
  speedButtons.forEach((button) => speedGroup.appendChild(button));

  const themeGroup = document.createElement("div");
  themeGroup.className = "button-row";
  const themeButtons = Object.entries(THEMES).map(([key, value]) =>
    createButton(value.label, `theme:${key}`, () => store.setTheme(key))
  );
  themeButtons.forEach((button) => themeGroup.appendChild(button));

  const toggleButton = createButton("止", "toggle", () => store.togglePause());
  toggleButton.classList.add("toggle");

  panel.appendChild(speedGroup);
  panel.appendChild(themeGroup);
  panel.appendChild(toggleButton);

  const quote = document.createElement("div");
  quote.className = "quote";
  let quoteIndex = 0;
  quote.textContent = QUOTES[quoteIndex];

  const centerToast = document.createElement("div");
  centerToast.className = "center-toast";

  overlay.appendChild(hero);
  overlay.appendChild(status);
  overlay.appendChild(panel);
  overlay.appendChild(quote);
  overlay.appendChild(centerToast);
  root.appendChild(overlay);

  let lastPausedState = false;

  function showToast(message) {
    centerToast.textContent = message;
    centerToast.classList.remove("show");
    window.setTimeout(() => centerToast.classList.add("show"), 0);
    window.setTimeout(() => centerToast.classList.remove("show"), 1500);
  }

  function update(state) {
    status.innerHTML = `
      <span>当前流速：${SPEED_SETTINGS[state.speedMode].label}</span>
      <span>当前意境：${THEMES[state.theme].label}</span>
      <span>当前状态：${state.paused ? "已静止" : "运行中"}</span>
    `;

    for (const button of speedButtons) {
      button.classList.toggle("active", button.dataset.action === `speed:${state.speedMode}`);
    }
    for (const button of themeButtons) {
      button.classList.toggle("active", button.dataset.action === `theme:${state.theme}`);
    }
    toggleButton.textContent = state.paused ? "行" : "止";

    if (state.paused !== lastPausedState) {
      showToast(state.paused ? COPY.pauseOverlay : COPY.resumeOverlay);
      lastPausedState = state.paused;
    }
  }

  const unsubscribe = store.subscribe(update);
  update(store.getState());

  const quoteTimer = window.setInterval(() => {
    quoteIndex = getNextQuoteIndex(quoteIndex, QUOTES.length);
    quote.textContent = QUOTES[quoteIndex];
  }, SETTINGS.quoteIntervalMs);

  return {
    destroy() {
      unsubscribe();
      window.clearInterval(quoteTimer);
      root.removeChild(overlay);
    }
  };
}
