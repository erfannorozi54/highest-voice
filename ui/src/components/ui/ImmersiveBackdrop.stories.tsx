import type { Meta, StoryObj } from '@storybook/react';
import ImmersiveBackdrop from './ImmersiveBackdrop';

const meta = {
  title: 'Components/ImmersiveBackdrop',
  component: ImmersiveBackdrop,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    imageUrl: {
      control: 'text',
      description: 'URL of the background image for color palette extraction',
    },
    parallaxStrength: {
      control: { type: 'range', min: 0, max: 2, step: 0.1 },
      description: 'Strength of the parallax effect',
    },
  },
} satisfies Meta<typeof ImmersiveBackdrop>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="relative w-full h-96">
      <ImmersiveBackdrop imageUrl="https://picsum.photos/600/400?random=1" parallaxStrength={0.5} />
    </div>
  ),
};

export const StrongParallax: Story = {
  render: () => (
    <div className="relative w-full h-96">
      <ImmersiveBackdrop imageUrl="https://picsum.photos/600/400?random=2" parallaxStrength={1.0} />
    </div>
  ),
};

export const NoImage: Story = {
  args: {
    parallaxStrength: 0.8,
  },
};
