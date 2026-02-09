import assert from "node:assert/strict";

const failures = [];

async function run(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL ${name}`);
    console.error(error.message);
  }
}

await run("store initial state", async () => {
  const { createStore } = await import("../src/state/store.js");
  const store = createStore();
  assert.deepEqual(store.getState(), {
    theme: "xuan",
    speedMode: "normal",
    paused: false,
    pointer: { x: 0, y: 0 }
  });
});

await run("store updates speed and pause", async () => {
  const { createStore } = await import("../src/state/store.js");
  const store = createStore();
  store.setSpeed("fast");
  store.togglePause();
  assert.equal(store.getState().speedMode, "fast");
  assert.equal(store.getState().paused, true);
});

await run("desktop fallback rules", async () => {
  const { shouldUseDesktopFallback } = await import("../src/utils/device.js");
  assert.equal(shouldUseDesktopFallback({ width: 768, hasTouch: false }), true);
  assert.equal(shouldUseDesktopFallback({ width: 1366, hasTouch: true }), true);
  assert.equal(shouldUseDesktopFallback({ width: 1440, hasTouch: false }), false);
});

await run("quote rotation wraps", async () => {
  const { getNextQuoteIndex } = await import("../src/utils/messages.js");
  assert.equal(getNextQuoteIndex(0, 6), 1);
  assert.equal(getNextQuoteIndex(4, 6), 5);
  assert.equal(getNextQuoteIndex(5, 6), 0);
});

await run("intro progress clamps into range", async () => {
  const { getIntroProgress } = await import("../src/utils/intro.js");
  assert.equal(getIntroProgress(-1, 3), 0);
  assert.equal(getIntroProgress(0, 3), 0);
  assert.equal(getIntroProgress(1.5, 3), 0.5);
  assert.equal(getIntroProgress(5, 3), 1);
});

await run("color interpolation returns midpoint and endpoints", async () => {
  const { interpolateHexColor } = await import("../src/utils/themeTransition.js");
  assert.equal(interpolateHexColor(0x000000, 0xffffff, 0), 0x000000);
  assert.equal(interpolateHexColor(0x000000, 0xffffff, 1), 0xffffff);
  assert.equal(interpolateHexColor(0x000000, 0xffffff, 0.5), 0x808080);
});

await run("scene transition state is inactive by default", async () => {
  const { createSceneTransitionState } = await import("../src/utils/sceneTransitionState.js");
  assert.deepEqual(createSceneTransitionState(), {
    active: false,
    elapsed: 0,
    duration: 0,
    from: null,
    to: null,
    progress: 0
  });
});

await run("scene transition starts as active with reset progress", async () => {
  const { createSceneTransitionState, beginSceneThemeTransition } = await import("../src/utils/sceneTransitionState.js");
  const started = beginSceneThemeTransition(createSceneTransitionState(), {
    from: { ambient: 0x000000, directional: 0x111111, back: 0x222222 },
    to: { ambient: 0xffffff, directional: 0xeeeeee, back: 0xdddddd },
    duration: 0.9
  });

  assert.equal(started.active, true);
  assert.equal(started.elapsed, 0);
  assert.equal(started.duration, 0.9);
  assert.equal(started.progress, 0);
});

await run("scene transition advances, clamps, and stays stable when done", async () => {
  const { createSceneTransitionState, beginSceneThemeTransition, advanceSceneThemeTransition } = await import(
    "../src/utils/sceneTransitionState.js"
  );
  const started = beginSceneThemeTransition(createSceneTransitionState(), {
    from: { ambient: 1, directional: 2, back: 3 },
    to: { ambient: 4, directional: 5, back: 6 },
    duration: 1
  });
  const advanced = advanceSceneThemeTransition(started, 0.25);
  assert.equal(advanced.active, true);
  assert.equal(advanced.progress, 0.25);

  const done = advanceSceneThemeTransition(advanced, 1.5);
  assert.equal(done.active, false);
  assert.equal(done.progress, 1);
  assert.equal(done.elapsed, done.duration);

  const stableDone = advanceSceneThemeTransition(done, 0.5);
  assert.deepEqual(stableDone, done);
});

await run("scene transition step exposes progress payload without undefined refs", async () => {
  const { createSceneTransitionState, beginSceneThemeTransition, stepSceneThemeTransition } = await import(
    "../src/utils/sceneTransitionState.js"
  );
  const started = beginSceneThemeTransition(createSceneTransitionState(), {
    from: { ambient: 0x123456, directional: 0x223344, back: 0x334455 },
    to: { ambient: 0xabcdef, directional: 0xbccdde, back: 0xcdddee },
    duration: 1
  });

  const stepped = stepSceneThemeTransition(started, 0.4);
  assert.equal(stepped.state.active, true);
  assert.equal(stepped.progress, 0.4);
  assert.equal(stepped.from.ambient, 0x123456);
  assert.equal(stepped.to.directional, 0xbccdde);
});

await run("scene transition step is no-op while inactive", async () => {
  const { createSceneTransitionState, stepSceneThemeTransition } = await import("../src/utils/sceneTransitionState.js");
  const inactive = createSceneTransitionState();
  const stepped = stepSceneThemeTransition(inactive, 0.2);
  assert.equal(stepped.progress, 0);
  assert.equal(stepped.from, null);
  assert.equal(stepped.to, null);
  assert.deepEqual(stepped.state, inactive);
});

await run("speed resolver maps modes to clockwise angular velocity", async () => {
  const { resolveClockwiseAngularVelocity } = await import("../src/config.js");
  assert.equal(resolveClockwiseAngularVelocity("slow"), 0.25);
  assert.equal(resolveClockwiseAngularVelocity("normal"), 0.45);
  assert.equal(resolveClockwiseAngularVelocity("fast"), 0.8);
  assert.equal(resolveClockwiseAngularVelocity("slow") > 0, true);
  assert.equal(resolveClockwiseAngularVelocity("normal") > 0, true);
  assert.equal(resolveClockwiseAngularVelocity("fast") > 0, true);
});

await run("speed resolver does not require pointer state", async () => {
  const { resolveClockwiseAngularVelocity } = await import("../src/config.js");
  const velocity = resolveClockwiseAngularVelocity({ speedMode: "normal" });
  assert.equal(velocity, 0.45);
  assert.equal(velocity > 0, true);
});

await run("taiji symbol uses canonical yin-yang proportions", async () => {
  const { TAIJI_SYMBOL_CONFIG, getTaijiSymbolMetrics } = await import("../src/utils/taijiVisual.js");
  const metrics = getTaijiSymbolMetrics(1000, TAIJI_SYMBOL_CONFIG);
  assert.equal(metrics.radius, 460);
  assert.equal(metrics.halfRadius, 230);
  assert.equal(metrics.eyeRadius, 58);
});

await run("outer ring color remains fixed neutral gray", async () => {
  const { FIXED_OUTER_RING_COLOR, resolveOuterRingColor } = await import("../src/utils/taijiVisual.js");
  assert.equal(FIXED_OUTER_RING_COLOR, 0x9da3a6);
  assert.equal(resolveOuterRingColor("xuan"), 0x9da3a6);
  assert.equal(resolveOuterRingColor("yun"), 0x9da3a6);
});

await run("breathing scale stays subtle around unity", async () => {
  const { getBreathScale } = await import("../src/utils/taijiVisual.js");
  const low = getBreathScale(0, 0.01, 1.1);
  const high = getBreathScale(Math.PI / 2, 0.01, 1.1);
  assert.equal(low >= 0.99 && low <= 1.01, true);
  assert.equal(high >= 0.99 && high <= 1.01, true);
});

await run("taiji palette stays monochrome regardless of theme", async () => {
  const { resolveTaijiMonoColors } = await import("../src/utils/taijiVisual.js");
  const xuan = resolveTaijiMonoColors("xuan");
  const yun = resolveTaijiMonoColors("yun");
  assert.deepEqual(xuan, { yin: 0x000000, yang: 0xffffff });
  assert.deepEqual(yun, { yin: 0x000000, yang: 0xffffff });
});

if (failures.length > 0) {
  console.error(`\n${failures.length} test(s) failed.`);
  process.exit(1);
}

console.log("\nAll tests passed.");
