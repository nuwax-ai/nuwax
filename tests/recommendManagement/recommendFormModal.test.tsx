import RecommendFormModal from '@/pages/SystemManagement/RecommendManage/components/RecommendFormModal';
import {
  apiSystemSaveDisplayRecommend,
  apiSystemUpdateDisplayRecommend,
} from '@/pages/SystemManagement/RecommendManage/services/recomment';
import type { DisplayRecommendInfo } from '@/pages/SystemManagement/RecommendManage/types';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/square', () => ({
  fetchChatboxCategories: vi.fn(async () => []),
}));
vi.mock('@/services/agentDev', () => ({ apiPublishedAgentInfo: vi.fn() }));
vi.mock('@/pages/SystemManagement/RecommendManage/services/recomment', () => ({
  apiSystemSaveDisplayRecommend: vi.fn(),
  apiSystemUpdateDisplayRecommend: vi.fn(),
}));
vi.mock('@/components/CustomFormModal', () => ({
  default: ({ open, children, onConfirm, loading }: any) =>
    open ? (
      <div>
        {children}
        <button type="button" disabled={loading} onClick={onConfirm}>
          保存
        </button>
      </div>
    ) : null,
}));
vi.mock('@/components/UploadAvatar', () => ({
  default: ({ imageUrl, onUploadSuccess }: any) => (
    <button
      type="button"
      aria-label="上传图标"
      onClick={() => onUploadSuccess?.('/prompt-icon.png')}
    >
      {imageUrl || '默认图标'}
    </button>
  ),
}));
vi.mock(
  '@/pages/SystemManagement/RecommendManage/components/RecommendAddModal',
  () => ({
    default: ({ open, onPick }: any) =>
      open ? (
        <button
          type="button"
          onClick={() => onPick({ targetId: 71, name: '已推荐的智能体' })}
        >
          选择智能体
        </button>
      ) : null,
  }),
);
vi.mock(
  '@/pages/SystemManagement/RecommendManage/components/RecommendFormModal/SelectedAgentCard',
  () => ({
    default: ({ item, onClick }: any) => (
      <button type="button" onClick={onClick}>
        {item.name}
      </button>
    ),
  }),
);
vi.mock(
  '@/pages/SystemManagement/RecommendManage/components/RecommendFormModal/index.less',
  () => ({
    default: new Proxy({}, { get: (_, key) => String(key) }),
  }),
);

const key = (name: string) => `PC.Pages.SystemRecommendManage.${name}`;
const callbacks = { onCancel: vi.fn(), onSuccess: vi.fn() };
const record = (
  overrides: Partial<DisplayRecommendInfo> = {},
): DisplayRecommendInfo => ({
  id: 1,
  tenantId: 1,
  targetType: 'Agent',
  targetId: 71,
  recType: 'ChatBoxNav',
  functionType: 'Chat',
  label: '已推荐的智能体',
  icon: '',
  placeholder: '',
  sort: 1,
  modified: '',
  created: '',
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiPublishedAgentInfo).mockResolvedValue({
    code: '0000',
    data: undefined,
  } as any);
  vi.mocked(apiSystemSaveDisplayRecommend).mockResolvedValue({
    code: '0000',
  } as any);
  vi.mocked(apiSystemUpdateDisplayRecommend).mockResolvedValue({
    code: '0000',
  } as any);
});
afterEach(cleanup);

it('新增推荐提交多条提示词，标题、内容、图标分别保存', async () => {
  render(<RecommendFormModal open defaultSort={10} {...callbacks} />);
  fireEvent.click(screen.getByText(key('clickToAddAgent')));
  fireEvent.click(screen.getByRole('button', { name: '选择智能体' }));
  fireEvent.click(screen.getByRole('button', { name: key('addPrompt') }));
  fireEvent.click(screen.getByRole('button', { name: key('addPrompt') }));
  const titles = screen.getAllByPlaceholderText(key('promptTitlePlaceholder'));
  const contents = screen.getAllByPlaceholderText(
    key('promptContentPlaceholder'),
  );
  fireEvent.change(titles[0], { target: { value: '  提示标题  ' } });
  fireEvent.change(contents[0], {
    target: { value: '第一条完整内容\n保留换行' },
  });
  fireEvent.change(contents[1], { target: { value: '第二条完整内容' } });
  fireEvent.click(screen.getAllByRole('button', { name: '上传图标' })[1]);
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() =>
    expect(apiSystemSaveDisplayRecommend).toHaveBeenCalledWith(
      expect.objectContaining({
        targetId: 71,
        prompts: [
          {
            title: '提示标题',
            content: '第一条完整内容\n保留换行',
            icon: '/prompt-icon.png',
          },
          { title: '', content: '第二条完整内容', icon: '' },
        ],
      }),
    ),
  );
  expect(callbacks.onSuccess).toHaveBeenCalledOnce();
});

it('编辑回填提示词，清除图标并删除全部后更新传空数组', async () => {
  const editingRecord = record({
    prompts: [{ title: '原标题', content: '原内容', icon: '/old.png' }],
  });
  render(
    <RecommendFormModal
      open
      editingRecord={editingRecord}
      defaultSort={10}
      {...callbacks}
    />,
  );
  expect(await screen.findByDisplayValue('原内容')).toBeInTheDocument();
  expect(screen.getByDisplayValue('原标题')).toBeInTheDocument();
  expect(screen.getByText('/old.png')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: key('clearPromptIcon') }));
  expect(screen.queryByText('/old.png')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: key('removePrompt') }));
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() =>
    expect(apiSystemUpdateDisplayRecommend).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        targetId: 71,
        prompts: [],
      }),
    ),
  );
});

it('纯空白内容阻止提交，补全内容后可以保存', async () => {
  render(
    <RecommendFormModal
      open
      editingRecord={record()}
      defaultSort={10}
      {...callbacks}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: key('addPrompt') }));
  const content = screen.getByPlaceholderText(key('promptContentPlaceholder'));
  fireEvent.change(content, { target: { value: '   ' } });
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  expect(
    await screen.findByText(key('promptContentRequired')),
  ).toBeInTheDocument();
  expect(apiSystemUpdateDisplayRecommend).not.toHaveBeenCalled();
  fireEvent.change(content, { target: { value: '有效内容' } });
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() =>
    expect(apiSystemUpdateDisplayRecommend).toHaveBeenCalledOnce(),
  );
});

it('编辑旧记录兼容 null，打开新增不残留上一条提示词和智能体', async () => {
  const { rerender } = render(
    <RecommendFormModal
      open
      editingRecord={record({ prompts: null })}
      defaultSort={10}
      {...callbacks}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() =>
    expect(apiSystemUpdateDisplayRecommend).toHaveBeenCalledWith(
      expect.objectContaining({ prompts: [] }),
    ),
  );
  rerender(
    <RecommendFormModal
      open
      editingRecord={record({
        prompts: [{ title: '旧标题', content: '旧内容', icon: '' }],
      })}
      defaultSort={10}
      {...callbacks}
    />,
  );
  expect(await screen.findByDisplayValue('旧内容')).toBeInTheDocument();
  rerender(<RecommendFormModal open defaultSort={10} {...callbacks} />);
  expect(screen.queryByDisplayValue('旧内容')).toBeNull();
  expect(screen.queryByRole('button', { name: '已推荐的智能体' })).toBeNull();
  expect(screen.getByText(key('clickToAddAgent'))).toBeInTheDocument();
});

it('切换编辑记录后，旧智能体详情晚到不会覆盖当前保存目标', async () => {
  let resolveOld!: (value: any) => void;
  vi.mocked(apiPublishedAgentInfo).mockReturnValueOnce(
    new Promise((resolve) => {
      resolveOld = resolve;
    }),
  );
  const { rerender } = render(
    <RecommendFormModal
      open
      editingRecord={record()}
      defaultSort={10}
      {...callbacks}
    />,
  );
  rerender(
    <RecommendFormModal
      open
      editingRecord={record({ id: 2, targetId: 72, label: '当前智能体' })}
      defaultSort={10}
      {...callbacks}
    />,
  );
  resolveOld({ code: '0000', data: { agentId: 71, name: '旧智能体' } });
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() =>
    expect(apiSystemUpdateDisplayRecommend).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, targetId: 72 }),
    ),
  );
});

it('校验和请求进行中只提交一次，接口失败保留提示词供重试', async () => {
  let resolveSave!: (value: any) => void;
  vi.mocked(apiSystemUpdateDisplayRecommend).mockReturnValueOnce(
    new Promise((resolve) => {
      resolveSave = resolve;
    }),
  );
  render(
    <RecommendFormModal
      open
      editingRecord={record({
        prompts: [{ title: '保留标题', content: '保留内容', icon: '' }],
      })}
      defaultSort={10}
      {...callbacks}
    />,
  );
  const save = screen.getByRole('button', { name: '保存' });
  fireEvent.click(save);
  fireEvent.click(save);
  await waitFor(() =>
    expect(apiSystemUpdateDisplayRecommend).toHaveBeenCalledOnce(),
  );
  resolveSave({ code: '1000' });
  await waitFor(() => expect(save).toBeEnabled());
  expect(screen.getByDisplayValue('保留内容')).toBeInTheDocument();
  expect(callbacks.onSuccess).not.toHaveBeenCalled();
  fireEvent.click(save);
  await waitFor(() =>
    expect(apiSystemUpdateDisplayRecommend).toHaveBeenCalledTimes(2),
  );
});
