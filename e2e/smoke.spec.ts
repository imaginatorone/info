import { expect, test } from "@playwright/test";

for (const path of ["/", "/about", "/code", "/sound", "/links"]) {
  test(`${path} renders without a blank app shell`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await page.goto(path);
    await expect(page.locator(".site-shell")).toBeVisible();
    await expect(page.locator(".site-content")).toBeVisible();
    expect(errors).toEqual([]);
  });
}
