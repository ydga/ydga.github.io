import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"
import { AlertCircleIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "./alert"

const meta = {
  component: Alert,
  tags: ["ai-generated"],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  render: () => (
    <Alert className="w-[420px]">
      <AlertCircleIcon aria-hidden="true" />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>
        You can add components to your app using the CLI.
      </AlertDescription>
    </Alert>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent("Heads up")
  },
}

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive" className="w-[420px]">
      <AlertCircleIcon aria-hidden="true" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Something went wrong. Please try again.
      </AlertDescription>
    </Alert>
  ),
}
