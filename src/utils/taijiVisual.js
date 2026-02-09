function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hexToCss(hex) {
  return `#${hex.toString(16).padStart(6, "0")}`;
}

export const FIXED_OUTER_RING_COLOR = 0x9da3a6;
export const TAIJI_MONO_COLORS = { yin: 0x000000, yang: 0xffffff };

export const TAIJI_SYMBOL_CONFIG = {
  radiusRatio: 0.46,
  lobeOffsetRatio: 0.5,
  eyeRadiusRatio: 0.125
};

export function resolveOuterRingColor() {
  return FIXED_OUTER_RING_COLOR;
}

export function resolveTaijiMonoColors() {
  return { ...TAIJI_MONO_COLORS };
}

export function getTaijiSymbolMetrics(size, config = TAIJI_SYMBOL_CONFIG) {
  const radius = Math.round(size * config.radiusRatio);
  const halfRadius = Math.round(radius * config.lobeOffsetRatio);
  const eyeRadius = Math.round(radius * config.eyeRadiusRatio);
  return {
    center: size / 2,
    radius,
    halfRadius,
    eyeRadius
  };
}

export function drawTaijiSymbolTexture(ctx, size, colors, config = TAIJI_SYMBOL_CONFIG) {
  const { center, radius, halfRadius, eyeRadius } = getTaijiSymbolMetrics(size, config);

  ctx.clearRect(0, 0, size, size);
  ctx.save();

  // 裁剪为主圆
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // 1. 整体填充阳色（白）
  ctx.fillStyle = hexToCss(colors.yang);
  ctx.fillRect(0, 0, size, size);

  // 2. 右半圆填充阴色（黑）—— 从12点顺时针到6点
  ctx.fillStyle = hexToCss(colors.yin);
  ctx.beginPath();
  ctx.arc(center, center, radius, -Math.PI / 2, Math.PI / 2);
  ctx.closePath();
  ctx.fill();

  // 3. 阴色（黑）半圆向上凸出 —— S曲线上半部分，黑色侵入左侧白色区域
  ctx.beginPath();
  ctx.arc(center, center - halfRadius, halfRadius, 0, Math.PI * 2);
  ctx.fill();

  // 4. 阳色（白）半圆向下凸出 —— S曲线下半部分，白色侵入右侧黑色区域
  ctx.fillStyle = hexToCss(colors.yang);
  ctx.beginPath();
  ctx.arc(center, center + halfRadius, halfRadius, 0, Math.PI * 2);
  ctx.fill();

  // 5. 阴眼：黑点在下方白色凸出区域内
  ctx.fillStyle = hexToCss(colors.yin);
  ctx.beginPath();
  ctx.arc(center, center + halfRadius, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  // 6. 阳眼：白点在上方黑色凸出区域内
  ctx.fillStyle = hexToCss(colors.yang);
  ctx.beginPath();
  ctx.arc(center, center - halfRadius, eyeRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function getBreathScale(elapsed, amplitude = 0.01, frequency = 1.1) {
  const safeAmplitude = clamp(Number.isFinite(amplitude) ? amplitude : 0.01, 0, 0.03);
  const safeFrequency = Math.max(Math.abs(Number.isFinite(frequency) ? frequency : 1.1), 0.001);
  const scale = 1 + Math.sin(elapsed * safeFrequency) * safeAmplitude;
  return clamp(scale, 1 - safeAmplitude, 1 + safeAmplitude);
}
