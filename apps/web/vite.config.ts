import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const workspaceUiSrc = path.resolve(__dirname, "../../packages/ui/src")

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
  resolve: {
    alias: [
      {
        find: "@workspace/ui/globals.css",
        replacement: path.resolve(workspaceUiSrc, "styles/globals.css"),
      },
      {
        find: /^@workspace\/ui\/(.+)$/,
        replacement: `${workspaceUiSrc}/$1`,
      },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
})
