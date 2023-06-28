<script lang="ts">
	import { page } from '$app/stores';

	const { privacy } = $page.data;
</script>

<div id="privacy">
	<h1>Privacy Policy</h1>

	{@html privacy}
</div>

<style>
	#privacy :global(h2) {
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
		margin-top: 2rem;
		font-weight: 600;
	}
	#privacy :global(h3) {
		font-size: 1rem;
		margin-bottom: 0.5rem;
		margin-top: 2rem;
		font-weight: 600;
	}
	#privacy :global(p) {
		margin: 0.5rem 0;
	}
	#privacy :global(div) {
		margin-top: 1em;
	}
	#privacy :global(ul),
	:global(ol) {
		list-style: revert;
		padding-left: 1rem;
	}
</style>
