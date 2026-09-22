import { describe, expect, it } from "vitest";
import { site } from "./site";

describe("site config", () => {
  it("keeps the two GitHub identities distinct", () => {
    expect(site.identity.githubPrimary).toBe("imaginatorone");
    expect(site.identity.githubSecondary).toBe("sensorywave");
    expect(site.identity.githubPrimary).not.toBe(site.identity.githubSecondary);
  });

  it("uses explicit public social URLs", () => {
    expect(site.socials.telegram).toMatch(/^https:\/\/t\.me\//);
    expect(site.socials.youtube).toMatch(/^https:\/\/www\.youtube\.com\//);
  });
});
