export const COPY = {
  title: "太极 · 生息",
  subtitle: "一动一静，万象自平衡",
  hint: "移动鼠标，感受阴阳流转",
  panelTitle: "观象",
  pauseOverlay: "万籁俱寂，心自有光",
  resumeOverlay: "流转再起，气韵重生",
  mobileTitle: "请使用桌面设备观看",
  mobileDescription: "此作品为沉浸式三维展示，建议在电脑端开启完整体验。",
  mobileFootnote: "感谢观赏，愿你在动静之间，见天地与自我。"
};

export const QUOTES = [
  "虚实相生",
  "刚柔并济",
  "动中有静",
  "守中致和",
  "循环不息",
  "心境自明"
];

export const SPEED_SETTINGS = {
  slow: { label: "缓", value: 0.25 },
  normal: { label: "和", value: 0.45 },
  fast: { label: "劲", value: 0.8 }
};

export function resolveClockwiseAngularVelocity(stateOrMode) {
  const speedMode = typeof stateOrMode === "string" ? stateOrMode : stateOrMode?.speedMode;
  const configured = SPEED_SETTINGS[speedMode]?.value ?? SPEED_SETTINGS.normal.value;
  return Math.abs(configured);
}

export const THEMES = {
  xuan: {
    label: "玄夜",
    cssClass: "theme-xuan",
    scene: {
      ambient: 0x8f9ec6,
      directional: 0xf6f8ff
    },
    taiji: {
      yin: 0x090d14,
      yang: 0xf0f3fa,
      ring: 0xc6a96b
    },
    particles: {
      main: 0xd7c18b,
      sub: 0x90a4c7
    }
  },
  yun: {
    label: "云宣",
    cssClass: "theme-yun",
    scene: {
      ambient: 0xb7b2a4,
      directional: 0xfef8ed
    },
    taiji: {
      yin: 0x3f3b34,
      yang: 0xfffaf0,
      ring: 0xa89464
    },
    particles: {
      main: 0xab9870,
      sub: 0x9a8f7a
    }
  }
};

export const SETTINGS = {
  breathAmplitude: 0.012,
  breathFrequency: 1.1,
  quoteIntervalMs: 8000,
  particleCount: 800,
  introDurationSeconds: 3,
  themeTransitionDurationSeconds: 0.9,
  starfieldCount: 2000,
  bloomStrength: 0.4,
  bloomRadius: 0.35,
  bloomThreshold: 0.65,
  wobbleAmplitude: 0.04,
  wobbleFrequency: 0.3,
  parallaxStrength: 0.12,
  pauseSmoothing: 3.5
};
