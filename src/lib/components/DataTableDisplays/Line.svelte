<script lang="ts">
	import { getContext } from 'svelte';

	// @ts-ignore
	const { data, xGet, yGet } = getContext('LayerCake');

	let color = '#f0c';

	let path = $derived.by(() => {
		return (
			'M' +
			$data
				.map((d: any) => {
					return `${$xGet(d)},${$yGet(d)}`;
				})
				.join('L')
		);
	});
</script>

<path d={path} fill="none" stroke={color} stroke-width="1.5" />
