// LayerCake chart components for Svelte 5
// Docs: https://layercake.graphics/
//
// Usage:
//   import { Line, Area, AxisX, AxisY, Scatter, Bar, Labels, Tooltip } from '$lib/components/chart';
//   import { formatCurrency, formatPercent } from '$lib/components/chart';
//   import type { ChartPoint } from '$lib/components/chart';
//
// These are "headless" components meant to be used inside LayerCake's
// <Svg>, <Canvas>, or <Html> layout wrappers:
//
//   <LayerCake x="x" y="y" {data} padding={{ top: 8, right: 10, bottom: 20, left: 25 }}>
//     <Svg>
//       <AxisX />
//       <AxisY ticks={4} />
//       <Line stroke="#f0c" />
//       <Area fill="#f0c10" />
//       <Scatter r={3} fill="#0cf" />
//       <Bar fill="#00bbff" />
//     </Svg>
//     <Html>
//       <Labels format={(d) => d.y.toFixed(2)} />
//       <Tooltip format={(d) => `${d.x}: $${d.y}`} />
//     </Html>
//   </LayerCake>

// Composite chart (ready-to-use, no LayerCake boilerplate needed)
export { default as Chart } from './Chart.svelte';

// SVG components (use inside <Svg>)
export { default as Line } from './Line.svelte';
export { default as Area } from './Area.svelte';
export { default as AxisX } from './AxisX.svelte';
export { default as AxisY } from './AxisY.svelte';
export { default as Scatter } from './Scatter.svelte';
export { default as Bar } from './Bar.svelte';
export { default as Baseline } from './Baseline.svelte';

// HTML components (use inside <Html>)
export { default as Labels } from './Labels.svelte';
export { default as Tooltip } from './Tooltip.svelte';

// Types
export type { ChartPoint, AxisTickFormat, TooltipData, LabelPosition, TextAnchor } from './types.js';

// Helpers
export {
	formatCurrency,
	formatPercent,
	formatDateShort,
	formatDateMonthYear,
	extent,
	lerp,
	clamp
} from './helpers.js';
