export function getIntroProgress(elapsed, durationSeconds) {
  if (durationSeconds <= 0) {
    return 1;
  }
  const progress = elapsed / durationSeconds;
  if (progress < 0) {
    return 0;
  }
  if (progress > 1) {
    return 1;
  }
  return progress;
}

export function easeOutCubic(value) {
  const clamped = Math.min(Math.max(value, 0), 1);
  return 1 - (1 - clamped) ** 3;
}
