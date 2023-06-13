<script lang="ts">
	import { goto } from '$app/navigation';
	import DownIcon from '../Icons/downIcon.svelte';
	import { page } from '$app/stores';

	let show = false;
	const path = $page.route.id ?? '';
	const { user } = $page.data;

	export let pageName: string;
	function logout() {
		document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
		goto('/');
	}
</script>

<div>
	<div
		class="centered"
		style="gap: 5px;"
		on:click={() => (show = !show)}
		on:keyup={() => (show = !show)}
	>
		<h1>{pageName}</h1>
		<DownIcon />
	</div>
	{#key show}
		<div id="navbar" class={show ? 'open' : ''}>
			{#if !path.includes('profile')}
				<a href="/profile">Profile</a>
			{/if}
			{#if !path.includes('household') && user.householdId}
				<a href="/household">Household</a>
			{/if}
			{#if !path.includes('invites') && user.householdId}
				<a href="/invites">Invites</a>
			{/if}
			{#if !path.includes('calendar') && user.householdId}
				<a href="/calendar">Calendar</a>
			{/if}
			{#if !path.includes('circle') && user.householdId}
				<a href="/circle">Circle</a>
			{/if}
			{#if !path.includes('dashboard') && user.householdId}
				<a href="/dashboard">Dashboard</a>
			{/if}
			<button on:click={logout}>Log out</button>
		</div>
	{/key}
</div>

<style>
	#navbar {
		text-align: right;
		margin: auto;
		background: white;
		width: 100px;
		border-radius: 5px;
		overflow: hidden;
		height: 0;
	}
	#navbar * {
		padding: 0.1rem 0;
		font-size: large;
		color: #5a5a5a;
	}
	.centered {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	#navbar.open {
		height: fit-content;
		padding: 0.5rem;
	}
</style>
