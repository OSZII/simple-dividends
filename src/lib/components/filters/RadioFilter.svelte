<script lang="ts">
	interface Props {
		value: string;
		label: string;
		id: string;
		description?: string;
		checked: boolean;
		onchange: (e: any) => void;
	}

	let { id, value, label, description, checked = $bindable(), onchange }: Props = $props();
</script>

<label class="flex cursor-pointer items-start gap-3">
	<input
		{onchange}
		{value}
		{checked}
		type="radio"
		class="radio mt-0.5 radio-sm radio-primary"
		name={id}
	/>
	<div class="flex flex-col leading-snug">
		<span class="font-medium">{label}</span>
		{#if description}
			<span class="text-sm font-light text-base-content/60">{description}</span>
		{/if}
	</div>
</label>
