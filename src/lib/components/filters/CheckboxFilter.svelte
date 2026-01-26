<script lang="ts">
	interface Props {
		value: string;
		label: string;
		description?: string;
		checked: string[];
	}

	let { value, label, description, checked = $bindable() }: Props = $props();

	function toggle() {
		if (checked.includes(value)) {
			checked = checked.filter((v) => v !== value);
		} else {
			checked = [...checked, value];
		}
	}
</script>

<label class="flex cursor-pointer items-start gap-3">
	<input
		type="checkbox"
		class="checkbox mt-0.5 checkbox-sm checkbox-primary"
		checked={checked.includes(value)}
		onchange={toggle}
	/>
	<div class="flex flex-col leading-snug">
		<span class="font-medium">{label}</span>
		{#if description}
			<span class="text-sm font-light text-base-content/60">{description}</span>
		{/if}
	</div>
</label>
