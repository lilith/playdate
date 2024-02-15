<script lang="ts">
	import { EMOTICONS_REVERSE } from '$lib/constants';
	import {
		getRowColor,
		isAvailableOnRow,
		markRowUnavailableLocally,
		requestToMarkOneRow
	} from '$lib/logics/Calendar/ScheduleTable/logic';
	import type { Row, Unavailable } from '$lib/types';
	import { AvailabilityStatus } from '@prisma/client';
	import { createEventDispatcher, tick } from 'svelte';
	import Editor from './Editor.svelte';

	const dispatch = createEventDispatcher();

	export let dbRows: Row[];
	export let displayedRows: Row[];
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
		if (!dbRows.length) break $;

		rowColors = [...Array(21).keys()].map((_, i) =>
			getRowColor({
				i,
				numRows: dbRows.length,
				isAvailable: isAvailableOnRow(dbRows[i]),
				isRowExpanded: openedRows.has(i)
			})
		);
	}

	const openEditor = (i: number) => {
		openedRows.add(i);
		openedRows = openedRows;
		tick().then(() => {
			document.getElementById(`editor-${i}`)?.focus();
		});
	};

	const closeEditor = (i: number) => {
		openedRows.delete(i);
		openedRows = openedRows;
	};

	const markRowAsUnavailable = async ({ i, status }: { i: number; status: Unavailable }) => {
		const dbRow = { ...displayedRows[i] };
		displayedRows = markRowUnavailableLocally({ i, displayedRows, status });
		dispatch('changed:displayedRows', displayedRows);
		try {
			await requestToMarkOneRow({
				status,
				displayedRow: displayedRows[i],
				availableDetails: null
			});
			closeEditor(i);
			dispatch('markedRow');
		} catch (err) {
			alert('Something went wrong with saving'); // TODO: come up with better UI for showing err
			console.error('Something went wrong with marking row as unavailable', err);
			displayedRows[i] = dbRow;
			dispatch('changed:displayedRows', displayedRows);
		}
	};
</script>

<table id="schedule">
	{#each dbRows as row, i}
		<tr style="background-color: {rowColors[i]};">
			<td
				class:blue={openedRows.has(i)}
				class="day"
				on:click={() => openEditor(i)}
				on:keyup={() => openEditor(i)}
			>
				{row.englishDay}
			</td>
			<td
				class:blue={openedRows.has(i)}
				class="date"
				on:click={() => openEditor(i)}
				on:keyup={() => openEditor(i)}
			>
				{row.monthDay}
			</td>
			<td colspan="2" class="time" on:click={() => openEditor(i)} on:keyup={() => openEditor(i)}>
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
							status: AvailabilityStatus.BUSY
						});
					}}
					on:keyup={() =>
						markRowAsUnavailable({
							i,
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
							status: AvailabilityStatus.UNSPECIFIED
						})}
					on:keyup={() =>
						markRowAsUnavailable({
							i,
							status: AvailabilityStatus.UNSPECIFIED
						})}
				>
					Clear
				</td>
			{/if}
		</tr>
		{#if openedRows.has(i)}
			<Editor
				hasBadTime={rowIndsWithTimeErrs.has(i)}
				unsavedRows={displayedRows}
				{i}
				{timeZone}
				on:changed:time={(e) => {
					rowIndsWithTimeErrs.delete(i);
					rowIndsWithTimeErrs = rowIndsWithTimeErrs;
					dispatch('changed:displayedRow', {
						i,
						row: { ...displayedRows[i], availRange: e.detail }
					});
				}}
				on:closeEditor={() => closeEditor(i)}
				on:clicked:emoji={(e) => {
					dispatch('changed:displayedRow', {
						i,
						row: { ...displayedRows[i], emoticons: e.detail }
					});
				}}
				on:markedRow={() => dispatch('markedRow')}
			/>
		{/if}
	{/each}
</table>

<style>
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

	.blue {
		background: #a0e3ff;
	}
</style>
