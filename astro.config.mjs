import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

const base = process.env.SITE_BASE ?? "/missionweaveprotocol.github.io";
const site = process.env.SITE_URL ?? "https://missionweaveproject.github.io";
const withBase = (path) => `${base === "/" ? "" : base}${path}`;
const absoluteAsset = (path) => new URL(withBase(path), site).href;

export default defineConfig({
  site,
  base,
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "MissionWeave",
      description:
        "Group-oriented cooperation for autonomous agents inside one organization.",
      logo: {
        light: "./src/assets/missionweave-icon.svg",
        dark: "./src/assets/missionweave-icon-white.svg",
        alt: "MissionWeave",
      },
      favicon: "/favicon.svg",
      customCss: ["./src/styles/custom.css"],
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
      head: [
        {
          tag: "link",
          attrs: {
            rel: "apple-touch-icon",
            href: withBase("/apple-touch-icon.png"),
          },
        },
        {
          tag: "link",
          attrs: { rel: "manifest", href: withBase("/site.webmanifest") },
        },
        {
          tag: "meta",
          attrs: { name: "theme-color", content: "#121826" },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: absoluteAsset("/og-image.png"),
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "twitter:image",
            content: absoluteAsset("/og-image.png"),
          },
        },
      ],
    }),
    sitemap(),
  ],
});
