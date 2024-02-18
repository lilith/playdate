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
		SpecifiedRowWithDateAndStringEmojis
	} from '$lib/logics/Dashboard/_shared/types';

	const { userRows, circleDatesDict, householdsDict, overlaps, circle } = $page.data as {
		userRows: SpecifiedRowWithDateAndStringEmojis[];
		circleDatesDict: {
			[key: string]: SpecifiedRowWithDateAndStringEmojis[];
		};
		householdsDict: HouseholdsDict;
		overlaps: Overlaps;
		circle: CircleMember[];
	};
</script>

<div>
	<NavBar pageName="Dashboard" />
	<NoticesSection {userRows} {circle} />

	<OverlapsTable {overlaps} {householdsDict} />

	<p class="subtitle">
		<a class="link" href="/calendar">Your Schedule</a>
	</p>
	<ScheduleTable rows={userRows} />

	<p class="subtitle">Your Circle's Schedules</p>
	<CircleSchedTables {circleDatesDict} {householdsDict} />
</div>
