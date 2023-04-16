<script lang="ts">
    import PhoneInput from '../PhoneInput.svelte';
    import { onMount } from 'svelte';

    let phoneInput: object;

	onMount(async () => {
        const input: HTMLElement | null = document.querySelector('.iti');
        if (input && input.style)
            input.style.flexGrow = '1';
	});
</script>
<svelte:head>
	<title>Household</title>
	<meta name="description" content="Playdate app" />

	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/css/intlTelInput.css"
	/>
	<script
		src="https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/intlTelInput.min.js"
	></script>
</svelte:head>
<div>
    <h1>Household</h1>

    <label class="subtitle" for="nickname">Nickname<span class="red">*</span></label>
	<input type="text" name="nickname" required />
    <!-- bind:value={} -->

    <label class="subtitle" for="faq">FAQ</label>
	<textarea name="faq" />

    <hr class="section">

    <p class="subtitle">Kids</p>
    <div class="card">
        <p>Johnny Appleseed</p>
        <button class="delete-btn"><hr></button>
    </div>

    <hr class="inner-section">
    
    <label class="subtitle-2" for="first-name">First Name<span class="red">*</span></label>
    <input type="text" name="first-name" required />

    <label class="subtitle-2" for="last-name">Last Name</label>
    <input type="text" name="last-name" />

    <label class="subtitle-2" for="pronouns">Pronouns<span class="red">*</span></label>
    <input type="text" name="pronouns" required />

    <label class="subtitle-2" for="dob">Date of Birth</label>
    <input type="text" name="dob" />
    
    <div id="btn-container"><button class="add-btn">+</button></div>

    <hr class="section">

    <p class="subtitle">Adults</p>
    <div class="card">
        <p>Johnny Appleseed</p>
        <button class="delete-btn"><hr></button>
    </div>

    <hr class="inner-section">

    <div style="display: flex; gap: 20px;">
        <PhoneInput bind:phoneInput  />
        <button class="add-btn" style="width: 40px;height: 40px;font-size: 26px;">+</button>
    </div>

    <div class="delete-btn-container">
        <button class="btn">Delete Household</button>
        <button class="btn">Delete Account</button>
    </div>
</div>
<style>

#btn-container {
    display: flex;
    justify-content: center;
    margin: 1rem auto 2rem;
}
textarea {
    height: 200px;
    resize: none;
}
.section {
    border-radius: 5px;
    border-top: 2px solid #5a5a5a;
    margin-bottom:  1rem;
}

.inner-section {
    border-radius: 5px;
    border-top: 2px solid #d9d9d9;
    margin-bottom:  1rem;
}
.card {
    font-weight: 400;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    text-align: center;

    color: #797979;
    display: flex;
    flex-direction: column;
    border: 1px solid #D9D9D9;
    width: 80%;
    padding: 38px 35px;
    border-radius: 6px;
    margin: 1rem auto;
    gap: 20px;
}
.delete-btn, .add-btn {
    background: #fce9be;
    border: 1.5px solid #5A5A5A;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    font-size: 28px;
}
.card button hr {
    width: 40%;
    border-top: 3px solid #5A5A5A;
    margin: 30%;
}
.subtitle-2 {
    font-weight: 400;
    font-size: 24px;
    line-height: 30px;
    display: flex;
    align-items: center;

    color: #5A5A5A;
}

.delete-btn-container {
    display: flex;
    flex-direction: column;
    margin: 3rem 3rem 4rem;
    gap: 20px;
}

.delete-btn-container button {
    background: #BD0000;
}
</style>