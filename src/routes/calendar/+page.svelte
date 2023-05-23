<script lang="ts">
    import { DAYS } from '../../constants';
    import Legend from '../Legend.svelte';
    import Button from '../Button.svelte';
    import { invalidate } from '$app/navigation';
    import { afterUpdate, onMount } from 'svelte';
    import { page } from '$app/stores';
	import { AvailabilityStatus } from '@prisma/client';

    let { availabilityDates, user } = $page.data;

    let rows: {
        englishDay: string,
        monthDay: string,
        availRange: any,
        notes: string | undefined,
        emoticons: Set<string>,
        startHr: number | undefined,
        startMin: number | undefined,
        endHr: number | undefined,
        endMin: number | undefined,
    }[] = [];
    function oneStr(emoji: string) {
        return [...emoji].join("");
    }
    // const EMOTICONS_ENGLISH = [
    //     'house',
    //     'car',
    //     'person',
    //     'people',
    //     'school',
    //     'star1',
    //     'star2',
    //     'star3',
    // ];
    // const EMOTICONS = [
    //     '🏠',
    //     '🚗',
    //     '👤',
    //     '👥',
    //     '🏫',
    //     '⭐️',
    //     '🌟',
    //     '🙏'
    // ];
    const EMOTICONS = {
        '🏠': 'houes',
        '🚗': 'car',
        '👤': 'person',
        '👥': 'people',
        '🏫': 'school',
        '⭐️': 'star1',
        '🌟': 'star2',
        '🙏': 'star3',
    };

    const now = new Date();
    onMount(() => {
        rows = [...Array(21).keys()].map((x, i) => {
            const date = new Date(new Date().setDate(now.getDate() + x));
            const englishDay = DAYS[date.getDay()];
            const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
            let availRange = 'Unspecified'; // one of 'BUSY', 'Unspecified', and some time range
            let notes;
            let startHr;
            let startMin;
            let endHr;
            let endMin;
            let emoticons = new Set<string>();
            if (availabilityDates && monthDay in availabilityDates) {
                availRange = availabilityDates[monthDay].availRange;
                if (availRange !== AvailabilityStatus.UNSPECIFIED && availRange !== AvailabilityStatus.BUSY) {
                    // it's gonna be formatted like H:MM - H:MM
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
                endMin,
            };
        });
    });
    afterUpdate(() => {
		availabilityDates = $page.data.availabilityDates;
        rows.forEach((x, i) => {
            const { monthDay } = x;
            let availRange = 'Unspecified'; // one of 'BUSY', 'Unspecified', and some time range

            if (availabilityDates && monthDay in availabilityDates) {
                availRange = availabilityDates[monthDay].availRange;
            }
            rows[i] = {
                ...rows[i],
                availRange,
            };
        });
	});
    
    // const emoticons: { [key: string]: boolean } = {
    //     '🏠': false,
    //     '🚗': false,
    //     '👤': false,
    //     '👥': false,
    //     '🏫': false,
    //     '⭐️': false,
    //     '🌟': false,
    //     '🙏': false,
    // };

    let shownRows = new Set();

    async function markAs(
        i: number,
        status: string,
    ) {
        if (status === AvailabilityStatus.UNSPECIFIED) {
            rows[i].notes = '';
            rows[i].emoticons = new Set();
            rows[i].startHr = undefined;
            rows[i].startMin = undefined;
            rows[i].endHr = undefined;
            rows[i].endMin = undefined;
        }
        const response = await fetch('/db', {
			method: 'POST',
			body: JSON.stringify({
				type: 'schedule',
				monthDay: rows[i].monthDay,
                status,
                notes: rows[i].notes,
                emoticons: Array.from(rows[i].emoticons).join(','),
                householdId: user.householdId,
                startHr: rows[i].startHr,
                startMin: rows[i].startMin,
                endHr: rows[i].endHr,
                endMin: rows[i].endMin,
			})
		});
		if (response.status == 200) {
            await invalidate('data:calendar');
		} else {
			alert('Something went wrong with saving');
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
</script>
<div style="text-align: center;">
    <h1>Calendar</h1>

    <table id="schedule">
    {#each rows as row, i}
        <tr style="background-color: {i % 2 ? '#f2f2f2' : 'white'};">
            <td>
                {row.englishDay}
            </td>
            <td>
                {row.monthDay}
            </td>
            <td>
                {row.availRange}
            </td>
            {#if row.availRange === 'Unspecified'}
            <td
                on:click={() => markAs(i, AvailabilityStatus.BUSY)}
                on:keyup={() => markAs(i, AvailabilityStatus.BUSY)}
                class="busy"
            >
                Mark Busy
            </td>
            <td
                class="edit"
                on:click={() => { shownRows.add(i); shownRows = new Set(shownRows); }}
                on:keyup={() => { shownRows.add(i); shownRows = new Set(shownRows); }}
            >
                Edit
            </td>
            {:else if row.availRange === 'Busy'}
            <td
                colspan="2"
                class="clear"
                on:click={() => markAs(i, AvailabilityStatus.UNSPECIFIED)}
                on:keyup={() => markAs(i, AvailabilityStatus.UNSPECIFIED)}
            >
                Clear
            </td>
            {:else}
            <td
                class="edit"
                on:click={() => { shownRows.add(i); shownRows = new Set(shownRows); }}
                on:keyup={() => { shownRows.add(i); shownRows = new Set(shownRows); }}
            >
                Edit
            </td>
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
            <td colspan="5" style="padding: 0.4rem;">
                <div style="position: relative; margin: 0.8rem 1rem;">
                    <div style="margin-bottom: 0.5rem; font-size: large; font-weight: 600;">
                        {row.englishDay} {row.monthDay} 
                    </div>
                    <div
                        class="close-btn"
                        on:click={() => { shownRows.delete(i); shownRows = new Set(shownRows); }}
                        on:keyup={() => { shownRows.delete(i); shownRows = new Set(shownRows); }}
                    >
                        X
                    </div>
                </div>
                <form on:submit|preventDefault={() => markAs(i, AvailabilityStatus.AVAILABLE)}>
                    <div class="v-center-h-space">
                        <label class="thin-label" for="start-hr">Start</label>
                        <div>
                            <select name="start-hr" bind:value={row.startHr}>
                                {#each [...Array(24).keys()] as hr}
                                    <option value={hr}>{hr}</option>
                                {/each}
                            </select>:
                            <select name="start-min" bind:value={row.startMin}>
                                {#each [...Array(60).keys()] as min}
                                    <option value={min}>{min < 10 ? `0${min}` : min}</option>
                                {/each}
                            </select>
                        </div>
                        <label class="thin-label" for="end-hr">End</label>
                        <div>
                            <select name="end-hr" bind:value={row.endHr}>
                                {#each [...Array(24).keys()] as hr}
                                    <option value={hr}>{hr}</option>
                                {/each}
                            </select>:
                            <select name="end-min" bind:value={row.endMin}>
                                {#each [...Array(60).keys()] as min}
                                    <option value={min}>{min < 10 ? `0${min}` : min}</option>
                                {/each}
                            </select>
                        </div>
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
                    <div class="v-center-h-space" style="gap: 0.5rem;">
                        <textarea
                            bind:value={row.notes}
                            style="font-size: inherit;"
                            name="notes"
                            placeholder="(add notes)"
                        />
                        <Button
                            onClick={() => {}}
                            content={'✓'}
                            bgColor={'#73A4EB'}
                            padding="0.1rem 0.5rem"
                        />
                    </div>
                </form>
            </td>
        </tr>
        {/if}
    {/each}
    </table>
</div>
<style>
    .close-btn {
        position: absolute;
        right: 0;
        top: 0;
        font-size: large;
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
    label {
        font-size: large;
    }
    .tooltip {
        width: fit-content;
    }
    select {
        margin: 0 0.1rem 0 0;
        width: fit-content;
        height: fit-content;
        font-size: inherit;
        padding: 0.3rem 3px;
    }
    .busy, .edit, .clear {
        text-decoration: underline;
    }
    table {
        border-collapse: collapse;
        border: 1px solid #dddddd;
    }
    
    #schedule {
        width: 100%;
    }
    #schedule td {
        padding: 0.4rem 0;
        text-align: center;
    }
    td {
        border-right: 1px solid #dddddd;
        text-align: left;
    }
    .emoji {
        background: white;
        font-size: x-large;
        margin: 1rem 0;
        padding: 0.2rem;
        border-radius: 3px;
        border: 1px solid #d9d9d9;
    }
    .tooltiptext {
        left: 0;
    }
</style>
