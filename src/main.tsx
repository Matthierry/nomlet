import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./index.css"
import { registerSW } from "virtual:pwa-register"

ReactDOM.createRoot(document.getElementById("root")!).render(<App />)

// Register the service worker AFTER the app is mounted.
// Avoid immediate: true because it can interfere with focus/inputs during updates.
registerSW({
  immediate: false,
})