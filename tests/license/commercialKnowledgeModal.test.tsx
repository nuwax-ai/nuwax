import LocalCustomDocModal from '@/pages/SpaceKnowledge/LocalCustomDocModal';
import { apiKnowledgeDocumentCustomAdd } from '@/services/knowledge';
import { KnowledgeTextImportEnum } from '@/types/enums/library';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ enabled: true }));
vi.mock('umi', () => ({ useRequest: (api: any) => ({ run: api }) }));
vi.mock('@/hooks/useCommercialEdition', () => ({
  default: () => ({ aiOSCommercialEdition: state.enabled }),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/knowledge', () => ({
  apiKnowledgeDocumentAdd: vi.fn(),
  apiKnowledgeDocumentCustomAdd: vi.fn(),
}));
vi.mock('@/utils/upload', () => ({
  getProgressStatus: vi.fn(),
  handleUploadFileList: vi.fn(),
}));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));
vi.mock('@/components/LabelStar', () => ({ default: () => null }));
vi.mock('@/components/custom/SelectList', () => ({ default: () => null }));
vi.mock('@/pages/SpaceKnowledge/LocalCustomDocModal/UploadFile', () => ({
  default: () => null,
}));
vi.mock('@/pages/SpaceKnowledge/LocalCustomDocModal/DataProcess', () => ({
  default: () => null,
}));
vi.mock('@/pages/SpaceKnowledge/LocalCustomDocModal/index.less', () => ({
  default: {},
}));
vi.mock(
  '@/pages/SpaceKnowledge/LocalCustomDocModal/TextFill/index.less',
  () => ({ default: {} }),
);
vi.mock(
  '@/pages/SpaceKnowledge/LocalCustomDocModal/CreateSet/index.less',
  () => ({ default: {} }),
);
afterEach(cleanup);

it('智能分段已选中时撤销授权，回到自动分段并提交普通文档参数', async () => {
  state.enabled = true;
  const props = {
    id: 930,
    type: KnowledgeTextImportEnum.Custom,
    open: true,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };
  const view = render(<LocalCustomDocModal {...props} />);
  fireEvent.change(
    screen.getByPlaceholderText(
      'PC.Pages.SpaceKnowledge.TextFill.docNamePlaceholder',
    ),
    { target: { value: '授权回归文档' } },
  );
  fireEvent.change(
    screen.getByPlaceholderText(
      'PC.Pages.SpaceKnowledge.TextFill.docContentPlaceholder',
    ),
    { target: { value: '文档内容' } },
  );
  const next = 'PC.Pages.SpaceKnowledge.LocalCustomDocModal.nextStep';
  fireEvent.click(screen.getByRole('button', { name: next }));
  fireEvent.click(
    await screen.findByText('PC.Pages.SpaceKnowledge.CreateSet.isAiSegment'),
  );
  state.enabled = false;
  view.rerender(<LocalCustomDocModal {...props} />);
  expect(
    screen.queryByText('PC.Pages.SpaceKnowledge.CreateSet.isAiSegment'),
  ).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: next }));
  fireEvent.click(
    await screen.findByRole('button', { name: 'PC.Common.Global.confirm' }),
  );
  await waitFor(() =>
    expect(apiKnowledgeDocumentCustomAdd).toHaveBeenCalledWith({
      kbId: 930,
      name: '授权回归文档',
      fileContent: '文档内容',
      autoSegmentConfigFlag: true,
    }),
  );
});
