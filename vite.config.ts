import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  base: "/nomlet/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Nomlet",
        short_name: "Nomlet",
        description: "Meals picked. Shop sorted.",
        theme_color: "#F1F7F7",
        background_color: "#F1F7F7",
        display: "standalone",
        start_url: "/nomlet/",
        scope: "/nomlet/",
        icons: [
          {
            src: "/nomlet/images/nomlet-placeholder.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/nomlet/images/nomlet-placeholder.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ]
})