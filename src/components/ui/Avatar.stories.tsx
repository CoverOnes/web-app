import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  component: Avatar,
  title: 'UI/Avatar',
  args: { name: 'Wayne Chen' },
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    status: { control: 'select', options: ['online', 'away', 'offline'] },
    showStatus: { control: 'boolean' },
    ring: { control: 'boolean' },
  },
}
export default meta

type Story = StoryObj<typeof Avatar>

export const Default: Story = { args: { size: 'md' } }
export const WithImage: Story = { args: { src: 'https://i.pravatar.cc/150?img=3', size: 'md' } }
export const Online: Story = { args: { size: 'lg', showStatus: true, status: 'online' } }
export const Away: Story = { args: { size: 'lg', showStatus: true, status: 'away' } }
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => (
        <Avatar key={size} name="Wayne Chen" size={size} />
      ))}
    </div>
  ),
}
export const GradientColor: Story = {
  args: { pixelSize: 48, color: ['#6366f1', '#8b5cf6'], ring: true },
}
