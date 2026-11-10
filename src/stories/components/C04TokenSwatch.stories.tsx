import type { Meta, StoryObj } from '@storybook/react-vite';
import { TokenSwatch } from '../../components/UI';

const palette = [
  { name: 'Forest', value: '#265340', usage: '주요 행동과 강조에 사용하는 문서 공간의 중심색' },
  { name: 'Paper', value: '#f7f8f4', usage: '오래 읽는 문서의 기본 표면' },
  { name: 'Ink', value: '#20362c', usage: '제목과 본문의 기본 텍스트' },
  { name: 'Accent', value: '#d4dd80', usage: '핵심 정보와 선택 상태를 보조하는 강조색' },
  { name: 'Border', value: '#e1e5dc', usage: '카드와 정보 구역의 경계' },
  { name: 'Muted', value: '#68756b', usage: '본문보다 낮은 위계의 보조 정보' },
];

const meta = {
  id: 'ui-token',
  title: '디자인/컴포넌트/C04 TokenSwatch',
  component: TokenSwatch,
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ padding: 32, maxWidth: 1040, margin: '0 auto' }}><Story /></div>],
  args: palette[0],
  argTypes: {
    name: { control: 'text' },
    value: { control: 'color', description: '실제 사용한 HEX 색상값. 값 버튼으로 복사할 수 있습니다.' },
    usage: { control: 'text' },
  },
  parameters: { docs: { description: { component: '문서 사이트의 임시 시각 체계를 설명하는 색상 견본입니다. 농산물 브랜드의 최종 색상은 아닙니다. 색상값을 누르면 클립보드 복사를 실행합니다.' } } },
} satisfies Meta<typeof TokenSwatch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Forest: Story = {
  name: '기본 · 중심색',
  render: (args) => <div style={{ maxWidth: 340 }}><TokenSwatch {...args} /></div>,
};
export const Paper: Story = {
  name: '밝은 표면색',
  args: palette[1],
  render: (args) => <div style={{ maxWidth: 340 }}><TokenSwatch {...args} /></div>,
};
export const WorkingPalette: Story = {
  name: '문서 공간 팔레트',
  render: () => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 20 }}>{palette.map((token) => <TokenSwatch key={token.name} {...token} />)}</div>,
  parameters: { controls: { disable: true } },
};
