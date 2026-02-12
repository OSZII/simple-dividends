<script lang="ts">
	import { getContext } from 'svelte';

	const { data, xGet, yGet, xScale, yScale } = getContext('LayerCake') as any;

	interface Props {
		/** Circle radius */
		r?: number;
		/** Circle fill color */
		fill?: string;
		/** Circle stroke color */
		stroke?: string;
		/** Circle stroke width */
		strokeWidth?: number;
	}

	let { r = 5, fill = '#0cf', stroke = '#000', strokeWidth = 0 }: Props = $props();
</script>

<g class="scatter-group">
	{#each $data as d}
		<circle
			cx={$xGet(d) + ($xScale.bandwidth ? $xScale.bandwidth() / 2 : 0)}
			cy={$yGet(d) + ($yScale.bandwidth ? $yScale.bandwidth() / 2 : 0)}
			{r}
			{fill}
			{stroke}
			stroke-width={strokeWidth}
		/>
	{/each}
</g>
