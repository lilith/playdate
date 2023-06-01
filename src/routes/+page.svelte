<script lang="ts">
	import PhoneInput from './PhoneInput.svelte';
	import Button from './Button.svelte';
	import logo from '$lib/images/logo.png';
	import { POST_Req } from '../utils';

	let phoneInput: object;
	let loginSuccess = false;
	async function login() {
		if (!phoneInput.isValidNumber()) {
			alert('You have entered an invalid contact number.');
			return;
		}

		const response = await POST_Req('/login', {
			phone: phoneInput.getNumber()
		});
		if (response.status == 200) {
			const thing = await response.json();
			/**
			 * TODO: to be deleted once toll-free number verified
			 */
			alert(thing.body);
			loginSuccess = true;
		}
	}
</script>

<svelte:head>
	<title>Login</title>
	<meta name="description" content="Playdate app" />

	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/css/intlTelInput.css"
	/>
	<script
		src="https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/intlTelInput.min.js"
	></script>
</svelte:head>

<section>
	<img src={logo} alt="Playdate logo" id="logo" />

	<PhoneInput bind:phoneInput />
	<Button
		onClick={login}
		content={'Send Login Link'}
		bgColor={'#73A4EB'}
		margin={'2rem auto 1rem auto'}
	/>
	{#if loginSuccess}
		<p>Login successful! A magic link should be sent to you within 3 mins.</p>
	{:else}
		<p>
			By submitting your phone number you consent to receive SMS messages from Playdate.help. You
			can opt out at any time.
		</p>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
	}

	#logo {
		margin-top: 64%;
		margin-bottom: 14rem;
	}
	p {
		text-align: center;
		width: 75%;
	}
</style>
