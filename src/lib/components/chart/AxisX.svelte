<script lang="ts">
	import { getContext } from 'svelte';

	const { width, height, xScale, yRange } = getContext('LayerCake') as any;

	interface Props {
		/** Show tick marks below the axis */
		tickMarks?: boolean;
		/** Show vertical gridlines */
		gridlines?: boolean;
		/** Length of tick marks in px */
		tickMarkLength?: number;
		/** Show horizontal baseline */
		baseline?: boolean;
		/** Snap first/last labels to edges */
		snapLabels?: boolean;
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
	}

	let {
		tickMarks = false,
		gridlines = true,
		tickMarkLength = 6,
		baseline = false,
		snapLabels = false,
		format = (d: any) => d,
		ticks = undefined,
		tickGutter = 0,
		dx = 0,
		dy = 12
	}: Props = $props();

	function textAnchor(i: number, sl: boolean): string {
		if (sl === true) {
			if (i === 0) return 'start';
			if (i === tickVals.length - 1) return 'end';
		}
		return 'middle';
	}

	let tickLen = $derived(tickMarks === true ? (tickMarkLength ?? 6) : 0);
	let isBandwidth = $derived(typeof $xScale.bandwidth === 'function');

	let tickVals = $derived(
		Array.isArray(ticks)
			? ticks
			: isBandwidth
				? $xScale.domain()
				: typeof ticks === 'function'
					? ticks($xScale.ticks())
					: $xScale.ticks(ticks)
	);

	let halfBand = $derived(isBandwidth ? $xScale.bandwidth() / 2 : 0);
</script>

<g class="axis x-axis" class:snapLabels>
	{#each tickVals as tick, i (tick)}
		{#if baseline === true}
			<line class="baseline" y1={$height} y2={$height} x1="0" x2={$width} />
		{/if}
		<g class="tick tick-{i}" transform="translate({$xScale(tick)},{Math.max(...$yRange)})">
			{#if gridlines === true}
				<line class="gridline" x1={halfBand} x2={halfBand} y1={-$height} y2="0" />
			{/if}
			{#if tickMarks === true}
				<line
					class="tick-mark"
					x1={halfBand}
					x2={halfBand}
					y1={tickGutter}
					y2={tickGutter + tickLen}
				/>
			{/if}
			<text
				x={halfBand}
				y={tickGutter + tickLen}
				{dx}
				{dy}
				text-anchor={textAnchor(i, snapLabels)}
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
	line,
	.tick line {
		stroke: #aaa;
		stroke-dasharray: 2;
	}
	.tick text {
		fill: #666;
	}
	.tick .tick-mark,
	.baseline {
		stroke-dasharray: 0;
	}
	.axis.snapLabels .tick:last-child text {
		transform: translateX(3px);
	}
	.axis.snapLabels .tick.tick-0 text {
		transform: translateX(-3px);
	}
</style>
