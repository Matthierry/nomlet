import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./index.css"

// TEMP: disable PWA/service worker to diagnose the input bug
// import { registerSW } from "virtual:pwa-register"

ReactDOM.createRoot(document.getElementById("root")!).render(<App />)

// TEMP: disable PWA/service worker to diagnose the input bug
// registerSW({ immediate: false })