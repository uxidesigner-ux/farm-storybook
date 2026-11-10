import { useState } from 'react';
import type { ComponentProps } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../components/UI';

const meta = {
  id: 'ui-button',
  title: '디자인/컴포넌트/C01 Button',
  component: Button,
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ padding: 32, maxWidth: 920, margin: '0 auto' }}><Story /></div>],
  args: { children: '예제 실행', variant: 'primary', disabled: false },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'quiet'], description: '행동의 중요도에 따른 시각적 변형' },
    children: { control: 'text', description: '사용자가 실행할 행동을 설명하는 문구' },
    disabled: { control: 'boolean', description: '실행 조건이 충족되지 않은 경우 사용' },
    onClick: { control: false },
  },
  parameters: { docs: { description: { component: '행동을 실행하는 기본 버튼입니다. 클릭 가능한 예제는 아래의 실행 횟수나 상태를 실제로 변경합니다.' } } },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

function CounterExample(args: ComponentProps<typeof Button>) {
  const [count, setCount] = useState(0);
  return <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
    <Button {...args} onClick={() => setCount((previous) => previous + 1)} />
    <p role="status" style={{ margin: 0 }}>실행 횟수: <strong>{count}회</strong></p>
  </div>;
}

function VariantExample() {
  const [selection, setSelection] = useState('아직 실행한 버튼이 없습니다.');
  const variants = [
    { variant: 'primary' as const, label: '주요 행동' },
    { variant: 'secondary' as const, label: '보조 행동' },
    { variant: 'quiet' as const, label: '조용한 행동' },
  ];
  return <div style={{ display: 'grid', gap: 20 }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {variants.map(({ variant, label }) => <Button key={variant} variant={variant} onClick={() => setSelection(`${label} 버튼을 실행했습니다.`)}>{label}</Button>)}
    </div>
    <p role="status" style={{ margin: 0 }}>{selection}</p>
  </div>;
}

export const Primary: Story = {
  name: '기본 · 클릭 상태',
  render: (args) => <CounterExample {...args} />,
};
export const Variants: Story = {
  name: '세 가지 중요도',
  render: () => <VariantExample />,
  parameters: { controls: { disable: true } },
};
export const Disabled: Story = {
  name: '비활성 상태',
  args: { children: '검토 후 사용 가능', disabled: true },
  render: (args) => <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
    <CounterExample {...args} />
    <p style={{ margin: 0, maxWidth: 440 }}>필요한 검토가 끝나지 않은 상태입니다. 사용 가능한 시점과 이유를 버튼 주변에 함께 설명합니다.</p>
  </div>,
};
