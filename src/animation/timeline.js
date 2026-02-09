import { SETTINGS } from "../config.js";
import { getIntroProgress } from "../utils/intro.js";

export function createTimeline({ store, render, updateScene, updateTaiji, updateParticles }) {
  let rafId = 0;
  let lastTime = performance.now();
  let elapsed = 0;
  let realElapsed = 0;
  let timeScale = 1;
  let sceneUpdateFaulted = false;

  function frame(now) {
    const state = store.getState();
    const frameDelta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    // Smooth pause / resume transition
    const targetTimeScale = state.paused ? 0 : 1;
    timeScale += (targetTimeScale - timeScale) * Math.min(frameDelta * SETTINGS.pauseSmoothing, 1);
    if (Math.abs(timeScale) < 0.001) timeScale = 0;

    const delta = frameDelta * timeScale;
    elapsed += delta;
    realElapsed += frameDelta;

    const introProgress = getIntroProgress(elapsed, SETTINGS.introDurationSeconds);
    const effects = { introProgress, realDelta: frameDelta, realElapsed };

    if (typeof updateScene === "function") {
      try {
        updateScene(delta, elapsed, state, effects);
      } catch (error) {
        if (!sceneUpdateFaulted) {
          sceneUpdateFaulted = true;
          console.error("Scene update failed; continuing timeline loop.", error);
        }
      }
    }
    updateTaiji(delta, elapsed, state, effects);
    updateParticles(delta, elapsed, state, effects);
    render();

    rafId = requestAnimationFrame(frame);
  }

  function start() {
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    cancelAnimationFrame(rafId);
  }

  return { start, stop };
}
