// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/リポジトリ名/", // ここが重要
  plugins: [react()],
});
