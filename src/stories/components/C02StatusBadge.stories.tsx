import type { Meta, StoryObj } from '@storybook/react-vite';
import { StatusBadge } from '../../components/UI';

const statuses = ['리서치 완료', '검토 중', '초안', '운영 기준'];
const meta = {
  id: 'ui-status',
  title: '디자인/컴포넌트/C02 StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ padding: 32, maxWidth: 920, margin: '0 auto' }}><Story /></div>],
  args: { status: '검토 중' },
  argTypes: { status: { control: 'select', options: statuses, description: '사업 전체의 진행률이 아닌, 해당 문서의 성숙도' } },
  parameters: { docs: { description: { component: '색상과 텍스트로 문서 상태를 함께 전달합니다. 리서치 완료는 제안된 전략이 확정됐다는 의미가 아닙니다.' } } },
} satisfies Meta<typeof StatusBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Review: Story = { name: '기본 · 검토 중' };
export const AllStatuses: Story = {
  name: '네 가지 문서 상태',
  render: () => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>{statuses.map((status) => <StatusBadge key={status} status={status} />)}</div>,
  parameters: { controls: { disable: true } },
};
export const InContext: Story = {
  name: '제목과 함께 사용',
  args: { status: '초안' },
  render: (args) => <section style={{ maxWidth: 600 }}>
    <StatusBadge {...args} />
    <h2 style={{ margin: '16px 0 8px' }}>타깃과 메시지 가설</h2>
    <p style={{ margin: 0, lineHeight: 1.75 }}>실제 고객의 사용 상황과 유료 구매를 확인하기 위한 첫 제안입니다. 현재 상태를 먼저 읽고 본문의 가설을 검토합니다.</p>
  </section>,
};
