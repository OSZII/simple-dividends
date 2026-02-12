<script lang="ts">
	import { LayerCake, Svg } from 'layercake';
	import Line from './Line.svelte';
	import Baseline from './Baseline.svelte';
	import type { ChartPoint } from './types.js';

	interface Props {
		data: ChartPoint[];
		stroke?: string;
		strokeWidth?: number;
		baseline?: number;
		baselineStroke?: string;
		baselineStrokeWidth?: number;
		baselineStrokeDasharray?: string;
	}

	let {
		data,
		stroke = '#ab00d6',
		strokeWidth = 2,
		baseline,
		baselineStroke = '#666',
		baselineStrokeWidth = 1,
		baselineStrokeDasharray = '4,4'
	}: Props = $props();
</script>

{#if data.length > 1}
	<LayerCake x="x" y="y" {data}>
		<Svg>
			<Line {stroke} {strokeWidth} />
			{#if baseline !== undefined}
				<Baseline
					value={baseline}
					stroke={baselineStroke}
					strokeWidth={baselineStrokeWidth}
					strokeDasharray={baselineStrokeDasharray}
				/>
			{/if}
		</Svg>
	</LayerCake>
{/if}
