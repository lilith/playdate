<script lang="ts">
	import PhoneInput from '../PhoneInput.svelte';
    import { onMount, afterUpdate } from 'svelte';
    import { page } from '$app/stores';
	import RejectIcon from '../../Icons/xIcon.svelte';
	import AcceptIcon from '../../Icons/checkIcon.svelte';
	import NavBar from '../NavBar.svelte';
	import { invalidate } from '$app/navigation';
	
	let phoneInput: object;
	let { friendReqsInfo, circleInfo, user } = $page.data;
	afterUpdate(() => {
		friendReqsInfo = $page.data.friendReqsInfo;
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

	async function invite() {
		if (!phoneInput.isValidNumber() || phoneInput.getNumber() === user.phone) {
			alert('You have entered an invalid contact number.');
			return;
		}
		const response = await fetch('/db', {
			method: 'POST',
			body: JSON.stringify({
				type: 'inviteToCircle',
				targetPhone: phoneInput.getNumber(),
				fromHouseholdId: $page.data.user.householdId,
				fromUserId: $page.data.user.id
			})
		});
		if (response.status == 200) {
			alert(`Successfully invited the user with the number ${phoneInput.getNumber()}`);
			phoneInput.telInput.value = '';
		} else {
			const { message } = await response.json();
			alert(message);
		}
	}

	async function deleteFriend(connectionId: number) {
		const response = await fetch('/db', {
			method: 'POST',
			body: JSON.stringify({
				type: 'deleteFriend',
				connectionId,
			}),
		});
		if (response.status == 200) {
			await invalidate('data:circle');
		} else {
			alert('Something went wrong with deleting this connection');
		}
	}

	async function acceptFriendReq(friendReqId: number, friendHouseholdId: number) {
		const response = await fetch('/db', {
			method: 'POST',
			body: JSON.stringify({
				type: 'acceptFriendReq',
				householdId: $page.data.user.householdId,
				friendHouseholdId,
				friendReqId,
			}),
		});
		if (response.status == 200) {
			await invalidate('data:circle');
		} else {
			alert('Something went wrong with accepting this connection');
		}
	}

	async function rejectFriendReq(reqId: number) {
		const response = await fetch('/db', {
			method: 'POST',
			body: JSON.stringify({
				type: 'rejectFriendReq',
				reqId,
			}),
		});
		if (response.status == 200) {
			await invalidate('data:circle');
		} else {
			alert('Something went wrong with rejecting this connection');
		}
	}
</script>

<div>
	<NavBar pageName="Circle" />
	<p class="subtitle">Your Circle</p>
    <p>Names that are crossed out indicate friends who have turned off their notifications.</p>
	{#if !(circleInfo.length)}
		<p class="subtitle-2">No members in your circle at this time</p>
	{/if}
    {#each circleInfo as household}
        <div class="card">
			<p class="household-name">{ household.name }</p>
			<div>
				{#each household.parents as parent}
				<p style="text-decoration: {parent.phonePermissions.allowInvites ? 'none' : 'line-through'}">{parent.firstName} {parent.lastName}</p>
				{/each}
			</div>
			<div class="btn-wrapper delete w-full">
				<button class="delete-btn" on:click|preventDefault={() => deleteFriend(household.connectionId)}><hr /></button>
			</div>
        </div>
    {/each}

    <p class="subtitle">Invites</p>
    <p>If you accept an invitation, you and your new friend will be added to each other's circle. No info outside of your profile (e.g., other households in your circle) will be conveyed to your new friend.
	<br><br>	
	If you reject an invitation, the other party will not be notified.</p>
	{#if !(friendReqsInfo.length)}
		<p class="subtitle-2">No invites at this time</p>
	{/if}

	{#each friendReqsInfo as household}
        <div class="card">
			<p class="household-name">{ household.name }</p>
			<div>
				{#each household.parents as parent}
				<p>{parent.firstName} {parent.lastName}</p>
				{/each}
			</div>
			<a href="tel:{household.phone}">{household.phone}</a>
			<div class="w-full">
				<div style="display: flex;">
					<div
						class="btn-wrapper delete w-half"
						on:click={() => rejectFriendReq(household.reqId)}
						on:keyup={() => rejectFriendReq(household.reqId)}
					>
						<RejectIcon />
					</div>
					<div
						class="btn-wrapper success w-half"
						on:click={() => acceptFriendReq(household.reqId, household.id)}
						on:keyup={() => acceptFriendReq(household.reqId, household.id)}
					>
						<AcceptIcon />
					</div>
				</div>
				<!-- <div
					class="btn-wrapper w-full alarm"
					style="height: 55px;"
				>
					<ReportIcon />
				</div> -->
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
.w-half {
	width: 50%;
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
.success {
	background: rgba(127, 250, 122, 0.74);
}
.alarm {
	background: rgba(241, 0, 0, 0.62);
}

.household-name {
	text-shadow: 0px 2px 2px rgba(0, 0, 0, 0.20);
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
a {
	font-size: 1.2rem;
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
