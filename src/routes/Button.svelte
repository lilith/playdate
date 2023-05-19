<script lang="ts">
	export let content = '';

	export let bgColor = '#f4ed2a';
	export let color = 'white';
	export let margin = '';
	export let padding = '0.4rem 2.8rem';
	$: cssVarStyles = `--bg:${bgColor};--color:${color};--margin:${margin};--padding:${padding}`;

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

		padding: var(--padding);
		font-size: x-large;
	}
</style>
