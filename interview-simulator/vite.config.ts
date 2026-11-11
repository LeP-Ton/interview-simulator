import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // 相对资源路径同时适配 GitHub Pages 仓库子目录和根路径静态托管。
  base: "./",
  plugins: [react()],
});
