<script lang="ts">
	import { onMount } from 'svelte';

	export let phoneInput;
	onMount(async () => {
		console.log('loading phone');
		const phoneInputField = document.querySelector('#phone');
		phoneInput = window.intlTelInput(phoneInputField, {
			utilsScript: 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js'
		});
	});
</script>

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
