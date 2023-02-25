<script lang="ts">
	export let content = '';

	export let bgColor = '#f4ed2a';
	export let color = 'white';
	export let margin = '';
	$: cssVarStyles = `--bg:${bgColor};--color:${color};--margin:${margin};`;

	export let onClick: () => void;
</script>

<button
	class="pretty-btn cursor-pointer rounded-md border-none"
	style={cssVarStyles}
	on:click={onClick}
>
	{content}
</button>

<style>
	.pretty-btn {
		background-color: var(--bg, white);
		color: var(--color, black);
		margin: var(--margin);

		padding: 0.4rem 6.3rem;
		font-size: x-large;
	}
</style>
