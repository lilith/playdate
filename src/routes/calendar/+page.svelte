<script lang="ts">
    import { DAYS } from '../../constants';
    import Legend from '../Legend.svelte';
    import Button from '../Button.svelte';
    import { invalidate } from '$app/navigation';
    import { afterUpdate, onMount } from 'svelte';
    import { page } from '$app/stores';

    let { availabilityDates, user } = $page.data;

    let rows: any[] = [];
    const EMOTICONS = ['🏠','🚗','👤','👥','🏫','⭐️','🌟','🙏'];
    onMount(() => {
        rows = [...Array(21).keys()].map((x) => {
            const date = new Date(new Date().setDate(now.getDate() + x));
            const englishDay = DAYS[date.getDay()];
            const monthDay = `${date.getMonth()}/${date.getDate()}`;
            let availRange = 'Unspecified'; // one of 'BUSY', 'Unspecified', and some time range
            let notes;
            let emoticons = new Set();

            if (availabilityDates && monthDay in availabilityDates) {
                availRange = availabilityDates[monthDay].availRange;
                notes = availabilityDates[monthDay].notes;
                if (availabilityDates[monthDay].emoticons)
                    availabilityDates[monthDay].emoticons.forEach((x: string) => emoticons.add(x))
            }
            return {
                englishDay,
                monthDay,
                availRange,
                notes,
                emoticons,
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
    const now = new Date();

    let startHr = now.getHours();
    let startMin = now.getMinutes();
    let endHr = now.getHours();
    let endMin = now.getMinutes();
    
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
        // startHr?: number,
        // startMin?: number,
        // endHr?: number,
        // endMin?: number,
    ) {
        console.log(rows[i], status)
        const response = await fetch('/db', {
			method: 'POST',
			body: JSON.stringify({
				type: 'schedule',
				monthDay: rows[i].monthDay,
                status,
                notes: rows[i].notes,
                emoticons: rows[i].emoticons,
                householdId: user.householdId,
                startHr,
                startMin,
                endHr,
                endMin,
			})
		});
		if (response.status == 200) {
            await invalidate('data:calendar');
		} else {
			alert('Something went wrong with saving');
		}
    }

    function toggleEmoticon(i: number, emoticon: string) {
        console.log(i, emoticon)
        if (rows[i].emoticons.has(emoticon)) {
            rows[i].emoticons.delete(emoticon);
        } else {
            rows[i].emoticons.add(emoticon);
        }
        rows[i].emoticons = new Set(rows[i].emoticons);
        console.log(rows[i].emoticons)
    }
</script>
<div style="text-align: center;">
    <h1>Calendar</h1>
    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
        <table class="legend">
            <tr>
                <th colspan="2">Circumstances</th>
            </tr>
            <tr>
                <td>🏠</td>
                <td>Can Host</td>
            </tr>
            <tr>
                <td>🚗</td>
                <td>Can Visit</td>
            </tr>
            <tr>
                <td>👤</td>
                <td>Just Kids</td>
            </tr>
            <tr>
                <td>👥</td>
                <td>Chaperones</td>
            </tr>
            <tr>
                <td>🏫</td>
                <td>At School</td>
            </tr>
        </table>
        <table class="legend">
            <tr>
                <th colspan="2">Likelihood of Availability</th>
            </tr>
            <tr>
                <td>⭐️</td>
                <td>Good</td>
            </tr>
            <tr>
                <td>🌟</td>
                <td>Great</td>
            </tr>
            <tr>
                <td>🙏</td>
                <td>Please help</td>
            </tr>
        </table>
    </div>
    <p class="subtitle-2">Legends</p>

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
                on:click={() => markAs(i, 'BUSY')}
                on:keyup={() => markAs(i, 'BUSY')}
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
            {:else if row.availRange === 'BUSY'}
            <td colspan="2">Clear</td>
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
                on:click={() => markAs(i, 'BUSY')}
                on:keyup={() => markAs(i, 'BUSY')}
            >
                Clear
            </td>
            {/if}
        </tr>
        {#if shownRows.has(i)}
        <tr style="background: #A0E3FF">
            <td colspan="5" style="padding: 0.4rem;">
                <div style="margin-bottom: 0.5rem; font-size: large; font-weight: 600;">
                    {row.englishDay} {row.monthDay} 
                </div>
                <form on:submit={(e) => markAs(i, 'AVAILABLE')}>
                    <div class="v-center-h-space">
                        <label class="thin-label" for="start-hr">Start</label>
                        <div>
                            <select name="start-hr" bind:value={startHr}>
                                {#each [...Array(31).keys()] as hr}
                                    <option value={hr}>{hr}</option>
                                {/each}
                            </select>:
                            <select name="start-min" bind:value={startMin}>
                                {#each [...Array(60).keys()] as min}
                                    <option value={min}>{min < 10 ? `0${min}` : min}</option>
                                {/each}
                            </select>
                        </div>
                        <label class="thin-label" for="end-hr">End</label>
                        <div>
                            <select name="end-hr" bind:value={endHr}>
                                {#each [...Array(31).keys()] as hr}
                                    <option value={hr}>{hr}</option>
                                {/each}
                            </select>:
                            <select name="end-min" bind:value={endMin}>
                                {#each [...Array(60).keys()] as min}
                                    <option value={min}>{min < 10 ? `0${min}` : min}</option>
                                {/each}
                            </select>
                        </div>
                    </div>
                    <div class="v-center-h-space">
                        <!-- {#each Object.entries(emoticons) as [emoticon, chosen]}
                            <div
                                class="emoji {chosen ? 'chosen' : ''}"
                                on:click={() => emoticons[emoticon] = !chosen}
                                on:keyup={() => emoticons[emoticon] = !chosen}
                            >
                                {emoticon}
                            </div>
                        {/each} -->
                        {#key row.emoticons}
                        {#each EMOTICONS as emoticon}
                            <div
                                class="emoji {row.emoticons.has(emoticon) ? 'chosen' : ''}"
                                on:click={() => toggleEmoticon(i, emoticon)}
                                on:keyup={() => toggleEmoticon(i, emoticon)}
                            >
                                {emoticon}
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
    .legend {
        font-size: larger;
        width: fit-content;
    }
    .legend tr:nth-child(odd){background-color: #f2f2f2;}
    .legend td {
        padding: 0.4rem 0.9rem;
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

    .subtitle-2 {
        margin-top: 1rem;
        margin-bottom: 0.5rem;
        font-size: larger;
        font-weight: 500;
    }

    th {
        height: 4rem;
        border-bottom: 1px solid #dddddd;
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
