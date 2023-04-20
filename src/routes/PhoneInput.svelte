<script lang="ts">
	import { onMount } from 'svelte';

	export let phoneInput;
	function initPhoneInput(phoneInputField: Element | null) {
		phoneInput = window.intlTelInput(phoneInputField, {
			utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js'
		});
	}
	onMount(() => {
		const phoneInputField = document.querySelector('#phone');

		if ('intlTelInput' in window) {
			initPhoneInput(phoneInputField);
		} else {
			setTimeout(() => {
				if ('intlTelInput' in window) {
					initPhoneInput(phoneInputField);
				}
			}, 1000);
		}
	});
</script>

<svelte:head>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/css/intlTelInput.css"
	/>
	<script
		src="https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/intlTelInput.min.js"
	></script>
</svelte:head>
<input type="tel" id="phone" name="phone" />

<style>
	#phone {
		border-radius: 4px;
		padding-top: 0.4rem;
		padding-bottom: 0.4rem;
		border-color: #cecece;
		border-width: 1px;
		border-style: solid;

		font-size: larger;
	}
</style>
