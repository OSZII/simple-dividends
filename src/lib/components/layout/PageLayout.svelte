<script lang="ts">
	interface Props {
		title: string;
		description: string;
		ogImage?: string;
		children: () => void;
	}

	let { title, description, ogImage = '', children } = $props();
</script>

<svelte:head>
	<title>{title} | Simple Dividends</title>
	<meta name="description" content={description} />
	<meta name="og:title" content={title + ' | Simple Dividends'} />
	<meta name="og:description" content={description} />
	<meta name="og:type" content="website" />
	{#if ogImage}
		<meta name="og:image" content={ogImage} />
	{/if}
</svelte:head>

<div class="mx-auto flex w-full max-w-5xl flex-col px-4 py-8">
	<div class="relative z-10 mx-auto max-w-4xl">
		<!-- Header -->
		<header class="animate-in fade-in slide-in-from-top-4 mb-2 text-center duration-700 md:mb-10">
			<h1 class="mb-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
				{title}
			</h1>
			<h2>{description}</h2>
		</header>
	</div>
	{@render children()}
</div>
