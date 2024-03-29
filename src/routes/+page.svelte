<script lang="ts">
	import { env as public_env } from '$env/dynamic/public';
	import { writeReq } from '$lib/logics/_shared/utils';
	import { onMount } from 'svelte';
	import intlTelInput from 'intl-tel-input';

	export let data;
	let phoneInput: object;

	function stylePhoneInput() {
		const flag: HTMLElement | null = document.querySelector('.iti__flag-container');
		if (flag && flag.style) flag.style.display = 'none';

		const input: HTMLElement | null = document.querySelector('.iti');
		if (input && input.style) input.style.width = '100%';
	}

	let authErr = false;
	let serverErr = false;
	onMount(() => {
		const input = document.querySelector('#phone');
		phoneInput = intlTelInput(input, {
			utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@17.0.3/build/js/utils.js'
		});
		setTimeout(() => {
			stylePhoneInput();
		}, 0);
		if (data.phone) phoneInput.telInput.value = data.phone;
		if (data.status === '403') {
			authErr = true;
		} else if (data.status === '500') {
			serverErr = true;
		}
	});

	async function login() {
		if (!phoneInput.isValidNumber()) {
			alert(`You have entered an invalid contact number: ${phoneInput.telInput.value}`);
			return;
		}

		const phone = phoneInput.getNumber();
		document.cookie = `phone=${phone}`;

		const res = await writeReq('/login', {
			phone
		});
		if (res.status === 200) {
			const { token } = await res.json();
			if (public_env.PUBLIC_ENV === 'test') console.log('TOKEN', token);

			const region = new Intl.DateTimeFormat();
			const { timeZone } = region.resolvedOptions();
			const msgRes = await writeReq('/twilio?nocookie=true', {
				phone,
				type: 'login',
				token,
				timeZone
			});
			const { message } = await msgRes.json();
			if (msgRes.status === 200) {
				if (message === 'BLOCKED')
					alert(
						`You must text UNSTOP to ${public_env.PUBLIC_TWILIO_PHONE_NUMBER} to be able to receive a login code.`
					);
			} else {
				alert(message);
			}
		}
	}
</script>

<svelte:head>
	<title>playdate.help</title>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width,initial-scale=1" />
	<meta name="color-scheme" content="light only" />
	<meta name="description" content="save time. build friendships. be more social." />
	<meta property="og:site_name" content="playdate.help" />
	<meta property="og:title" content="playdate.help" />
	<meta property="og:type" content="website" />
	<meta property="og:description" content="save time. build friendships. be more social." />
	<link
		href="https://fonts.googleapis.com/css2?display=swap&family=Sora:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600;1,700&family=Merriweather:ital,wght@0,300;1,300"
		rel="stylesheet"
		type="text/css"
	/>
	<link rel="stylesheet" href="/main.css" />
	<noscript><link rel="stylesheet" href="/noscript.css" /></noscript>
</svelte:head>

<div id="wrapper">
	<div id="main">
		<dialog
			class="err-dialog"
			open={authErr || serverErr}
			on:click={() => {
				authErr = false;
				serverErr = false;
			}}
			on:keyup={() => {
				authErr = false;
				serverErr = false;
			}}
		>
			<span style="margin-right: 0.5rem;">❌</span>
			{#if authErr}
				Invalid / expired magic link
			{:else if serverErr}
				Something went wrong with logging in
			{/if}
		</dialog>
		<div class="inner" style="padding:0">
			<section id="home-section">
				<div id="container04" class="style1 container default full">
					<div class="wrapper">
						<div class="inner" data-onvisible-trigger="1">
							<h3 id="text03" class="style2"><mark>play dates</mark> made easier</h3>
							<p id="text02" class="style3">
								<span class="p"
									>get texts when your kid&#39;s friends are free. text their parents when
									you&#39;re free.<br />get weekly reminders of your schedule overlaps.<br />build
									friendships. make memories.<br /><a href="#video">watch how much easier this is</a
									></span
								>
							</p>
							<h3 id="text01" class="style2"><mark>login with sms</mark> or signup for the beta</h3>
							<form
								enctype="multipart/form-data"
								id="form01"
								method="post"
								class="style1"
								on:submit|preventDefault={login}
							>
								<div class="inner">
									<div class="field">
										<input
											type="tel"
											name="555-123-4567"
											placeholder="(555) 123 4567"
											maxlength="128"
											required
											id="phone"
										/>
									</div>
									<div class="actions">
										<button type="submit"
											><svg><use xlink:href="/icons.svg#mobile" /></svg><span class="label"
												>Send login link</span
											></button
										>
									</div>
								</div>
								<input type="hidden" name="id" value="form01" />
							</form>
							<p id="text08" class="style3">
								By submitting your phone number you consent to receive SMS messages from
								Playdate.Help and acknowledge our <a href="/legal/terms">Terms of Use</a> and
								<a href="/legal/privacy">Privacy Policy</a>. You can opt out at any time via your
								account or by replying STOP. playdate.help is open-source, non-commercial, and
								won&#39;t sell your info.
							</p>
							<ul id="buttons03" class="style1 buttons">
								<li>
									<a href="https://github.com/lilith/playdate" class="button n01"
										><svg><use xlink:href="/icons.svg#github" /></svg><span class="label"
											>source code</span
										></a
									>
								</li>
								<li>
									<a href="#about" class="button n02"
										><svg><use xlink:href="/icons.svg#globe" /></svg><span class="label"
											>mission</span
										></a
									>
								</li>
								<li>
									<a
										href="https://docs.google.com/document/d/18AJJTOX9x-pXl4mSTfKHp_9Op4cszZLhZkb9UiQZbNA/edit?usp=sharing"
										class="button n03"
										><svg><use xlink:href="/icons.svg#document-alt" /></svg><span class="label"
											>Design doc</span
										></a
									>
								</li>
							</ul>
						</div>
					</div>
				</div>
				<div
					id="container07"
					data-scroll-id="about"
					data-scroll-behavior="default"
					data-scroll-offset="0"
					data-scroll-speed="3"
					data-scroll-invisible="1"
					class="container default full screen"
				>
					<div class="wrapper">
						<div class="inner" data-onvisible-trigger="1">
							<h3 id="text30" class="style2">about us</h3>
							<h2 id="text31" class="style4">mission</h2>
							<p id="text32" class="style3">
								<span class="p"
									>playdate.help has no plans to become profitable or accept revenue. This project
									is focused on public good, through helping children build friendships and
									social-emotional skills, and (eventually) by reminding parents to donate to
									charities periodically.</span
								><span class="p"
									>Operating costs may become significant over time, so we ask that if you know
									software development, consider pitching in on <a
										href="https://github.com/lilith/playdate">Github</a
									> to make this service better for everyone.</span
								>
							</p>
						</div>
					</div>
				</div>
				<div
					id="container08"
					data-scroll-id="video"
					data-scroll-behavior="default"
					data-scroll-offset="0"
					data-scroll-speed="3"
					data-scroll-invisible="1"
					class="style1 container default full"
				>
					<div class="wrapper">
						<div class="inner" data-onvisible-trigger="1">
							<!-- svelte-ignore a11y-media-has-caption -->
							<video width="320" controls style="margin: auto;">
								<source src="/playdate_vid.mov" type="video/mp4" />
								Your browser does not support the video tag.
							</video>
							<p id="text16" class="style5">© lilith river 2023</p>
						</div>
					</div>
				</div>
			</section>
			<section id="done-section">
				<div id="container02" class="style1 container default full">
					<div class="wrapper">
						<div class="inner" data-onvisible-trigger="1">
							<h2 id="text07" class="style1">Thank You</h2>
							<p id="text10" class="style3">
								Maecenas aliquam velit scelerisque. Nisi vitae suscipit tellus mauris. Suscipit
								tellus mauris a diam maecenas sed enim ut sem lorem ipsum.
							</p>
							<ul id="buttons06" class="style1 buttons">
								<li>
									<!-- svelte-ignore a11y-invalid-attribute -->
									<a href="#" class="button n01"
										><svg><use xlink:href="/icons.svg#arrow-right-light" /></svg><span class="label"
											>Continue</span
										></a
									>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</section>
			<section id="footer">
				<div
					id="container09"
					data-scroll-id="footer"
					data-scroll-behavior="default"
					data-scroll-offset="0"
					data-scroll-speed="3"
					data-scroll-invisible="1"
					class="container default full screen s-y_bCXRrkrYfP"
				>
					<div class="wrapper s-y_bCXRrkrYfP">
						<div class="inner s-y_bCXRrkrYfP" data-onvisible-trigger="1">
							<h2 id="text40" class="style4" style="padding-bottom: 2rem;">Playdate</h2>
							<h3 id="text41" class="style2">Legal</h3>
							<p class="style6"><a href="/legal/privacy">Privacy</a></p>
							<p class="style6"><a href="/legal/terms">Terms of Use</a></p>
						</div>
					</div>
				</div>
			</section>
		</div>
	</div>
</div>

<style>
	.err-dialog {
		position: fixed;
		bottom: 2rem;
		border-radius: 1rem;
		overflow: hidden;
		z-index: 2;
		background: #ffd9d9;
		color: red;
		padding: 1.2rem 1.5rem;
	}

	#text41 {
		padding-bottom: 0.8rem;
	}
	#text40 {
		padding: var(--padding-vertical) var(--padding-horizontal);
	}
	p.style6 {
		letter-spacing: 0.04375rem;
		width: calc(100% + 0.04375rem);
		font-size: 1em;
		line-height: 2.375;
	}
	p.style6 a {
		text-decoration: none;
	}
	a {
		color: white;
	}
</style>
