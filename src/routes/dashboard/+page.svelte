<script lang="ts">
	import Legend from '../Legend.svelte';
	import NavBar from '../NavBar.svelte';
	import { page } from '$app/stores';
	import type { Dates, DateDetails, BusyDetails } from '$lib/constants';
	import { formatMin } from '../../utils';
	import type { Household } from './constants';
	import { goto } from '$app/navigation';

	type CircleMember = {
		friendHouseholdId: number;
		householdId: number;
		friendHousehold: Household;
		household: Household;
	}[];
	const {
		overlaps: overlapMap,
		households,
		userDates,
		circle,
		userDatesArr,
		circleDatesMap
	} = $page.data as {
		overlaps: Dates;
		households: {
			[key: number | string]: {
				name: string;
				kids: string[];
				parents: {
					name: string;
					phone: string;
				}[];
			};
		};
		userDates: Dates;
		circle: CircleMember;
		userDatesArr: (DateDetails | BusyDetails)[];
		circleDatesMap: {
			[key: number]: (DateDetails | BusyDetails)[];
		};
	};

	const emptySchedule = Object.keys(userDatesArr).length === 0;
	const noFriends = circle.length === 0;
	const numNotices = [emptySchedule, noFriends].reduce(
		(accumulator, currentValue) => accumulator + (currentValue ? 1 : 0),
		0
	);
</script>

<div>
	<NavBar pageName="Dashboard" />
	<div style="margin-bottom: 2rem;">
		<p class="subtitle">Notices<span>{numNotices}</span></p>
		{#if emptySchedule}
			<div class="notice" on:click={() => goto('/calendar')} on:keyup={() => goto('/calendar')}>
				<p>Empty Schedule</p>
				<p>Please mark your tentative availability.</p>
				<p>Click <span class="link">here</span> to go to your schedule editor.</p>
			</div>
		{/if}

		{#if noFriends}
			<div class="notice" on:click={() => goto('/circle')} on:keyup={() => goto('/circle')}>
				<p>Find your friends</p>
				<p>Be sure to invite your friends to set up play dates!</p>
				<p>Click <span class="link">here</span> to go to your Circle page.</p>
			</div>
		{/if}

		{#if !numNotices}
			<p class="default">No notices at this time</p>
		{/if}
	</div>

	<!-- planning on condensing range of contiguous days and hours overlapping into one summary -->
	<p class="subtitle">Overlaps</p>
	{#each Object.entries(overlapMap) as [overlapDay, overlapArr]}
		<p class="bold larger">{overlapDay}</p>
		{#each overlapArr as overlap}
			<div class="summary">
				<a class="bold household" href="/household/{overlap.householdId}">
					{households[overlap.householdId].name} (
					{households[overlap.householdId].kids}
					)
				</a>
				<p class="bold">
					{overlap.startHr}:{formatMin(overlap.startMin)} - {overlap.endHr}:{formatMin(
						overlap.endMin
					)}
				</p>
				<div class="tooltip-container">
					<div class="tooltip">
						<p>
							You: {userDates[overlap.monthDay][0].emoticons}
							<span class="tooltiptext">
								<Legend />
							</span>
						</p>
					</div>
					|
					<div class="tooltip">
						<p>
							Them: {overlap.emoticons}
							<span class="tooltiptext">
								<Legend />
							</span>
						</p>
					</div>
				</div>
				<p>Contacts to set up a play date:</p>
				<ul>
					{#each households[overlap.householdId].parents as contact}
						<li>{contact.name} - <a href="tel:{contact.phone}">{contact.phone}</a></li>
					{/each}
				</ul>
			</div>
		{/each}
	{/each}
	{#if Object.keys(overlapMap).length === 0}
		<p class="default">No overlaps detected</p>
	{/if}

	<p class="subtitle">
		<a class="link" href="/calendar">Your Schedule</a>
	</p>
	<table class="schedule">
		{#each userDatesArr as row}
			<tr>
				{#if row.status === 'Available'}
					<td class="border-right">
						<div class="flex">
							{row.englishDay}
							{row.monthDay}
							{row.availRange}
							{#if row.emoticons !== 'N/A'}
								<div class="tooltip w-fit">
									<p>
										{row.emoticons}
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
				{:else}
					<td>
						Busy {row.availRange}
					</td>
				{/if}
			</tr>
		{/each}
	</table>
	{#if userDatesArr.length === 0}
		<p class="default">Empty for the next 21 days</p>
	{/if}

	<p class="subtitle">Your Circle's Schedules</p>
	{#each Object.entries(circleDatesMap) as [householdId, scheds]}
		<a href="/household/{householdId}" class="bold larger"
			>{households[householdId].name} ({households[householdId].kids.join(', ')})</a
		>
		{#each households[householdId].parents as contact}
			<p class="parent">{contact.name} - <a href="tel:{contact.phone}">{contact.phone}</a></p>
		{/each}

		{#if !scheds.length}
			<p class="default">Empty for the next 21 days</p>
		{/if}
		<table class="schedule mb">
			{#each scheds as row}
				<tr>
					{#if row.status === 'Available'}
						<td class="border-right">
							<div class="flex">
								{row.englishDay}
								{row.monthDay}
								{row.availRange}
								{#if row.emoticons !== 'N/A'}
									<div class="tooltip w-fit">
										<p>
											{row.emoticons}
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
					{:else}
						<td>
							Busy {row.availRange}
						</td>
					{/if}
				</tr>
			{/each}
		</table>
	{/each}
	{#if Object.keys(circleDatesMap).length === 0}
		<p class="default">Empty for the next 21 days</p>
	{/if}
</div>

<style>
	.mb {
		margin-bottom: 1rem;
	}
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
	.link {
		text-decoration: underline;
		color: #4578ff;
	}
	.default {
		font-size: large;
		text-align: center;
	}
	.household {
		color: black;
		font-size: large;
	}
	.parent {
		font-size: large;
		margin: 0.4rem 0;
	}

	.tooltip-container {
		display: inline-flex;
		width: 100%;
	}

	.larger {
		font-size: larger;
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

	.notice,
	.summary {
		border: 1px solid #a6b6de;
		box-shadow: 0px 4px 4px 1px #d9d9d9;
		border-radius: 18px;
		padding: 1rem;
		color: #5a5a5a;
		background: white;
		margin-bottom: 1rem;
	}

	.subtitle span {
		background: #d9d9d9;
		width: 42px;
		height: 29px;
		display: inline-flex;
		border-radius: 15px;
		align-items: center;
		justify-content: center;
		font-weight: 400;
		font-size: 20px;
		margin-left: 0.8rem;
	}

	.notice p:first-of-type {
		font-weight: bold;
		padding-bottom: 0.8rem;
		font-size: large;
	}
</style>
