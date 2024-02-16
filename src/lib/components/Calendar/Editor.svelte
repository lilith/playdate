<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Legend from '$lib/components/Legend.svelte';
	import { markRowAsAvailable, toggleEmoticon } from '$lib/logics/Calendar/Editor/logic';
	import { EMOTICONS, UNAVAILABLE } from '$lib/logics/Calendar/_shared/constants';
	import type { Row } from '$lib/types';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let i: number;
	export let unsavedRows: Row[];
	export let hasBadTime: boolean;
	export let timeZone: string;

	let inputVal: string = UNAVAILABLE.includes(unsavedRows[i].availRange)
		? ''
		: unsavedRows[i].availRange;

	$: dispatch('changed:time', inputVal);

	const clickOnEmoji = (stuff: { i: number; unsavedRows: Row[]; emoticon: string }) => {
		dispatch('clicked:emoji', toggleEmoticon(stuff));
	};

	const clickOnSave = async () => {
		try {
			const newRow = await markRowAsAvailable({
				unsavedRow: unsavedRows[i],
				timeZone
			});

			dispatch('markedRow', {
				i,
				newRow
			});
		} catch (err) {
			console.log(err);
			if (!(err instanceof Response)) {
				dispatch('markBadTime');
			}

			alert('Something went wrong with saving'); // TODO: come up with better UI for showing err
			console.error('Something went wrong with marking row as available', err);
		}
	};

	const clickOnCancel = (e?: Event) => {
		e?.preventDefault();
		dispatch('closeEditor');
	};
</script>

<tr style="background: #A0E3FF">
	<td colspan="5" style="padding: 0.9rem 0.4rem;" class="editorCell">
		<form on:submit|preventDefault={() => {}}>
			<div class="v-center-h-space flex-col" style="gap: 0.1rem;">
				<input
					id={`editor-${i}`}
					type="text"
					class="text-inherit"
					placeholder={'Enter a valid time range. Ex. "2:30pm-7 or 5-6"'}
					bind:value={inputVal}
				/>
				{#if hasBadTime}
					<p class="red">Enter a valid time range. Ex. "2:30pm-7 or 5-6"</p>
				{/if}
			</div>
			<div class="v-center-h-space">
				{#key unsavedRows[i].emoticons}
					{#each Object.entries(EMOTICONS) as [emoji, emojiDescrip]}
						<button
							class="emoji {unsavedRows[i].emoticons.has(emojiDescrip) ? 'chosen' : ''}"
							on:click={() => clickOnEmoji({ i, unsavedRows, emoticon: emojiDescrip })}
						>
							{emoji}
						</button>
					{/each}
				{/key}
				<div class="tooltip">
					<p>
						Legend
						<span class="tooltiptext">
							<Legend />
						</span>
					</p>
				</div>
			</div>
			<div class="v-center-h-space">
				<textarea
					bind:value={unsavedRows[i].notes}
					class="text-inherit"
					name="notes"
					placeholder="(add notes)"
				/>
			</div>
			<div class="editor-btns">
				<Button
					onClick={clickOnSave}
					disabled={hasBadTime}
					content={'Save'}
					bgColor={'#93FF8B'}
					padding="0.1rem 0.7rem"
					color={'black'}
					fontSize={'larger'}
				/>
				<Button
					onClick={clickOnCancel}
					content={'Cancel'}
					bgColor={'rgba(255, 233, 184, 0.78)'}
					padding="0.1rem 0.7rem"
					color={'black'}
					fontSize={'larger'}
				/>
			</div>
		</form>
	</td>
</tr>

<style>
	.red {
		color: #bd0000;
	}
	.text-inherit {
		font-size: inherit;
	}
	.emoji.chosen {
		border: 1px solid black;
	}
	textarea {
		margin: 0;
		resize: none;
	}
	.v-center-h-space {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.flex-col {
		flex-direction: column;
	}
	.tooltip {
		width: fit-content;
	}

	.emoji {
		background: white;
		font-size: x-large;
		margin: 0.5rem 0;
		padding-left: 0.2rem;
		padding-right: 0.2rem;
		border-radius: 3px;
		border: 1px solid #d9d9d9;
	}

	.tooltiptext {
		left: 0;
	}

	.editorCell {
		width: 100%;
	}
	.editor-btns {
		gap: 0.5rem;
		display: flex;
		justify-content: center;
		margin: 1rem auto 0;
	}
</style>
