<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, afterUpdate } from 'svelte';
	import { PRONOUNS } from '$lib/constants';
	import type { PRONOUNS_ENUM } from '$lib/types';
	import { invalidate, invalidateAll, goto } from '$app/navigation';
	import Modal from '$lib/components/Modal.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import PhoneInput from '$lib/components/PhoneInput.svelte';
	import { writeReq } from '$lib/utils';
	import { fullName } from '$lib/format';
	import { DateTime } from 'luxon';

	enum ModalReason {
		DISCONNECT_ADULT,
		DELETE_HOUSEHOLD,
		DELETE_ACCOUNT
	}

	let phoneInput: object;
	let { householdId, name, publicNotes, kids, adults } = $page.data.householdInfo;
	let { householdInvites, user } = $page.data;
	afterUpdate(() => {
		user = $page.data.user;
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
	let inviteesPhone: string;

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
		const twoWeeksLater = DateTime.now()
			.setZone($page.data.user.timeZone)
			.set({
				hour:
					$page.data.user.notifMeridiem === 'PM'
						? $page.data.user.notifHr + 12
						: $page.data.user.notifHr,
				minute: $page.data.user.notifMin
			})
			.plus({ days: 6 })
			.minus({ minutes: 1 });
		await writeReq('/twilio?noacc=true', {
			type: 'tip',
			phone: $page.data.user.phone,
			sendAt: twoWeeksLater.toJSDate()
		});
	}

	async function saveToDB() {
		const response = await writeReq('/db', {
			type: 'upsertHousehold',
			name: name,
			publicNotes: publicNotes
		});
		if (response.status == 200) {
			await invalidateAll();
			goto('/dashboard');
		} else {
			alert('Something went wrong with saving');
		}
	}

	async function addKid(e: SubmitEvent) {
		let newHouse = false;
		if (!householdId) {
			newHouse = true;
			const response = await writeReq('/db', {
				type: 'upsertHousehold',
				name: '',
				publicNotes: ''
			});

			if (response.status !== 200) {
				alert('Something went wrong with saving');
			}
		}
		const response = await writeReq('/db', {
			type: 'createKid',
			firstName: e.target[0].value,
			pronouns: e.target[2].value,
			lastName: e.target[1].value,
			dateOfBirth: new Date(e.target[3].value)
		});
		if (response.status == 200) {
			// NOTE: turn off till twilio is more stable
			// if (newHouse) schedTipMsg();
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
		const response = await writeReq(
			'/db',
			{
				type: 'householdChild',
				id: kids[ind].id
			},
			'DELETE'
		);
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
						modalText.content = `Are you sure that you'd like to disconnect ${fullName(
							adults[ind].firstName,
							adults[ind].lastName
						)} from this household?`;
					}
				}
				break;
			case ModalReason.DELETE_HOUSEHOLD:
				modalText.heading = 'Delete Household';
				modalText.content =
					"Are you sure that you'd like to delete your household? This will delete all basic household info and associated children but leave all adult users' accounts intact.";
				break;
			case ModalReason.DELETE_ACCOUNT:
				modalText.heading = 'Delete Account';
				modalText.content =
					"Are you sure that you'd like to delete your account? If you are the last adult in your household, this will delete all basic household info and associated children. Otherwise, the household's info and other adult users' accounts will remain intact. Additionally, we'll delete your profile info, but keep track of your phone permission settings.";
				break;
			default:
				throw new Error(`Undefined modal reason type ${type}`);
		}
		modalReason = type;
		showModal = true;
	}

	async function deleteHousehold() {
		const response = await writeReq(
			'/db',
			{
				type: 'household'
			},
			'DELETE'
		);
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
		await writeReq('/db', {
			type: 'createHouseholdInvite',
			targetPhone: phoneInput.getNumber()
		});
		inviteesPhone = phoneInput.getNumber();
		showClickToTextLink = true;
		phoneInput.telInput.value = '';
	}

	async function joinHousehold(id: number) {
		const response = await writeReq('/db', {
			type: 'acceptHouseholdInvite',
			id
		});
		if (response.status == 200) {
			await invalidateAll();
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

	let showClickToTextLink = false;
	function smsInvite(inviteesPhone: string) {
		const kidNames = kids
			.map(
				(kid: { firstName: string; lastName: string }) =>
					`${kid.firstName}${kid.lastName ? ` ${kid.lastName}` : ''}`
			)
			.join(', ');
		let objectivePronoun = PRONOUNS[user.pronouns as PRONOUNS_ENUM].split(', ')[2];
		if (objectivePronoun === 'hers') objectivePronoun = objectivePronoun.slice(0, -1);
		const msg = `${user.firstName} (parent of ${kidNames}) has invited you as a parent in ${objectivePronoun} household at playdate.help to simplify scheduling and social time. First, verify ${objectivePronoun} real phone number is ${user.phone} for safety. If it is valid, click https://playdate.help?phone=${inviteesPhone} to join.`;

		return msg;
	}

	function smsInviteEncoded(msg: string) {
		return `sms:${inviteesPhone}?&body=${encodeURIComponent(msg)}`;
	}

	async function deleteAcc() {
		const response = await writeReq(
			'/db',
			{
				type: 'user'
			},
			'DELETE'
		);
		if (response.status == 200) {
			document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
			await goto('/');
			location.reload();
		} else {
			window.alert('Something went wrong with deleting the account');
		}
	}
</script>

<div>
	<Modal showModal={showClickToTextLink}>
		<h2 slot="header">Pre-filled SMS Invite</h2>

		<div style="display: flex; flex-direction: column; margin-bottom: 1rem;">
			<p>
				To invite someone to be a co-parent, you'll need to text them. We can pre-fill an SMS for
				you with the following contents:
			</p>
			<p class="sms">{smsInvite(inviteesPhone)}</p>
		</div>

		<div slot="close" let:dialog>
			<button
				on:click={async () => {
					dialog.close();
				}}
			>
				<a href={smsInviteEncoded(smsInvite(inviteesPhone))} style="color: white;">Send a message</a
				>
			</button>
		</div>
	</Modal>
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
						{householdInvites[0].fromUser.lastName ?? ''}
					</p>
					<span style="padding: 0 0.5rem; font-size: 15px;"
						>({householdInvites[0].fromUser.phone})</span
					>

					<h4 class="subtitle-3">Kids</h4>
					{#each householdInvites[0].household.children as kid}
						<p style="font-size: 18px;">{kid.firstName} {kid.lastName ?? ''}</p>
					{/each}
					{#if !householdInvites[0].household.children.length}
						<p>None added yet</p>
					{/if}
				</div>

				<div slot="close" let:dialog>
					<button
						on:click={async () => {
							await joinHousehold(householdInvites[0].id);
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
		<h2 slot="header" style="margin-top: 0">{modalText.heading}</h2>

		<p>{modalText.content}</p>

		<div slot="close" let:dialog>
			<button
				on:click={async () => {
					if (modalReason === ModalReason.DISCONNECT_ADULT) disconnectAdult();
					else if (modalReason === ModalReason.DELETE_HOUSEHOLD) deleteHousehold();
					else if (modalReason === ModalReason.DELETE_ACCOUNT) deleteAcc();
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
		<p class="subtitle-2" style="margin-bottom: 1rem;">
			Everything you enter on this page is shared with your Circle. Don't enter sensitive
			information.
		</p>
		{#if $page.data.householdInfo.name}
			<p class="subtitle-2">
				Click <a href={`/household/${householdId}`} class="link">here</a> to see what your circle can
				see.
			</p>
		{/if}
		<p class="subtitle">Kids</p>
		{#each kids as kid, ind}
			<div class="card">
				<p>{kid.firstName} {kid.lastName ?? ''}</p>
				<p class="small-font">Pronouns: {PRONOUNS[kid.pronouns]}</p>
				<p class="small-font">Age: {isNaN(kid.age) ? 'N/A' : kid.age}</p>
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

		{#if householdId}
			<hr class="section" />

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

			<hr class="section" />

			<p class="subtitle">Adult (Household managers)</p>
			{#each adults as adult, ind}
				<div class="card">
					<p>{adult.firstName} {adult.lastName ?? ''}</p>
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
			<button
				class="btn important-delete-btn"
				on:click|preventDefault={() => openModal(ModalReason.DELETE_ACCOUNT)}>Delete Account</button
			>
		</div>
	</form>
</div>

<style>
	.link {
		text-decoration: underline;
		color: #4578ff;
	}
	.sms {
		background: #6ad36a;
		color: white;
		padding: 10px;
		border-radius: 10px;
	}
	.subtitle-3 {
		font-size: 15px;
		margin: 2rem 0 0;
	}
	.small-font {
		font-size: 1.2rem;
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
		color: #5a5a5a;
	}

	.btn-container-1 {
		display: flex;
		flex-direction: column;
		margin: 3rem 3rem 4rem;
		gap: 2rem;
	}

	.important-delete-btn {
		background: #bd0000;
	}

	.save-btn {
		background: rgba(127, 250, 122, 0.74);
		color: #5a5a5a;
	}
</style>
