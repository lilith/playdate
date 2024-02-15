<script lang="ts">
	import type { Row } from '$lib/types';
	import NavBar from '$lib/components/NavBar.svelte';
	import ScheduleTable from '$lib/components/Calendar/ScheduleTable.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { initVals } from '$lib/logics/Calendar/Wrapper/logic';
	import Notifier from '$lib/components/Calendar/Notifier.svelte';
	import { markUnspecifiedRowsAsBusy } from '$lib/logics/Calendar/ScheduleTable/logic';

	let { dbAvailabilityDates, user, kidNames, circleInfo } = $page.data;

	let dbRows: Row[] = []; // rows saved in db
	let rowsOnMount: Row[] = []; // needed for generating schedule diff and determining that rows saved in db have changed
	let displayedRows: Row[] = []; // rows actually used in rendering -- not necessarily saved to db yet
	let unsavedInds: number[] = [];

	onMount(() => {
		const initializedVals = initVals({ dbDates: dbAvailabilityDates, timeZone: user.timeZone });
		dbRows = initializedVals.dbRows;
		rowsOnMount = initializedVals.rowsOnMount;
		displayedRows = initializedVals.displayedRows;
		unsavedInds = initializedVals.unsavedInds;
	});
	// $: updateRowColors();

	$: displayedRows = [...dbRows];
</script>

<div>
	<NavBar pageName="Calendar" />
	<div style="text-align: center; margin: 2rem 0;">
		<ScheduleTable rows={displayedRows} timeZone={user.timeZone} on:changed:rows={(e) => displayedRows = e.detail} />
		<button
			class="mark-all-busy-btn"
			style="margin: 1rem;"
			on:click={() =>
				markUnspecifiedRowsAsBusy({
					displayedRows,
					dbRows
				})}>Mark unspecified days as busy</button
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