<script lang="ts">
	import { getContext } from 'svelte';

	const { yGet, width } = getContext('LayerCake') as any;

	interface Props {
		/** The y-value where the baseline should be drawn */
		value: number;
		/** Line stroke color */
		stroke?: string;
		/** Line stroke width */
		strokeWidth?: number;
		/** Line dash array (e.g., "5,5" for dashed line) */
		strokeDasharray?: string;
	}

	let {
		value,
		stroke = '#666',
		strokeWidth = 1,
		strokeDasharray = '4,4'
	}: Props = $props();

	// Get the y position for the baseline value
	let y = $derived($yGet({ y: value }));
</script>

<line
	class="baseline"
	x1={0}
	y1={y}
	x2={$width}
	y2={y}
	{stroke}
	stroke-width={strokeWidth}
	stroke-dasharray={strokeDasharray}
></line>

<style>
	.baseline {
		opacity: 0.6;
	}
</style>
