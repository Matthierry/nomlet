import ReactDOM from "react-dom/client"
import App from "./App.tsx"
import "./index.css"
import { registerSW } from "virtual:pwa-register"

ReactDOM.createRoot(document.getElementById("root")!).render(<App />)

// Register after mount; avoid immediate: true which can interfere with inputs
registerSW({ immediate: false })