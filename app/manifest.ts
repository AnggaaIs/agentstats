import type { MetadataRoute } from "next";

import { APP_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} - Valorant Stats`,
    short_name: APP_NAME,
    description:
      "Explore Valorant agents, weapons, skins, bundles, maps, leaderboards, and service status.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1016",
    theme_color: "#ff4655",
    icons: [
      {
        src: "/brand/agentstats-mark-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
