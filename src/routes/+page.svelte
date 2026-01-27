<script lang="ts">
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import FilterDropDown from '$lib/components/FilterDropDown.svelte';
	import FilterChip from '$lib/components/filters/FilterChip.svelte';
	import { Plus } from 'phosphor-svelte';

	// Initial filters state
	let filters = $state<Filter[]>([
		{
			id: 'safety',
			label: 'Dividend Safety',
			title: 'Dividend Safety',
			active: true,
			selected: [],
			filterDescription: 'Show companies whose dividend appears...',
			infotext:
				'Our Dividend Safety Scores look at a company’s financial metrics to evaluate how secure its dividend appears over a full economic cycle.',
			options: [
				{ value: 'very_safe', label: 'Very Safe', description: 'a cut is highly unlikely' },
				{ value: 'safe', label: 'Safe', description: 'a cut is unlikely' },
				{
					value: 'borderline_safe',
					label: 'Borderline Safe',
					description: 'moderate risk of a cut'
				},
				{ value: 'unsafe', label: 'Unsafe', description: 'moderate to high risk of a cut' },
				{ value: 'very_unsafe', label: 'Very Unsafe', description: 'high risk of a cut' }
			]
		},
		{
			id: 'yield',
			label: 'Dividend Yield',
			title: 'Dividend Yield',
			active: false,
			selected: [],
			options: [
				{ value: 'high', label: 'High (> 4%)' },
				{ value: 'medium', label: 'Medium (2-4%)' },
				{ value: 'low', label: 'Low (< 2%)' }
			]
		},
		{
			id: 'sector',
			label: 'Sector',
			title: 'Sector',
			active: false,
			selected: [],
			options: [
				{ value: 'tech', label: 'Technology' },
				{ value: 'finance', label: 'Financials' },
				{ value: 'health', label: 'Healthcare' },
				{ value: 'energy', label: 'Energy' }
			]
		}
	]);

	function getDisplayValue(filter: Filter) {
		if (filter.selected.length === 0) return '';
		if (filter.selected.length === 1) {
			return filter.options.find((o) => o.value === filter.selected[0])?.label || '';
		}
		if (filter.selected.length === filter.options.length) return 'All';
		return `${filter.selected.length} selected`;
	}

	function removeFilter(id: string) {
		const filter = filters.find((f) => f.id === id);
		if (filter) {
			filter.active = false;
			filter.selected = [];
		}
	}

	function activateFilter(id: string) {
		const filter = filters.find((f) => f.id === id);
		if (filter) {
			filter.active = true;
		}
	}

	// Computed: all active selected filters for real data filtering
	const activeFilters = $derived(
		filters
			.filter((f) => f.active && f.selected.length > 0)
			.map((f) => ({ id: f.id, values: f.selected }))
	);
</script>

<PageLayout
	title="Analyze and find Dividend investments that suit you best!"
	description="Comprehensive list of dividend stocks and etfs"
>
	<div class="flex flex-col items-center gap-6 py-8">
		<div class="text-center">
			<h1 class="mb-2 text-4xl font-bold">Companies</h1>
			<p class="text-base-content/60">Screen for companies that match these filters:</p>
		</div>

		<div class="flex max-w-5xl flex-wrap justify-center gap-3">
			{#each filters as filter (filter.id)}
				<FilterDropDown
					title={filter.title}
					infotext={filter.infotext}
					filterDescription={filter.filterDescription}
					{filter}
					bind:checked={filter.selected}
					onApply={() => (filter.active = true)}
				>
					{#snippet trigger()}
						<FilterChip
							label={filter.label}
							valueDisplay={getDisplayValue(filter)}
							isActive={filter.active && filter.selected.length > 0}
							onRemove={() => removeFilter(filter.id)}
						/>
					{/snippet}
				</FilterDropDown>
			{/each}

			<!-- More filters placeholder -->
			<div class="dropdown dropdown-end">
				<div
					tabIndex={0}
					role="button"
					class="btn gap-2 rounded-full border border-dashed border-base-content/20 font-medium text-base-content/60 btn-ghost btn-sm"
				>
					<Plus size={16} weight="bold" class="text-primary" />
					More filters
				</div>
				<ul
					tabIndex={0}
					class="dropdown-content menu z-1 mt-2 w-52 rounded-box bg-base-100 p-2 shadow"
				>
					{#each filters.filter((f) => !f.active || f.selected.length === 0) as filter}
						<li>
							<button onclick={() => activateFilter(filter.id)}>{filter.label}</button>
						</li>
					{/each}
				</ul>
			</div>
		</div>

		<div class="flex gap-4 text-sm text-base-content/60">
			<button
				class="flex items-center gap-1 hover:underline"
				onclick={() =>
					filters.forEach((f) => {
						f.active = false;
						f.selected = [];
					})}
			>
				Reset
			</button>
			<span>|</span>
			<button class="hover:underline">Save screen...</button>
		</div>

		<!-- Debug info -->
		<div class="mt-8 w-full max-w-md rounded-lg bg-base-200 p-4">
			<h3 class="mb-2 font-bold">Active Filters for API:</h3>
			<pre class="text-xs">{JSON.stringify(activeFilters, null, 2)}</pre>
		</div>
	</div>
</PageLayout>
