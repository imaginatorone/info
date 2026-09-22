import { expect, test } from "@playwright/test";

for (const path of ["/", "/about", "/code", "/sound", "/links"]) {
  test(`${path} enters a usable route without errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(path);
    await expect(
      page.getByRole("button", { name: "Enter", exact: true }),
    ).toBeVisible();
    await expect(page.locator("body")).not.toContainText("1maginator");
    await expect(page.getByRole("navigation")).toHaveCount(0);
    await page.getByRole("button", { name: "Enter", exact: true }).click();
    await expect(page.locator(".site-content")).toBeVisible();
    await expect(page.getByRole("navigation")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("keyboard entry, gesture-gated audio, mute persistence, and persistent route surface", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    const contexts: AudioContext[] = [];
    Object.assign(window, { __audioContexts: contexts });
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        contexts.push(this);
      }
    };
  });
  await page.goto("/");
  const audioCount = () =>
    page.evaluate(
      () =>
        (window as unknown as { __audioContexts: AudioContext[] })
          .__audioContexts.length,
    );
  expect(await audioCount()).toBe(0);
  await expect(
    page.getByRole("button", { name: "Enter", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Enter", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "1maginator" })).toBeVisible();
  expect(await audioCount()).toBe(1);
  await expect(page.locator("main")).toBeFocused();
  await page.getByRole("button", { name: "Mute sound", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unmute sound", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("sound-muted"))).toBe(
    "true",
  );
  const surface = await page.locator("canvas").elementHandle();
  await page.getByRole("link", { name: "about", exact: true }).click();
  await expect(page.locator('[data-route="about"]')).toBeVisible();
  expect(
    await surface?.evaluate(
      (node) => node === document.querySelector("canvas"),
    ),
  ).toBe(true);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "1maginator" })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unmute sound", exact: true }),
  ).toBeVisible();
});

test("PRESS guidance appears and persists until entry", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".site-shell")).toHaveAttribute(
    "data-hint",
    "inactive",
  );
  await expect(page.locator(".site-shell")).toHaveAttribute(
    "data-hint",
    "active",
    { timeout: 12000 },
  );
  await page.waitForTimeout(2200);
  await page.screenshot({
    path: `test-results/hint-${test.info().project.name}.png`,
  });
  await expect(
    page.getByRole("button", { name: "Enter", exact: true }),
  ).toBeVisible();
  await page.waitForTimeout(5000);
  await expect(page.locator(".site-shell")).toHaveAttribute(
    "data-hint",
    "active",
  );
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.getByRole("heading", { name: "1maginator" })).toBeVisible();
});

test("pointer movement and touch-like swipes do not hide PRESS guidance", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".site-shell")).toHaveAttribute(
    "data-hint",
    "active",
    { timeout: 12000 },
  );
  await page.mouse.move(15, 15);
  await page.mouse.move(440, 260, { steps: 12 });
  await page.dispatchEvent("body", "pointerdown", {
    pointerId: 41,
    pointerType: "touch",
    clientX: 40,
    clientY: 420,
  });
  await page.dispatchEvent("body", "pointermove", {
    pointerId: 41,
    pointerType: "touch",
    clientX: 310,
    clientY: 350,
  });
  await page.dispatchEvent("body", "pointerup", {
    pointerId: 41,
    pointerType: "touch",
    clientX: 310,
    clientY: 350,
  });
  await expect(page.locator(".site-shell")).toHaveAttribute(
    "data-hint",
    "active",
  );
});

test("reduced motion enters promptly and keeps the field", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.getByRole("heading", { name: "1maginator" })).toBeVisible({
    timeout: 1000,
  });
  await expect(page.locator("[data-renderer]")).toHaveAttribute(
    "data-renderer",
    "webgl",
  );
  await page.screenshot({
    path: `test-results/reduced-${test.info().project.name}.png`,
  });
});

test("renderer failure leaves semantic entry and routes usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return Reflect.apply(getContext, this, [type, ...args]);
    } as typeof getContext;
  });
  await page.goto("/");
  await expect(page.locator("[data-renderer]")).toHaveAttribute(
    "data-renderer",
    "fallback",
  );
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.getByRole("heading", { name: "1maginator" })).toBeVisible();
  await page.getByRole("link", { name: "links", exact: true }).click();
  await expect(page.getByRole("link", { name: "telegram" })).toBeVisible();
});

test("touch can enter without hover", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4173");
  await page.getByRole("button", { name: "Enter", exact: true }).tap();
  await expect(page.getByRole("heading", { name: "1maginator" })).toBeVisible();
  await page.getByRole("button", { name: "Mute sound", exact: true }).tap();
  await expect(
    page.getByRole("button", { name: "Unmute sound", exact: true }),
  ).toBeVisible();
  await context.close();
});

test("the idle material moves, while reduced motion holds still", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Enter", exact: true }).focus();
  await page.keyboard.press("Shift");
  await page.waitForTimeout(400);
  const moving = await page.locator("canvas").screenshot();
  await page.waitForTimeout(900);
  expect((await page.locator("canvas").screenshot()).equals(moving)).toBe(
    false,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".site-shell")).toHaveAttribute(
    "data-hint",
    "active",
  );
  await page.waitForTimeout(400);
  const still = await page.locator("canvas").screenshot();
  await page.waitForTimeout(900);
  expect((await page.locator("canvas").screenshot()).equals(still)).toBe(true);
});

test("external links open a separate safe tab", async ({ page, context }) => {
  await context.route("https://t.me/**", (route) =>
    route.fulfill({ body: "telegram" }),
  );
  await page.goto("/links");
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  const links = page.locator(".foundation-page a");
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer noopener");
  }
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "telegram", exact: true }).click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  expect(page.url()).toContain("/links");
  expect(popup.url()).toContain("t.me/");
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  await popup.close();
});

test("glyph volume controls real master gain and preserves mute", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    const gains: GainNode[] = [];
    Object.assign(window, { __gains: gains });
    window.AudioContext = class extends Original {
      createGain() {
        const gain = super.createGain();
        gains.push(gain);
        return gain;
      }
    };
  });
  await page.goto("/");
  await expect(page.getByRole("slider", { name: "Volume" })).toHaveCount(0);
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Volume" });
  await expect(slider).toBeVisible();
  const box = await slider.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.click(box!.x + box!.width * 0.75, box!.y + box!.height / 2);
  await expect(slider).toHaveAttribute("aria-valuenow", /7[3-7]/);
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
  const master = () =>
    page.evaluate(
      () =>
        (window as unknown as { __gains: GainNode[] }).__gains[0].gain.value,
    );
  await expect.poll(master).toBeLessThan(0.001);
  await page.getByRole("button", { name: "Mute sound", exact: true }).click();
  await slider.focus();
  await page.keyboard.press("End");
  await expect(slider).toHaveAttribute("aria-valuenow", "100");
  await expect.poll(master).toBeLessThan(0.001);
  await page.getByRole("button", { name: "Unmute sound", exact: true }).click();
  await expect.poll(master).toBeGreaterThan(0.63);
  await page.reload();
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Volume" })).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
});

test("authored ambience uses one looping buffer with prepared boundaries", async ({
  page,
}) => {
  const rate = 16000,
    frames = rate;
  const wav = Buffer.alloc(44 + frames * 2);
  wav.write("RIFF");
  wav.writeUInt32LE(36 + frames * 2, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(frames * 2, 40);
  for (let i = 0; i < frames; i++)
    wav.writeInt16LE(
      Math.round(Math.sin((i / rate) * Math.PI * 2 * 100) * 1500),
      44 + i * 2,
    );
  await page.route("**/audio/manifest.json", (route) =>
    route.fulfill({
      json: {
        ambience: {
          src: "/audio/ambience-loop.wav",
          gain: 0.2,
          loopStart: 0.1,
          loopEnd: 0.9,
          crossfadeSeconds: 0.02,
        },
      },
    }),
  );
  await page.route("**/audio/ambience-loop.wav", (route) =>
    route.fulfill({ body: wav, contentType: "audio/wav" }),
  );
  await page.addInitScript(() => {
    const Original = window.AudioContext;
    const sources: AudioBufferSourceNode[] = [];
    Object.assign(window, { __sources: sources });
    window.AudioContext = class extends Original {
      constructor() {
        super();
        Object.assign(window, { __loopContext: this });
      }
      createBufferSource() {
        const source = super.createBufferSource();
        sources.push(source);
        return source;
      }
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  const loops = () =>
    page.evaluate(() =>
      (window as unknown as { __sources: AudioBufferSourceNode[] }).__sources
        .filter((source) => source.loop)
        .map((source) => ({
          start: source.loopStart,
          end: source.loopEnd,
          duration: source.buffer?.duration,
        })),
    );
  await expect.poll(async () => (await loops()).length).toBe(1);
  const loop = (await loops())[0];
  expect(loop.start).toBe(0);
  expect(loop.end).toBeCloseTo(0.78, 2);
  expect(loop.duration).toBeCloseTo(0.78, 2);
  await page.getByRole("link", { name: "about", exact: true }).click();
  expect((await loops()).length).toBe(1);
  const state = () =>
    page.evaluate(
      () =>
        (window as unknown as { __loopContext: AudioContext }).__loopContext
          .state,
    );
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(state).toBe("suspended");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(state).toBe("running");
  expect((await loops()).length).toBe(1);
});
