<script lang="ts">
	import { page } from '$app/state';
	import CaretDown from 'phosphor-svelte/lib/CaretDown';
	import List from 'phosphor-svelte/lib/List';
	import X from 'phosphor-svelte/lib/X';
	import Clock from 'phosphor-svelte/lib/Clock';
	import { Key } from 'phosphor-svelte';
	import { rootUrl, slugify } from '$lib';

	let menueOpened = $state(false);

	let structure = [
		{
			label: 'Calendar',
			url: '/'
		},
		{
			label: 'Stock Screener',
			url: '/stocks'
		}
	];
</script>

<div class="flex w-full items-center justify-between border-b border-white/5 p-6 md:hidden">
	<a href={rootUrl} class="flex w-full items-center gap-3">
		<div
			class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-[135deg,#6366f1_0%,#a855f7_100%] font-extrabold text-white"
		>
			S
		</div>
		<span
			class="bg-linear-to-r from-white to-[#94a3b8] bg-clip-text text-lg font-bold whitespace-nowrap text-transparent opacity-100 transition-opacity duration-300"
		>
			Simple Dividends
		</span>
		<List
			onclick={() => {
				menueOpened = !menueOpened;
			}}
			class="ml-auto size-8 text-white transition-transform duration-200 md:hidden"
		/>
	</a>
</div>

<aside
	class="{menueOpened
		? '0'
		: 'hidden md:flex'} fixed top-0 left-0 z-100 flex h-screen w-full flex-col border-r border-white/5 bg-[#12121a]/80 backdrop-blur-[20px] transition-all duration-400 ease-in-out md:flex md:w-70"
>
	<div class="hidden items-center justify-between border-b border-white/5 p-6 md:flex">
		<a href={rootUrl} class="flex items-center gap-3 overflow-hidden">
			<div
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-linear-[135deg,#6366f1_0%,#a855f7_100%] font-extrabold text-white"
			>
				S
			</div>
			<span
				class="bg-linear-to-r from-white to-[#94a3b8] bg-clip-text text-lg font-bold whitespace-nowrap text-transparent opacity-100 transition-opacity duration-300"
			>
				Simple Toolz
			</span>
		</a>
	</div>

	<nav
		class="flex-1 overflow-y-auto p-[1.5rem_0.75rem] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
	>
		<div class="flex items-center justify-end">
			<X
				onclick={() => {
					menueOpened = !menueOpened;
				}}
				class="mr-3 size-8 min-w-8 text-white md:hidden"
			/>
		</div>

		{#each structure as page}
			<div class="mb-8 ml-2">
				<a
					href={page.url}
					class="mb-3 -ml-2 px-3 text-[0.7rem] font-bold tracking-widest text-white uppercase"
				>
					{page.label}
				</a>
			</div>
		{/each}
	</nav>
</aside>
