import { expect, test } from "@playwright/test";
test("system Russian, live English override, About copy and persistent world", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "languages", { get: () => ["ru-RU"] });
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await page.getByRole("link", { name: "about", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Я 1maginator." }),
  ).toBeVisible();
  const canvas = await page.locator("canvas").elementHandle();
  await page.getByRole("button", { name: "en", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "I'm 1maginator." }),
  ).toBeVisible();
  for (const route of ["code", "sound", "links", "home"]) {
    await page.getByRole("link", { name: route, exact: true }).click();
    await expect(page.locator(`[data-route="${route}"]`)).toBeVisible();
    expect(
      await canvas?.evaluate(
        (node) => node === document.querySelector("canvas"),
      ),
    ).toBe(true);
  }
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Volume" })).toBeVisible();
});
test("intro prepares before entry and touch preserves its instruction", async ({
  page,
}) => {
  test.setTimeout(45000);
  await page.goto("/");
  await expect(page.locator(".site-shell")).toHaveAttribute(
    "data-intro",
    "complete",
    { timeout: 20000 },
  );
  await expect(page.locator("body")).not.toContainText("1maginator");
  await expect(page.locator(".site-shell")).toHaveAttribute(
    "data-hint",
    "active",
    { timeout: 4000 },
  );
  await page.dispatchEvent("canvas", "pointerdown", {
    pointerType: "touch",
    clientX: 180,
    clientY: 350,
  });
  await page.dispatchEvent("canvas", "pointermove", {
    pointerType: "touch",
    clientX: 230,
    clientY: 380,
  });
  await expect(page.locator(".site-shell")).toHaveAttribute(
    "data-hint",
    "active",
  );
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.getByRole("heading", { name: "1maginator" })).toBeVisible();
});
