<script lang="ts">
	import { getContext } from 'svelte';
	import type { LabelPosition } from './types.js';

	const { xRange, yScale, width } = getContext('LayerCake') as any;

	interface Props {
		/** Show tick marks to the left of the axis */
		tickMarks?: boolean;
		/** Position of labels: 'even' aligns with ticks, 'above' places above */
		labelPosition?: LabelPosition;
		/** Snap the bottom-most label upward so it doesn't clip */
		snapBaselineLabel?: boolean;
		/** Show horizontal gridlines */
		gridlines?: boolean;
		/** Custom tick mark length in px */
		tickMarkLength?: number;
		/** Custom tick label formatter */
		format?: (d: any) => string;
		/** Number of ticks, tick values array, or filter function */
		ticks?: number | any[] | ((ticks: any[]) => any[]);
		/** Gap between axis and tick marks */
		tickGutter?: number;
		/** Horizontal label offset */
		dx?: number;
		/** Vertical label offset */
		dy?: number;
		/** Approximate pixel width of a single character (for layout) */
		charPixelWidth?: number;
	}

	let {
		tickMarks = false,
		labelPosition = 'even',
		snapBaselineLabel = false,
		gridlines = true,
		tickMarkLength = undefined,
		format = (d: any) => d,
		ticks = 4,
		tickGutter = 0,
		dx = 0,
		dy = 0,
		charPixelWidth = 7.25
	}: Props = $props();

	function calcStringLength(sum: number, val: string): number {
		if (val === ',' || val === '.') return sum + charPixelWidth * 0.5;
		return sum + charPixelWidth;
	}

	let isBandwidth = $derived(typeof $yScale.bandwidth === 'function');

	let tickVals = $derived(
		Array.isArray(ticks)
			? ticks
			: isBandwidth
				? $yScale.domain()
				: typeof ticks === 'function'
					? ticks($yScale.ticks())
					: $yScale.ticks(ticks)
	);

	let widestTickLen = $derived(
		Math.max(
			10,
			Math.max(
				...tickVals.map((d: any) =>
					format(d).toString().split('').reduce(calcStringLength, 0)
				)
			)
		)
	);

	let tickLen = $derived(
		tickMarks === true
			? labelPosition === 'above'
				? (tickMarkLength ?? widestTickLen)
				: (tickMarkLength ?? 6)
			: 0
	);

	let x1 = $derived(-tickGutter - (labelPosition === 'above' ? widestTickLen : tickLen));
	let y = $derived(isBandwidth ? $yScale.bandwidth() / 2 : 0);
	let maxTickValPx = $derived(Math.max(...tickVals.map($yScale)));
</script>

<g class="axis y-axis">
	{#each tickVals as tick (tick)}
		{@const tickValPx = $yScale(tick)}
		<g class="tick tick-{tick}" transform="translate({$xRange[0]}, {tickValPx})">
			{#if gridlines === true}
				<line class="gridline" {x1} x2={$width} y1={y} y2={y}></line>
			{/if}
			{#if tickMarks === true}
				<line class="tick-mark" {x1} x2={x1 + tickLen} y1={y} y2={y}></line>
			{/if}
			<text
				x={x1}
				{y}
				dx={dx + (labelPosition === 'even' ? -3 : 0)}
				text-anchor={labelPosition === 'above' ? 'start' : 'end'}
				dy={dy +
					(labelPosition === 'above' ||
					(snapBaselineLabel === true && tickValPx === maxTickValPx)
						? -3
						: 4)}
			>
				{format(tick)}
			</text>
		</g>
	{/each}
</g>

<style>
	.tick {
		font-size: 11px;
	}
	.tick line {
		stroke: #aaa;
	}
	.tick .gridline {
		stroke-dasharray: 2;
	}
	.tick text {
		fill: #666;
	}
	.tick.tick-0 line {
		stroke-dasharray: 0;
	}
</style>
