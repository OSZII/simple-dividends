<script lang="ts">
	import { getContext } from 'svelte';

	const { data, xGet, yGet } = getContext('LayerCake') as any;

	interface Props {
		/** Format function for the label text */
		format?: (d: any) => string;
		/** Vertical offset from the data point in px */
		dy?: number;
		/** Horizontal offset from the data point in px */
		dx?: number;
		/** Font size in px */
		fontSize?: number;
		/** Label text color */
		color?: string;
	}

	let {
		format = (d: any) => String(d.y ?? d),
		dy = -10,
		dx = 0,
		fontSize = 11,
		color = '#666'
	}: Props = $props();
</script>

<div class="labels-group">
	{#each $data as d}
		<div
			class="label"
			style="
				position: absolute;
				left: {$xGet(d) + dx}px;
				top: {$yGet(d) + dy}px;
				font-size: {fontSize}px;
				color: {color};
				transform: translateX(-50%);
				white-space: nowrap;
				pointer-events: none;
			"
		>
			{format(d)}
		</div>
	{/each}
</div>
