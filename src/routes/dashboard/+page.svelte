<script>
	import Legend from '../Legend.svelte';
	const overlaps = [
		{
			dateRange: 'Tuesday 2/12',
			householdId: 2,
			house: 'Doe House (Alice, 8) (Kevin, 6)',
			timeRange: '11am - 6pm',
			userAvailability: '🏠🚗',
			themAvailability: '🏠🚗👥🌟',
			contacts: [
				{
					name: 'John Doe',
					phone: '+15107120505'
				},
				{
					name: 'John Doe',
					phone: '+15107120505'
				}
			]
		}
	];
	const userSched = [
		{
			dateRange: 'Tuesday 2/12',
			timeRange: '11am - 6pm',
			availability: '🏠🚗'
		},
		{
			dateRange: 'Wednesday 2/13 - Sunday 2/17',
			availability: 'Busy'
		}
	];
	const circleScheds = [
		{
			dateRange: 'Tuesday 2/12',
			householdId: 2,
			house: 'Doe House (Alice, 8) (Kevin, 6)',
			timeRange: '11am - 6pm',
			availability: '🏠🚗',
			themAvailability: '🏠🚗👥🌟',
			contacts: [
				{
					name: 'John Doe',
					phone: '+15107120505'
				},
				{
					name: 'John Doe',
					phone: '+15107120505'
				}
			]
		},
		{
			dateRange: 'Tuesday 2/12',
			householdId: 2,
			house: 'Smith House (Alice, 8) (Kevin, 6)',
			timeRange: '11am - 6pm',
			availability: '🏠🚗',
			themAvailability: '🏠🚗👥🌟',
			contacts: [
				{
					name: 'John Doe',
					phone: '+15107120505'
				},
				{
					name: 'John Doe',
					phone: '+15107120505'
				}
			]
		}
	];
</script>

<div class="container">
	<h1>Dashboard</h1>
	<div style="margin-bottom: 2rem;">
		<p class="subtitle">Notices<span>2</span></p>
		<div class="notice">
			<p>Empty Schedule</p>
			<p>Please mark your tentative availability.</p>
		</div>

		<div class="notice">
			<p>Find your friends</p>
			<p>Be sure to invite your friends to set up play dates!</p>
		</div>
	</div>

	<!-- planning on condensing range of contiguous days and hours overlapping into one summary -->
	<p class="subtitle">Overlaps</p>
	{#each overlaps as overlap}
		<p class="bold larger">{overlap.dateRange}</p>
		<div class="summary">
			<a class="bold household" href="/household/{overlap.householdId}">{overlap.house}</a>
			<p class="bold">{overlap.timeRange}</p>
			<div class="tooltip-container">
				<div class="tooltip">
					<p>
						You: {overlap.userAvailability}
						<span class="tooltiptext">
							<Legend />
						</span>
					</p>
				</div>
				|
				<div class="tooltip">
					<p>
						Them: {overlap.themAvailability}
						<span class="tooltiptext">
							<Legend />
						</span>
					</p>
				</div>
			</div>
			<p>Contacts to set up a play date:</p>
			<ul>
				{#each overlap.contacts as contact}
					<li>{contact.name} - <a href="tel:{contact.phone}">{contact.phone}</a></li>
				{/each}
			</ul>
		</div>
	{/each}

	<p class="subtitle">Your Schedule</p>
	{#each userSched as sched}
		<div class="summary">
			<p class="bold">{sched.dateRange}</p>
			{#if sched.availability === 'Busy'}
				<p class="bold">Busy</p>
			{:else}
				<p class="bold">{sched.timeRange}</p>
				<div class="tooltip">
					<p>
						{sched.availability}
						<span class="tooltiptext">
							<Legend />
						</span>
					</p>
				</div>
			{/if}
		</div>
	{/each}

	<p class="subtitle">Your Circle's Schedules</p>
	{#each circleScheds as sched}
		<p class="bold larger">{sched.dateRange}</p>
		<div class="summary">
			<a class="bold household" href="/household/{sched.householdId}">{sched.house}</a>
			<p class="bold">{sched.timeRange}</p>
			<div class="tooltip">
				<p>
					{sched.availability}
					<span class="tooltiptext">
						<Legend />
					</span>
				</p>
			</div>
			<p>Contacts to set up a play date:</p>
			<ul>
				{#each sched.contacts as contact}
					<li>{contact.name} - <a href="tel:{contact.phone}">{contact.phone}</a></li>
				{/each}
			</ul>
		</div>
	{/each}
</div>

<style>
	.household {
		color: black;
		font-size: large;
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
