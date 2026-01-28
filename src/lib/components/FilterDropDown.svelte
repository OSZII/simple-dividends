<script lang="ts">
	import { AlertDialog } from 'bits-ui';
	import CheckboxFilter from './filters/CheckboxFilter.svelte';
	import TwoSidedSlider from './filters/TwoSidedSlider.svelte';
	import type { Snippet } from 'svelte';
	import RadioFilter from './filters/RadioFilter.svelte';

	interface Props {
		filter: Filter;
		onApply?: () => void;
		trigger?: Snippet;
	}

	let { filter = $bindable(), onApply, trigger }: Props = $props();

	let open = $state(false);
	let localSelected = $state<any>(null);

	$effect(() => {
		if (open) {
			if (filter.type === 'two_sided_slider') {
				localSelected = { ...(filter.selected as object) };
			} else if (filter.type === 'radio') {
				localSelected = filter.selected;
			} else {
				const selectedArray = (filter.selected as string[]) || [];
				const obj: Record<string, boolean> = {};
				filter.options?.forEach((opt) => {
					obj[opt.value] = selectedArray.includes(opt.value);
				});
				localSelected = obj;
			}
		}
	});

	// this is called from radio filter onchange
	function handleOnChange(e: any) {
		localSelected = e.target.value;
	}

	function handleApply() {
		console.log(localSelected, 'apply');

		if (filter.type === 'two_sided_slider') {
			filter.selected = { ...localSelected };
		} else if (filter.type === 'radio') {
			filter.selected = localSelected;
		} else {
			// Convert back to array of selected values
			filter.selected = Object.keys(localSelected).filter((key) => localSelected[key]);
		}
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
			<AlertDialog.Title class="mb-6 text-center text-xl font-bold"
				>{filter.title}</AlertDialog.Title
			>

			<div class="flex flex-col gap-4">
				{#if filter.infotext}
					<div class="rounded-sm bg-base-200 p-4 text-sm text-base-content/80">
						{filter.infotext}
					</div>
				{/if}

				{#if filter.filterDescription}
					<div class="text-center font-medium">{filter.filterDescription}</div>
				{/if}

				<div class="flex flex-col gap-3">
					{#if localSelected !== null}
						{#if filter.type === 'two_sided_slider'}
							<TwoSidedSlider
								min={filter.min ?? 0}
								max={filter.max ?? 8}
								stepSize={filter.stepSize ?? 0.5}
								sections={filter.sections ?? []}
								bind:selected={localSelected}
							/>
						{:else if filter.type === 'radio'}
							{#each filter.options || [] as option}
								<RadioFilter
									id={filter.id}
									onchange={handleOnChange}
									value={option.value}
									label={option.label}
									description={option.description}
									checked={localSelected == option.value}
								/>
							{/each}
						{:else}
							{#each filter.options || [] as option}
								<CheckboxFilter
									value={option.value}
									label={option.label}
									description={option.description}
									bind:checked={localSelected[option.value]}
								/>
							{/each}
						{/if}
					{/if}
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
