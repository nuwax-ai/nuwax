/**
 * ChatInputUnified + 号弹层测试：
 * 审批/自动从 footer 模式下拉迁入 + 弹层后的行为——
 * 弹层菜单结构（四入口 + 分隔线 + 开关组）、三个开关的受控与持久化
 * （chatbox.config.{agentId} 全量写入）、审批模式回执 pill（ask 显示、x 切回 yolo）、
 * 服务端配置回填（含 mode 同步宿主）与未配置默认值（agent 的 enableVersionControl、
 * autoCommit 默认开）。
 * 桩法对齐 chatInputUnified.home.test.tsx：services/umi 一律 mock，子组件以捕获 props 的桩替代。
 */
import ChatInputUnified from '@/components/business-component/ChatInputUnified';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ChatInputHome/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

vi.mock('umi', () => ({
  useModel: () => ({ tenantConfigInfo: { enableSubscription: 0 } }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/hooks/useSubscription', () => ({
  default: () => ({
    createSubscriptionOrder: vi.fn(),
    querySkillSubscriptionPlans: vi.fn(),
    loadingTargetPricing: false,
    targetSubscriptionPlans: [],
    mySubscriptionInfo: null,
    loadingMySubscription: false,
  }),
}));

// 编辑器桩：暴露 openCapabilityWithType 间谍（连接器菜单项入口）
const editor = vi.hoisted(() => ({
  focus: vi.fn(),
  clear: vi.fn(),
  openCapabilityWithType: vi.fn(),
  lastProps: {} as Record<string, any>,
}));
vi.mock('@/components/ChatInputHome/MentionEditor', async () => {
  const React = await import('react');
  return {
    DEFAULT_CAPABILITY_RESOURCE_TYPES: ['skill', 'connector', 'knowledge'],
    default: React.forwardRef((props: any, ref: any) => {
      editor.lastProps = props;
      React.useImperativeHandle(ref, () => ({
        focus: editor.focus,
        clear: editor.clear,
        openCapabilityWithType: editor.openCapabilityWithType,
      }));
      return React.createElement('div', { 'data-testid': 'mention-editor' });
    }),
  };
});

const connectorPage = vi.hoisted(() => vi.fn());
vi.mock('@/services/systemManage', () => ({
  apiConnectorProviderPageList: connectorPage,
}));

// 会话框配置接口桩：默认未配置（data null），按用例覆写
const userConfig = vi.hoisted(() => ({
  get: vi.fn().mockResolvedValue({ data: null }),
  set: vi.fn().mockResolvedValue({ code: '0000' }),
}));
vi.mock('@/services/userConfig', () => ({
  apiUserConfigGet: (key: string) => userConfig.get(key),
  apiUserConfigSet: (data: any) => userConfig.set(data),
  chatboxConfigKey: (agentId: number | string) => `chatbox.config.${agentId}`,
}));

vi.mock('@/components/ChatInputHome/ComputerTypeSelector', () => ({
  default: () => null,
}));
vi.mock('@/components/ChatInputHome/WorkspaceDirPickerModal', () => ({
  default: () => null,
}));
vi.mock('@/components/ChatInputHome/SpaceSelector', () => ({
  default: () => null,
}));
vi.mock('@/components/ChatInputHome/ModelSelector', () => ({
  default: () => null,
}));
vi.mock('@/components/ChatInputHome/ManualComponentItem', () => ({
  default: () => null,
}));
vi.mock('@/components/ChatUploadFile', () => ({ default: () => null }));
vi.mock('@/components/base/SvgIcon', () => ({
  default: () => null,
}));
vi.mock('@/components/PermissionMask', () => ({ default: () => null }));
vi.mock('@/components/business-component/PaymentSubscriptionModal', () => ({
  default: () => null,
}));
vi.mock(
  '@/components/business-component/ChatInputUnified/ConversationDebugFab',
  () => ({ default: () => null }),
);

// 语音底座桩：子槽原样透传（isVoiceActive=false）
vi.mock('@/components/business-component/VoiceInput', async () => {
  const React = await import('react');
  const wrap = (testid: string) => (props: any) =>
    React.createElement(
      'div',
      { 'data-testid': testid },
      props.children ?? null,
    );
  return {
    ChatInputVoiceFooter: {
      Provider: ({ children }: any) =>
        typeof children === 'function' ? children(false) : children,
      HideWhenActive: wrap('voice-hide'),
      Expand: wrap('voice-expand'),
      Right: ({ children, defaultActions }: any) =>
        React.createElement(
          'div',
          { 'data-testid': 'voice-right' },
          defaultActions ?? null,
          children ?? null,
        ),
    },
    mergeVoiceTranscript: (prev: string, next: string) => prev + next,
  };
});

const AGENT_ID = 101;

function renderInput(props: Record<string, any> = {}) {
  return render(
    <ChatInputUnified
      onEnter={vi.fn()}
      agentId={AGENT_ID}
      agentMode="yolo"
      onAgentModeChange={vi.fn()}
      {...props}
    />,
  );
}

/** 点开 + 号弹层（菜单渲染在 body portal） */
function openPlusMenu() {
  const plusBox = document.querySelector('.plus-box');
  expect(plusBox).toBeTruthy();
  fireEvent.click(plusBox!);
  // 菜单项渲染到 portal 后再返回，供用例断言
  expect(
    screen.getByText('PC.Components.ChatInputHome.attachFile'),
  ).toBeInTheDocument();
}

beforeEach(() => {
  vi.clearAllMocks();
  userConfig.get.mockResolvedValue({ data: null });
  userConfig.set.mockResolvedValue({ code: '0000' });
  connectorPage.mockResolvedValue({
    code: '0000',
    data: { records: [], pageNum: 1 },
  });
  localStorage.clear();
});

afterEach(cleanup);

describe('+ 号弹层结构', () => {
  it('渲染四入口 + 分隔线 + 产物版本管理/审批模式开关（未配置时无自动提交行）', () => {
    renderInput({ agentEnableVersionControl: 0 });
    openPlusMenu();

    // 四个入口
    expect(
      screen.getByText('PC.Components.ChatInputHome.attachFile'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('PC.Components.ChatInputHome.atContext'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('PC.Components.ChatInputHome.slashCapability'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('PC.Components.ChatInputHome.plusMenuConnector'),
    ).toBeInTheDocument();
    // 分隔线
    expect(
      document.querySelector('.ant-dropdown-menu-item-divider'),
    ).toBeTruthy();
    // 产物版本管理 / 审批模式恒显示
    expect(
      screen.getByText('PC.Components.ChatInputHome.versionControlSwitch'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('PC.Components.ChatInputHome.approvalModeSwitch'),
    ).toBeInTheDocument();
    // 版本管理默认关 → 无变更自动提交行
    expect(
      screen.queryByText('PC.Components.ChatInputHome.autoCommitSwitch'),
    ).not.toBeInTheDocument();
  });

  it('版本管理开启（agent 默认或服务端配置）时显示变更自动提交行', async () => {
    renderInput({ agentEnableVersionControl: 1 });
    openPlusMenu();
    await waitFor(() =>
      expect(
        screen.getByText('PC.Components.ChatInputHome.autoCommitSwitch'),
      ).toBeInTheDocument(),
    );
  });

  it('连接器入口唤起能力弹窗连接器维度', () => {
    renderInput();
    openPlusMenu();
    fireEvent.click(
      screen.getByText('PC.Components.ChatInputHome.plusMenuConnector'),
    );
    expect(editor.openCapabilityWithType).toHaveBeenCalledWith('connector');
  });
});

describe('开关持久化（chatbox.config.{agentId} 全量写入）', () => {
  it('切审批开关：同步宿主 mode 并按 ask 全量写入', () => {
    const onAgentModeChange = vi.fn();
    renderInput({ agentEnableVersionControl: 1, onAgentModeChange });
    openPlusMenu();

    fireEvent.click(
      screen.getByText('PC.Components.ChatInputHome.approvalModeSwitch'),
    );
    expect(onAgentModeChange).toHaveBeenCalledWith('ask');
    expect(userConfig.set).toHaveBeenCalledWith({
      key: `chatbox.config.${AGENT_ID}`,
      value: { mode: 'ask', enableVersionControl: 1, autoCommit: 1 },
    });
  });

  it('切产物版本管理开关：写 0 并收起自动提交行', async () => {
    renderInput({ agentEnableVersionControl: 1 });
    openPlusMenu();

    fireEvent.click(
      screen.getByText('PC.Components.ChatInputHome.versionControlSwitch'),
    );
    expect(userConfig.set).toHaveBeenCalledWith({
      key: `chatbox.config.${AGENT_ID}`,
      value: { mode: 'yolo', enableVersionControl: 0, autoCommit: 1 },
    });
    // 菜单收起自动提交行（React 状态更新后）
    await waitFor(() =>
      expect(
        screen.queryByText('PC.Components.ChatInputHome.autoCommitSwitch'),
      ).not.toBeInTheDocument(),
    );
  });

  it('切变更自动提交开关：仅改 autoCommit 位', () => {
    renderInput({ agentEnableVersionControl: 1 });
    openPlusMenu();

    fireEvent.click(
      screen.getByText('PC.Components.ChatInputHome.autoCommitSwitch'),
    );
    expect(userConfig.set).toHaveBeenCalledWith({
      key: `chatbox.config.${AGENT_ID}`,
      value: { mode: 'yolo', enableVersionControl: 1, autoCommit: 0 },
    });
  });

  it('无 agentId 时仅内存态，不写服务端', () => {
    const { rerender } = render(
      <ChatInputUnified onEnter={vi.fn()} agentMode="yolo" />,
    );
    const plusBox = document.querySelector('.plus-box');
    fireEvent.click(plusBox!);
    fireEvent.click(
      screen.getByText('PC.Components.ChatInputHome.approvalModeSwitch'),
    );
    expect(userConfig.set).not.toHaveBeenCalled();
    rerender(<ChatInputUnified onEnter={vi.fn()} agentMode="yolo" />);
  });
});

describe('服务端配置回填', () => {
  it('未配置过：enableVersionControl 用 agent 默认值、autoCommit 默认开，不写服务端', async () => {
    renderInput({ agentEnableVersionControl: 1 });
    await waitFor(() =>
      expect(userConfig.get).toHaveBeenCalledWith(`chatbox.config.${AGENT_ID}`),
    );
    expect(userConfig.set).not.toHaveBeenCalled();
    // 默认值驱动开关行（自动提交行显示 = ev=1）
    openPlusMenu();
    expect(
      screen.getByText('PC.Components.ChatInputHome.autoCommitSwitch'),
    ).toBeInTheDocument();
  });

  it('已有配置：回填两键开关并把 mode 同步宿主（服务端优先）', async () => {
    const onAgentModeChange = vi.fn();
    userConfig.get.mockResolvedValue({
      data: { mode: 'ask', enableVersionControl: 1, autoCommit: 0 },
    });
    renderInput({ agentEnableVersionControl: 0, onAgentModeChange });

    await waitFor(() => expect(onAgentModeChange).toHaveBeenCalledWith('ask'));
    openPlusMenu();
    // 回填覆盖 agent 默认（ev=1）→ 自动提交行显示
    expect(
      screen.getByText('PC.Components.ChatInputHome.autoCommitSwitch'),
    ).toBeInTheDocument();
  });

  it('读取失败静默：回落默认值不抛错', async () => {
    userConfig.get.mockRejectedValue(new Error('network'));
    renderInput({ agentEnableVersionControl: 0 });
    openPlusMenu();
    await waitFor(() => expect(userConfig.get).toHaveBeenCalled());
    expect(
      screen.getByText('PC.Components.ChatInputHome.versionControlSwitch'),
    ).toBeInTheDocument();
  });
});

describe('审批模式回执 pill', () => {
  it('mode=ask 时 + 号旁显示，x 关闭即切回自动并写入', () => {
    const onAgentModeChange = vi.fn();
    renderInput({ agentMode: 'ask', onAgentModeChange });

    const pill = document.querySelector('.approval-pill');
    expect(pill).toBeTruthy();
    expect(
      screen.getByText('PC.Components.ChatInputHome.agentModeApproval'),
    ).toBeInTheDocument();

    fireEvent.click(document.querySelector('.approval-pill-close')!);
    expect(onAgentModeChange).toHaveBeenCalledWith('yolo');
    expect(userConfig.set).toHaveBeenCalledWith({
      key: `chatbox.config.${AGENT_ID}`,
      value: { mode: 'yolo', enableVersionControl: 0, autoCommit: 1 },
    });
  });

  it('mode=yolo 时不显示', () => {
    renderInput({ agentMode: 'yolo' });
    expect(document.querySelector('.approval-pill')).toBeNull();
  });
});
