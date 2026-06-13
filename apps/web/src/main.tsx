import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "@workspace/ui/globals.css"
import { ProTooltipProvider } from "@workspace/ui/components/tooltip"
import { App } from "./App.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ProTooltipProvider>
        <App />
      </ProTooltipProvider>
    </ThemeProvider>
  </StrictMode>
)
