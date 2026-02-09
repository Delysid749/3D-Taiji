function clamp01(value) {
  return Math.min(Math.max(value, 0), 1);
}

function normalizeDuration(duration) {
  return Number.isFinite(duration) && duration > 0 ? duration : 0.000001;
}

export function createSceneTransitionState() {
  return {
    active: false,
    elapsed: 0,
    duration: 0,
    from: null,
    to: null,
    progress: 0
  };
}

export function beginSceneThemeTransition(_state, { from, to, duration }) {
  const normalizedDuration = normalizeDuration(duration);
  return {
    active: true,
    elapsed: 0,
    duration: normalizedDuration,
    from,
    to,
    progress: 0
  };
}

export function advanceSceneThemeTransition(state, delta) {
  if (!state || !state.active) {
    return state;
  }

  const elapsed = Math.min(state.elapsed + Math.max(delta, 0), state.duration);
  const progress = clamp01(elapsed / state.duration);
  const active = progress < 1;

  return {
    active,
    elapsed,
    duration: state.duration,
    from: state.from,
    to: state.to,
    progress
  };
}

export function stepSceneThemeTransition(state, delta) {
  if (!state || !state.active) {
    return {
      state,
      progress: 0,
      from: null,
      to: null
    };
  }

  const nextState = advanceSceneThemeTransition(state, delta);
  return {
    state: nextState,
    progress: nextState.progress,
    from: nextState.from,
    to: nextState.to
  };
}
