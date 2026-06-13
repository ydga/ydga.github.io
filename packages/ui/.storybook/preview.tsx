import type { Preview } from "@storybook/react-vite"
import { initialize, mswLoader } from "msw-storybook-addon"
import { ThemeProvider, useTheme } from "next-themes"
import { useEffect } from "react"

import { TooltipProvider } from "../src/components/tooltip"
import "../src/styles/globals.css"
import { mswHandlers } from "./msw-handlers"

initialize({ onUnhandledRequest: "bypass" })

function ThemeWrapper({
  theme,
  children,
}: {
  theme: string
  children: React.ReactNode
}) {
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme(theme)
  }, [theme, setTheme])

  return children
}

const preview: Preview = {
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Color theme",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, { globals }) => (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <ThemeWrapper theme={globals.theme}>
          <TooltipProvider>
            <div className="bg-background font-sans text-foreground">
              <Story />
            </div>
          </TooltipProvider>
        </ThemeWrapper>
      </ThemeProvider>
    ),
  ],
  loaders: [mswLoader],
  parameters: {
    layout: "centered",
    msw: {
      handlers: Object.values(mswHandlers).flat(),
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "error",
    },
  },
  async beforeEach() {
    localStorage.setItem("theme", "light")
  },
}

export default preview
