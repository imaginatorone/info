export const site = {
  identity: {
    name: "1maginator",
    githubPrimary: "imaginatorone",
    githubSecondary: "sensorywave",
  },
  socials: {
    githubPrimary: "https://github.com/imaginatorone",
    githubSecondary: "https://github.com/sensorywave",
    telegram: "https://t.me/imaginatorone",
    youtube: "https://www.youtube.com/@1maginatorone",
    soundcloud: "",
  },
} as const;

export type SiteConfig = typeof site;
