<script lang="ts">
	import PhoneInput from '../PhoneInput.svelte';
	import { onMount, afterUpdate } from 'svelte';
	import { page } from '$app/stores';
	import NavBar from '../NavBar.svelte';
	import { invalidate } from '$app/navigation';
	import { writeReq } from '../../utils';
	import Modal from '../Modal.svelte';
	import { PRONOUNS, type PRONOUNS_ENUM } from '../../constants';

	let phoneInput: object;
	let inviteesPhone: string;
	let { circleInfo, user, kidNames } = $page.data;
	afterUpdate(() => {
		circleInfo = $page.data.circleInfo;
	});

	function stylePhoneInput() {
		const input: HTMLElement | null = document.querySelector('.iti');
		if (input && input.style) input.style.flexGrow = '1';
	}

	onMount(async () => {
		setTimeout(() => {
			stylePhoneInput();
		}, 1000);
	});

	let showClickToTextLink = false;
	async function invite() {
		if (!phoneInput.isValidNumber() || phoneInput.getNumber() === user.phone) {
			alert('You have entered an invalid contact number.');
			return;
		}
		const response = await writeReq('/db', {
			type: 'inviteToCircle',
			targetPhone: phoneInput.getNumber(),
			fromHouseholdId: $page.data.user.householdId,
			fromUserId: $page.data.user.id
		});
		if (response.status == 200) {
			inviteesPhone = phoneInput.getNumber();
			phoneInput.telInput.value = '';
			showClickToTextLink = true;
		} else {
			const { message } = await response.json();
			alert(message);
		}
	}

	async function deleteFriend(connectionId: number) {
		const response = await writeReq('/db', {
			type: 'deleteFriend',
			connectionId
		});
		if (response.status == 200) {
			await invalidate('data:circle');
		} else {
			alert('Something went wrong with deleting this connection');
		}
	}

	function smsInvite(inviteesPhone: string) {
		const objectivePronoun = PRONOUNS[user.pronouns as PRONOUNS_ENUM].split(', ')[2];
		const msg = `${user.firstName} (parent of ${kidNames}) has invited you to ${objectivePronoun} circle at playdate.help to simplify scheduling and social time. First, verify ${objectivePronoun} real phone number is ${user.phone} for safety. If it is valid, click https://playdate.help/home/${inviteesPhone} to join.`;
		return `sms:${inviteesPhone}?&body=${encodeURIComponent(msg)}`;
	}
</script>

<div>
	<Modal showModal={showClickToTextLink}>
		<h2 slot="header">Pre-filled SMS Invite</h2>

		<p>Open a pre-filled SMS invite for the person you're inviting!</p>

		<div slot="close" let:dialog>
			<button
				on:click={async () => {
					dialog.close();
				}}
			>
				<a href={smsInvite(inviteesPhone)} style="color: white;"> Open pre-filled SMS </a>
			</button>
		</div>
	</Modal>
	<NavBar pageName="Circle" />
	<p class="subtitle">Your Circle</p>
	<p>Names that are crossed out indicate friends who have turned off their notifications.</p>
	{#if !circleInfo.length}
		<p class="subtitle-2">No members in your circle at this time</p>
	{/if}
	{#each circleInfo as household}
		<div class="card">
			<p class="household-name">{household.name}</p>
			<div>
				{#each household.parents as parent}
					<p
						style="text-decoration: {parent.phonePermissions.allowInvites
							? 'none'
							: 'line-through'}"
					>
						{parent.firstName}
						{parent.lastName}
					</p>
				{/each}
			</div>
			<div class="btn-wrapper delete w-full">
				<button
					class="delete-btn"
					on:click|preventDefault={() => deleteFriend(household.connectionId)}><hr /></button
				>
			</div>
		</div>
	{/each}

	<p class="subtitle">Send a friend request!</p>
	<div style="display: flex; gap: 20px; margin-bottom: 2rem;">
		<PhoneInput bind:phoneInput />
		<button class="add-btn" on:click|preventDefault={invite}>+</button>
	</div>
</div>

<style>
	.w-full {
		width: 100%;
	}
	.delete-btn,
	.add-btn {
		background: #fce9be;
		border: 1.5px solid #5a5a5a;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		font-size: 26px;
	}

	.delete-btn {
		width: 35px;
		height: 35px;
	}
	.btn-wrapper {
		padding: 10px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.delete {
		background: rgba(255, 233, 184, 0.55);
	}

	.household-name {
		text-shadow: 0px 2px 2px rgba(0, 0, 0, 0.2);
	}

	.card {
		padding: 22px 0 0;
		overflow: hidden;
	}
	.card p {
		font-size: 1.3rem;
	}
	.card button hr {
		border-top: 2px solid #5a5a5a;
	}

	.subtitle-2 {
		text-align: center;
		font-weight: 600;
		font-size: 20px;
		line-height: 30px;
		margin: 1rem;
		color: #5a5a5a;
	}
</style>
