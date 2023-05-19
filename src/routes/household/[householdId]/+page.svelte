<script lang="ts">
	import type { PageData } from './$types';
	import { PRONOUNS } from '../../../constants';

	export let data: PageData;
	const { householdInfo: household } = data;
</script>

<svelte:head>
	<title>Household</title>
	<meta name="description" content="Playdate app" />
</svelte:head>
<div style="margin-bottom: 2rem;">
	<div id="dashboard-btn">
		<a href="/dashboard">🏠</a>
	</div>
	<h1>{household.name}</h1>
	<p class="subtitle">FAQ</p>
	<div class="faq">
		{household.publicNotes}
	</div>

	<p class="subtitle">Kids</p>
	{#each household.kids as kid}
		<div class="card">
			<p>{kid.firstName} {kid.lastName}</p>
			<p class="small-font">Pronouns: {PRONOUNS[kid.pronouns]}</p>
			<p class="small-font">Age: {kid.age}</p>
		</div>
	{/each}

	<p class="subtitle">Adults</p>
	{#each household.adults as adult}
		<div class="card">
			<p>{adult.firstName} {adult.lastName}</p>
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
	#dashboard-btn {
		position: fixed;
		font-size: 1.9rem;
		background: white;
		border-radius: 50%;
		width: 10rem;
		height: 6rem;
		text-align: center;
		border: 1px solid #d9d9d9;
		bottom: 0;
		right: 50%;
		transform: translate(50%, 50%);
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
	.card {
		font-weight: 400;
		font-size: 1.5rem;
		display: flex;
		align-items: center;
		text-align: center;

		color: #797979;
		display: flex;
		flex-direction: column;
		border: 1px solid #d9d9d9;
		width: 80%;
		padding: 38px 35px;
		border-radius: 6px;
		margin: 1rem auto;
		background: white;
	}
</style>
