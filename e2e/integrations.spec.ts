import { expect, test } from "@playwright/test";

test("GitHub profiles show fresh data and keep cached repositories offline", async ({
  page,
}) => {
  let offline = false;
  await page.route("https://api.github.com/users/**", (route) => {
    if (offline) return route.fulfill({ status: 503, body: "unavailable" });
    const url = new URL(route.request().url());
    const login = url.pathname.split("/")[2];
    return route.fulfill({
      json: url.pathname.endsWith("/repos")
        ? [
            {
              id: login === "imaginatorone" ? 1 : 2,
              name: "recent-work",
              html_url: `https://github.com/${login}/recent-work`,
              description: "A public repository",
              language: "TypeScript",
              stargazers_count: 3,
              pushed_at: "2026-09-20T00:00:00Z",
              fork: false,
            },
          ]
        : {
            login,
            bio: "Public profile",
            html_url: `https://github.com/${login}`,
            public_repos: 7,
            followers: 12,
          },
    });
  });
  await page.goto("/code");
  await page.getByRole("button", { name: "skip", exact: true }).click();
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.getByRole("link", { name: /recent-work/ })).toHaveCount(2);
  await expect(page.locator(".profile-counts").first()).toContainText(
    "7 repositories",
  );
  offline = true;
  await page.evaluate(() => {
    for (const key of ["github-v1-imaginatorone", "github-v1-sensorywave"]) {
      const data = JSON.parse(localStorage.getItem(key)!);
      data.fetchedAt = 0;
      localStorage.setItem(key, JSON.stringify(data));
    }
  });
  await page.reload();
  await page.getByRole("button", { name: "skip", exact: true }).click();
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.locator(".profile-status").first()).toContainText(
    "unavailable",
  );
  await expect(page.getByRole("link", { name: /recent-work/ })).toHaveCount(2);
});

test("SoundCloud loads on request and custom transport follows widget and master mute", async ({
  page,
}) => {
  await page.route("https://w.soundcloud.com/player/?**", (route) =>
    route.fulfill({ body: "<html></html>", contentType: "text/html" }),
  );
  await page.route("https://w.soundcloud.com/player/api.js", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `
 const callbacks={}; let playing=false;
 window.__player={volume:0,position:0};
 window.SC={Widget:()=>({bind:(name,fn)=>{callbacks[name]=fn;if(name==='ready')setTimeout(fn,30)},unbind:name=>delete callbacks[name],getSounds:fn=>fn([{id:1,title:'Test track',duration:180000,permalink_url:'https://soundcloud.com/imaginatorone/test'}]),getCurrentSoundIndex:fn=>fn(0),setVolume:value=>window.__player.volume=value,toggle:()=>{playing=!playing;callbacks[playing?'play':'pause']?.({})},play:()=>callbacks.play?.({}),pause:()=>callbacks.pause?.({}),skip:()=>{},seekTo:value=>{window.__player.position=value;callbacks.seek?.({currentPosition:value})}})};
 `,
    }),
  );
  await page.goto("/sound");
  await page.getByRole("button", { name: "skip", exact: true }).click();
  await page.getByRole("button", { name: "Enter", exact: true }).click();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page
    .getByRole("button", { name: "[ + ] load tracks", exact: true })
    .click();
  await expect(page.getByRole("button", { name: /Test track/ })).toBeVisible();
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pause", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mute sound", exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __player: { volume: number } }).__player
            .volume,
      ),
    )
    .toBe(0);
  const seek = page.getByRole("slider", { name: "Track position" });
  await seek.focus();
  await page.keyboard.press("End");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { __player: { position: number } }).__player
            .position,
      ),
    )
    .toBe(180000);
  await page.getByRole("button", { name: "ru", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Пауза", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "sound", exact: true }),
  ).toBeVisible();
});
