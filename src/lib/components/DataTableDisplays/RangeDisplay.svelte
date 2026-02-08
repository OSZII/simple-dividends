<script lang="ts">
	let { min, max, current } = $props();

	let percentage = $derived((current - min) / (max - min));
</script>

<div>
	<div class="relative">
		<!-- line -->
		<div class="h-1 w-full bg-base-300"></div>
		<!-- dot -->
		<div
			style="top: 50%; left: {percentage * 100}%; transform: translate(-50%, -50%);"
			class="absolute h-2 w-2 rounded-full bg-primary"
		></div>
	</div>
	<div class="flex justify-between items-center pt-3">
		<p class="text-xs text-base-content/70">{min.toFixed(2)}$</p>
		<p class="text-xs text-base-content/70">{max.toFixed(2)}$</p>
	</div>
</div>
