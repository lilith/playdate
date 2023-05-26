<script lang="ts">
	import PhoneInput from '../PhoneInput.svelte';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
	import RejectIcon from '../../Icons/xIcon.svelte';
	import AcceptIcon from '../../Icons/checkIcon.svelte';
	import ReportIcon from '../../Icons/flagIcon.svelte';
	
	const { friendReqsInfo } = $page.data;
	let phoneInput: object;

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
		if (!phoneInput.isValidNumber()) {
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
			if (!householdId) await invalidate('data:householdId');
		} else {
			const { message } = await response.json();
			alert(message);
		}
	}

	async function deleteFriend(ind: number) {

	}
</script>

<div>
	<h1>Circle</h1>
	<p class="subtitle">Your Circle</p>
    <p>Names that are crossed out indicate friends who have turned off their notifications.</p>
	<!-- TODO: replace with circleInfo -->
    {#each friendReqsInfo as household, ind}
        <div class="card">
			<p class="household-name">{ household.name }</p>
			<div>
				{#each household.parents as parent}
				<p>{parent.firstName} {parent.lastName}</p>
				{/each}
			</div>
			<div class="btn-wrapper delete w-full">
				<button class="delete-btn" on:click|preventDefault={() => deleteFriend(ind)}><hr /></button>
			</div>
        </div>
    {/each}

    <p class="subtitle">Invites</p>
    <p>If you accept an invitation, you and your new friend will be added to each other's circle. No info outside of your profile (e.g., other households in your circle) will be conveyed to your new friend.
	<br><br>	
	If you reject an invitation, the other party will not be notified.</p>

	{#each friendReqsInfo as household, ind}
        <div class="card">
			<p class="household-name">{ household.householdName }</p>
			<div>
				{#each household.parents as parent}
				<p>{parent.firstName} {parent.lastName}</p>
				{/each}
			</div>
			<a href="tel:{household.phone}">{household.phone}</a>
			<div class="w-full">
				<div style="display: flex;">
					<div class="btn-wrapper delete w-half">
						<RejectIcon />
					</div>
					<div class="btn-wrapper success w-half">
						<AcceptIcon />
					</div>
				</div>
				<div
					class="btn-wrapper w-full alarm"
					style="height: 55px;"
					on:click={() => deleteFriend(ind)}
					on:keyup={() => deleteFriend(ind)}
				>
					<ReportIcon />
				</div>
			</div>
        </div>
    {/each}

    <p class="subtitle">Send a friend request!</p>
    <div style="display: flex; gap: 20px;">
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
</style>
