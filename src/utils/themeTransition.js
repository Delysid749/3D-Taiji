function clamp01(value) {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

export function interpolateHexColor(fromHex, toHex, progress) {
  const t = clamp01(progress);
  const fromR = (fromHex >> 16) & 255;
  const fromG = (fromHex >> 8) & 255;
  const fromB = fromHex & 255;
  const toR = (toHex >> 16) & 255;
  const toG = (toHex >> 8) & 255;
  const toB = toHex & 255;

  const r = Math.round(fromR + (toR - fromR) * t);
  const g = Math.round(fromG + (toG - fromG) * t);
  const b = Math.round(fromB + (toB - fromB) * t);
  return (r << 16) + (g << 8) + b;
}
