import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { Label } from "./label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./select"

const meta = {
  component: Select,
  tags: ["ai-generated"],
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  render: () => (
    <div className="grid w-[200px] gap-2">
      <Label htmlFor="fruit-select">Fruit</Label>
      <Select>
        <SelectTrigger id="fruit-select" className="w-full">
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Fruits</SelectLabel>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvas, userEvent, canvasElement }) => {
    await userEvent.click(canvas.getByRole("combobox", { name: /fruit/i }))
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(await body.findByRole("option", { name: /banana/i }))
    await expect(
      canvas.getByRole("combobox", { name: /fruit/i })
    ).toHaveTextContent("Banana")
  },
}

export const Small: Story = {
  render: () => (
    <div className="grid w-[180px] gap-2">
      <Label htmlFor="fruit-select-sm">Fruit</Label>
      <Select defaultValue="apple">
        <SelectTrigger id="fruit-select-sm" size="sm" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="grape">Grape</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}
