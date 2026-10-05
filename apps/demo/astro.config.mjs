import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://plyco-demo.web.app",
  output: "static",
  trailingSlash: "always",
  server: { port: 4400 },
  vite: { plugins: [tailwindcss()] },
});
