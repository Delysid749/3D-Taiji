const initialState = {
  theme: "xuan",
  speedMode: "normal",
  paused: false,
  pointer: { x: 0, y: 0 }
};

export function createStore() {
  const state = {
    ...initialState,
    pointer: { ...initialState.pointer }
  };
  const listeners = new Set();

  const notify = () => {
    for (const listener of listeners) {
      listener({ ...state, pointer: { ...state.pointer } });
    }
  };

  return {
    getState() {
      return { ...state, pointer: { ...state.pointer } };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setTheme(theme) {
      state.theme = theme;
      notify();
    },
    setSpeed(speedMode) {
      state.speedMode = speedMode;
      notify();
    },
    togglePause() {
      state.paused = !state.paused;
      notify();
    },
    setPointer(x, y) {
      state.pointer.x = x;
      state.pointer.y = y;
    }
  };
}
