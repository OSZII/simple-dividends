<script lang="ts">
	import { getContext } from 'svelte';

	const { data, xGet, yGet, width, height } = getContext('LayerCake') as any;

	interface Props {
		/** Format function for tooltip content */
		format?: (d: any) => string;
		/** Background color */
		bg?: string;
		/** Text color */
		color?: string;
		/** Offset from cursor in px */
		offset?: number;
	}

	let {
		format = (d: any) => `x: ${d.x}, y: ${d.y}`,
		bg = 'rgba(0,0,0,0.85)',
		color = '#fff',
		offset = 12
	}: Props = $props();

	let hoveredData = $state<any>(null);
	let mouseX = $state(0);
	let mouseY = $state(0);

	function handleMousemove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;

		// Find closest data point
		let closestDist = Infinity;
		let closest = null;

		for (const d of $data) {
			const dx = $xGet(d) - mouseX;
			const dy = $yGet(d) - mouseY;
			const dist = dx * dx + dy * dy;
			if (dist < closestDist) {
				closestDist = dist;
				closest = d;
			}
		}

		hoveredData = closest;
	}

	function handleMouseleave() {
		hoveredData = null;
	}

	let tooltipLeft = $derived.by(() => {
		if (mouseX > $width / 2) return mouseX - offset;
		return mouseX + offset;
	});

	let tooltipTransform = $derived(mouseX > $width / 2 ? 'translateX(-100%)' : 'translateX(0)');
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="tooltip-layer"
	style="position: absolute; inset: 0; z-index: 10;"
	onmousemove={handleMousemove}
	onmouseleave={handleMouseleave}
>
	{#if hoveredData}
		<div
			class="tooltip"
			style="
				position: absolute;
				left: {tooltipLeft}px;
				top: {mouseY - offset}px;
				transform: {tooltipTransform};
				background: {bg};
				color: {color};
				padding: 6px 10px;
				border-radius: 4px;
				font-size: 12px;
				pointer-events: none;
				white-space: nowrap;
				z-index: 20;
			"
		>
			{format(hoveredData)}
		</div>
	{/if}
</div>
