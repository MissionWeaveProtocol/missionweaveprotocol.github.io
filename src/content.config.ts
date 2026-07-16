import { defineCollection } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

export const collections = {
  docs: defineCollection({
    loader: docsLoader({
      generateId: ({ entry, data }) => {
        if (typeof data.slug === "string") {
          return data.slug;
        }

        const path = entry
          .replace(/\\/gu, "/")
          .replace(/\.(?:markdown|mdown|mkdn|mkd|mdwn|md|mdx)$/u, "");

        return path === "index" ? path : path.replace(/\/index$/u, "");
      },
    }),
    schema: docsSchema(),
  }),
};
