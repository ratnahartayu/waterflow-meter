import { defineConfig } from "vite";

export default defineConfig({
  build: { chunkSizeWarningLimit: 700 },   // pustaka Firebase memang besar, dimuat sekali lalu tersimpan di HP
});
