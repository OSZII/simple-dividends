<script lang="ts">
	import type { ColumnConfig } from './Datatable.svelte';
	import { List, Check } from 'phosphor-svelte';

	interface Props {
		open: boolean;
		columns: ColumnConfig[];
	}

	let { open = $bindable(), columns = $bindable() }: Props = $props();

	let draggedIndex: number | null = $state(null);

	function handleDragStart(e: DragEvent, index: number) {
		draggedIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
		}
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === index) return;

		// Reorder columns
		const newColumns = [...columns];
		const [draggedItem] = newColumns.splice(draggedIndex, 1);
		newColumns.splice(index, 0, draggedItem);
		columns = newColumns;
		draggedIndex = index;
	}

	function handleDragEnd() {
		draggedIndex = null;
	}

	function toggleColumn(index: number) {
		columns[index].enabled = !columns[index].enabled;
	}

	function closeModal() {
		open = false;
	}
</script>

{#if open}
	<!-- Modal Backdrop -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		onclick={closeModal}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		role="dialog"
		aria-modal="true"
	>
		<!-- Modal Content -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="bg-base-100 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
			onclick={(e) => e.stopPropagation()}
			role="document"
		>
			<!-- Header -->
			<div class="px-6 py-4 border-b border-base-300">
				<h2 class="text-xl font-bold text-center">Columns</h2>
			</div>

			<!-- Column List -->
			<div class="flex-1 overflow-y-auto px-2 py-2">
				{#each columns as column, index (column.key)}
					<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
					<button
						class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-base-200 cursor-pointer"
						draggable="true"
						ondragstart={(e) => handleDragStart(e, index)}
						ondragover={(e) => handleDragOver(e, index)}
						ondragend={handleDragEnd}
						class:opacity-50={draggedIndex === index}
						onclick={() => toggleColumn(index)}
						onkeydown={(e) => e.key === 'Enter' && toggleColumn(index)}
						role="listitem"
						tabindex="0"
					>
						<!-- Checkbox -->
						<div
							class="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
							class:border-primary={column.enabled}
							class:bg-primary={column.enabled}
							class:border-base-300={!column.enabled}
						>
							{#if column.enabled}
								<Check size={14} weight="bold" class="text-primary-content" />
							{/if}
						</div>

						<!-- Label -->
						<span class="flex-1 text-base-content">{column.label}</span>

						<!-- Drag Handle -->
						<div class="text-base-content/40 cursor-grab active:cursor-grabbing">
							<List size={20} />
						</div>
					</button>
				{/each}
			</div>

			<!-- Footer -->
			<div class="px-6 py-4 border-t border-base-300">
				<button class="btn btn-primary w-full" onclick={closeModal}> Done </button>
			</div>
		</div>
	</div>
{/if}
