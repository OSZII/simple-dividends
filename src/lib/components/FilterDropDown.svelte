<script lang="ts">
	import { AlertDialog } from 'bits-ui';
	import CheckboxFilter from './filters/CheckboxFilter.svelte';
	import type { Snippet } from 'svelte';

	interface Option {
		value: string;
		label: string;
		description?: string;
	}

	interface Props {
		title: string;
		infotext?: string; // The info text/gray box
		groupLabel?: string; // The label above checkboxes
		filters: Option[];
		checked?: string[];
		onApply?: () => void;
		trigger?: Snippet;
	}

	let {
		title,
		infotext,
		groupLabel,
		filters,
		checked = $bindable([]),
		onApply,
		trigger
	}: Props = $props();

	let open = $state(false);
	let localChecked = $state<string[]>([]);

	$effect(() => {
		if (open) {
			localChecked = [...checked];
		}
	});

	function handleApply() {
		checked = [...localChecked];
		onApply?.();
		open = false;
	}
</script>

<AlertDialog.Root bind:open>
	{#if trigger}
		<AlertDialog.Trigger>
			{@render trigger()}
		</AlertDialog.Trigger>
	{:else}
		<AlertDialog.Trigger class="btn btn-outline btn-sm">Filter</AlertDialog.Trigger>
	{/if}

	<AlertDialog.Portal>
		<AlertDialog.Overlay class="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />

		<AlertDialog.Content
			class="fixed top-[50%] left-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-base-100 p-6 shadow-xl outline-none"
		>
			<AlertDialog.Title class="mb-6 text-center text-xl font-bold">{title}</AlertDialog.Title>

			<div class="flex flex-col gap-4">
				{#if infotext}
					<div class="rounded-sm bg-base-200 p-4 text-sm text-base-content/80">
						{infotext}
					</div>
				{/if}

				{#if groupLabel}
					<div class="font-medium">{groupLabel}</div>
				{/if}

				<div class="flex flex-col gap-3">
					{#each filters as filter}
						<CheckboxFilter
							value={filter.value}
							label={filter.label}
							description={filter.description}
							bind:checked={localChecked}
						/>
					{/each}
				</div>
			</div>

			<div class="mt-6 grid grid-cols-2 gap-3">
				<AlertDialog.Action class="btn w-full text-white btn-primary" onclick={handleApply}>
					Apply
				</AlertDialog.Action>
				<AlertDialog.Cancel
					class="btn w-full border-none bg-neutral-800 text-base-content hover:bg-base-300"
				>
					Cancel
				</AlertDialog.Cancel>
			</div>
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
