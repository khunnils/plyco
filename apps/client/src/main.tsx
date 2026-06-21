import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import { Toaster } from "sonner"
import posthog from "posthog-js"
import { PostHogErrorBoundary, PostHogProvider } from "@posthog/react"

import "./index.css"
import App from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { AppQueryProvider } from "@/providers/query-provider.tsx"

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: "2026-01-30",
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <PostHogErrorBoundary>
        <AppQueryProvider>
          <ThemeProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
            <Toaster position="bottom-right" richColors />
          </ThemeProvider>
        </AppQueryProvider>
      </PostHogErrorBoundary>
    </PostHogProvider>
  </StrictMode>
)
