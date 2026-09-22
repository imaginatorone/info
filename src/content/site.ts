export const site = {
  identity: {
    name: "1maginator",
    githubPrimary: "imaginatorone",
    githubSecondary: "sensorywave",
  },
  soundcloudUser: "https://api.soundcloud.com/users/1415829702",
  socials: {
    githubPrimary: "https://github.com/imaginatorone",
    githubSecondary: "https://github.com/sensorywave",
    telegram: "https://t.me/imaginatorone",
    youtube: "https://www.youtube.com/@1maginatorone",
    soundcloud: "https://soundcloud.com/imaginatorone",
  },
} as const;

export type SiteConfig = typeof site;
