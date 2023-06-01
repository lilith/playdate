<script lang="ts">
	import { onMount } from 'svelte';
	import intlTelInput from 'intl-tel-input';
	import 'intl-tel-input/build/css/intlTelInput.css';

	export let phoneInput;
	onMount(() => {
		const input = document.querySelector('#phone');
		phoneInput = intlTelInput(input, {
			utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@17.0.3/build/js/utils.js'
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
