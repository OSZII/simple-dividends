<script lang="ts">
	import './layout.css';
	import { dev } from '$app/environment';

	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/layout/Navbar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/logo.jpg" />
	<title>Simple Dividends</title>
	<link rel="icon" href={favicon} />
	{#if !dev}
		<script
			defer
			src="https://umami.ostojicstefan.com/script.js"
			data-website-id="7e6043ae-c510-4fde-98f9-ed07a1d8a735"
		></script>
	{/if}
</svelte:head>

<div class="flex min-h-screen flex-col bg-base">
	<!-- Sidebar -->
	<Navbar />

	<!-- Main Content -->
	<main class="z-10 flex-1 transition-all duration-400 ease-in-out md:pl-70">
		{@render children()}
	</main>
</div>
