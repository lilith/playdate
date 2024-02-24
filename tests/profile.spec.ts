import { test, expect } from '@playwright/test';
import { run } from '../prisma/seed';

// const url = 'http://localhost:5173/profile';
const host = 'http://localhost:5173';

test.beforeEach(async () => {
	await run();
});

test.only("User can create new profile with valid phone number", async ({ page, context }) => {
    await page.goto('http://localhost:5173');

    await page.waitForTimeout(3000);
    await page.getByRole('textbox').fill('2016660127');
    await page.getByRole('button').click();

    let token: string, phone: string;
    page.on('dialog', async (dialog) => {
        const thing = dialog.message().split(' ');
        phone = thing[0];
        token = thing[1];
        dialog.accept();
    });
    page.on('console', async (msg) => {
        const first = await msg.args()[0]?.jsonValue();
        if (first === 'PHONE_TOKEN') {
            phone = await msg.args()[1].jsonValue();
            token = await msg.args()[2].jsonValue();
        }
    });
    await new Promise<void>((resolve) => {
        let intervalId = setInterval(() => {
            if (phone && token) {
                clearInterval(intervalId);
                resolve();
            }
        }, 100);
    });
    await page.goto(`http://localhost:5173/login/${phone!}/${token!}`);
    await page.mainFrame().waitForLoadState();
    await expect(page).toHaveURL(host + '/profile');
})
