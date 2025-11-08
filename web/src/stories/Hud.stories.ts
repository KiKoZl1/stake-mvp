import type { Meta, StoryObj } from '@storybook/svelte';
import Hud from '../ui/Hud.svelte';

const meta = {
  title: 'Game/Hud',
  component: Hud,
  args: {
    balance: 125_000_000,
    bet: 2_000_000,
    lastWin: 18_500_000,
    spinning: false,
    autoActive: false,
    onSpin: () => {},
    onInfo: () => {},
    onStopAuto: () => {}
  }
} satisfies Meta<Hud>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAuto: Story = {
  args: {
    autoActive: true,
    spinning: true
  }
};
