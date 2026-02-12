<script lang="ts">
	import { getContext } from 'svelte';

	const { data, xGet, yGet, xScale, yScale, extents } = getContext('LayerCake') as any;

	interface Props {
		/** Area fill color (supports alpha, e.g. '#ab00d610') */
		fill?: string;
	}

	let { fill = '#ab00d610' }: Props = $props();

	let linePath = $derived(
		'M' +
			$data
				.map((d: any) => {
					return `${$xGet(d)},${$yGet(d)}`;
				})
				.join('L')
	);

	let area = $derived.by(() => {
		const yRange = $yScale.range();
		return (
			linePath +
			'L' +
			$xScale($extents.x ? $extents.x[1] : 0) +
			',' +
			yRange[0] +
			'L' +
			$xScale($extents.x ? $extents.x[0] : 0) +
			',' +
			yRange[0] +
			'Z'
		);
	});
</script>

<path class="path-area" d={area} {fill}></path>
