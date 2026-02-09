export function shouldUseDesktopFallback({ width, hasTouch }) {
  return width < 900 || hasTouch;
}
