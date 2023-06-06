<script lang="ts">
	import PhoneInput from '../PhoneInput.svelte';
	import { page } from '$app/stores';
	import { onMount, afterUpdate } from 'svelte';
	import { PRONOUNS } from '../../constants';
	import Modal from '../Modal.svelte';
	import { invalidate, invalidateAll } from '$app/navigation';
	import NavBar from '../NavBar.svelte';
	import { writeReq } from '../../utils';

	enum ModalReason {
		DISCONNECT_ADULT,
		DELETE_HOUSEHOLD
	}

	let phoneInput: object;
	let { householdId, name, publicNotes, kids, adults } = $page.data.householdInfo;
	let { householdInvites } = $page.data;
	afterUpdate(() => {
		householdId = $page.data.householdInfo.householdId;
		kids = $page.data.householdInfo.kids;
		adults = $page.data.householdInfo.adults;
		householdInvites = $page.data.householdInvites;
	});

	const now = new Date();
	let showModal = false;
	let adultInd: number;
	let modalText = {
		heading: '',
		content: ''
	};
	let modalReason: ModalReason;

	function stylePhoneInput() {
		const input: HTMLElement | null = document.querySelector('.iti');
		if (input && input.style) input.style.flexGrow = '1';
	}

	onMount(async () => {
		setTimeout(() => {
			stylePhoneInput();
		}, 1000);

		if (!$page.data.user.id) await invalidateAll();
	});

	async function schedTipMsg() {
		const twoWeeksLater = new Date();
		twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

		await writeReq('/twilio', {
			msg: "Tip: Add this number to your contacts as Playdate Help to prevent impersonation - we'll only ever contact you from this number.",
			phone: $page.data.user.phone,
			sendAt: twoWeeksLater
		});
	}

	async function saveToDB() {
		const response = await writeReq('/db', {
			type: 'household',
			id: householdId,
			userId: $page.data.user.id,
			name: name,
			publicNotes: publicNotes
		});
		if (response.status == 200) {
			alert('Successfully saved household info');
			if (!householdId) {
				await invalidate('data:householdId');
				schedTipMsg();
			}
		} else {
			alert('Something went wrong with saving');
		}
	}

	async function addKid(e: SubmitEvent) {
		const response = await writeReq('/db', {
			type: 'householdChild',
			householdId: householdId,
			founderId: $page.data.user.id,
			firstName: e.target[0].value,
			pronouns: e.target[2].value,
			lastName: e.target[1].value,
			dateOfBirth: new Date(e.target[3].value)
		});
		if (response.status == 200) {
			if (!householdId) schedTipMsg();
			await invalidate('data:householdId');
			const { id } = await response.json();
			kids = [
				...kids,
				{
					firstName: e.target[0].value,
					pronouns: e.target[2].value,
					lastName: e.target[1].value,
					id
				}
			];
			e.target.reset();
		} else {
			alert('Something went wrong with saving');
		}
	}

	async function deleteKid(ind: number) {
		const response = await fetch('/db', {
			method: 'DELETE',
			body: JSON.stringify({
				type: 'householdChild',
				id: kids[ind].id
			})
		});
		if (response.status == 200) {
			await invalidate('data:householdId');
			kids = kids.slice(0, ind).concat(kids.slice(ind + 1));
		} else {
			alert('Something went wrong with saving');
		}
	}

	async function disconnectAdult() {
		const response = await writeReq(
			'/db',
			{
				type: 'householdAdult',
				id: adults[adultInd].id
			},
			'PATCH'
		);
		if (response.status == 200) {
			adults = adults.slice(0, adultInd).concat(adults.slice(adultInd + 1));
			await invalidate('data:householdId');
			// handle name and publicNotes separately here so that we only hard-reset them here
			name = $page.data.householdInfo.name;
			publicNotes = $page.data.householdInfo.publicNotes;
		} else {
			alert('Something went wrong with saving');
		}
	}

	function openModal(type: ModalReason, ind?: number) {
		switch (type) {
			case ModalReason.DISCONNECT_ADULT:
				if (ind !== undefined) {
					adultInd = ind;
					if (adults[ind].id === $page.data.user.id) {
						modalText.heading = 'Disconnect From Household';
						modalText.content =
							"Are you sure that you'd like to disconnect from this household? The household's info will be saved, but you won't be able to access it until another adult in the household sends you an invite.";
					} else {
						modalText.heading = 'Disconnect Adult';
						modalText.content =
							"Are you sure that you'd like to disconnect this adult from this household?";
					}
				}
				break;
			case ModalReason.DELETE_HOUSEHOLD:
				modalText.heading = 'Delete Household';
				modalText.content =
					"Are you sure that you'd like to delete your household? This will delete all basic household info and associated children but leave all adult users' accounts intact.";
		}
		modalReason = type;
		showModal = true;
	}

	async function deleteHousehold() {
		const response = await fetch('/db', {
			method: 'DELETE',
			body: JSON.stringify({
				type: 'household',
				id: householdId
			})
		});
		if (response.status == 200) {
			alert('Successfully deleted household');
			await invalidate('data:householdId');

			document.getElementById('household-form')?.reset();
			document.getElementById('kid-form')?.reset();
		} else {
			alert('Something went wrong with saving');
		}
	}

	async function inviteAdult() {
		if (!phoneInput.isValidNumber()) {
			alert('You have entered an invalid contact number.');
			return;
		}
		const response = await writeReq('/db', {
			type: 'inviteToHousehold',
			targetPhone: phoneInput.getNumber(),
			householdId: householdId,
			fromUserId: $page.data.user.id
		});
		if (response.status == 200) {
			alert(
				`The user with phone # ${phoneInput.getNumber()} has been authorized to manage this household. Please ask them to log in and accept.`
			);
			if (!householdId) {
				await invalidate('data:householdId');
				schedTipMsg();
			}
			phoneInput.telInput.value = '';
		} else {
			const { message } = await response.json();
			alert(message);
		}
	}

	async function joinHousehold(householdId: number, id: number) {
		const response = await writeReq('/db', {
			type: 'acceptHouseholdInvite',
			phone: $page.data.user.phone,
			householdId,
			id
		});
		if (response.status == 200) {
			await invalidate('data:householdId');
			// handle name and publicNotes separately here so that we only hard-reset them here
			name = $page.data.householdInfo.name;
			publicNotes = $page.data.householdInfo.publicNotes;
		}
	}

	async function rejectHouseholdInvite(id: number) {
		const response = await writeReq('/db', {
			type: 'rejectHouseholdInvite',
			id
		});
		if (response.status == 200) {
			await invalidate('data:householdId');
		}
	}
</script>

<svelte:head>
	<title>Household</title>
	<meta name="description" content="Playdate app" />
</svelte:head>
<div>
	{#key householdId}
		<NavBar pageName="Household" />
	{/key}

	{#key householdInvites}
		{#if householdInvites.length && !householdId}
			<Modal showModal={householdInvites.length && !householdId}>
				<h2 slot="header" class="center-text">Household Invite</h2>

				<p class="center-text" style="margin-top: 1rem;">
					You have been invited to join the following household:
				</p>

				<div
					style="display: flex; flex-direction: column; margin-bottom: 1rem;"
					class="center-text"
				>
					<p class="subtitle">{householdInvites[0].household.name}</p>

					<h4 class="subtitle-3">Sender</h4>
					<p class="subtitle-2" style="display: inline; color: black; font-weight: 500;">
						{householdInvites[0].fromUser.firstName}
						{householdInvites[0].fromUser.lastName}
					</p>
					<span style="padding: 0 0.5rem; font-size: 15px;"
						>({householdInvites[0].fromUser.phone})</span
					>

					<h4 class="subtitle-3">Kids</h4>
					<ul>
						{#each householdInvites[0].household.children as kid}
							<li style="font-size: 18px;">{kid.firstName} {kid.lastName}</li>
						{/each}
					</ul>
				</div>

				<div slot="close" let:dialog>
					<button
						on:click={async () => {
							await joinHousehold(householdInvites[0].household.id, householdInvites[0].id);
							dialog.close();
						}}
					>
						Join
					</button>
					<button
						on:click={async () => {
							await rejectHouseholdInvite(householdInvites[0].id);
							dialog.close();
						}}
					>
						Reject
					</button>
				</div>
			</Modal>
		{/if}
	{/key}

	<Modal bind:showModal>
		<h2 slot="header">{modalText.heading}</h2>

		<p>{modalText.content}</p>

		<div slot="close" let:dialog>
			<button
				on:click={async () => {
					if (modalReason === ModalReason.DISCONNECT_ADULT) disconnectAdult();
					else if (modalReason === ModalReason.DELETE_HOUSEHOLD) deleteHousehold();
					dialog.close();
				}}
			>
				Yes
			</button>
			<button
				on:click={() => {
					dialog.close();
				}}
			>
				No
			</button>
		</div>
	</Modal>

	<form method="POST" action="/db" id="household-form" on:submit|preventDefault={saveToDB}>
		<label class="subtitle" for="nickname">Household Nickname<span class="red">*</span></label>
		<input type="text" name="nickname" required bind:value={name} />

		<label class="subtitle" for="faq">FAQ</label>
		<textarea
			name="faq"
			placeholder="e.g. work hours, school, allergies, or address"
			bind:value={publicNotes}
		/>

		<div class="btn-container-1">
			<button class="btn save-btn" type="submit">Save Basic Info</button>
		</div>

		{#if householdId}
			<hr class="section" />
			<p class="subtitle">Kids</p>
			{#each kids as kid, ind}
				<div class="card">
					<p>{kid.firstName} {kid.lastName}</p>
					<button class="delete-btn" on:click|preventDefault={() => deleteKid(ind)}><hr /></button>
				</div>
				<hr class="inner-section" />
			{/each}

			<form method="POST" action="/db" id="kid-form" on:submit|preventDefault={addKid}>
				<label class="subtitle-2" for="first-name">First Name<span class="red">*</span></label>
				<input type="text" name="first-name" required />

				<label class="subtitle-2" for="last-name">Last Name</label>
				<input type="text" name="last-name" />

				<label class="subtitle-2" for="pronouns">Pronouns<span class="red">*</span></label>
				<select name="pronouns" required>
					<option value="" />
					{#each Object.entries(PRONOUNS) as pronoun}
						<option value={pronoun[0]}>{pronoun[1]}</option>
					{/each}
				</select>

				<label class="subtitle-2" for="dob">Date of Birth</label>
				<input
					type="date"
					name="dob"
					max={`${now.getFullYear()}-${now.getMonth()}-${now.getDay()}`}
				/>

				<div id="btn-container-2"><button class="text-btn">Save Child</button></div>
			</form>

			<hr class="section" />

			<p class="subtitle">Adult (Household managers)</p>
			{#each adults as adult, ind}
				<div class="card">
					<p>{adult.firstName} {adult.lastName}</p>
					<button
						class="delete-btn"
						on:click|preventDefault={() => openModal(ModalReason.DISCONNECT_ADULT, ind)}
						><hr /></button
					>
				</div>
				<hr class="inner-section" />
			{/each}
			<p>
				You can authorize other guardians to manage this household by entering their phone number.
				After authorizing them, ask them to log in and accept the invite.
			</p>
			<div id="phone-input-container"><PhoneInput bind:phoneInput /></div>
			<div id="btn-container-2">
				<button class="text-btn" on:click|preventDefault={inviteAdult}>Authorize Adult</button>
			</div>

			<hr class="section" />
		{/if}

		<div class="btn-container-1">
			{#if householdId}
				<button
					class="btn important-delete-btn"
					on:click|preventDefault={() => openModal(ModalReason.DELETE_HOUSEHOLD)}
					>Delete Household</button
				>
			{/if}
		</div>
	</form>
</div>

<style>
	.subtitle-3 {
		font-size: 15px;
		margin: 2rem 0 0;
	}
	.center-text {
		text-align: center;
	}
	#household-form {
		margin: 2rem 0;
	}
	#phone-input-container {
		display: flex;
		justify-content: center;
		width: 80%;
		margin: auto;
		padding: 1rem;
	}
	#btn-container-2 {
		display: flex;
		justify-content: center;
		margin: 1rem auto 2rem;
	}
	#btn-container-2 button {
		padding: 0 1rem;
		height: 45px;
	}
	textarea {
		height: 200px;
		resize: none;
		padding: 10px;
	}
	.section {
		border-radius: 5px;
		border-top: 2px solid #969696;
		margin-bottom: 1rem;
	}

	.inner-section {
		border-radius: 5px;
		border-top: 2px solid #d9d9d9;
		margin-bottom: 1rem;
	}

	.delete-btn {
		background: #fce9be;
		border: 1.5px solid #5a5a5a;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		font-size: 26px;
	}

	.text-btn {
		background: #fce9be;
		border: 1.5px solid #5a5a5a;
		border-radius: 0.5rem;
		width: auto;
		font-size: 1.5rem;
		padding: 0.25rem;
	}

	.subtitle-2 {
		font-weight: 400;
		font-size: 20px;
		line-height: 30px;
		display: flex;
		align-items: center;

		color: #5a5a5a;
	}

	.btn-container-1 {
		display: flex;
		flex-direction: column;
		margin: 3rem 3rem 4rem;
		gap: 20px;
	}

	.important-delete-btn {
		background: #bd0000;
	}

	.save-btn {
		background: rgba(127, 250, 122, 0.74);
		color: #5a5a5a;
	}
</style>
