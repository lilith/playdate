<script lang="ts">
	import { page } from '$app/stores';
	import { PRONOUNS, LANGUAGES } from '$lib/logics/_shared/constants';
	import { browser } from '$app/environment';
	import { goto, invalidateAll } from '$app/navigation';
	import Modal from '$lib/components/Modal.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import { writeReq } from '$lib/logics/_shared/utils';

	const WEEKDAYS: { [key: string]: number } = {
		Sunday: 0,
		Monday: 1,
		Tuesday: 2,
		Wednesday: 3,
		Thursday: 4,
		Friday: 5,
		Saturday: 6
	};

	let {
		firstName,
		lastName,
		pronouns,
		timeZone,
		locale,
		email,
		notifFreq,
		notifStartDay,
		notifHr,
		notifMin,
		notifMeridiem,
		acceptedTermsAt,
		allowInvites,
		allowReminders
	} = $page.data.user;
	const { terms } = $page.data;
	let doNotDisturb = !allowInvites;
	let showModal = !acceptedTermsAt;

	function setDateTimes(zone: string) {
		notifStartDay = 1;
		notifHr = 2;
		notifMin = 0;
		notifMeridiem = 'PM';
		timeZone = zone;
	}

	function onChangeZone(e: Event) {
		setDateTimes(e.target.value);
	}

	if (!timeZone) {
		// set a default timezone based on what the browser tells us
		const region = new Intl.DateTimeFormat();
		const options = region.resolvedOptions();
		setDateTimes(options.timeZone);
	}

	if (!locale && browser) {
		locale =
			LANGUAGES[LANGUAGES.findIndex((x) => x.code === navigator.language)].name ??
			'English (United States)';
	}

	async function saveToDB() {
		const response = await writeReq('/db', {
			type: 'upsertUser',
			firstName,
			lastName,
			pronouns,
			timeZone,
			locale,
			email,
			notifFreq,
			notifStartDay,
			notifHr:
				notifHr === 12 && notifMeridiem === 'AM'
					? notifHr - 12
					: notifHr !== 12 && notifMeridiem === 'PM'
					? notifHr + 12
					: notifHr,
			notifMin,
			acceptedTermsAt,
			allowInvites: !doNotDisturb,
			allowReminders
		});

		if (response.status == 200) {
			if ($page.data.user.household === null) {
				await invalidateAll();
				goto('/household');
			}
		} else {
			alert('Something went wrong with saving');
		}
	}
</script>

<div>
	<Modal
		bind:showModal
		clickSelf={() => {
			return;
		}}
	>
		<h1 slot="header">Terms of Use</h1>

		{@html terms}

		<!-- svelte-ignore a11y-autofocus -->
		<div slot="close" let:dialog>
			<button
				autofocus
				on:click={async () => {
					acceptedTermsAt = new Date();

					await writeReq('/twilio?nocookie=true', {
						type: 'thanks',
						phone: $page.data.user.phone
					});
					dialog.close();
				}}
			>
				Accept
			</button>
		</div>
	</Modal>

	<NavBar pageName="Profile" />
	<p class="subtitle-2" style="margin-top: 2rem;">Your phone</p>
	<p class="subtitle" style="text-align: center; margin-top: 0.1rem;">{$page.data.user.phone}</p>
	{#if $page.data.user.household === null}
		<p class="subtitle-2">You have not joined or created a household yet</p>
	{:else}
		<p class="subtitle-2">You are managing household</p>
		<p class="subtitle" style="text-align: center; margin-top: 0.1rem;">
			{$page.data.user.household}
		</p>
	{/if}

	<form method="POST" action="/db" on:submit|preventDefault={saveToDB}>
		<label class="subtitle" for="first-name"
			>First Name<span class="red">*</span><br />
			<input type="text" name="first-name" id="first-name" bind:value={firstName} required />
		</label>

		<label class="subtitle" for="last-name"
			>Last Name<br />
			<input type="text" name="last-name" id="last-name" bind:value={lastName} />
		</label>

		<label class="subtitle" for="pronouns"
			>Pronouns<span class="red">*</span><br />
			<select name="pronouns" id="pronouns" bind:value={pronouns} required>
				<option value="" />
				{#each Object.entries(PRONOUNS) as pronoun}
					<option value={pronoun[0]}>{pronoun[1]}</option>
				{/each}
			</select>
		</label>

		<label class="subtitle" for="zone"
			>Zone<span class="red">*</span><br />
			<select name="zone" id="zone" bind:value={timeZone} required on:change={onChangeZone}>
				{#each Intl.supportedValuesOf('timeZone') as zone}
					<option value={zone}>{zone}</option>
				{/each}
			</select>
		</label>

		<label class="subtitle" for="locale"
			>Language<span class="red">*</span><br />
			<select name="locale" id="locale" bind:value={locale} required>
				<option value="" />
				{#each $page.data.LANGUAGES as lang}
					<option value={lang.name}>{lang.name}</option>
				{/each}
			</select>
		</label>

		<label class="subtitle" for="email">Email</label>
		<input type="text" name="email" bind:value={email} />

		<div class="switch-container">
			<label class="thin-label" for="reminder-consent">Remind me to update my schedule</label>
			<label class="switch">
				<input name="reminder-consent" type="checkbox" bind:checked={allowReminders} />
				<span class="slider round" />
			</label>
		</div>

		<div class="switch-container">
			<label class="thin-label" for="notif-freq">Remind me every (days)</label>
			<select name="notif-freq" bind:value={notifFreq}>
				{#each [21, 14, 7, 6, 5, 4, 3, 2, 1] as interval}
					<option value={interval}>{interval}</option>
				{/each}
			</select>
		</div>

		<div class="switch-container">
			<label class="thin-label" for="notif-start-day">First remind me on</label>
			<select name="notif-start-day" bind:value={notifStartDay}>
				{#each Object.entries(WEEKDAYS) as [day, ind]}
					<option value={ind}>{day}</option>
				{/each}
			</select>
		</div>

		<div class="switch-container">
			<label class="thin-label" for="notif-hr">Text reminders at</label>
			<select name="notif-hr" bind:value={notifHr}>
				{#each [...Array(12).keys()] as hr}
					<option value={hr + 1}>{hr + 1}</option>
				{/each}
			</select>:
			<select name="notif-min" bind:value={notifMin}>
				{#each [...Array(60).keys()] as min}
					<option value={min}>{min < 10 ? `0${min}` : min}</option>
				{/each}
			</select>
			<select name="notif-am-pm" bind:value={notifMeridiem}>
				{#each ['AM', 'PM'] as meridiem}
					<option value={meridiem}>{meridiem}</option>
				{/each}
			</select>
		</div>

		<div class="switch-container" style="margin-bottom: 15px;">
			<label class="thin-label" for="invite-consent">Block messages from friends</label>
			<label class="switch">
				<input name="invite-consent" type="checkbox" bind:checked={doNotDisturb} />
				<span class="slider round" />
			</label>
		</div>
		<p id="descrip">
			Block other parents from sending you availability updates. If selected, your name will have a
			strikethrough to others in your circle, (e.g., <span style="text-decoration: line-through;"
				>Jane Doe</span
			>).
		</p>

		<button type="submit" class="btn" style="margin: 2rem auto 4rem;"> Save </button>
	</form>
</div>

<style>
	.subtitle > * {
		font-weight: revert;
	}
	.subtitle-2 {
		text-align: center;
		font-size: 24px;
		color: #5a5a5a;
	}
	#descrip {
		font-style: normal;
		font-weight: 400;
		font-size: 19px;
		line-height: 24px;

		color: #5a5a5a;
	}
	.switch-container select {
		width: fit-content;
		padding: 0 2px;
		margin: auto 3px;
	}
	.switch-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin: 25px 0;
	}
	.thin-label {
		width: 60%;
		font-style: normal;
		font-weight: 400;
		font-size: 21px;
		line-height: 26px;
		color: #5a5a5a;
	}

	.switch {
		position: relative;
		display: inline-block;
		width: 60px;
		height: 34px;
	}

	/* Hide default HTML checkbox */
	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	/* The slider */
	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		-webkit-transition: 0.4s;
		transition: 0.4s;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 26px;
		width: 26px;
		left: 4px;
		bottom: 4px;
		background-color: white;
		-webkit-transition: 0.4s;
		transition: 0.4s;
	}

	input:checked + .slider {
		background-color: #98ebdb;
	}

	input:focus + .slider {
		box-shadow: 0 0 1px #98ebdb;
	}

	input:checked + .slider:before {
		-webkit-transform: translateX(26px);
		-ms-transform: translateX(26px);
		transform: translateX(26px);
	}

	/* Rounded sliders */
	.slider.round {
		border-radius: 34px;
	}

	.slider.round:before {
		border-radius: 50%;
	}
</style>
