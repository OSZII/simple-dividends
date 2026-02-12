<script lang="ts">
	import {
		CaretUp,
		CaretDown,
		Columns,
		Export,
		CaretLeft,
		CaretRight,
		CaretDoubleLeft,
		CaretDoubleRight
	} from 'phosphor-svelte';
	import ColumnModal from './ColumnModal.svelte';
	import RangeDisplay from './RangeDisplay.svelte';
	import { Chart } from '../chart';
	import type { ColumnConfig, SortState, SortDirection } from './types.js';
	import { formatCellValue, getPaginationRange } from './helpers.js';

	interface Props {
		columns: ColumnConfig[];
		data: Record<string, unknown>[];
		totalCount: number;
		currentPage?: number;
		pageSize?: number;
		sortState?: SortState;
		onSortChange?: (sortState: SortState) => void;
		onPageChange?: (page: number) => void;
	}

	let {
		columns = $bindable(),
		data,
		totalCount,
		currentPage = 1,
		pageSize = 10,
		sortState = { column: null, direction: null },
		onSortChange,
		onPageChange
	}: Props = $props();

	let showColumnModal = $state(false);

	// Get only enabled columns in order
	const enabledColumns = $derived(columns.filter((c) => c.enabled));

	function handleColumnClick(column: ColumnConfig) {
		if (!column.sortable) return;

		let newDirection: SortDirection;

		if (sortState.column !== column.key) {
			// New column - start with ascending
			newDirection = 'asc';
		} else {
			// Same column - cycle: asc -> desc -> null
			if (sortState.direction === 'asc') {
				newDirection = 'desc';
			} else if (sortState.direction === 'desc') {
				newDirection = null;
			} else {
				newDirection = 'asc';
			}
		}

		const newState: SortState = {
			column: newDirection ? column.key : null,
			direction: newDirection
		};

		onSortChange?.(newState);
	}

	function getSortIcon(column: ColumnConfig) {
		if (sortState.column !== column.key) return null;
		return sortState.direction;
	}

	function handlePageChange(newPage: number) {
		if (newPage < 1 || newPage > totalPages) return;
		onPageChange?.(newPage);
	}

	const totalPages = $derived(Math.ceil(totalCount / pageSize));
</script>

<div class="w-full">
	<!-- Header with total count and actions -->
	<div class="mb-4 flex items-center justify-between">
		<div></div>
		<div class="text-center">
			<span class="text-lg font-semibold">{totalCount.toLocaleString()} matches</span>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-sm btn-ghost gap-2" onclick={() => (showColumnModal = true)}>
				<Columns size={18} />
				Columns
			</button>
			<button class="btn btn-sm btn-ghost gap-2">
				<Export size={18} />
				Export
			</button>
		</div>
	</div>

	<!-- Table -->
	<div class="overflow-x-auto rounded-lg border border-base-300">
		<table class="table w-full">
			<!-- Header -->
			<thead>
				<tr class="bg-primary text-primary-content">
					{#each enabledColumns as column (column.key)}
						<th
							class="{column.key === 'name'
								? 'sticky left-0 bg-primary z-10 table-fixed min-w-[250px]'
								: ''} select-none whitespace-nowrap px-4 py-3 text-sm font-semibold"
							class:cursor-pointer={column.sortable}
							class:hover:brightness-90={column.sortable}
							onclick={() => handleColumnClick(column)}
							style:text-align={column.align || 'left'}
						>
							<div
								class="flex items-center gap-1"
								class:justify-center={column.align === 'center'}
								class:justify-end={column.align === 'right'}
							>
								<span>{column.label}</span>
								{#if column.sortable}
									<span
										class="flex flex-col z-0"
										class:opacity-100={getSortIcon(column) !== null}
										class:opacity-40={getSortIcon(column) === null}
									>
										{#if getSortIcon(column) === 'asc'}
											<CaretUp size={14} weight="fill" />
										{:else if getSortIcon(column) === 'desc'}
											<CaretDown size={14} weight="fill" />
										{/if}
									</span>
								{/if}
							</div>
						</th>
					{/each}
				</tr>
			</thead>

			<!-- Body -->
			<tbody>
				{#each data as row, rowIndex (rowIndex)}
					<tr class="border-b border-base-200 hover:bg-base-200 max-h-[65px] overflow-hidden">
						{#each enabledColumns as column (column.key)}
							<td
								class="{column.key === 'name'
									? 'sticky left-0 bg-base-300 z-10'
									: ''} px-4 py-3 text-sm"
								style:text-align={column.align || 'left'}
							>
								{#if column.key === 'fiftyTwoWeekRange'}
									<RangeDisplay
										min={row.fiftyTwoWeekLow}
										max={row.fiftyTwoWeekHigh}
										current={row.price}
									/>
								{:else if column.key === 'price'}
									{@const priceHistory =
										(row.priceHistory as { date: string; price: string }[] | undefined)?.map(
											(item) => ({ x: new Date(item.date), y: parseFloat(item.price) })
										) ?? []}
									<p class="text-xs mb-2">
										{parseFloat(row[column.key] as string).toFixed(2)}$
									</p>
									<div class="h-5 w-24">
										<Chart
											baselineStroke="#FFF"
											baselineStrokeWidth={1}
											baselineStrokeDasharray="3,3"
											baseline={row.price}
											data={priceHistory}
										/>
									</div>
								{:else if column.key === 'name'}
									<p class="text-sm">{row.symbol}</p>
									<a href="/company/{row.ticker}" class="max-w-[210px] truncate inline-block"
										>{row[column.key]}</a
									>
								{:else if column.modify && row[column.key]}
									{column.modify(row[column.key])}
								{:else}
									{formatCellValue(row[column.key], column)}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination -->
	{#if totalPages > 1}
		<div class="mt-4 flex items-center justify-center gap-2">
			<!-- First Page -->
			<button
				class="btn btn-square btn-sm btn-ghost"
				disabled={currentPage === 1}
				onclick={() => handlePageChange(1)}
			>
				<CaretDoubleLeft size={16} />
			</button>

			<!-- Previous Page -->
			<button
				class="btn btn-square btn-sm btn-ghost"
				disabled={currentPage === 1}
				onclick={() => handlePageChange(currentPage - 1)}
			>
				<CaretLeft size={16} />
			</button>

			<!-- Page Numbers -->
			<div class="join">
				{#each getPaginationRange(currentPage, totalPages) as page}
					<button
						class="join-item btn btn-sm w-10 {currentPage === page
							? 'btn-active btn-primary'
							: 'btn-ghost'}"
						onclick={() => handlePageChange(page as number)}
					>
						{page}
					</button>
				{/each}
			</div>

			<!-- Next Page -->
			<button
				class="btn btn-square btn-sm btn-ghost"
				disabled={currentPage === totalPages}
				onclick={() => handlePageChange(currentPage + 1)}
			>
				<CaretRight size={16} />
			</button>

			<!-- Last Page -->
			<button
				class="btn btn-square btn-sm btn-ghost"
				disabled={currentPage === totalPages}
				onclick={() => handlePageChange(totalPages)}
			>
				<CaretDoubleRight size={16} />
			</button>
		</div>
	{/if}
</div>

<!-- Column Modal -->
<ColumnModal bind:open={showColumnModal} bind:columns />
