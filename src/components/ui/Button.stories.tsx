import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'UI/Button',
  args: { children: 'Button' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof Button>

export const Primary: Story = { args: { variant: 'primary', children: 'Primary' } }
export const Secondary: Story = { args: { variant: 'secondary', children: 'Secondary' } }
export const Ghost: Story = { args: { variant: 'ghost', children: 'Ghost' } }
export const Danger: Story = { args: { variant: 'danger', children: 'Delete' } }
export const Loading: Story = { args: { variant: 'primary', loading: true, children: 'Sending...' } }
export const Disabled: Story = { args: { variant: 'primary', disabled: true, children: 'Disabled' } }
export const Small: Story = { args: { size: 'sm', children: 'Small' } }
export const Large: Story = { args: { size: 'lg', children: 'Large' } }
