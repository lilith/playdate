<script lang="ts">
	import type {
		HouseholdsDict,
		Overlaps,
	} from '$lib/logics/Dashboard/_shared/types';
	import Legend from '../Legend.svelte';
	import './styles.css';

	export let overlaps: Overlaps;
	export let householdsDict: HouseholdsDict;
</script>

<p class="subtitle">Overlaps</p>
{#each overlaps as { monthDay, englishDay, overlapsArr }}
	<p class="bold larger">{englishDay} {monthDay}</p>
	{#each overlapsArr as { friendHouseholdId, timeRange, friendEmoticons, userEmoticons }}
		<div class="summary">
			<a class="household" href="/household/{friendHouseholdId}">
				{householdsDict[friendHouseholdId].name} (
				{householdsDict[friendHouseholdId].kids}
				)
			</a>
			<p class="bold">
				{timeRange}
			</p>
			<div class="tooltip-container">
				<div class="tooltip">
					<p>
						You: {userEmoticons.length ? userEmoticons : 'N/A'}
						<span class="tooltiptext">
							<Legend />
						</span>
					</p>
				</div>
				|
				<div class="tooltip">
					<p>
						Them: {friendEmoticons.length ? friendEmoticons : 'N/A'}
						<span class="tooltiptext">
							<Legend />
						</span>
					</p>
				</div>
			</div>
			<p>Contacts to set up a play date:</p>
			<ul>
				{#each householdsDict[friendHouseholdId].parents as contact}
					<li>
						{contact.name} - <a class="phone-num" href="sms:{contact.phone}">{contact.phone}</a>
					</li>
				{/each}
			</ul>
		</div>
	{/each}
{/each}
{#if !overlaps.length}
	<p class="default">No overlaps detected</p>
{/if}

<style>
	.tooltip-container {
		display: inline-flex;
		width: 100%;
	}

	li {
		list-style: inside;
	}

	.bold {
		font-weight: bold;
	}

	.summary {
		text-align: center;
	}

	.summary {
		border: 1px solid #a6b6de;
		box-shadow: 0px 4px 4px 1px #d9d9d9;
		border-radius: 18px;
		padding: 1rem;
		color: #5a5a5a;
		background: white;
		margin-bottom: 1rem;
	}
</style>