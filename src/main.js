import "./styles/global.css";
import { COPY, THEMES } from "./config.js";
import { createScene } from "./scene/createScene.js";
import { createTaiji } from "./scene/createTaiji.js";
import { createParticles } from "./scene/createParticles.js";
import { createStore } from "./state/store.js";
import { shouldUseDesktopFallback } from "./utils/device.js";
import { createOverlay } from "./ui/overlay.js";
import { createTimeline } from "./animation/timeline.js";

function renderDesktopFallback(root) {
  root.innerHTML = `
    <main class="mobile-fallback">
      <h1>${COPY.mobileTitle}</h1>
      <p>${COPY.mobileDescription}</p>
      <small>${COPY.mobileFootnote}</small>
    </main>
  `;
}

function run() {
  const root = document.querySelector("#app");
  if (!root) {
    return;
  }

  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (shouldUseDesktopFallback({ width: window.innerWidth, hasTouch })) {
    renderDesktopFallback(root);
    return;
  }

  const sceneHost = document.createElement("div");
  sceneHost.className = "scene-host";
  root.appendChild(sceneHost);

  const store = createStore();
  let currentThemeKey = "xuan";
  document.body.classList.add(THEMES[currentThemeKey].cssClass);

  const sceneInstance = createScene(sceneHost, THEMES[currentThemeKey]);
  const taiji = createTaiji(sceneInstance.scene, THEMES[currentThemeKey]);
  const particles = createParticles(sceneInstance.scene, THEMES[currentThemeKey]);
  const overlay = createOverlay(root, store);

  const timeline = createTimeline({
    store,
    render: sceneInstance.render,
    updateScene: sceneInstance.update,
    updateTaiji: taiji.update,
    updateParticles: particles.update
  });

  const unsubscribe = store.subscribe((state) => {
    if (state.theme !== currentThemeKey) {
      document.body.classList.remove(THEMES[currentThemeKey].cssClass);
      currentThemeKey = state.theme;
      document.body.classList.add(THEMES[currentThemeKey].cssClass);
      sceneInstance.setTheme(THEMES[currentThemeKey]);
      taiji.setTheme(THEMES[currentThemeKey]);
      particles.setTheme(THEMES[currentThemeKey]);
    }
  });

  function onResize() {
    sceneInstance.resize();
  }

  function onKeyDown(event) {
    if (event.code === "Space") {
      event.preventDefault();
      store.togglePause();
      return;
    }
    if (event.key === "1") {
      store.setSpeed("slow");
    }
    if (event.key === "2") {
      store.setSpeed("normal");
    }
    if (event.key === "3") {
      store.setSpeed("fast");
    }
    if (event.key.toLowerCase() === "t") {
      const nextTheme = store.getState().theme === "xuan" ? "yun" : "xuan";
      store.setTheme(nextTheme);
    }
  }

  function onMouseMove(event) {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    store.setPointer(x, y);
  }

  window.addEventListener("resize", onResize);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("beforeunload", () => {
    timeline.stop();
    unsubscribe();
    overlay.destroy();
    taiji.dispose();
    particles.dispose();
    sceneInstance.dispose();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("mousemove", onMouseMove);
  });

  timeline.start();
}

run();
