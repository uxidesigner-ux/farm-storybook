import type { Meta, StoryObj } from '@storybook/react-vite';
import { DocCard } from '../../components/UI';
import { documents } from '../../data';
import type { GuideDocument } from '../../types';

function requiredDocument(id: string): GuideDocument {
  const document = documents.find((item) => item.id === id);
  if (!document) throw new Error(`Storybook 예제의 원본 문서를 찾을 수 없습니다: ${id}`);
  return document;
}
const researchDocument = requiredDocument('bx-research');
const marketingDocument = requiredDocument('marketing-positioning');
const exampleDocuments = [researchDocument, requiredDocument('design-foundations'), marketingDocument];

const meta = {
  id: 'ui-doc-card',
  title: '디자인/컴포넌트/C05 DocCard',
  component: DocCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ padding: 32, maxWidth: 1040, margin: '0 auto' }}><Story /></div>],
  args: { document: researchDocument },
  argTypes: { document: { control: false, description: '생성된 실제 문서 데이터. 카드의 링크는 해당 문서를 엽니다.' } },
  parameters: { docs: { description: { component: '제목·요약·분류·상태·읽기 시간을 보여주고 실제 문서로 이동하는 카드입니다. 클릭하면 Storybook의 문서가 열립니다.' } } },
} satisfies Meta<typeof DocCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Research: Story = {
  name: '리서치 문서',
  render: (args) => <div style={{ maxWidth: 380 }}><DocCard {...args} /></div>,
};
export const Draft: Story = {
  name: '마케팅 초안 문서',
  args: { document: marketingDocument },
  render: (args) => <div style={{ maxWidth: 380 }}><DocCard {...args} /></div>,
};
export const Collection: Story = {
  name: '분류별 문서 모음',
  render: () => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 20 }}>{exampleDocuments.map((document) => <DocCard key={document.id} document={document} />)}</div>,
};
