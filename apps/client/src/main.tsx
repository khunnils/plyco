import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { AppQueryProvider } from "@/providers/query-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppQueryProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AppQueryProvider>
  </StrictMode>
)
