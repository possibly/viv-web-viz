import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// On GitHub Pages this is served from /viv-web-viz/. Locally we want `/`.
// The deploy workflow sets VITE_BASE=/viv-web-viz/ before `vite build`.
export default defineConfig({
    base: process.env.VITE_BASE ?? "/",
    plugins: [react()],
    server: { port: 5173, strictPort: true },
});
