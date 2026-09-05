/** Recharts animation — disabled for snappier mobile UI. */
export const CHART_ANIMATION = {
  isAnimationActive: false,
  animationDuration: 0,
} as const;

/**
 * Disable Recharts keyboard/focus layer so iOS WebKit does not draw a
 * blue focus box around the chart SVG on tap.
 */
export const CHART_FOCUS = {
  accessibilityLayer: false,
  tabIndex: -1,
} as const;

/** Shared tooltip chrome — readable in light and dark themes. */
export const CHART_TOOLTIP_STYLE = {
  background: "var(--bg-elevated)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--fg)",
  boxShadow: "var(--shadow-soft)",
} as const;

export const CHART_TOOLTIP_ITEM_STYLE = {
  color: "var(--fg)",
} as const;

export const CHART_TOOLTIP_LABEL_STYLE = {
  color: "var(--fg-muted)",
} as const;

/** Bar/area hover cursor — never the default light gray wash. */
export const CHART_CURSOR = {
  fill: "var(--bg-muted)",
  opacity: 0.55,
} as const;
