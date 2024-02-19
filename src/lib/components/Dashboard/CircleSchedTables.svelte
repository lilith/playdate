<script lang="ts">
	import type {
		HouseholdsDict,
	} from '$lib/logics/Dashboard/_shared/types';
	import type { ScheduleItem } from '$lib/logics/_shared/format';
	import ScheduleTable from './ScheduleTable.svelte';
	import './styles.css';

	export let circleDatesDict: {
		[key: string]: ScheduleItem[];
	};
	export let householdsDict: HouseholdsDict;
</script>

{#each Object.entries(circleDatesDict) as [householdId, rows]}
	<div class="display: flex; flex-direction: column; gap: 1rem;">
		<a href="/household/{householdId}" class="larger household"
			>{householdsDict[householdId].name} ({householdsDict[householdId].kids.join(', ')})</a
		>
		{#each householdsDict[householdId].parents as contact}
			<p class="parent">
				{contact.name} - <a class="phone-num" href="sms:{contact.phone}">{contact.phone}</a>
			</p>
		{/each}

		<ScheduleTable {rows} />
	</div>
{/each}

<style>
	.parent {
		font-size: large;
		margin: 0.4rem 0;
	}
</style>
