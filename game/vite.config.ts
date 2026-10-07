import { defineConfig } from "vite";

export default defineConfig({
  // relative base so the build works on GitHub Pages, Surge, etc.
  base: "./",
  preview: {
    // Cloudflare quick tunnels use random *.trycloudflare.com hosts
    allowedHosts: true,
  },
  server: {
    allowedHosts: true,
  },
});
