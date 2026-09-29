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
  within,
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
  default: ({ open, children, onConfirm, onCancel, loading, title }: any) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
        <button type="button" onClick={onCancel}>
          取消
        </button>
        <button type="button" disabled={loading} onClick={onConfirm}>
          保存
        </button>
      </div>
    ) : null,
}));
vi.mock('@/components/UploadAvatar', () => ({
  default: ({ imageUrl, onUploadSuccess, defaultImage, svgIconName }: any) => (
    <button
      type="button"
      aria-label="上传图标"
      data-default-image={defaultImage || ''}
      data-default-svg={svgIconName || ''}
      onClick={() => onUploadSuccess?.('/prompt-icon.png')}
    >
      {imageUrl || '空图标'}
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
vi.mock(
  '@/pages/SystemManagement/RecommendManage/components/RecommendFormModal/PromptSettingsModal/index.less',
  () => ({
    default: new Proxy({}, { get: (_, key) => String(key) }),
  }),
);

const key = (name: string) => `PC.Pages.SystemRecommendManage.${name}`;
const callbacks = { onCancel: vi.fn(), onSuccess: vi.fn() };
const openPromptSettings = (index = 0) => {
  fireEvent.click(
    screen.getAllByRole('button', { name: key('editPrompt') })[index],
  );
  return within(
    screen.getByRole('dialog', { name: key('promptSettingsTitle') }),
  );
};
const applyPromptSettings = async (
  settings: ReturnType<typeof openPromptSettings>,
) => {
  fireEvent.click(settings.getByRole('button', { name: '保存' }));
  await waitFor(() =>
    expect(
      screen.queryByRole('dialog', { name: key('promptSettingsTitle') }),
    ).toBeNull(),
  );
};
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
  const settings = openPromptSettings();
  fireEvent.change(
    settings.getByPlaceholderText(key('promptTitlePlaceholder')),
    { target: { value: '  提示标题  ' } },
  );
  fireEvent.change(
    settings.getByPlaceholderText(key('promptContentPlaceholder')),
    {
      target: { value: '第一条完整内容\n保留换行' },
    },
  );
  fireEvent.click(settings.getByRole('button', { name: '上传图标' }));
  await applyPromptSettings(settings);
  fireEvent.change(
    screen.getAllByPlaceholderText(key('promptContentPlaceholder'))[1],
    { target: { value: '第二条完整内容' } },
  );
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

it('删除并重新添加嵌套字段后，保留其他提示词的图标和多行内容', async () => {
  render(
    <RecommendFormModal
      open
      editingRecord={record({
        prompts: [
          { title: '保留标题', content: '第一行\n第二行', icon: '' },
          { title: '删除标题', content: '删除内容', icon: '/removed.png' },
        ],
      })}
      defaultSort={10}
      {...callbacks}
    />,
  );
  const settings = openPromptSettings();
  fireEvent.click(settings.getByRole('button', { name: '上传图标' }));
  await applyPromptSettings(settings);
  fireEvent.click(
    screen.getAllByRole('button', { name: key('removePrompt') })[1],
  );
  fireEvent.click(screen.getByRole('button', { name: key('addPrompt') }));
  fireEvent.change(
    screen.getAllByPlaceholderText(key('promptContentPlaceholder'))[1],
    { target: { value: '新内容' } },
  );
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() =>
    expect(apiSystemUpdateDisplayRecommend).toHaveBeenCalledWith(
      expect.objectContaining({
        prompts: [
          {
            title: '保留标题',
            content: '第一行\n第二行',
            icon: '/prompt-icon.png',
          },
          { title: '', content: '新内容', icon: '' },
        ],
      }),
    ),
  );
});

it('删除前项后，后项嵌套字段按稳定 key 保留完整数据', async () => {
  render(
    <RecommendFormModal
      open
      editingRecord={record({
        prompts: [
          { title: '删除标题', content: '删除内容', icon: '/removed.png' },
          { title: '保留标题', content: '保留内容', icon: '/kept.png' },
        ],
      })}
      defaultSort={10}
      {...callbacks}
    />,
  );
  fireEvent.click(
    screen.getAllByRole('button', { name: key('removePrompt') })[0],
  );
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() =>
    expect(apiSystemUpdateDisplayRecommend).toHaveBeenCalledWith(
      expect.objectContaining({
        prompts: [
          { title: '保留标题', content: '保留内容', icon: '/kept.png' },
        ],
      }),
    ),
  );
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
  const settings = openPromptSettings();
  expect(settings.getByText('/old.png')).toBeInTheDocument();
  fireEvent.click(
    settings.getByRole('button', { name: key('clearPromptIcon') }),
  );
  expect(settings.queryByText('/old.png')).toBeNull();
  await applyPromptSettings(settings);
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

it('图标默认不预置图片，上传后可清除且提交空图标', async () => {
  render(
    <RecommendFormModal
      open
      editingRecord={record({
        prompts: [{ title: '标题', content: '内容', icon: '' }],
      })}
      defaultSort={10}
      {...callbacks}
    />,
  );
  const settings = openPromptSettings();
  const upload = settings.getByRole('button', { name: '上传图标' });
  expect(upload).toHaveAttribute('data-default-image', '');
  expect(upload).toHaveAttribute('data-default-svg', '');
  expect(
    settings.queryByRole('button', { name: key('clearPromptIcon') }),
  ).toBeNull();
  fireEvent.click(upload);
  fireEvent.click(
    settings.getByRole('button', { name: key('clearPromptIcon') }),
  );
  expect(
    settings.queryByRole('button', { name: key('clearPromptIcon') }),
  ).toBeNull();
  await applyPromptSettings(settings);
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() =>
    expect(apiSystemUpdateDisplayRecommend).toHaveBeenCalledWith(
      expect.objectContaining({
        prompts: [{ title: '标题', content: '内容', icon: '' }],
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

it('设置弹窗拒绝纯空白内容，修正后回填完整内容并允许标题和图标为空', async () => {
  render(
    <RecommendFormModal
      open
      editingRecord={record()}
      defaultSort={10}
      {...callbacks}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: key('addPrompt') }));
  const settings = openPromptSettings();
  const content = settings.getByPlaceholderText(
    key('promptContentPlaceholder'),
  );
  fireEvent.change(content, { target: { value: ' \n ' } });
  fireEvent.click(settings.getByRole('button', { name: '保存' }));
  expect(
    await settings.findByText(key('promptContentRequired')),
  ).toBeInTheDocument();
  expect(apiSystemUpdateDisplayRecommend).not.toHaveBeenCalled();
  fireEvent.change(content, { target: { value: '第一行\n完整的第二行' } });
  await applyPromptSettings(settings);
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() =>
    expect(apiSystemUpdateDisplayRecommend).toHaveBeenCalledWith(
      expect.objectContaining({
        prompts: [{ title: '', content: '第一行\n完整的第二行', icon: '' }],
      }),
    ),
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

it.each([false, true])(
  '接口抛出 BizError 时捕获异常并保留数据，可重试（编辑模式：%s）',
  async (isEdit) => {
    const api = vi.mocked(
      isEdit ? apiSystemUpdateDisplayRecommend : apiSystemSaveDisplayRecommend,
    );
    const error = new Error('相同功能类型、推荐类型、目标类型和目标已存在');
    error.name = 'BizError';
    api.mockRejectedValueOnce(error);
    render(
      <RecommendFormModal
        open
        editingRecord={
          isEdit
            ? record({
                prompts: [{ title: '保留标题', content: '保留内容', icon: '' }],
              })
            : undefined
        }
        defaultSort={10}
        {...callbacks}
      />,
    );
    if (!isEdit) {
      fireEvent.click(screen.getByText(key('clickToAddAgent')));
      fireEvent.click(screen.getByRole('button', { name: '选择智能体' }));
      fireEvent.click(screen.getByRole('button', { name: key('addPrompt') }));
      const settings = openPromptSettings();
      fireEvent.change(
        settings.getByPlaceholderText(key('promptTitlePlaceholder')),
        {
          target: { value: '保留标题' },
        },
      );
      fireEvent.change(
        settings.getByPlaceholderText(key('promptContentPlaceholder')),
        { target: { value: '保留内容' } },
      );
      await applyPromptSettings(settings);
    }
    const save = screen.getByRole('button', { name: '保存' });
    fireEvent.click(save);
    await waitFor(() => expect(api).toHaveBeenCalledOnce());
    await waitFor(() => expect(save).toBeEnabled());
    expect(screen.getByDisplayValue('保留标题')).toBeInTheDocument();
    expect(screen.getByDisplayValue('保留内容')).toBeInTheDocument();
    expect(callbacks.onSuccess).not.toHaveBeenCalled();
    expect(callbacks.onCancel).not.toHaveBeenCalled();
    fireEvent.click(save);
    await waitFor(() => expect(api).toHaveBeenCalledTimes(2));
    expect(api).toHaveBeenLastCalledWith(
      expect.objectContaining({
        prompts: [{ title: '保留标题', content: '保留内容', icon: '' }],
      }),
    );
    expect(callbacks.onSuccess).toHaveBeenCalledOnce();
  },
);

it('设置取消不覆盖原图标、标题和多行内容', async () => {
  const prompt = {
    title: '原标题',
    content: '第一行\n第二行',
    icon: '/old.png',
  };
  render(
    <RecommendFormModal
      open
      editingRecord={record({ prompts: [prompt] })}
      defaultSort={10}
      {...callbacks}
    />,
  );
  const settings = openPromptSettings();
  fireEvent.change(
    settings.getByPlaceholderText(key('promptTitlePlaceholder')),
    { target: { value: '未保存标题' } },
  );
  fireEvent.change(
    settings.getByPlaceholderText(key('promptContentPlaceholder')),
    { target: { value: '未保存内容' } },
  );
  fireEvent.click(settings.getByRole('button', { name: '上传图标' }));
  fireEvent.click(settings.getByRole('button', { name: '取消' }));
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() =>
    expect(apiSystemUpdateDisplayRecommend).toHaveBeenCalledWith(
      expect.objectContaining({ prompts: [prompt] }),
    ),
  );
});

it('删除前项后设置剩余问题，更新正确的嵌套字段', async () => {
  render(
    <RecommendFormModal
      open
      editingRecord={record({
        prompts: [
          { title: '删除项', content: '删除内容', icon: '' },
          { title: '保留项', content: '保留内容', icon: '/keep.png' },
        ],
      })}
      defaultSort={10}
      {...callbacks}
    />,
  );
  fireEvent.click(
    screen.getAllByRole('button', { name: key('removePrompt') })[0],
  );
  const settings = openPromptSettings();
  fireEvent.change(
    settings.getByPlaceholderText(key('promptTitlePlaceholder')),
    { target: { value: '更新标题' } },
  );
  fireEvent.change(
    settings.getByPlaceholderText(key('promptContentPlaceholder')),
    { target: { value: '更新内容\n保留换行' } },
  );
  await applyPromptSettings(settings);
  fireEvent.click(screen.getByRole('button', { name: '保存' }));
  await waitFor(() =>
    expect(apiSystemUpdateDisplayRecommend).toHaveBeenCalledWith(
      expect.objectContaining({
        prompts: [
          {
            title: '更新标题',
            content: '更新内容\n保留换行',
            icon: '/keep.png',
          },
        ],
      }),
    ),
  );
});
