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
