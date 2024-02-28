<script lang="ts">
	import { page } from '$app/stores';
	import CircleSchedTables from '$lib/components/Dashboard/CircleSchedTables.svelte';
	import NoticesSection from '$lib/components/Dashboard/NoticesSection.svelte';
	import OverlapsTable from '$lib/components/Dashboard/OverlapsTable.svelte';
	import ScheduleTable from '$lib/components/Dashboard/ScheduleTable.svelte';
	import '$lib/components/Dashboard/styles.css';
	import NavBar from '$lib/components/NavBar.svelte';
	import type {
		CircleMember,
		HouseholdsDict,
		Overlaps,
	} from '$lib/logics/Dashboard/_shared/types';
	import type { ScheduleItem } from '$lib/logics/_shared/format';

	const { displayedUserRows, displayedCircleDatesDict, householdsDict, overlaps, circle } = $page.data as {
		displayedUserRows: ScheduleItem[];
		displayedCircleDatesDict: {
			[key: string]: ScheduleItem[];
		};
		householdsDict: HouseholdsDict;
		overlaps: Overlaps;
		circle: CircleMember[];
	};
</script>

<div>
	<NavBar pageName="Dashboard" />
	<NoticesSection userRows={displayedUserRows} {circle} />

	<OverlapsTable {overlaps} {householdsDict} />

	<p class="subtitle">
		<a class="link" href="/calendar">Your Schedule</a>
	</p>
	<ScheduleTable rows={displayedUserRows} />

	<p class="subtitle">Your Circle's Schedules</p>
	<CircleSchedTables circleDatesDict={displayedCircleDatesDict} {householdsDict} />
	{#if circle.length === 0}
		<p class="default">Find your friends!</p>
	{/if}
</div>
