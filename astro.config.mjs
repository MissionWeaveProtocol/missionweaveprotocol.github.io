import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

const base = process.env.SITE_BASE ?? "/missionweaveprotocol.github.io";

export default defineConfig({
  site: process.env.SITE_URL ?? "https://missionweaveproject.github.io",
  base,
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "MissionWeave",
      description:
        "Group-oriented cooperation for autonomous agents inside one organization.",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/MissionWeaveProject",
        },
      ],
      editLink: {
        baseUrl:
          "https://github.com/MissionWeaveProject/missionweaveprotocol.github.io/edit/main/",
      },
    }),
    sitemap(),
  ],
});
