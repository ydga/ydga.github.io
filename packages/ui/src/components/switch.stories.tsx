import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"

import { Label } from "./label"
import { Switch } from "./switch"

const meta = {
  component: Switch,
  tags: ["ai-generated"],
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane mode</Label>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const toggle = canvas.getByRole("switch")
    await expect(toggle).toHaveAttribute("aria-checked", "false")
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute("aria-checked", "true")
  },
}

export const Small: Story = {
  args: {
    size: "sm",
    "aria-label": "Small switch",
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    "aria-label": "Disabled switch",
  },
}
