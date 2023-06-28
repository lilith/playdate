<script lang="ts">
	import { page } from '$app/stores';

	const { summary } = $page.data;
</script>

<div id="summary">
	{@html summary}
</div>

<style>
	#summary :global(h2) {
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
		margin-top: 2rem;
		font-weight: 600;
	}
	#summary :global(h3) {
		font-size: 1rem;
		margin-bottom: 0.5rem;
		margin-top: 2rem;
		font-weight: 600;
	}
	#summary :global(p) {
		margin: 0.5rem 0;
	}
	#summary :global(div) {
		margin-top: 1em;
	}
	#summary :global(ul),
	:global(ol) {
		list-style: revert;
		padding-left: 1rem;
	}
</style>
