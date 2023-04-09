<script lang="ts">
	import { page } from '$app/stores';
	import { LANGUAGES } from '../../constants';
	import Modal from '../Modal.svelte';
	import { browser } from '$app/environment';

	const PRONOUNS = {
		FAE_FAER_FAERS: '(f)ae, (f)aer, (f)aers',
		EEY_EM_EIRS: 'e/ey, em, eirs',
		HE_HIM_HIS: 'he, him, his',
		PER_PER_PERS: 'per, per, pers',
		SHE_HER_HERS: 'she, her, hers',
		THEY_THEM_THEIRS: 'they, them, theirs',
		VE_VER_VIS: 've, ver, vis',
		XE_XEM_XYRS: 'xe, xem, xyrs',
		ZEZIE_HIR_HIRS: 'ze/zie, hir, hirs'
	};

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
		acceptedTermsAt,
		allowInvites,
		allowReminders
	} = $page.data.user;

	let showModal = !acceptedTermsAt;

	function setDateTimes(zone: string) {
		const formatter = new Intl.DateTimeFormat([], {
			timeZone: zone,
			hour: '2-digit',
			weekday: 'long'
		});
		const formattedDate = formatter.formatToParts(new Date());
		notifStartDay =
			WEEKDAYS[formattedDate[formattedDate.findIndex((x) => x.type === 'weekday')].value];
		notifHr = parseInt(formattedDate[formattedDate.findIndex((x) => x.type === 'hour')].value);
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
		const response = await fetch('/db', {
			method: 'POST',
			body: JSON.stringify({
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
				acceptedTermsAt,
				allowInvites,
				allowReminders
			})
		});
		if (response.status == 200) {
			alert('Successfully saved profile info');
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
		<h2 slot="header">Terms and Conditions</h2>

		<p>Messaging rates, texting, etcetc</p>

		<!-- svelte-ignore a11y-autofocus -->
		<div slot="close" let:dialog>
			<button
				autofocus
				on:click={() => {
					acceptedTermsAt = new Date();
					dialog.close();
				}}
			>
				Accept
			</button>
		</div>
	</Modal>

	<h1>Profile</h1>
	<p class="subtitle" style="text-align: center">Part of Household</p>
	<p style="text-align: center;font-size: 24px;color: #5A5A5A;margin-bottom: 0.5rem;">
		{$page.data.user.household}
	</p>

	<form method="POST" action="/db" on:submit|preventDefault={saveToDB}>
		<label class="subtitle" for="first-name">First Name<span class="red">*</span></label>
		<input type="text" name="first-name" bind:value={firstName} required />

		<label class="subtitle" for="last-name">Last Name</label>
		<input type="text" name="last-name" bind:value={lastName} />

		<label class="subtitle" for="pronouns">Pronouns<span class="red">*</span></label>
		<select name="pronouns" bind:value={pronouns} required>
			<option value="" />
			{#each Object.entries(PRONOUNS) as pronoun}
				<option value={pronoun[0]}>{pronoun[1]}</option>
			{/each}
		</select>

		<label class="subtitle" for="zone">Zone<span class="red">*</span></label>
		<select name="zone" bind:value={timeZone} required on:change={onChangeZone}>
			{#each Intl.supportedValuesOf('timeZone') as zone}
				<option value={zone}>{zone}</option>
			{/each}
		</select>

		<label class="subtitle" for="locale">Language<span class="red">*</span></label>
		<select name="locale" bind:value={locale} required>
			<option value="" />
			{#each $page.data.LANGUAGES as lang}
				<option value={lang.name}>{lang.name}</option>
			{/each}
		</select>

		<label class="subtitle" for="email">Email</label>
		<input type="text" name="email" bind:value={email} />

		<div class="switch-container">
			<label class="thin-label" for="reminder-consent">Periodic reminder notifications</label>
			<label class="switch">
				<input name="reminder-consent" type="checkbox" bind:checked={allowReminders} />
				<span class="slider round" />
			</label>
		</div>

		<div class="switch-container">
			<label class="thin-label" for="notif-freq">Notification frequency (days)</label>
			<select name="notif-freq" bind:value={notifFreq}>
				{#each [...Array(7).keys()] as interval}
					<option value={interval + 1}>{interval + 1}</option>
				{/each}
			</select>
		</div>

		<div class="switch-container">
			<label class="thin-label" for="notif-start-day">Notification start day</label>
			<select name="notif-start-day" bind:value={notifStartDay}>
				{#each Object.entries(WEEKDAYS) as [day, ind]}
					<option value={ind}>{day}</option>
				{/each}
			</select>
		</div>

		<div class="switch-container">
			<label class="thin-label" for="notif-hr">Notification time</label>
			<select name="notif-hr" bind:value={notifHr}>
				{#each [...Array(31).keys()] as hr}
					<option value={hr}>{hr}</option>
				{/each}
			</select>:
			<select name="notif-min" bind:value={notifMin}>
				{#each [...Array(60).keys()] as min}
					<option value={min}>{min < 10 ? `0${min}` : min}</option>
				{/each}
			</select>
		</div>

		<div class="switch-container" style="margin-bottom: 15px;">
			<label class="thin-label" for="invite-consent">Do not disturb</label>
			<label class="switch">
				<input name="invite-consent" type="checkbox" bind:checked={allowInvites} />
				<span class="slider round" />
			</label>
		</div>
		<p id="descrip">
			Disallow other parents from sending you availability updates. If selected, your name will have
			a strikethrough to others in your circle, (e.g., <span style="text-decoration: line-through;"
				>Jane Doe</span
			>).
		</p>

		<button type="submit" class="btn"> Save </button>
	</form>
</div>

<style>
	#descrip {
		font-style: normal;
		font-weight: 400;
		font-size: 19px;
		line-height: 24px;

		color: #5a5a5a;
	}
	.switch-container select {
		width: fit-content;
		padding: 0 10px;
		margin: auto 0;
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
	.btn {
		margin-top: 25px;
		width: 100%;
		border-radius: 6px;
		height: 45px;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
			Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
		font-style: normal;
		font-weight: 600;
		background: #73a4eb;
		color: white;
		font-size: 26px;
	}

	.subtitle {
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
			Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
		font-style: normal;
		font-weight: 600;
		font-size: 24px;
		line-height: 30px;
		color: #5a5a5a;
	}

	input,
	select {
		border: 1px solid #d9d9d9;
		width: 100%;
		border-radius: 6px;
		height: 45px;
		margin-bottom: 1rem;
		margin-top: 0.2rem;
		font-size: 22px;
		line-height: 28px;
		padding: 0 3px;
	}

	.red {
		color: #bd0000;
		font-weight: 400;
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
