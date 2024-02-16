<script lang="ts">
	import { page } from '$app/stores';
	import Notifier from '$lib/components/Calendar/Notifier.svelte';
	import ScheduleTable from '$lib/components/Calendar/ScheduleTable.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import { initVals, requestToMarkMultipleRowsAsBusy } from '$lib/logics/Calendar/Wrapper/logic';
	import type { Row } from '$lib/types';
	import { onMount } from 'svelte';

	let { dbAvailabilityDates, user, kidNames, circleInfo } = $page.data;

	let dbRows: Row[] = []; // rows saved in db
	let rowsOnMount: Row[] = []; // needed for generating schedule diff and determining that rows saved in db have changed
	let displayedRows: Row[] = []; // rows actually used in rendering -- not necessarily saved to db yet

	onMount(() => {
		const initializedVals = initVals({ dbDates: dbAvailabilityDates, timeZone: user.timeZone });
		dbRows = initializedVals.dbRows;
		rowsOnMount = initializedVals.rowsOnMount;
		displayedRows = initializedVals.displayedRows;
	});

	$: displayedRows = [...dbRows];

	const markUnspecifiedRowsAsBusy = async () => {
		try {
			await requestToMarkMultipleRowsAsBusy();
		} catch (err) {
			alert('Something went wrong with saving'); // TODO: come up with better UI for showing err
			console.error(err);
			console.error('Something went wrong with marking unspecified rows as busy');
			displayedRows = [...dbRows];
		}
	};
</script>

<div>
	<NavBar pageName="Calendar" />
	<div style="text-align: center; margin: 2rem 0;">
		<ScheduleTable
			{dbRows}
			{displayedRows}
			timeZone={user.timeZone}
			on:changed:displayedRow={(e) => (displayedRows[e.detail.i] = e.detail.row)}
			on:markedRow={() => (dbRows = displayedRows)}
			on:markedRow:available={(e) => {
				displayedRows[e.detail.i] = e.detail.newRow;
				dbRows = displayedRows;
			}}
		/>
		<button class="mark-all-busy-btn" style="margin: 1rem;" on:click={markUnspecifiedRowsAsBusy}
			>Mark unspecified days as busy</button
		>
		<Notifier {dbRows} {rowsOnMount} {circleInfo} {user} {kidNames} />
	</div>
</div>

<style>
	.mark-all-busy-btn {
		padding: 0.2rem 1rem;
		border-radius: 17px;
		background: white;
		border: 1px solid #5a5a5a;
	}
</style>
