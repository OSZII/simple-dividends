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
		'btn flex items-center gap-2 rounded-full text-sm whitespace-nowrap transition-all duration-150 select-none',
		isActive ? 'text-primary-content btn-primary' : 'btn-dash'
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
			class="ml-1 p-1 outline-0 transition-colors hover:cursor-pointer"
			onclick={(e) => {
				e.stopPropagation();
				onRemove?.();
			}}
		>
			<X size={14} weight="bold" />
		</button>
	{/if}
</div>
