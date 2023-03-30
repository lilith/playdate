<script lang="ts">
	import { page } from '$app/stores';

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

	let {
		firstName,
		lastName,
		pronouns,
		timeZone,
		locale,
		notifFreq,
		notifStartDay,
		notifHr,
		notifMin
	} = $page.data.user;
	async function saveToDB() {
		const response = await fetch('/db', {
			method: 'POST',
			body: JSON.stringify({
				firstName,
				lastName,
				pronouns,
				timeZone,
				locale,
				notifFreq,
				notifStartDay,
				notifHr,
				notifMin
			})
		});
		if (response.status == 200) {
			const thing = await response.json();
			alert('Successfully saved profile info');
		} else {
			const thing = await response.json();
			alert('Something went wrong with saving');
		}
	}
</script>

<div>
	<h1>Profile</h1>
	<p class="subtitle" style="text-align: center">Part of Household</p>
	<p style="text-align: center;font-size: 24px;color: #5A5A5A;margin-bottom: 0.5rem;">
		{$page.data.user.household}
	</p>

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
	<input type="text" name="zone" bind:value={timeZone} required />

	<label class="subtitle" for="locale">Language<span class="red">*</span></label>
	<input type="text" name="locale" bind:value={locale} required />

    <label class="subtitle" for="reminder-consent">Periodic reminder notifications</label>
	<label class="switch">
		<input name="reminder-consent" type="checkbox" />
		<span class="slider round" />
    </label><br>

	<label class="subtitle" for="notif-freq">Notification frequency (days)</label>
	<select name="notif-freq" bind:value={notifFreq}>
		{#each [...Array(7).keys()] as interval}
			<option value={interval + 1}>{interval + 1}</option>
		{/each}
	</select>
	<label class="subtitle" for="notif-start-day">Notification start day</label>
	<select name="notif-start-day" bind:value={notifStartDay}>
		{#each ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as day, ind}
			<option value={ind}>{day}</option>
		{/each}
	</select>
	<label class="subtitle" for="notif-hr">Notification time</label>
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

	<button on:click={saveToDB} style="background: #73A4EB;color: white;font-size: 26px;" class="btn">
		Save
	</button>
</div>

<style>
	.btn {
		width: 100%;
		border-radius: 6px;
		height: 45px;
		font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu,
			Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
		font-style: normal;
		font-weight: 600;
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
		background-color: #2196f3;
	}

	input:focus + .slider {
		box-shadow: 0 0 1px #2196f3;
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
