import type { Meta, StoryObj } from '@storybook/react-vite';
import { DownloadCard } from '../../components/UI';
import { files } from '../../data';

const researchFile = files.find((file) => file.id === 'research');
const wbsFile = files.find((file) => file.id === 'wbs');
if (!researchFile || !wbsFile) throw new Error('다운로드 예제에 필요한 원본 파일 정보가 없습니다.');

const meta = {
  id: 'ui-download-card',
  title: '디자인/컴포넌트/C06 DownloadCard',
  component: DownloadCard,
  tags: ['autodocs'],
  decorators: [(Story) => <div style={{ padding: 32, maxWidth: 1040, margin: '0 auto' }}><Story /></div>],
  args: { file: researchFile },
  argTypes: { file: { control: false, description: '파일 유형·설명·버전·상태·실제 다운로드 주소' } },
  parameters: { docs: { description: { component: '문서 원본의 형식·버전·상태를 설명하는 다운로드 카드입니다. 버튼은 실제 PDF, 스프레드시트 또는 Markdown 파일을 다운로드합니다.' } } },
} satisfies Meta<typeof DownloadCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ResearchPdf: Story = { name: 'PDF 리서치 원본' };
export const Spreadsheet: Story = {
  name: '스프레드시트 계획서',
  args: { file: wbsFile },
};
export const ResourceLibrary: Story = {
  name: '전체 원본 자료',
  render: () => <div style={{ display: 'grid', gap: 16 }}>{files.map((file) => <DownloadCard key={file.id} file={file} />)}</div>,
};
