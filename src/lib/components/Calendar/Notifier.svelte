<script lang="ts">
	import { onMount } from 'svelte';
	import { generateDiffSchedule, generateFullSchedule } from '$lib/logics/_shared/format';
	import type { Row, UserWithPermissions } from '$lib/logics/_shared/types';
	import type { CircleInfo } from '$lib/logics/Calendar/_shared/types';
	import { getObjectivePronoun } from '$lib/logics/_shared/parse';
	import { notify, notifyAll } from '$lib/logics/Calendar/Notifier/logic';

	export let rowsOnMount: Row[]; // needed for generating schedule diff and determining that rows saved in db have changed
	export let dbRows: Row[];
	export let circleInfo: CircleInfo;
	export let user: UserWithPermissions;
	export let kidNames: string;

	let showFullSched = true;
	let schedFull: string[] = [];
	let schedDiffs: string[] = [];
	let notified = new Set<string>();

	onMount(() => {
		schedFull = generateFullSchedule(dbRows);
	});

	$: {
		if (!rowsOnMount || !dbRows) break $
		schedDiffs = generateDiffSchedule(rowsOnMount, dbRows);
		schedFull = generateFullSchedule(dbRows);
	}
</script>

{#key schedDiffs}
	<p class="subtitle">Notify Circle</p>
	<p id="preview-notif-subtitle">Preview of your notification message(s)</p>
	<label class="switch">
		<input
			type="checkbox"
			checked={!showFullSched}
			on:click={() => (showFullSched = !showFullSched)}
			disabled={!schedDiffs.length}
		/>
		<span class="slider round" />
		<span class="toggle-label">Full</span>
		<span class="toggle-label" style="left: 50%;">Diff</span>
	</label>
	<div id="preview-notif">
		{`${user.firstName}${user.lastName && user.lastName.length ? ` ${user.lastName}` : ''}`} (parent
		of {kidNames}) has {showFullSched ? 'updated' : 'changed the following days on'}
		{getObjectivePronoun(user.pronouns)} tentative schedule:
		<br />
		Legend: 🏠(host) 🚗(visit) 👤(dropoff) 👥(together) 🏫(via school) ⭐(good) 🌟(great) 🙏(needed)
		<br /><br />

		{#each showFullSched ? schedFull : schedDiffs as day}
			<p>{day}</p>
		{/each}
	</div>

	<button
		class="notif-btn"
		style="margin: 1rem;"
		on:click={() =>
			notifyAll({
				circleInfo,
				schedDiffs,
				schedFull,
				showFullSched,
				notified
			})}>Notify All</button
	>
	<table id="notif-table">
		{#each circleInfo as c}
			{#each c.parents as p}
				<tr>
					<td>
						{c.name}
					</td>
					<td>
						{#if notified.has(p.phone)}
							<p>Notified!</p>
						{:else}
							<button
								class="notif-btn"
								on:click={() =>
									notify({
										parent: p,
										schedDiffs,
										schedFull,
										showFullSched,
										notified
									})}
								>Notify <span class:strike={!p.phonePermissions.allowReminders}
									>{p.firstName} {p.lastName ?? ''}</span
								></button
							>
						{/if}
					</td>
				</tr>
			{/each}
		{/each}
	</table>
{/key}

<style>
	#preview-notif-subtitle {
		font-size: large;
		text-align: left;
	}
	
	#preview-notif {
		box-shadow: 0px 0px 4px 0px #00000096;
		text-align: left;
		padding: 0.7rem 0.5rem;
		border-radius: 6px;
		background: white;
	}

	.toggle-label {
		position: absolute;
		top: 50%;
		transform: translateY(-50%);
		left: 0px;
		font-size: 18px;
		color: #333;
		width: 50%;
		text-align: center;
	}
	/* The switch - the box around the slider */
	.switch {
		position: relative;
		display: inline-block;
		width: 50%;
		height: 34px;
		margin: 0.5rem 0 0.9rem;
	}

	/* Hide default HTML checkbox */
	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	/* The slider */
	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #73a4eb;
		-webkit-transition: 0.4s;
		transition: 0.4s;
	}

	input:disabled + .slider {
		background-color: #d9d9d9;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 30px;
		width: 50%;
		left: 2px;
		bottom: 2px;
		background-color: white;
		-webkit-transition: 0.4s;
		transition: 0.4s;
	}

	input:checked + .slider + .toggle-label {
		color: white;
	}
	input:not(:checked):not(:disabled) ~ .toggle-label:last-child {
		color: white;
	}

	input:focus + .slider {
		box-shadow: 0 0 1px #73a4eb;
	}

	input:checked + .slider:before {
		-webkit-transform: translateX(calc(100% - 4px));
		-ms-transform: translateX(calc(100% - 4px));
		transform: translateX(calc(100% - 4px));
	}

	/* Rounded sliders */
	.slider.round {
		border-radius: 34px;
	}

	.slider.round:before {
		border-radius: 34px;
	}
	.strike {
		text-decoration: line-through;
	}

	#notif-table {
		width: 100%;
	}
	#notif-table tr {
		margin: 0.5rem;
	}
	#notif-table td {
		padding: 0.4rem 0;
		height: 46px;
		width: 50%;
	}
	.notif-btn {
		padding: 0.2rem 1rem;
		border-radius: 17px;
		background: white;
		border: 1px solid #5a5a5a;
	}
</style>
