export const APP_NAME = "AgentStats";

export const REGIONS = ["ap", "na", "eu", "kr", "br", "latam"] as const;

export type Region = (typeof REGIONS)[number];

export const NAV_ITEMS = [
  { href: "/community", label: "Community" },
  { href: "/agents", label: "Agents" },
  { href: "/weapons", label: "Weapons" },
  { href: "/bundles", label: "Bundles" },
  { href: "/maps", label: "Maps" },
  { href: "/leaderboard", label: "Leaderboard" },
] as const;
