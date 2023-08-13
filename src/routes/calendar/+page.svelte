<script lang="ts">
	import { DAYS, PRONOUNS, EMOTICONS_REVERSE, type Row } from '$lib/constants';
	import { generateDiffSchedule, generateFullSchedule } from '$lib/format';
	import Legend from '../Legend.svelte';
	import Button from '../Button.svelte';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import NavBar from '../NavBar.svelte';
	import { writeReq } from '../../utils';

	let { availabilityDates, user, kidNames, AvailabilityStatus, circleInfo } = $page.data;

	let rows: Row[] = [];
	let ogRows: Row[] = [];
	let schedFull: string[] = [];

	const EMOTICONS = {
		'🏠': 'house',
		'🚗': 'car',
		'👤': 'person',
		'👥': 'people',
		'🏫': 'school',
		'⭐️': 'star1',
		'🌟': 'star2',
		'🙏': 'star3'
	};

	const now = new Date();
	onMount(() => {
		rows = [...Array(21).keys()].map((x) => {
			const date = new Date(new Date().setDate(now.getDate() + x));
			const englishDay = DAYS[date.getDay()];
			const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
			let availRange; // one of 'BUSY', 'Unspecified', and some time range
			let notes;
			let startHr;
			let startMin;
			let endHr;
			let endMin;
			let emoticons = new Set<string>();
			if (availabilityDates && monthDay in availabilityDates) {
				availRange = availabilityDates[monthDay].availRange;
				if (
					availRange !== AvailabilityStatus.UNSPECIFIED &&
					availRange !== AvailabilityStatus.BUSY
				) {
					// it's gonna be formatted like h(:mm)a - h(:mm)a
					const timeSplit = availRange.split(/[( - )|:]/);
					startHr = parseInt(timeSplit[0]);
					startMin = parseInt(timeSplit[1]);
					endHr = parseInt(timeSplit[3]);
					endMin = parseInt(timeSplit[4]);
				}
				notes = availabilityDates[monthDay].notes;
				if (availabilityDates[monthDay].emoticons) {
					for (const emoji of availabilityDates[monthDay].emoticons.split(',')) {
						emoticons.add(emoji);
					}
				}
			}
			return {
				englishDay,
				monthDay,
				availRange,
				notes,
				emoticons,
				startHr,
				startMin,
				endHr,
				endMin
			};
		});
		ogRows = [...rows];
		schedFull = generateFullSchedule(rows);
	});

	let shownRows = new Set();
	let timeErrs = new Set();
	let schedDiffs: string[] = [];
	function getAvailRange(i: number, status: string) {
		if (status === AvailabilityStatus.UNSPECIFIED || status === AvailabilityStatus.BUSY) return {};
		// validator and formatter
		const regexpRange =
			/\s*(?<fromhr>[0-9]+)(:(?<frommin>[0-5][0-9]))?\s*(?<fromhalf>am|pm|AM|PM)?\s*(-|to|until|till)\s*(?<tohr>[0-9]+)(:(?<tomin>[0-5][0-9]))?\s*(?<tohalf>am|pm|AM|PM)?\s*/i;
		const t = rows[i].availRange.match(regexpRange)?.groups;
		if (!t) {
			return {};
		}
		let fromhalf = t.fromhalf?.toLowerCase();
		let tohalf = t.tohalf?.toLowerCase();
		let fromhr = parseInt(t.fromhr);
		let tohr = parseInt(t.tohr);
		let frommin = t.frommin ? parseInt(t.frommin) : 0;
		let tomin = t.tomin ? parseInt(t.tomin) : 0;

		if (!fromhr || fromhr > 12 || !tohr || tohr > 12 || frommin >= 60 || tomin >= 60) {
			return {};
		}

		/**
		When neither start nor stop time specifies am/pm:
			We’ll assume that kids generally do afternoons together, and that start times will be before 7pm. 
			If the start value is < 7, assume pm. If start value >= 7, assume am.
		When only start time specifies am/pm, and stop value > start value, copy start time (am/pm), otherwise use opposite (am/pm)
		When only stop time specifies am/pm, and start value < stop value, copy stop time (am/pm), otherwise use opposite
		*/
		if (!fromhalf && !tohalf) {
			if (fromhr < 7) {
				fromhalf = 'pm';
			} else {
				fromhalf = 'am';
			}
			tohalf = 'pm';
		} else if (fromhalf && !tohalf) {
			if (tohr * 100 + tomin > fromhr * 100 + frommin) tohalf = fromhalf;
			else tohalf = fromhalf === 'am' ? 'pm' : 'am';
		} else if (!fromhalf && tohalf) {
			if (tohr * 100 + tomin > fromhr * 100 + frommin) fromhalf = tohalf;
			else fromhalf = tohalf === 'am' ? 'pm' : 'am';
		}
		return {
			startHr: fromhalf === 'pm' ? fromhr + 12 : fromhr,
			startMin: frommin,
			endHr: tohalf === 'pm' ? tohr + 12 : tohr,
			endMin: tomin
		};
		// return `${fromhr}${frommin ? `:${frommin < 10 ? `0${frommin}` : frommin}` : ''}${fromhalf}-${tohr}${tomin ? `:${tomin < 10 ? `0${tomin}` : tomin}` : ''}${tohalf}`;
	}
	async function markAs(i: number, status: string) {
		const availRange = getAvailRange(i, status);
		const { startHr, startMin, endHr, endMin } = availRange;
		if (status === AvailabilityStatus.UNSPECIFIED || status === AvailabilityStatus.BUSY) {
			rows[i].notes = '';
			rows[i].emoticons = new Set();
		} else if (status === AvailabilityStatus.AVAILABLE) {
			if (Object.keys(availRange).length === 0) {
				timeErrs.add(i);
				timeErrs = new Set(timeErrs);
				return;
			}
			// check whether the end time is greater than the start time
			const tempStart = new Date();
			const tempEnd = new Date(tempStart);
			tempStart.setHours(startHr ?? 0);
			tempStart.setMinutes(startMin ?? 0);
			tempEnd.setHours(endHr ?? 0);
			tempEnd.setMinutes(endMin ?? 0);

			if (tempEnd.getTime() - tempStart.getTime() <= 0) {
				alert('Please ensure that the difference in time is positive.');
				return;
			}
		}
		const response = await writeReq('/db', {
			type: 'schedule',
			monthDay: rows[i].monthDay,
			status,
			notes: rows[i].notes,
			emoticons: Array.from(rows[i].emoticons).join(','),
			startHr,
			startMin,
			endHr,
			endMin
		});
		if (response.status == 200) {
			await invalidate('data:calendar');
			availabilityDates = $page.data.availabilityDates;
			rows.forEach((x, i) => {
				const { monthDay } = x;
				let availRange; // one of 'BUSY', 'Unspecified', and some time range
				if (availabilityDates && monthDay in availabilityDates) {
					availRange = availabilityDates[monthDay].availRange;
				}
				rows[i] = {
					...rows[i],
					availRange
				};
			});
			schedDiffs = generateDiffSchedule(ogRows, rows);
			schedFull = generateFullSchedule(rows);
			return 'ok';
		} else {
			alert('Something went wrong with saving');
			return 'err';
		}
	}

	function toggleEmoticon(i: number, emoticon: string) {
		if (rows[i].emoticons.has(emoticon)) {
			rows[i].emoticons.delete(emoticon);
		} else {
			rows[i].emoticons.add(emoticon);
		}
		rows[i].emoticons = new Set(rows[i].emoticons);
	}

	let notified = new Set();
	type Parent = {
		phone: string;
		phonePermissions: { allowReminders: boolean };
	};
	async function notify(p: Parent) {
		const { phone, phonePermissions } = p;
		const { allowReminders } = phonePermissions;
		if (allowReminders) {
			await writeReq('/twilio', {
				phone,
				type: 'circleNotif',
				sched: diff ? schedDiffs.join('\n') : schedFull.join('\n')
			});
			notified.add(phone);
			notified = new Set(notified);
			setTimeout(() => {
				notified.delete(phone);
				notified = new Set(notified);
			}, 4000);
		}
	}
	function notifyAll() {
		circleInfo.forEach((c: { parents: Parent[] }) => {
			c.parents.forEach((p: Parent) => notify(p));
		});
	}

	async function sanitizeNotes(i: number) {
		const v = rows[i].notes;
		if (!v) return; // empty notes are totally valid
		const res = await fetch(`/sanitize?which=dateNotes&notes=${encodeURIComponent(v)}`);
		const { notes, message } = await res.json();
		if (res.status !== 200) {
			console.error(message);
			throw new Error(message); // don't continue on to saving
		} else {
			rows[i].notes = notes;
		}
	}

	let diff = false;
</script>

<div>
	<NavBar pageName="Calendar" />
	<div style="text-align: center; margin: 2rem 0;">
		<table id="schedule">
			{#each rows as row, i}
				<tr style="background-color: {i % 2 ? '#f2f2f2' : 'white'};">
					<td
						class:blue={shownRows.has(i)}
						class="day"
						on:click={() => {
							shownRows.add(i);
							shownRows = new Set(shownRows);
						}}
						on:keyup={() => {
							shownRows.add(i);
							shownRows = new Set(shownRows);
						}}
					>
						{row.englishDay}
					</td>
					<td
						class:blue={shownRows.has(i)}
						class="date"
						on:click={() => {
							shownRows.add(i);
							shownRows = new Set(shownRows);
						}}
						on:keyup={() => {
							shownRows.add(i);
							shownRows = new Set(shownRows);
						}}
					>
						{row.monthDay}
					</td>
					<td
						colspan="2"
						class="time"
						on:click={() => {
							shownRows.add(i);
							shownRows = new Set(shownRows);
						}}
						on:keyup={() => {
							shownRows.add(i);
							shownRows = new Set(shownRows);
						}}
					>
						{#if !row.availRange}
							<p>Unspecified (<span class="edit">edit</span>)</p>
						{:else if row.availRange === 'Busy'}
							<p>Busy (<span class="edit">edit</span>)</p>
						{:else}
							<p class="timeDisplay">{row.availRange}</p>
							{#if row.emoticons}
								<p class="emoticonsDisplay">
									{#each Array.from(row.emoticons) as emojiStr}
										{EMOTICONS_REVERSE[emojiStr]}
									{/each}
								</p>
							{/if}
							{#if row.notes}
								<p class="notesDisplay">{row.notes}</p>
							{/if}
							<p class="changeTime">(edit)</p>
						{/if}
					</td>
					{#if !row.availRange}
						<td
							on:click={() => markAs(i, AvailabilityStatus.BUSY)}
							on:keyup={() => markAs(i, AvailabilityStatus.BUSY)}
							class="busy"
						>
							Busy
						</td>
					{:else if row.availRange === 'Busy'}
						<td
							class="clear"
							on:click={() => markAs(i, AvailabilityStatus.UNSPECIFIED)}
							on:keyup={() => markAs(i, AvailabilityStatus.UNSPECIFIED)}
						>
							Clear
						</td>
					{:else}
						<td
							class="clear"
							on:click={() => markAs(i, AvailabilityStatus.UNSPECIFIED)}
							on:keyup={() => markAs(i, AvailabilityStatus.UNSPECIFIED)}
						>
							Clear
						</td>
					{/if}
				</tr>
				{#if shownRows.has(i)}
					<tr style="background: #A0E3FF">
						<td colspan="5" style="padding: 0.9rem 0.4rem;" class="editorCell">
							<form on:submit|preventDefault={() => {}}>
								<div class="v-center-h-space flex-col" style="gap: 0.1rem;">
									<!-- prettier-ignore -->
									<input type="text"
										class="text-inherit"
										placeholder='Enter a valid time range. Ex. "2:30pm-7 or 5-6"'
										bind:value={row.availRange}
										on:keydown={() => {
											timeErrs.delete(i);
											timeErrs = new Set(timeErrs);
										}}
									/>
									{#if timeErrs.has(i)}
										<p class="red">Enter a valid time range. Ex. "2:30pm-7 or 5-6"</p>
									{/if}
								</div>
								<div class="v-center-h-space">
									{#key row.emoticons}
										{#each Object.entries(EMOTICONS) as [emoji, english]}
											<div
												class="emoji {row.emoticons.has(english) ? 'chosen' : ''}"
												on:click={() => toggleEmoticon(i, english)}
												on:keyup={() => toggleEmoticon(i, english)}
											>
												{emoji}
											</div>
										{/each}
									{/key}
									<div class="tooltip">
										<p>
											Legend
											<span class="tooltiptext">
												<Legend />
											</span>
										</p>
									</div>
								</div>
								<div class="v-center-h-space">
									<textarea
										bind:value={row.notes}
										class="text-inherit"
										name="notes"
										placeholder="(add notes)"
									/>
								</div>
								<div class="editor-btns">
									<Button
										onClick={async () => {
											await sanitizeNotes(i);
											const res = await markAs(i, AvailabilityStatus.AVAILABLE);
											if (res === 'ok') {
												shownRows.delete(i);
												shownRows = new Set(shownRows);
											}
										}}
										disabled={timeErrs.has(i)}
										content={'Save'}
										bgColor={'#93FF8B'}
										padding="0.1rem 0.7rem"
										color={'black'}
										fontSize={'larger'}
									/>
									<Button
										onClick={(e) => {
											e?.preventDefault();
											shownRows.delete(i);
											shownRows = new Set(shownRows);
										}}
										content={'Cancel'}
										bgColor={'rgba(255, 233, 184, 0.78)'}
										padding="0.1rem 0.7rem"
										color={'black'}
										fontSize={'larger'}
									/>
								</div>
							</form>
						</td>
					</tr>
				{/if}
			{/each}
		</table>
		{#key schedDiffs}
			<p class="subtitle">Notify Circle</p>
			<p id="preview-notif-subtitle">Preview of your notification messsage(s)</p>
			<label class="switch">
				<input type="checkbox" bind:checked={diff} disabled={!schedDiffs.length} />
				<span class="slider round" />
				<span class="toggle-label">Full</span>
				<span class="toggle-label" style="left: 50%;">Diff</span>
			</label>
			<div id="preview-notif">
				{`${user.firstName}${user.lastName && user.lastName.length ? ` ${user.lastName}` : ''}`} (parent
				of {kidNames}) has updated {PRONOUNS[user.pronouns].split(',')[1]} tentative schedule:
				<br />
				Legend: 🏠(host) 🚗(visit) 👤(dropoff) 👥(together) 🏫(at school) ⭐(good) 🌟(great) 🙏(needed)
				<br /><br />

				{#if diff}
					{#each schedDiffs as diff}
						<p>{diff}</p>
					{/each}
				{:else}
					{#each schedFull as day}
						<p>{day}</p>
					{/each}
				{/if}
			</div>

			<button class="notif-btn" style="margin: 1rem;" on:click={notifyAll}>Notify All</button>
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
									<button class="notif-btn" on:click={() => notify(p)}
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
	</div>
</div>

<style>
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
	input:not(:checked) ~ .toggle-label:last-child {
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
	.red {
		color: #bd0000;
	}
	.text-inherit {
		font-size: inherit;
	}
	table {
		border-collapse: collapse;
		border: 1px solid #dddddd;
	}
	#schedule {
		width: 100%;
	}
	#schedule td {
		padding: 0.4rem 0rem;
		text-align: center;
		border-right: 1px solid #dddddd;
	}
	#schedule td.day,
	#schedule td.date {
		text-align: left;
		padding-left: 0.3rem;
		padding-right: 0.3rem;
		white-space: nowrap;
	}
	#schedule td.time {
		width: 99%; /* All excess space goes here */
		cursor: pointer;
	}
	#schedule td.time .emoticonsDisplay,
	#schedule td.time .timeDisplay {
		display: inline; /* No line breaks between time and emoticons */
	}
	#schedule td.time .emoticonsDisplay {
		padding-left: 0.5em;
	}
	#schedule .changeTime {
		display: block;
		text-decoration: underline;
		font-weight: 600;
		cursor: pointer;
	}
	#schedule td.busy,
	#schedule td.clear {
		text-decoration: underline;
		font-weight: 600;
		white-space: nowrap;
		padding: 0.3rem;
		cursor: pointer;
	}

	#schedule .edit,
	#schedule .changeTime {
		text-decoration: underline;
		font-weight: 600;
		cursor: pointer;
	}

	#schedule td.editorCell {
		width: 100%;
	}
	.editor-btns {
		gap: 0.5rem;
		display: flex;
		justify-content: center;
		margin: 1rem auto 0;
	}
	.blue {
		background: #a0e3ff;
	}
	.notif-btn {
		padding: 0.2rem 1rem;
		border-radius: 17px;
		background: white;
		border: 1px solid #5a5a5a;
	}
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
	.emoji.chosen {
		border: 1px solid black;
	}
	textarea {
		margin: 0;
		resize: none;
	}
	.v-center-h-space {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.flex-col {
		flex-direction: column;
	}
	.tooltip {
		width: fit-content;
	}

	.emoji {
		background: white;
		font-size: x-large;
		margin: 0.5rem 0;
		padding-left: 0.2rem;
		padding-right: 0.2rem;
		border-radius: 3px;
		border: 1px solid #d9d9d9;
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
	.tooltiptext {
		left: 0;
	}
</style>
