import type { Meta, StoryObj } from '@storybook/react';
import CountdownHeartbeat from './CountdownHeartbeat';

const meta = {
  title: 'Components/CountdownHeartbeat',
  component: CountdownHeartbeat,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    
  },
} satisfies Meta<typeof CountdownHeartbeat>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    
  },
};

export const ShortCountdown: Story = {
  args: {
    
  },
};

export const LongCountdown: Story = {
  args: {
    
  },
};

export const Completed: Story = {
  args: {
    
  },
};
