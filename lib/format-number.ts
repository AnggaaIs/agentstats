export function formatCompactNumber(value: number): string {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;

  if (safeValue < 1_000) return Math.round(safeValue).toString();

  const unit =
    safeValue >= 999_500_000
      ? { value: 1_000_000_000, suffix: "b" }
      : safeValue >= 999_500
        ? { value: 1_000_000, suffix: "m" }
        : { value: 1_000, suffix: "k" };
  const compact = safeValue / unit.value;
  const rounded =
    compact >= 100
      ? Math.round(compact)
      : compact >= 10
        ? Math.round(compact * 10) / 10
        : Math.round(compact * 10) / 10;

  return `${rounded.toFixed(rounded % 1 === 0 ? 0 : 1)}${unit.suffix}`;
}
