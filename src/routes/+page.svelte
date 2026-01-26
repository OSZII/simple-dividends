<script lang="ts">
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import FilterDropDown from '$lib/components/FilterDropDown.svelte';

	const safetyOptions = [
		{
			value: 'very_safe',
			label: 'Very Safe',
			description: 'a cut is highly unlikely',
			type: 'checkbox_filter'
		},
		{ value: 'safe', label: 'Safe', description: 'a cut is unlikely', type: 'checkbox_filter' },
		{
			value: 'borderline_safe',
			label: 'Borderline Safe',
			description: 'moderate risk of a cut',
			type: 'checkbox_filter'
		},
		{
			value: 'unsafe',
			label: 'Unsafe',
			description: 'moderate to high risk of a cut',
			type: 'checkbox_filter'
		},
		{
			value: 'very_unsafe',
			label: 'Very Unsafe',
			description: 'high risk of a cut, type: "checkbox_filter"'
		}
	];
</script>

<PageLayout
	title="Analyze and find Dividend investments that suit you best!"
	description="Comprahensive list of dividend stocks and etfs"
>
	test

	<FilterDropDown
		title="Dividend Safety"
		groupLabel="Show companies whose dividend appears..."
		infotext="Our Dividend Safety Scores look at a company’s financial metrics to evaluate how secure its dividend appears over a full economic cycle. As conservative investors, we prefer to have most of our portfolio in stocks with Safe or higher scores."
		filters={safetyOptions}
	></FilterDropDown>
</PageLayout>
