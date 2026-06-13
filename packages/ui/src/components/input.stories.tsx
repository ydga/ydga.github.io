import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"

import { Input } from "./input"
import { Label } from "./label"

const meta = {
  component: Input,
  tags: ["ai-generated"],
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    placeholder: "Email",
    type: "email",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByPlaceholderText("Email")).toHaveAttribute(
      "type",
      "email"
    )
  },
}

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-[320px] gap-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    placeholder: "Disabled",
    disabled: true,
  },
}
