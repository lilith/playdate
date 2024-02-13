<script lang="ts">
	import { EMOTICONS, UNAVAILABLE } from '$lib/logics/Calendar/_shared/constants';
	import { EMOTICONS_REVERSE } from '$lib/constants';
	import type { Row, Unavailable } from '$lib/types';
	import Legend from '$lib/components/Legend.svelte';
	import Button from '$lib/components/Button.svelte';
	import {
		closeEditor,
		getRowColor,
		isAvailableOnRow,
		markRowAsAvailable,
		markRowUnavailableLocally,
		requestToMarkOneRow,
		// markRowAsUnavailable,
		showEditor,
		toggleEmoticon
	} from '$lib/logics/Calendar/ScheduleTable/logic';
	import { AvailabilityStatus } from '@prisma/client';

	export let rows: Row[];
	export let timeZone: string;

	let openedRows = new Set<number>(); // row inds which have open editors
	let rowIndsWithTimeErrs = new Set<number>();
	/*
		rowColors rules
		1. white - unopened and even ind and unavailable
		2. gray - unopened and odd ind and unavailable
		3. dark blue - opened
		4. light blue - unopened and available
	*/
	let rowColors: string[] = [];

	$: {
		if (!rows.length) break $;

		rowColors = [...Array(21).keys()].map((_, i) =>
			getRowColor({
				i,
				numRows: rows.length,
				isAvailable: isAvailableOnRow(rows[i]),
				isRowExpanded: openedRows.has(i)
			})
		);
	}

	const handleEditorOpen = (i: number) => {
		openedRows = showEditor({ i, openedRows });
	};

	const markRowAsUnavailable = async ({
		i,
		status
	}: {
		i: number;
		status: Unavailable;
	}) => {
		const dbRows = [...rows]
		rows = markRowUnavailableLocally({ i, displayedRows: rows, status });

		try {
			await requestToMarkOneRow({
				i,
				status,
				// dbRows,
				displayedRows: rows,
				availableDetails: null
			});
			closeEditor({ i, openedRows });
		} catch (err) {
			console.error(err);
			console.error('Something went wrong with marking row as unavailable');

			rows = [...dbRows]
		}
};
</script>

<table id="schedule">
	{#each rows as row, i}
		<tr style="background-color: {rowColors[i]};">
			<td
				class:blue={openedRows.has(i)}
				class="day"
				on:click={() => handleEditorOpen(i)}
				on:keyup={() => handleEditorOpen(i)}
			>
				{row.englishDay}
			</td>
			<td
				class:blue={openedRows.has(i)}
				class="date"
				on:click={() => handleEditorOpen(i)}
				on:keyup={() => handleEditorOpen(i)}
			>
				{row.monthDay}
			</td>
			<td
				colspan="2"
				class="time"
				on:click={() => handleEditorOpen(i)}
				on:keyup={() => handleEditorOpen(i)}
			>
				{#if row.availRange === AvailabilityStatus.UNSPECIFIED}
					<p>Unspecified (<span class="edit">edit</span>)</p>
				{:else if row.availRange === AvailabilityStatus.BUSY}
					<p>Busy (<span class="edit">edit</span>)</p>
				{:else}
					<p class="timeDisplay">{row.availRange}</p>
					{#if row.emoticons.size}
						<p class="emoticonsDisplay">
							{#each Array.from(row.emoticons) as emojiStr}
								{EMOTICONS_REVERSE[emojiStr]}
							{/each}
						</p>
					{/if}
					{#if row.notes}
						<p class="notesDisplay">{row.notes}</p>
					{/if}
					<p class="changeTime">(edit)</p>
				{/if}
			</td>
			{#if row.availRange === AvailabilityStatus.UNSPECIFIED}
				<td
					on:click={() => {
						markRowAsUnavailable({
							i,
							displayedRows: rows,
							openedRows,
							status: AvailabilityStatus.BUSY
						});
					}}
					on:keyup={() =>
						markRowAsUnavailable({
							i,
							displayedRows: rows,
							openedRows,
							status: AvailabilityStatus.BUSY
						})}
					class="busy"
				>
					Busy
				</td>
			{:else}
				<td
					class="clear"
					on:click={() =>
						markRowAsUnavailable({
							i,
							displayedRows: rows,
							openedRows,
							status: AvailabilityStatus.UNSPECIFIED
						})}
					on:keyup={() =>
						markRowAsUnavailable({
							i,
							displayedRows: rows,
							openedRows,
							status: AvailabilityStatus.UNSPECIFIED
						})}
				>
					Clear
				</td>
			{/if}
		</tr>
		{#if openedRows.has(i)}
			<tr style="background: #A0E3FF">
				<td colspan="5" style="padding: 0.9rem 0.4rem;" class="editorCell">
					<form on:submit|preventDefault={() => {}}>
						<div class="v-center-h-space flex-col" style="gap: 0.1rem;">
							<!-- prettier-ignore -->
							<input
                id={`editor-${i}`}
                type="text"
                class="text-inherit"
                placeholder='Enter a valid time range. Ex. "2:30pm-7 or 5-6"'
                value={UNAVAILABLE.includes(rows[i].availRange) ? '' : rows[i].availRange}
                on:keydown={(e) => {
                  rowIndsWithTimeErrs.delete(i);
                  rowIndsWithTimeErrs = new Set(rowIndsWithTimeErrs);

									rows[i].availRange = e.currentTarget.value;
                }}
              />
							{#if rowIndsWithTimeErrs.has(i)}
								<p class="red">Enter a valid time range. Ex. "2:30pm-7 or 5-6"</p>
							{/if}
						</div>
						<div class="v-center-h-space">
							{#key rows[i].emoticons}
								{#each Object.entries(EMOTICONS) as [emoji, emojiDescrip]}
									<div
										class="emoji {rows[i].emoticons.has(emojiDescrip) ? 'chosen' : ''}"
										on:click={() =>
											toggleEmoticon({ i, displayedRows: rows, emoticon: emojiDescrip })}
										on:keyup={() =>
											toggleEmoticon({ i, displayedRows: rows, emoticon: emojiDescrip })}
									>
										{emoji}
									</div>
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
								bind:value={rows[i].notes}
								class="text-inherit"
								name="notes"
								placeholder="(add notes)"
							/>
						</div>
						<div class="editor-btns">
							<Button
								onClick={async () => {
									try {
										await markRowAsAvailable({
											i,
											displayedRows: rows,
											timeZone,
											rowIndsWithTimeErrs
										});
										openedRows = closeEditor({ i, openedRows });
									} catch {}
								}}
								disabled={rowIndsWithTimeErrs.has(i)}
								content={'Save'}
								bgColor={'#93FF8B'}
								padding="0.1rem 0.7rem"
								color={'black'}
								fontSize={'larger'}
							/>
							<Button
								onClick={(e) => {
									e?.preventDefault();
									openedRows = closeEditor({ i, openedRows });
								}}
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
		{/if}
	{/each}
</table>

<style>
	.red {
		color: #bd0000;
	}
	.text-inherit {
		font-size: inherit;
	}
	table {
		border-collapse: collapse;
		border: 1px solid #dddddd;
	}
	#schedule {
		width: 100%;
	}
	#schedule td {
		padding: 0.4rem 0rem;
		text-align: center;
		border-right: 1px solid #dddddd;
	}
	#schedule td.day,
	#schedule td.date {
		text-align: left;
		padding-left: 0.3rem;
		padding-right: 0.3rem;
		white-space: nowrap;
	}
	#schedule td.time {
		width: 99%; /* All excess space goes here */
		cursor: pointer;
	}
	#schedule td.time .emoticonsDisplay,
	#schedule td.time .timeDisplay {
		display: inline; /* No line breaks between time and emoticons */
	}
	#schedule td.time .emoticonsDisplay {
		padding-left: 0.5em;
	}
	#schedule .changeTime {
		display: block;
		text-decoration: underline;
		font-weight: 600;
		cursor: pointer;
	}
	#schedule td.busy,
	#schedule td.clear {
		text-decoration: underline;
		font-weight: 600;
		white-space: nowrap;
		padding: 0.3rem;
		cursor: pointer;
	}

	#schedule .edit,
	#schedule .changeTime {
		text-decoration: underline;
		font-weight: 600;
		cursor: pointer;
	}

	#schedule td.editorCell {
		width: 100%;
	}
	.editor-btns {
		gap: 0.5rem;
		display: flex;
		justify-content: center;
		margin: 1rem auto 0;
	}
	.blue {
		background: #a0e3ff;
	}

	#preview-notif-subtitle {
		font-size: large;
		text-align: left;
	}
	#preview-notif {
		box-shadow: 0px 0px 4px 0px #00000096;
		text-align: left;
		padding: 0.7rem 0.5rem;
		border-radius: 6px;
		background: white;
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
</style>
