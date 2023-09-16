<script lang="ts">
	import { afterUpdate } from 'svelte';
	import { page } from '$app/stores';
	import RejectIcon from '../../Icons/xIcon.svelte';
	import AcceptIcon from '../../Icons/checkIcon.svelte';
	import NavBar from '../NavBar.svelte';
	import { invalidate } from '$app/navigation';
	import { writeReq } from '$lib/utils';

	let { friendReqsInfo, householdInvites } = $page.data;
	afterUpdate(() => {
		friendReqsInfo = $page.data.friendReqsInfo;
		householdInvites = $page.data.householdInvites;
	});

	async function acceptFriendReq(friendReqId: number) {
		const response = await writeReq('/db', {
			type: 'acceptFriendReq',
			friendReqId
		});
		if (response.status == 200) {
			await invalidate('data:invite');

			// send new friend's sched to you
			await writeReq('/twilio', {
				phone: $page.data.user.phone,
				type: 'newFriendSched',
				friendReqId
			});

			// tell new friend that they're in your circle now
		} else {
			alert('Something went wrong with accepting this connection');
		}
	}

	async function rejectFriendReq(reqId: number) {
		const response = await writeReq('/db', {
			type: 'rejectFriendReq',
			reqId
		});
		if (response.status == 200) {
			await invalidate('data:invite');
		} else {
			alert('Something went wrong with rejecting this connection');
		}
	}

	async function joinHousehold(id: number) {
		const response = await writeReq('/db', {
			type: 'acceptHouseholdInvite',
			id
		});
		if (response.status === 200) {
			await invalidate('data:invite');
		} else {
			const { message } = await response.json();
			alert(message);
		}
	}

	async function rejectHouseholdInvite(id: number) {
		const response = await writeReq('/db', {
			type: 'rejectHouseholdInvite',
			id
		});
		if (response.status == 200) {
			await invalidate('data:invite');
		}
	}
</script>

<div>
	<NavBar pageName="Invites" />
	<p class="subtitle">Circle Invites</p>
	<p>
		If you accept a circle invitation, you and your new friend will be added to each other's circle.
		No info outside of your profile (e.g., other households in your circle) will be conveyed to your
		new friend.
		<br /><br />
		If you reject an invitation, the other party will not be notified.
	</p>
	{#if !friendReqsInfo.length}
		<p class="subtitle-2">
			No invites at this time
			<br />
			<a
				class="subtitle-2"
				style="text-decoration: underline; font-weight: 400; font-size: 18px;"
				href="/circle">(Invite a friend to your circle)</a
			>
		</p>
	{/if}

	{#each friendReqsInfo as household}
		<div class="card">
			<p class="household-name">{household.name}</p>
			<div>
				{#each household.parents as parent}
					<p>{parent.firstName} {parent.lastName ?? ''}</p>
				{/each}
			</div>
			<a href="sms:{household.phone}">{household.phone}</a>
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
						on:click={() => acceptFriendReq(household.reqId)}
						on:keyup={() => acceptFriendReq(household.reqId)}
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

	<p class="subtitle">Household Invites</p>
	<div>
		If you accept a household invitation, you will be added into the invitee's household and be able
		to edit all household-related info (children, parents, schedule). If you are already part of a
		household, you can either:
		<ol>
			<li>delete your existing household or</li>
			<li>delete your account and recreate it to join the inviting household</li>
		</ol>

		If you reject an invitation, the other party will not be notified.
	</div>
	{#if !householdInvites.length}
		<p class="subtitle-2">No invites at this time</p>
	{/if}

	{#each householdInvites as invite}
		<div class="card">
			<p class="household-name">{invite.household.name}</p>
			<div>
				{#each invite.household.parents as parent}
					<p>{parent.firstName} {parent.lastName ?? ''}: {parent.phone}</p>
				{/each}
			</div>
			<div>
				{#each invite.household.children as child}
					<p>{child.firstName} {child.lastName ?? ''}</p>
				{/each}
			</div>
			<div class="w-full">
				<div style="display: flex;">
					<div
						class="btn-wrapper delete w-half"
						on:click={() => rejectHouseholdInvite(invite.id)}
						on:keyup={() => rejectHouseholdInvite(invite.id)}
					>
						<RejectIcon />
					</div>
					<div
						class="btn-wrapper success w-half"
						on:click={() => joinHousehold(invite.id)}
						on:keyup={() => joinHousehold(invite.id)}
					>
						<AcceptIcon />
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>

<style>
	.w-half {
		width: 50%;
	}
	.w-full {
		width: 100%;
	}
	ol {
		margin-left: 1rem;
	}
	li {
		margin: 0.5rem 0;
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
	/* .alarm {
		background: rgba(241, 0, 0, 0.62);
	} */

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
