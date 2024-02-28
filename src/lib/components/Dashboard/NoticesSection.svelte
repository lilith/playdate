<script lang="ts">
	import { goto } from "$app/navigation";
	import type { CircleMember } from "$lib/logics/Dashboard/_shared/types";
	import type { ScheduleItem } from "$lib/logics/_shared/format";
	import './styles.css';

  export let userRows: ScheduleItem[];
  export let circle: CircleMember[];

  const emptySchedule = userRows.length === 0;
	const noFriends = circle.length === 0;
	const numNotices = [emptySchedule, noFriends].reduce(
		(accumulator, currentValue) => accumulator + (currentValue ? 1 : 0),
		0
	);
</script>

<div style="margin-bottom: 2rem;">
  <p class="subtitle">Notices<span>{numNotices}</span></p>
  {#if emptySchedule}
    <div role="button" tabindex="0" class="notice" on:click={() => goto('/calendar')} on:keyup={() => goto('/calendar')}>
      <p>Empty Schedule</p>
      <p>Please mark your tentative availability.</p>
      <p>Click <span class="link">here</span> to go to your schedule editor.</p>
    </div>
  {/if}

  {#if noFriends}
    <div role="button" tabindex="0" class="notice" on:click={() => goto('/circle')} on:keyup={() => goto('/circle')}>
      <p>Find your friends</p>
      <p>Be sure to invite your friends to set up play dates!</p>
      <p>Click <span class="link">here</span> to go to your Circle page.</p>
    </div>
  {/if}

  {#if !numNotices}
    <p class="default">No notices at this time</p>
  {/if}
</div>

<style>
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
  
  .notice {
		border: 1px solid #a6b6de;
		box-shadow: 0px 4px 4px 1px #d9d9d9;
		border-radius: 18px;
		padding: 1rem;
		color: #5a5a5a;
		background: white;
		margin-bottom: 1rem;
	}

  .notice p:first-of-type {
		font-weight: bold;
		padding-bottom: 0.8rem;
		font-size: large;
	}
</style>