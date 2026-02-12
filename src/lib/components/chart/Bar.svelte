<script lang="ts">
	import { getContext } from 'svelte';

	const { data, xGet, yGet, xScale, yScale } = getContext('LayerCake') as any;

	interface Props {
		/** Bar fill color */
		fill?: string;
	}

	let { fill = '#00bbff' }: Props = $props();
</script>

<g class="bar-group">
	{#each $data as d, i}
		<rect
			class="group-rect"
			data-id={i}
			x={$xScale.range()[0]}
			y={$yGet(d)}
			height={$yScale.bandwidth()}
			width={$xGet(d)}
			{fill}
		></rect>
	{/each}
</g>
