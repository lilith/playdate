<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { page } from '$app/stores';
	import { invalidate } from '$app/navigation';
	import { writeReq } from '$lib/utils';
	import NavBar from '$lib/components/NavBar.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PhoneInput from '$lib/components/PhoneInput.svelte';
	import { circleInviteMsg } from '$lib/format';

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
		await writeReq('/db', {
			type: 'inviteToCircle',
			targetPhone: phoneInput.getNumber()
		});
		inviteesPhone = phoneInput.getNumber();
		phoneInput.telInput.value = '';
		showClickToTextLink = true;
	}

	let friendToDelete:
		| {
				connectionId: number;
				name: string;
		  }
		| undefined;
	$: showDeleteFriendModal = !!friendToDelete;
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
		return circleInviteMsg(user, kidNames, inviteesPhone);
	}
	function smsInviteEncoded(msg: string) {
		return `sms:${inviteesPhone};?&body=${encodeURIComponent(msg)}`;
	}
</script>

<div>
	<Modal bind:showModal={showClickToTextLink}>
		<h2 slot="header">Pre-filled SMS Invite</h2>

		<div style="display: flex; flex-direction: column; margin-bottom: 1rem;">
			<p>
				To invite a friend, you'll need to text them. We can pre-fill an SMS for you with the
				following contents:
			</p>
			<p class="sms">{smsInvite(inviteesPhone)}</p>
		</div>

		<div style="display: flex; justify-content: center;" slot="close" let:dialog>
			<a
				href={smsInviteEncoded(smsInvite(inviteesPhone))}
				class="send-btn"
				on:click={async () => {
					dialog.close();
				}}>Send a message</a
			>
		</div>
	</Modal>
	<Modal bind:showModal={showDeleteFriendModal}>
		<h2 slot="header" style="margin-top: 0px;">Unfriend</h2>

		<p>Are you sure that you'd like to unfriend {friendToDelete?.name}?</p>

		<div slot="close" let:dialog>
			<button
				on:click={async () => {
					if (friendToDelete) await deleteFriend(friendToDelete.connectionId);
					friendToDelete = undefined;
					dialog.close();
				}}
			>
				Yes
			</button>
			<button
				on:click={() => {
					friendToDelete = undefined;
					dialog.close();
				}}
			>
				No
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
			<a class="household-name" href="/household/{household.id}">
				{household.name}
			</a>
			<div>
				{#each household.parents as parent}
					<p
						style="text-decoration: {parent.phonePermissions.allowInvites
							? 'none'
							: 'line-through'}"
					>
						{parent.firstName}
						{parent.lastName ?? ''}
					</p>
				{/each}
			</div>
			<div class="btn-wrapper delete w-full">
				<button class="delete-btn" on:click|preventDefault={() => (friendToDelete = household)}
					><hr /></button
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
	.send-btn {
		background: #73a4eb;
		color: white;
		padding: 0.8rem 1rem;
		border-radius: 10px;
	}
	.sms {
		background: #6ad36a;
		color: white;
		padding: 10px;
		border-radius: 10px;
	}
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
		text-decoration: underline;
		color: #5a5a5a;
		font-size: 1.4rem;
		/* text-shadow: 0px 2px 2px rgba(0, 0, 0, 0.2); */
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
