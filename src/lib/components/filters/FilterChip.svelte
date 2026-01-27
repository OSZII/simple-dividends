<script lang="ts">
	import { Plus, X } from 'phosphor-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		valueDisplay?: string; // e.g. "Borderline Safe and up"
		isActive?: boolean;
		onRemove?: () => void;
		onclick?: () => void;
	}

	let { label, valueDisplay, isActive = false, onRemove, onclick }: Props = $props();
</script>

<div
	role="button"
	tabindex="0"
	class={[
		'flex cursor-pointer items-center gap-2 rounded-full bg-neutral-800 px-4 py-2 text-sm whitespace-nowrap transition-all select-none',
		isActive
			? 'border border-neutral-400 text-white shadow-sm'
			: 'border border-dashed text-base-content/60 hover:border-base-content/40'
	]}
	{onclick}
	onkeydown={(e) => e.key === 'Enter' && onclick?.()}
>
	{#if !isActive}
		<Plus size={16} weight="bold" />
	{/if}

	<div class="pointer-events-none flex items-center gap-1.5">
		<span class={isActive ? 'font-bold' : 'font-medium'}>{label}</span>
		{#if isActive && valueDisplay}
			<span class="font-normal opacity-70">{valueDisplay}</span>
		{/if}
	</div>

	{#if isActive}
		<button
			type="button"
			class="pointer-events-auto ml-1 rounded-md p-1 transition-colors hover:bg-neutral-600"
			onclick={(e) => {
				e.stopPropagation();
				onRemove?.();
			}}
		>
			<X size={14} weight="bold" />
		</button>
	{/if}
</div>
