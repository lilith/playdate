<script lang="ts">
	import type { PageData } from './$types';
	import { PRONOUNS } from '$lib/constants';
	import NavBar from '../../NavBar.svelte';

	export let data: PageData;
	const { householdInfo: household } = data;
</script>

<svelte:head>
	<title>Household</title>
	<meta name="description" content="Playdate app" />
</svelte:head>
<div style="margin-bottom: 2rem;">
	<NavBar pageName={household.name} />
	<p class="subtitle">FAQ</p>
	<div class="faq">
		{household.publicNotes.length ? household.publicNotes : 'Nothing of note'}
	</div>

	<p class="subtitle">Kids</p>
	{#each household.kids as kid}
		<div class="card">
			<p>{kid.firstName} {kid.lastName ?? ''}</p>
			<p class="small-font">Pronouns: {PRONOUNS[kid.pronouns]}</p>
			<p class="small-font">Age: {kid.age}</p>
		</div>
	{/each}

	<p class="subtitle">Adults</p>
	{#each household.adults as adult}
		<div class="card">
			<p>{adult.firstName} {adult.lastName ?? ''}</p>
			<p class="small-font">Pronouns: {PRONOUNS[adult.pronouns]}</p>
			<p class="small-font">
				Phone: <a href="tel:{adult.phone}">{adult.phone}</a>
			</p>
			<p class="small-font">Time Zone: {adult.timeZone}</p>
		</div>
	{/each}
</div>

<style>
	a {
		color: #5a5a5a;
	}

	.faq {
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
