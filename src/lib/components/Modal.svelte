<script lang="ts">
	export let showModal: boolean;

	let dialog: HTMLDialogElement;
	export let clickSelf = function () {
		dialog.close();
	};

	$: if (dialog && showModal) dialog.showModal();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<dialog bind:this={dialog} on:click|self={clickSelf} on:close={() => (showModal = false)}>
	<div on:click|stopPropagation id="modal">
		<slot name="header" />
		<hr />
		<slot />
		<hr />
		<slot name="close" {dialog} />
	</div>
</dialog>

<style>
	#modal :global(ul),
	:global(ol) {
		list-style: revert;
		padding-left: 1rem;
		margin-left: 1rem;
	}
	#modal :global(h1) {
		text-align: left;
	}
	#modal :global(h2) {
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
		margin-top: 2rem;
	}
	#modal :global(p) {
		margin: 0.5rem 0;
	}
	#modal :global(div) {
		margin-top: 1em;
		display: flex;
	}
	#modal :global(button) {
		background-color: #73a4eb;
		padding: 0.5rem 1rem;
		margin: auto;
		color: white;
		border-radius: 0.2em;
	}
	dialog {
		max-width: 32em;
		border-radius: 0.2em;
		border: none;
		padding: 0;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
