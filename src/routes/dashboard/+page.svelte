<script>
	import Legend from './Legend.svelte';
</script>

<div>
	<h1>Dashboard</h1>
	<div class="container">
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
	<p class="bold larger">Tuesday 2/12</p>
	<div class="summary">
		<p class="bold household">Doe House (Alice, 8) (Kevin, 6)</p>
		<p class="bold">11am - 6pm</p>
		<div class="tooltip-container">
			<div class="tooltip">
				<p>
					You: 🏠🚗
					<span class="tooltiptext">
						<Legend />
					</span>
				</p>
			</div>
			|
			<div class="tooltip">
				<p>
					Them: 🏠🚗👥🌟
					<span class="tooltiptext">
						<Legend />
					</span>
				</p>
			</div>
		</div>
		<p>Contacts to set up a play date:</p>
		<ul>
			<li>John Doe - <a href="tel:+15107120505">(123) 244-5677</a></li>
			<li>John Doe - <a href="tel:+15107120505">(123) 244-5677</a></li>
		</ul>
	</div>

	<p class="subtitle">Your Schedule</p>
	<!-- TODO: put a foreach here -->
	<div class="summary">
		<p class="bold">Tuesday 2/12</p>
		<p class="bold">11am - 6pm</p>
		<div class="tooltip">
			<p>
				🏠🚗
				<span class="tooltiptext">
					<Legend />
				</span>
			</p>
		</div>
	</div>
	<div class="summary">
		<p class="bold">Wednesday 2/13 - Sunday 2/17</p>
		<p class="bold">Busy</p>
	</div>
	<div class="summary">
		<p class="bold">Monday 2/18</p>
		<p class="bold">11am - 6pm</p>
		<div class="tooltip">
			<p>
				🏠🚗
				<span class="tooltiptext">
					<Legend />
				</span>
			</p>
		</div>
	</div>

	<p class="subtitle">Your Circle's Schedules</p>
	<div class="summary">
		<p class="bold household">Doe House (Alice, 8) (Kevin, 6)</p>
		<p class="bold">Tuesday 2/12</p>
		<p class="bold">11am - 6pm</p>
		<div class="tooltip">
			<p>
				🏠🚗
				<span class="tooltiptext">
					<Legend />
				</span>
			</p>
		</div>
		<ul>
			<li>John Doe - <a href="tel:+15107120505">(123) 244-5677</a></li>
			<li>John Doe - <a href="tel:+15107120505">(123) 244-5677</a></li>
		</ul>
	</div>
	<div class="summary">
		<p class="bold household">Smith House (Alice, 8) (Kevin, 6)</p>
		<p class="bold">Tuesday 2/12</p>
		<p class="bold">11am - 6pm</p>
		<div class="tooltip">
			<p>
				🏠🚗
				<span class="tooltiptext">
					<Legend />
				</span>
			</p>
		</div>
		<ul>
			<li>John Doe - <a href="tel:+15107120505">(123) 244-5677</a></li>
			<li>John Doe - <a href="tel:+15107120505">(123) 244-5677</a></li>
		</ul>
	</div>
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

	a {
		color: black;
	}

	li {
		list-style: inside;
	}

	.subtitle {
		margin-bottom: 1rem;
	}

	.container {
		margin-bottom: 2rem;
		background: #f7f9fa;
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

	.tooltip {
		position: relative;
		display: inline-flex;
		justify-content: center;
		width: 50%;
	}

	.tooltip p {
		border-bottom: 1px dotted black; /* If you want dots under the hoverable text */
		width: fit-content;
	}

	/* Tooltip text */
	.tooltip .tooltiptext {
		visibility: hidden;
		width: 133px;
		background-color: black;
		color: #fff;
		text-align: left;
		padding: 5px 0;
		border-radius: 6px;
		position: absolute;
		z-index: 1;
		left: 50%;
		bottom: 110%;
		transform: translateX(-50%);
		padding-left: 0.5rem;
	}

	/* Show the tooltip text when you mouse over the tooltip container */
	.tooltip:hover .tooltiptext {
		visibility: visible;
	}

	.tooltip .tooltiptext::after {
		content: ' ';
		position: absolute;
		top: 100%; /* At the bottom of the tooltip */
		left: 50%;
		margin-left: -5px;
		border-width: 5px;
		border-style: solid;
		border-color: black transparent transparent transparent;
	}
</style>
