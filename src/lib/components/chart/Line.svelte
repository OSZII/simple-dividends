<script lang="ts">
	import { getContext } from 'svelte';

	const { data, xGet, yGet } = getContext('LayerCake') as any;

	interface Props {
		/** Line stroke color */
		stroke?: string;
		/** Line stroke width */
		strokeWidth?: number;
	}

	let { stroke = '#ab00d6', strokeWidth = 2 }: Props = $props();

	let path = $derived(
		'M' +
			$data
				.map((d: any) => {
					return `${$xGet(d)},${$yGet(d)}`;
				})
				.join('L')
	);
</script>

<path class="path-line" d={path} {stroke} stroke-width={strokeWidth}></path>

<style>
	.path-line {
		fill: none;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
</style>
