<script lang="ts">
	import Legend from '../Legend.svelte';
	import { getDisplayedEmoticons, type ScheduleItem } from '$lib/logics/_shared/format';

	export let rows: ScheduleItem[];
</script>

<table class="schedule">
	{#each rows as row}
		<tr>
			<td>
				<div class="flex">
					{row.label}
					{#if row.emoticons.size}
						<div class="tooltip w-fit">
							<p>
								{getDisplayedEmoticons(row.emoticons)}
								<span class="tooltiptext">
									<Legend />
								</span>
							</p>
						</div>
					{/if}
				</div>
				{#if row.notes}
					{row.notes}
				{/if}
			</td>
			<!-- {#if row.availRange === AvailabilityStatus.BUSY}
				<td>
					Busy {row.availRange}
				</td>
			{:else}
				<td class="border-right">
					<div class="flex">
						{row.englishDay}
						{row.monthDay}
						{row.availRange}
						{#if row.emoticons.size}
							<div class="tooltip w-fit">
								<p>
									{getDisplayedEmoticons(row.emoticons)}
									<span class="tooltiptext">
										<Legend />
									</span>
								</p>
							</div>
						{/if}
					</div>
					{#if row.notes}
						{row.notes}
					{/if}
				</td>
			{/if} -->
		</tr>
	{/each}
</table>
{#if rows.length === 0}
	<p class="default">Empty for the next 21 days</p>
{/if}

<style>
	.w-fit {
		width: fit-content;
	}
	.flex {
		display: flex;
	}
	.border-right {
		border-right: 1px solid #dddddd;
	}
	table {
		border-collapse: collapse;
		border: 1px solid #dddddd;
	}

	.schedule {
		width: 100%;
	}
	.schedule td {
		padding: 0.4rem 0;
		text-align: center;
	}
	.schedule td div {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 1rem;
	}
	.schedule tr:nth-child(odd) {
		background-color: #f2f2f2;
	}
</style>
