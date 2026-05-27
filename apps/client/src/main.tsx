import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "sonner"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { AppQueryProvider } from "@/providers/query-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppQueryProvider>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster position="bottom-right" richColors />
      </ThemeProvider>
    </AppQueryProvider>
  </StrictMode>
)
