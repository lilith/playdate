<script lang="ts">
	export let content = '';

	export let bgColor = '#f4ed2a';
	export let color = 'white';
	export let margin = '';
	export let padding = '0.4rem 2.8rem';
	export let fontSize = 'x-large';
	$: cssVarStyles = `--bg:${bgColor};--color:${color};--margin:${margin};--padding:${padding};--font-size:${fontSize}`;

	export let onClick: (e?: Event) => void;
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
		font-size: var(--font-size);
	}
</style>
