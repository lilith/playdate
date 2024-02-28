<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import HamburgerIcon from '$lib/icons/hamburgerIcon.svelte';
	import CloseIcon from '$lib/icons/closeIcon.svelte';

	let show = false;
	const path = $page.route.id ?? '';
	const { user } = $page.data;

	export let pageName: string;
	async function logout() {
		document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
		await goto('/');
		location.reload();
	}
	function clickOverlay() {
		if (show) show = false;
	}
</script>

<div>
	<div id="hamburger" on:click={() => (show = !show)} on:keyup={() => (show = !show)}>
		<HamburgerIcon />
	</div>
	<div class="centered" style="gap: 5px;">
		<h1>{pageName}</h1>
	</div>

	{#key show}
		<div
			class="overlay"
			class:overlay-open={show}
			on:click|stopPropagation={clickOverlay}
			on:keyup|stopPropagation={clickOverlay}
		/>
		<div class="menu right" class:menu-open={show}>
			<div on:click={() => (show = !show)} on:keyup={() => (show = !show)} class="p-4">
				<CloseIcon />
			</div>
			<div class="menu-contents right">
				{#if !path.includes('dashboard') && user.householdId}
					<a href="/dashboard">Dashboard</a>
				{/if}
				{#if !path.includes('calendar') && user.householdId}
					<a href="/calendar">Calendar</a>
				{/if}
				{#if !path.includes('invites') && user.householdId}
					<a href="/invites">Invites</a>
				{/if}
				{#if !path.includes('circle') && user.householdId}
					<a href="/circle">Circle</a>
				{/if}
				{#if (!path.includes('household') || path.includes('household/')) && user.firstName}
					<a href="/household">Household</a>
				{/if}
				{#if !path.includes('profile')}
					<a href="/profile">Profile</a>
				{/if}
				<button on:click={logout} class="right">Log out</button>
			</div>
		</div>
	{/key}
</div>

<style>
	.p-4 {
		padding: 1rem;
	}
	.menu-contents > :nth-child(odd) {
		background-color: #ddd;
	}
	.menu-contents {
		width: 100%;
	}
	.menu-contents > * {
		width: 100%;
		padding: 1rem;
		font-size: large;
		color: #5a5a5a;
	}
	.overlay {
		z-index: 2;
		position: fixed;
		display: none;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
	}
	.overlay-open {
		display: block;
	}

	#hamburger {
		display: flex;
		justify-content: flex-end;
	}
	.menu {
		z-index: 2;
		position: fixed;
		top: 0;
		right: 0;
		width: 50%;
		height: 100vh;
		text-align: right;
		background-color: #f2f2f2;
		transform: translateX(100%);
	}
	.right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.menu-open {
		transform: translateX(0);
	}
	.centered {
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
