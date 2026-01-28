<script lang="ts">
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import FilterDropDown from '$lib/components/FilterDropDown.svelte';
	import FilterChip from '$lib/components/filters/FilterChip.svelte';
	import { Plus } from 'phosphor-svelte';

	// Initial filters state
	let filters = $state<Filter[]>([
		{
			id: 'safety',
			type: 'checkbox',
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
			type: 'two_sided_slider',
			min: 0,
			max: 8,
			stepSize: 0.5,
			title: 'Dividend Yield',
			active: false,
			filterDescription: 'Show companies yielding...',
			selected: {
				min: 0,
				max: 8
			}
		},
		{
			id: 'sector',
			type: 'checkbox',
			title: 'Sector',
			active: false,
			selected: [],
			options: [
				// Dynamically load that here
				// { value: 'tech', label: 'Technology' },
				// { value: 'tech', label: 'Technology' },
				// { value: 'finance', label: 'Financials' },
				// { value: 'health', label: 'Healthcare' },
				// { value: 'energy', label: 'Energy' }
			]
		},
		{
			id: 'latest_dividend_raise',
			type: 'two_sided_slider',
			min: 0,
			max: 6,
			stepSize: 1,
			title: 'Latest Dividend Raise',
			infotext:
				"A company's latest increase can indicate how quickly the payout is likely to grow going forward. All else equal, faster growth is preferrable, but there's usually a tradeoff between dividend growth and yield (e.g. a 3% raise for a high-yield stock is not bad).",
			active: false,
			filterDescription: '',
			sections: [
				{
					display: '< 0%',
					text: 'Negative'
				},
				{
					display: '0-3%',
					text: 'Very Slow'
				},
				{
					display: '3-5%',
					text: 'Slow'
				},
				{
					display: '5-8%',
					text: 'Average'
				},
				{
					display: '8-12%',
					text: 'Fast'
				},
				{
					display: '>12%',
					text: 'Very Fast'
				}
			],
			selected: {
				min: 0,
				max: 6
			}
		},
		{
			id: '52_week_range',
			type: 'radio',
			title: '52-Week Range',
			filterDescription: 'Show companies whose shares are trading...',
			options: [
				{
					value: '52-week-low',
					label: 'Near their 52-week low',
					description: 'Bottom 25% of price range'
				},
				{
					value: '52-week-midpoint',
					label: 'Below their 52-week midpoint',
					description: 'Bottom 50% of price range'
				},
				{
					value: '52-week-not-near-high',
					label: 'Not near their 52-week high',
					description: 'Bottom 75% of price range'
				},
				{
					value: '52-week-high',
					label: 'Near their 52-week high',
					description: 'Top 25% of price range'
				}
			],
			active: false,
			selected: '52-week-low'
		}
	]);

	function getDisplayValue(filter: Filter) {
		if (filter.type === 'two_sided_slider') {
			const s = filter.selected as { min: number; max: number };
			if (s.min === filter.min && s.max === filter.max) return '';
			const maxText = s.max >= (filter.max || 8) ? `+` : `%`;
			return `${s.min}% - ${s.max}${maxText}`;
		}

		if (filter.type === 'radio') {
			let selectedElement = filter.options?.find((el) => el.value === filter.selected);
			return `${selectedElement?.label} selected`;
		}

		const selected = filter.selected as string[];
		if (selected.length === 0) return '';
		if (selected.length === 1) {
			return filter.options?.find((o) => o.value === selected[0])?.label || '';
		}
		if (selected.length === (filter.options?.length || 0)) return 'All';
		return `${selected.length} selected`;
	}

	function isFilterActive(filter: Filter) {
		if (!filter.active) return false;

		// if slider filter not the default
		if (filter.type === 'two_sided_slider') {
			const s = filter.selected as { min: number; max: number };
			return s.min !== filter.min || s.max !== filter.max;
		}
		return (filter.selected as string[]).length > 0;
	}

	function removeFilter(id: string) {
		const filter = filters.find((f) => f.id === id);
		if (filter) {
			filter.active = false;
			if (filter.type === 'two_sided_slider') {
				filter.selected = { min: filter.min || 0, max: filter.max || 8 };
			} else {
				filter.selected = [];
			}
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
		filters.filter(isFilterActive).map((f) => ({ id: f.id, values: f.selected }))
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
			{#each filters as _, i (filters[i].id)}
				<FilterDropDown bind:filter={filters[i]} onApply={() => (filters[i].active = true)}>
					{#snippet trigger()}
						<FilterChip
							label={filters[i].title}
							valueDisplay={getDisplayValue(filters[i])}
							isActive={isFilterActive(filters[i])}
							onRemove={() => removeFilter(filters[i].id)}
						/>
					{/snippet}
				</FilterDropDown>
			{/each}

			<!-- More filters placeholder -->
			<div class="dropdown dropdown-end">
				<div
					tabIndex={0}
					role="button"
					class="btn gap-2 rounded-full border border-dashed border-base-content/20 px-4 py-2 font-medium text-base-content/60 btn-ghost"
				>
					<Plus size={16} weight="bold" class="text-primary" />
					More filters
				</div>
				<ul
					tabIndex={0}
					class="dropdown-content menu z-1 mt-2 w-52 rounded-box bg-base-100 p-2 shadow"
				>
					{#each filters.filter((f) => !f.active) as filter}
						<li>
							<button onclick={() => activateFilter(filter.id)}>{filter.title}</button>
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
