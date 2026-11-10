import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout } from '../../components/UI';

const meta = {
  id: 'ui-callout',
  title: '디자인/컴포넌트/C03 Callout',
  component: Callout,
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ padding: 32, maxWidth: 920, margin: '0 auto' }}><Story /></div>],
  args: {
    title: '읽는 기준',
    children: '관찰한 사실, 전략적 해석, 우리 사업에서 검증할 가설을 구분합니다.',
    tone: 'info',
  },
  argTypes: {
    tone: { control: 'select', options: ['info', 'notice', 'success'] },
    title: { control: 'text' },
    children: { control: 'text' },
  },
  parameters: { docs: { description: { component: '본문에서 놓치기 쉬운 적용 범위, 조건, 검토 결과를 강조합니다. 긴 본문 전체를 콜아웃으로 감싸지 않습니다.' } } },
} satisfies Meta<typeof Callout>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Information: Story = { name: '안내 · 정보의 적용 범위' };
export const Notice: Story = {
  name: '검토 · 아직 확정되지 않은 약속',
  args: {
    tone: 'notice',
    title: '상품 약속의 확인이 필요합니다',
    children: '작물·품종·규격과 실제 출고 상태가 정해지기 전에는 세척 완료, 즉석섭취, 특정 품질의 우월성을 확정 문구로 사용하지 않습니다.',
  },
};
export const Completed: Story = {
  name: '완료 · 조사 범위의 명시',
  args: {
    tone: 'success',
    title: '35개 사례의 비교를 정리했습니다',
    children: '국내 12개·해외 23개 사례의 공식 자료를 기준으로 비교했습니다. 목적 표본에 대한 리서치 완료이며 시장 전체의 전수조사나 성과 검증은 아닙니다.',
  },
};
