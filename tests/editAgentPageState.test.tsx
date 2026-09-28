import EditAgent from '@/pages/EditAgent';
import { PublishStatusEnum } from '@/types/enums/common';
import { AgentTypeEnum } from '@/types/enums/space';
import type { AgentConfigInfo } from '@/types/interfaces/agent';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  agentId: '3937',
  read: vi.fn(),
  save: vi.fn(),
  queryConversation: vi.fn(),
  refreshFiles: vi.fn(),
  changeAgent: undefined as
    | undefined
    | ((value: string | number, attr: string) => Promise<void>),
  conversationModel: {} as Record<string, unknown>,
}));

vi.mock('umi', () => {
  // 模拟 model 的稳定引用，避免变量同步 effect 因每次 render 生成新数组而循环。
  const tenantModel = { setTitle: vi.fn() };
  const spaceModel = { agentComponentList: [] };
  const chatModel = {
    pagePreviewData: null,
    hidePagePreview: vi.fn(),
    showPagePreview: vi.fn(),
  };
  return {
    useParams: () => ({ spaceId: '752', agentId: h.agentId }),
    useLocation: () => ({
      pathname: `/space/752/agent/${h.agentId}`,
      search: '',
    }),
    useModel: (name: string) => {
      if (name === 'conversationInfo') return h.conversationModel;
      if (name === 'tenantConfigInfo') return tenantModel;
      if (name === 'spaceAgent') return spaceModel;
      return chatModel;
    },
    history: { push: vi.fn() },
  };
});
vi.mock('@/services/agentConfig', () => ({
  apiAgentConfigInfo: h.read,
  apiAgentConfigUpdate: h.save,
  apiAgentComponentModelUpdate: vi.fn(),
}));
vi.mock('@/services/modelConfig', () => ({
  apiModelList: vi.fn().mockResolvedValue({ data: [] }),
}));
vi.mock('@/services/vncDesktop', () => ({
  apiDownloadAllFiles: vi.fn(),
  apiUpdateStaticFile: vi.fn(),
  apiUploadFiles: vi.fn(),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));
vi.mock('@/pages/EditAgent/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/business-component/AppPageState/index.less', () => ({
  default: { pageState: 'app-page-state' },
}));
vi.mock('@/components/business-component/AppDevEmptyState/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/hooks/useUnifiedTheme', () => ({
  default: () => ({ navigationStyle: 'style2' }),
}));
vi.mock('@/hooks/useTerminalWsUrl', () => ({
  useTerminalWsUrl: () => undefined,
}));
vi.mock('@/utils', () => ({ checkFileSizeExceedLimit: vi.fn() }));
vi.mock('@/utils/common', () => ({ addBaseTarget: vi.fn() }));
vi.mock('@/utils/ant-custom', () => ({ modalConfirm: vi.fn() }));
vi.mock('@/components/business-component', () => ({
  ConversationBottomConsole: () => null,
  FileTreeViewPanel: () => null,
}));
vi.mock('@/components/business-component/PagePreviewIframe', () => ({
  default: () => null,
}));
vi.mock('@/components/CreateAgent', () => ({ default: () => null }));
vi.mock('@/components/PublishComponentModal', () => ({ default: () => null }));
vi.mock('@/components/ShowStand', () => ({ default: () => null }));
vi.mock('@/components/VersionHistory', () => ({ default: () => null }));
vi.mock('@/components/custom/Loading', () => ({
  default: () => <div>loading</div>,
}));
vi.mock('@/components/ResizableSplit', () => ({ default: () => null }));
vi.mock('@/pages/SpaceDevelop/AnalyzeStatistics', () => ({
  default: () => null,
}));
vi.mock('@/pages/SpaceDevelop/CreateTempChatModal', () => ({
  default: () => null,
}));
vi.mock('@/pages/EditAgent/AgentArrangeConfig', () => ({
  default: ({ onChangeAgent }: { onChangeAgent: typeof h.changeAgent }) => {
    h.changeAgent = onChangeAgent;
    return <div data-testid="agent-arrange" />;
  },
}));
vi.mock('@/pages/EditAgent/AgentHeader', () => ({
  default: ({ agentConfigInfo }: { agentConfigInfo: AgentConfigInfo }) => (
    <div data-testid="saved-time">{agentConfigInfo.modified}</div>
  ),
}));
vi.mock('@/pages/EditAgent/SystemTipsWord', async () => {
  const { forwardRef } = await import('react');
  return { default: forwardRef(() => null) };
});
vi.mock('@/pages/EditAgent/AgentFlowCanvas', async () => {
  const { forwardRef } = await import('react');
  return { default: forwardRef(() => null) };
});
vi.mock('@/pages/EditAgent/AgentModelSetting', () => ({ default: () => null }));
vi.mock('@/pages/EditAgent/ArrangeTitle', () => ({ default: () => null }));
vi.mock('@/pages/EditAgent/DebugDetails', () => ({ default: () => null }));
vi.mock('@/pages/EditAgent/PreviewAndDebug', () => ({ default: () => null }));
vi.mock('@/pages/EditAgent/SubscriptionSetting', () => ({
  default: () => null,
}));
vi.mock('@/pages/EditAgent/SubscriptionStats', () => ({ default: () => null }));

const savedTime = '2026-09-28T17:36:00';
const permissionError = Object.assign(new Error('无此资源权限'), {
  name: 'BizError',
  info: { code: '4033', message: '无此资源权限', tid: 'permission-trace' },
});

async function loadAgent() {
  const view = render(<EditAgent />);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(350);
  });
  return view;
}

describe('智能体编排页错误状态', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    h.agentId = '3937';
    h.changeAgent = undefined;
    h.conversationModel = {
      messageList: [],
      closePreviewView: vi.fn(),
      setIsLoadingOtherInterface: vi.fn(),
      setIsSuggest: vi.fn(),
      setChatSuggestList: vi.fn(),
      setIsLoadingConversation: vi.fn(),
      runQueryConversation: h.queryConversation,
      refreshFileListImmediately: h.refreshFiles,
    };
    h.read.mockImplementation(async (id: number) => ({
      code: '0000',
      data: {
        id,
        type: AgentTypeEnum.ChatBot,
        systemPrompt: '原始提示词',
        openingChatMsg: '原始开场白',
        devConversationId: 777,
        modified: savedTime,
        publishStatus: PublishStatusEnum.Published,
      },
    }));
    h.save.mockResolvedValue({ code: '0000', success: true, data: null });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it.each([
    permissionError,
    { name: 'BizError', info: { code: '4030' } },
    { response: { status: 403 } },
  ])('读取权限失败展示无权限状态：%j', async (error) => {
    h.read.mockRejectedValue(error);
    await loadAgent();
    expect(
      screen.getByText('PC.Components.AppDevEmptyState.permissionDeniedTitle'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('agent-arrange')).toBeNull();
  });

  it('普通读取失败展示加载错误，不误报无权限', async () => {
    h.read.mockRejectedValue(new Error('network'));
    await loadAgent();
    expect(
      screen.getByText('PC.Components.AppDevEmptyState.errorTitle'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        'PC.Components.AppDevEmptyState.permissionDeniedTitle',
      ),
    ).toBeNull();
  });

  it('保存权限拒绝被捕获，展示无权限状态并停止成功副作用', async () => {
    h.save.mockRejectedValue(permissionError);
    await loadAgent();
    let update: Promise<void>;
    await act(async () => {
      update = h.changeAgent!('新开场白', 'openingChatMsg');
      await vi.advanceTimersByTimeAsync(650);
    });
    await expect(update!).resolves.toBeUndefined();
    expect(
      screen.getByText('PC.Components.AppDevEmptyState.permissionDeniedTitle'),
    ).toBeInTheDocument();
    expect(h.queryConversation).not.toHaveBeenCalled();
    expect(h.refreshFiles).not.toHaveBeenCalled();
  });

  it('普通保存失败保留编排页面和原保存时间', async () => {
    h.save.mockRejectedValue(new Error('network'));
    await loadAgent();
    let update: Promise<void>;
    await act(async () => {
      update = h.changeAgent!('新开场白', 'openingChatMsg');
      await vi.advanceTimersByTimeAsync(650);
    });
    await expect(update!).resolves.toBeUndefined();
    expect(screen.getByTestId('agent-arrange')).toBeInTheDocument();
    expect(screen.getByTestId('saved-time')).toHaveTextContent(savedTime);
    expect(h.queryConversation).not.toHaveBeenCalled();
  });

  it('保存成功后更新时间并刷新开场白会话', async () => {
    await loadAgent();
    await act(async () => {
      const update = h.changeAgent!('新开场白', 'openingChatMsg');
      await vi.advanceTimersByTimeAsync(650);
      await update;
    });
    expect(screen.getByTestId('saved-time')).not.toHaveTextContent(savedTime);
    expect(h.queryConversation).toHaveBeenCalledWith(777);
  });

  it('切换智能体后清除上一资源的错误状态', async () => {
    h.read.mockRejectedValueOnce(permissionError);
    const view = await loadAgent();
    expect(
      screen.getByText('PC.Components.AppDevEmptyState.permissionDeniedTitle'),
    ).toBeInTheDocument();
    h.agentId = '3938';
    view.rerender(<EditAgent />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(screen.getByTestId('agent-arrange')).toBeInTheDocument();
    expect(
      screen.queryByText(
        'PC.Components.AppDevEmptyState.permissionDeniedTitle',
      ),
    ).toBeNull();
  });
});
