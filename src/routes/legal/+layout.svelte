<script lang="ts">
	import { goto } from '$app/navigation';
	import logo from '$lib/images/logo.png';

	async function goHome() {
		await goto('/');
		location.reload();
	}
</script>

<main>
	<div>
		<img src={logo} alt="Playdate logo" id="logo" on:click={goHome} on:keyup={goHome} />
		<h2>Legal</h2>
		<a href="/legal/privacy">Current Privacy Policy</a>
		<a href="/legal/terms">Current Terms of Use</a>
		<a href="https://github.com/lilith/playdate/tree/main/static/legal">Previous versions</a>
		<a href="/legal/summarized">Summarized</a>

		<p style="margin-bottom: 1rem;">
			Contact lilith@imazen.io if you have any questions related to this Service or the Terms of Use
			and Privacy Policy.
		</p>
	</div>
	<slot />
</main>

<style>
	#logo {
		margin: auto;
		padding-top: 2rem;
	}
	h2 {
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
		margin-top: 2rem;
		font-weight: 600;
	}
	a {
		margin: 0.4rem 0.5rem 0.4rem 2rem;
		display: block;
		font-weight: 600;
	}
	div {
		margin-bottom: 2rem;
	}
</style>
