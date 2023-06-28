<script lang="ts">
	import { page } from '$app/stores';

	const { terms } = $page.data;
</script>

<div id="terms">
	<h1>Terms of Use</h1>

	{@html terms}
</div>

<style>
	#terms :global(h2) {
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
		margin-top: 2rem;
		font-weight: 600;
	}
	#terms :global(h3) {
		font-size: 1rem;
		margin-bottom: 0.5rem;
		margin-top: 2rem;
		font-weight: 600;
	}
	#terms :global(p) {
		margin: 0.5rem 0;
	}
	#terms :global(div) {
		margin-top: 1em;
	}
	#terms :global(ul),
	:global(ol) {
		list-style: revert;
		padding-left: 1rem;
	}
</style>
