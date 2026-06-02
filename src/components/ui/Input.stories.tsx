import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  component: Input,
  title: 'UI/Input',
  args: { placeholder: 'Enter text...' },
  argTypes: { disabled: { control: 'boolean' } },
  decorators: [
    Story => (
      <div style={{ width: 320, padding: 16 }}>
        <Story />
      </div>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = {}
export const WithLabel: Story = { args: { label: 'Username', id: 'username', placeholder: 'waynechen' } }
export const WithError: Story = {
  args: { label: 'Email', id: 'email', value: 'not-an-email', error: 'Please enter a valid email address' },
}
export const Disabled: Story = { args: { label: 'Read only', disabled: true, value: 'Cannot edit' } }
export const Password: Story = { args: { label: 'Password', type: 'password', id: 'pwd', placeholder: '••••••••' } }
