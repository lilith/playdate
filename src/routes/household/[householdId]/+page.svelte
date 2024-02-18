<script lang="ts">
	import type { PageData } from './$types';
	import { PRONOUNS } from '$lib/logics/_shared/constants';
	import NavBar from '$lib/components/NavBar.svelte';

	export let data: PageData;
	const { householdInfo: household, authorized } = data;
</script>

<div class:mb={authorized} class:full-screen={!authorized}>
	<NavBar pageName={household.name} />
	{#if authorized}
		<p class="subtitle">FAQ</p>
		<div class="faq">
			{household.publicNotes ?? 'Nothing of note'}
		</div>

		<p class="subtitle">Kids</p>
		{#each household.kids as kid}
			<div class="card">
				<p>{kid.firstName} {kid.lastName ?? ''}</p>
				<p class="small-font">Pronouns: {PRONOUNS[kid.pronouns]}</p>
				<p class="small-font">Age: {!kid.age || isNaN(kid.age) ? 'N/A' : kid.age}</p>
			</div>
		{/each}

		<p class="subtitle">Adults</p>
		{#each household.adults as adult}
			<div class="card">
				<p>{adult.firstName} {adult.lastName ?? ''}</p>
				<p class="small-font">Pronouns: {PRONOUNS[adult.pronouns]}</p>
				<p class="small-font">
					Phone: <a href="sms:{adult.phone}">{adult.phone}</a>
				</p>
				<p class="small-font">Time Zone: {adult.timeZone}</p>
			</div>
		{/each}
	{:else}
		<div style="flex-grow: 1; display: contents;">
			<h1 style="margin: auto;">
				You must add this household to your circle before being able to view their page!
			</h1>
		</div>
	{/if}
</div>

<style>
	.mb {
		margin-bottom: 2rem;
	}
	.full-screen {
		height: calc(100vh - 2rem);
		display: contents;
	}
	a {
		color: #5a5a5a;
	}

	.faq {
		white-space: pre-line;
		margin: 1rem auto;
		width: 80%;
		font-size: 1.3rem;
		line-height: 1.2;
		color: #797979;
	}
	.small-font {
		font-size: 1.2rem;
	}
</style>
