import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  component: Badge,
  title: 'UI/Badge',
  argTypes: { count: { control: 'number' }, max: { control: 'number' } },
}
export default meta

type Story = StoryObj<typeof Badge>

export const Default: Story = { args: { count: 3 } }
export const SingleDigit: Story = { args: { count: 1 } }
export const DoublDigit: Story = { args: { count: 42 } }
export const Overflow: Story = { args: { count: 150, max: 99 } }
export const Zero: Story = { args: { count: 0 } }
