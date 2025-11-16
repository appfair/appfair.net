// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // https://docs.astro.build/en/guides/internationalization/
  i18n: {
    locales: ["es", "en", "fr", "pt-br"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: true,
    },
  }

  // https://docs.astro.build/en/guides/prefetch/
  //prefetch: true
});
