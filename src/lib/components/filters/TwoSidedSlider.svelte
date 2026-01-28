<script lang="ts">
	interface Props {
		min: number;
		max: number;
		stepSize: number;
		selected: { min: number; max: number };
		sections: any[];
	}

	let { min, max, stepSize, selected = $bindable(), ...props }: Props = $props();

	// Initialize if needed - using a derived-like approach or just checking on mount
	if (!selected || Array.isArray(selected)) {
		selected = { min: 0, max: 8 }; // Fallback to provided specific defaults or passed props
	}

	function handleInput(e: Event, type: 'min' | 'max') {
		const target = e.target as HTMLInputElement;
		const val = parseFloat(target.value);

		if (type === 'min') {
			// Min slider can go up to (selected.max - stepSize)
			const clampedValue = Math.min(val, selected.max - stepSize);
			selected.min = clampedValue;
			// Force the input to snap back visually if it was pushed too far
			target.value = String(clampedValue);
		} else {
			// Max slider can go down to (selected.min + stepSize)
			const clampedValue = Math.max(val, selected.min + stepSize);
			selected.max = clampedValue;
			// Force the input to snap back visually if it was pushed too far
			target.value = String(clampedValue);
		}
	}

	function isSectionActive(index: number) {
		if (props.sections.length === 0) {
			return false;
		}

		let isActive = selected.min <= index && selected.max > index;
		return isActive;
	}

	let leftPercent = $derived(((selected.min - min) / (max - min)) * 100);
	let rightPercent = $derived(((selected.max - min) / (max - min)) * 100);
</script>

<div class="flex flex-col gap-6 py-4">
	<!-- Sections -->
	{#if props.sections.length > 0}
		<div class="flex w-full justify-between">
			{#each props.sections as section, index}
				<div
					class={[
						'flex w-full flex-col items-center opacity-60',
						isSectionActive(index) && 'opacity-100'
					]}
				>
					<p class="flex items-center">{section.display}</p>
					<p class="mt-2 text-sm text-neutral-500">{section.text}</p>
				</div>
			{/each}
		</div>
	{/if}
	<div class="relative h-8 w-full">
		{#if props.sections.length > 0}
			<div class="absolute top-0 left-0 z-100 flex w-full justify-around px-9">
				{#each Array(max - 1) as counter}
					<div class="h-6 w-2 bg-base-100"></div>
				{/each}
			</div>
		{/if}

		<!-- Track Background -->
		<div
			class="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-neutral-200/20"
		></div>

		<!-- Track Highlight -->
		<div
			class="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary"
			style="left: {leftPercent}%; right: {100 - rightPercent}%"
		></div>

		<!-- Sliders -->
		<input
			type="range"
			{min}
			{max}
			step={stepSize}
			value={selected.min}
			oninput={(e) => handleInput(e, 'min')}
			class="pointer-events-none absolute top-1/2 z-100 w-full -translate-y-1/2 appearance-none bg-transparent outline-none
			[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:active:scale-95
			[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-95"
		/>
		<input
			type="range"
			{min}
			{max}
			step={stepSize}
			value={selected.max}
			oninput={(e) => handleInput(e, 'max')}
			class="pointer-events-none absolute top-1/2 z-100 w-full -translate-y-1/2 appearance-none bg-transparent outline-none
			[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:active:scale-95
			[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-95"
		/>
	</div>

	{#if props.sections.length === 0}
		<div class="flex justify-between px-1 text-sm font-medium text-neutral-500">
			<div class="flex flex-col">
				<span>{selected.min}%</span>
			</div>
			<div class="flex flex-col items-end">
				<span>{selected.max >= max ? `More than ${max}%` : `${selected.max}%`}</span>
			</div>
		</div>
	{/if}
</div>
