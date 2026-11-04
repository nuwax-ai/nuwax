/** 审批/版本配置持久化与能力边界合同，保留真实菜单交互。 */
import ChatInputUnified from '@/components/business-component/ChatInputUnified';
import {
  act,
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
  useLocation: () => ({ pathname: '/home', search: '' }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));

vi.mock('@/services/agentDev', () => ({
  apiPublishedAgentInfo: vi.fn(async () => ({ data: undefined })),
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
  default: () => <div data-testid="manual-components" />,
}));
vi.mock('@/components/ChatUploadFile', () => ({ default: () => null }));
vi.mock('@/components/base/SvgIcon', () => ({
  default: () => null,
}));
vi.mock('@/components/PermissionMask', () => ({ default: () => null }));
vi.mock('@/components/business-component/PaymentSubscriptionModal', () => ({
  default: () => null,
}));
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

async function renderInput(props: Record<string, any> = {}) {
  let view: ReturnType<typeof render>;
  // 配置与连接器在挂载后异步回填，交互前等待这些更新完成。
  await act(async () => {
    view = render(
      <ChatInputUnified
        onEnter={vi.fn()}
        agentId={AGENT_ID}
        agentMode="yolo"
        onAgentModeChange={vi.fn()}
        {...props}
      />,
    );
  });
  return view!;
}

/** 点开 + 号弹层，等待菜单的异步挂载完成。 */
async function openPlusMenu() {
  const plusBox = document.querySelector('.plus-box');
  expect(plusBox).toBeTruthy();
  await act(async () => {
    fireEvent.click(plusBox!);
  });
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

describe('+ 号弹层交互', () => {
  it('点击附件行本身只打开一次选择器，禁用时不打开', async () => {
    const { rerender } = await renderInput();
    await openPlusMenu();
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const click = vi.spyOn(fileInput, 'click').mockImplementation(() => {});
    fireEvent.click(screen.getByRole('menuitem', { name: /attachFile/ }));
    expect(click).toHaveBeenCalledTimes(1);
    expect(fileInput).toBeInTheDocument();
    await act(async () => {
      rerender(<ChatInputUnified onEnter={vi.fn()} wholeDisabled />);
    });
    await openPlusMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /attachFile/ }));
    expect(click).toHaveBeenCalledTimes(1);
    click.mockRestore();
  });

  it.each([
    ['versionControlSwitch', { enableVersionControl: 0 }],
    ['autoCommitSwitch', { autoCommit: 0 }],
    ['approvalModeSwitch', { mode: 'ask' }],
  ])('点击 %s 行的留白切换一次且保持菜单展开', async (label, changed) => {
    await renderInput({ agentEnableVersionControl: 1 });
    await openPlusMenu();
    fireEvent.click(
      screen.getByRole('menuitem', { name: new RegExp(label as string) }),
    );
    expect(userConfig.set).toHaveBeenCalledTimes(1);
    expect(userConfig.set).toHaveBeenCalledWith({
      key: `chatbox.config.${AGENT_ID}`,
      value: expect.objectContaining(changed),
    });
    await waitFor(() => expect(screen.getByRole('menu')).toBeVisible());
  });

  it('禁用的开关项点击整行不修改配置', async () => {
    await renderInput({ agentEnableVersionControl: 1, wholeDisabled: true });
    await openPlusMenu();
    for (const label of [
      'versionControlSwitch',
      'autoCommitSwitch',
      'approvalModeSwitch',
    ]) {
      fireEvent.click(
        screen.getByRole('menuitem', { name: new RegExp(label) }),
      );
    }
    expect(userConfig.set).not.toHaveBeenCalled();
  });

  it('连接器入口唤起能力弹窗连接器维度', async () => {
    await renderInput();
    await openPlusMenu();
    fireEvent.click(
      screen.getByText('PC.Components.ChatInputHome.plusMenuConnector'),
    );
    expect(editor.openCapabilityWithType).toHaveBeenCalledWith('connector');
  });

  it('enableMention=false（allowAtSkill 非 1）：隐藏「/ 能力」入口并从能力弹窗开放范围滤除技能', async () => {
    await renderInput({ enableMention: false });
    // 能力弹窗资源类型：技能被收敛（连接器等其余维度保留）
    expect(editor.lastProps.capabilityResourceTypes).not.toContain('skill');
    expect(editor.lastProps.capabilityResourceTypes).toEqual(
      expect.arrayContaining(['connector', 'knowledge']),
    );
    await openPlusMenu();
    // + 号菜单不再有「/ 能力」项，其余入口保留
    expect(
      screen.queryByText('PC.Components.ChatInputHome.slashCapability'),
    ).toBeNull();
    expect(
      screen.getByText('PC.Components.ChatInputHome.attachFile'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('PC.Components.ChatInputHome.plusMenuConnector'),
    ).toBeInTheDocument();
  });

  it('项目智能体锁定时 + 菜单仅提示 @ 文档，专家能力不开放', async () => {
    await renderInput({ atHomePanel: true, showExpertCapability: false });
    expect(editor.lastProps.capabilityResourceTypes).not.toContain('expert');
    await openPlusMenu();
    expect(
      screen.getByText('PC.Components.ChatInputHome.atContextDocs'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('PC.Components.ChatInputHome.atContext'),
    ).toBeNull();
  });

  it('ChatBot 点击 + 直接打开附件选择器，不显示弹层', async () => {
    const onEnter = vi.fn();
    await renderInput({ agentType: 'ChatBot', agentMode: 'ask', onEnter });

    expect(editor.lastProps.enableMention).toBe(false);
    expect(editor.lastProps.atHomePanel).toBe(false);
    expect(editor.lastProps.capabilityResourceTypes).toEqual([]);
    expect(editor.lastProps.placeholder).toBe(
      'PC.Components.ChatInputHomeMentionEditor.placeholderWithoutMention',
    );
    expect(screen.queryByTestId('manual-components')).toBeNull();
    expect(
      screen.queryByText('PC.Components.ChatInputHome.agentModeApproval'),
    ).toBeNull();

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const click = vi.spyOn(fileInput, 'click').mockImplementation(() => {});
    fireEvent.click(document.querySelector('.plus-box')!);
    expect(click).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(
      screen.queryByText('PC.Components.ChatInputHome.atContext'),
    ).toBeNull();
    expect(
      screen.queryByText('PC.Components.ChatInputHome.slashCapability'),
    ).toBeNull();
    expect(
      screen.queryByText('PC.Components.ChatInputHome.plusMenuConnector'),
    ).toBeNull();
    expect(
      screen.queryByText('PC.Components.ChatInputHome.versionControlSwitch'),
    ).toBeNull();
    expect(
      screen.queryByText('PC.Components.ChatInputHome.approvalModeSwitch'),
    ).toBeNull();

    act(() => {
      editor.lastProps.onChange('测试问题');
      editor.lastProps.onSkillIdsChange([11]);
      editor.lastProps.onDocsChange([{ slugId: 12 }]);
      editor.lastProps.onExpertSelect({ targetId: 13, name: '专家' });
    });
    act(() => editor.lastProps.onPressEnter());
    expect(onEnter).toHaveBeenCalledWith(
      '测试问题',
      [],
      [],
      undefined,
      'ask',
      [],
      [],
    );
    click.mockRestore();
  });

  it('智能体类型加载期间按 ChatBot 能力边界处理', async () => {
    await renderInput({ agentTypeLoading: true });
    expect(editor.lastProps.enableMention).toBe(false);
    expect(editor.lastProps.placeholder).toBe(
      'PC.Components.ChatInputHomeMentionEditor.placeholderWithoutMention',
    );
    expect(screen.queryByTestId('manual-components')).toBeNull();
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const click = vi.spyOn(fileInput, 'click').mockImplementation(() => {});
    fireEvent.click(document.querySelector('.plus-box')!);
    expect(click).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(
      screen.queryByText('PC.Components.ChatInputHome.atContext'),
    ).toBeNull();
    click.mockRestore();
  });
});

describe('开关持久化（chatbox.config.{agentId} 全量写入）', () => {
  it('切审批开关：同步宿主 mode 并按 ask 全量写入', async () => {
    const onAgentModeChange = vi.fn();
    await renderInput({ agentEnableVersionControl: 1, onAgentModeChange });
    await openPlusMenu();

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
    await renderInput({ agentEnableVersionControl: 1 });
    await openPlusMenu();

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

  it('切变更自动提交开关：仅改 autoCommit 位', async () => {
    await renderInput({ agentEnableVersionControl: 1 });
    await openPlusMenu();

    fireEvent.click(
      screen.getByText('PC.Components.ChatInputHome.autoCommitSwitch'),
    );
    expect(userConfig.set).toHaveBeenCalledWith({
      key: `chatbox.config.${AGENT_ID}`,
      value: { mode: 'yolo', enableVersionControl: 1, autoCommit: 0 },
    });
  });

  it('无 agentId 时仅内存态，不写服务端', async () => {
    await renderInput({ agentId: undefined });
    await openPlusMenu();
    fireEvent.click(
      screen.getByText('PC.Components.ChatInputHome.approvalModeSwitch'),
    );
    expect(userConfig.set).not.toHaveBeenCalled();
  });
});

describe('服务端配置回填', () => {
  it('未配置过：enableVersionControl 用 agent 默认值、autoCommit 默认开，不写服务端', async () => {
    await renderInput({ agentEnableVersionControl: 1 });
    await waitFor(() =>
      expect(userConfig.get).toHaveBeenCalledWith(`chatbox.config.${AGENT_ID}`),
    );
    expect(userConfig.set).not.toHaveBeenCalled();
    // 默认值驱动开关行（自动提交行显示 = ev=1）
    await openPlusMenu();
    expect(
      screen.getByText('PC.Components.ChatInputHome.autoCommitSwitch'),
    ).toBeInTheDocument();
  });

  it('已有配置：回填两键开关并把 mode 同步宿主（服务端优先）', async () => {
    const onAgentModeChange = vi.fn();
    userConfig.get.mockResolvedValue({
      data: { mode: 'ask', enableVersionControl: 1, autoCommit: 0 },
    });
    await renderInput({ agentEnableVersionControl: 0, onAgentModeChange });

    await waitFor(() => expect(onAgentModeChange).toHaveBeenCalledWith('ask'));
    await openPlusMenu();
    // 回填覆盖 agent 默认（ev=1）→ 自动提交行显示
    expect(
      screen.getByText('PC.Components.ChatInputHome.autoCommitSwitch'),
    ).toBeInTheDocument();
  });

  it('读取失败静默：回落默认值不抛错', async () => {
    userConfig.get.mockRejectedValue(new Error('network'));
    await renderInput({ agentEnableVersionControl: 0 });
    await openPlusMenu();
    await waitFor(() => expect(userConfig.get).toHaveBeenCalled());
    expect(
      screen.getByText('PC.Components.ChatInputHome.versionControlSwitch'),
    ).toBeInTheDocument();
  });
});

describe('审批模式回执 pill', () => {
  it('关闭审批模式回执即切回自动并写入', async () => {
    const onAgentModeChange = vi.fn();
    await renderInput({ agentMode: 'ask', onAgentModeChange });

    fireEvent.click(document.querySelector('.approval-pill-close')!);
    expect(onAgentModeChange).toHaveBeenCalledWith('yolo');
    expect(userConfig.set).toHaveBeenCalledWith({
      key: `chatbox.config.${AGENT_ID}`,
      value: { mode: 'yolo', enableVersionControl: 0, autoCommit: 1 },
    });
  });
});
