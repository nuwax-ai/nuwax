/**
 * ChatInputUnified 首页场景测试：
 * 统一输入框在 /home（无会话）场景下的能力开关与行为——
 * 工作目录栏渲染条件、cloudOnly 透传、切云清目录、空间选择器、推荐标签 pill、
 * ref 清空/聚焦、'home' 草稿作用域、召唤专家 chip、调试 FAB 开关。
 * 桩法对齐 mentionCommands.test.tsx：services/umi 一律 mock，子组件以捕获 props 的桩替代。
 */
import ChatInputUnified, {
  type ChatInputUnifiedRef,
} from '@/components/business-component/ChatInputUnified';
import {
  loadDraft,
  saveDraft,
} from '@/components/business-component/ChatInputUnified/draftStorage';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRef } from 'react';
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

// 编辑器桩：受控渲染 value，暴露 focus/clear 间谍，lastProps 供直接驱动 onPressEnter
const editor = vi.hoisted(() => ({
  focus: vi.fn(),
  clear: vi.fn(),
  lastProps: {} as Record<string, any>,
}));
vi.mock('@/components/ChatInputHome/MentionEditor', async () => {
  const React = await import('react');
  return {
    // 与真实实现同款缺省值（不含专家），供 ChatInputUnified 计算开放范围
    DEFAULT_CAPABILITY_RESOURCE_TYPES: ['skill', 'connector', 'knowledge'],
    default: React.forwardRef((props: any, ref: any) => {
      editor.lastProps = props;
      React.useImperativeHandle(ref, () => ({
        focus: editor.focus,
        clear: editor.clear,
      }));
      return React.createElement(
        'div',
        { 'data-testid': 'mention-editor' },
        String(props.value ?? ''),
      );
    }),
  };
});

// 电脑选择器桩：捕获 props（value/cloudOnly/onChange），提供切云/切个人两个触发按钮
const computer = vi.hoisted(() => ({ props: {} as Record<string, any> }));
vi.mock('@/components/ChatInputHome/ComputerTypeSelector', async () => {
  const React = await import('react');
  return {
    default: (props: any) => {
      computer.props = props;
      return React.createElement(
        'div',
        { 'data-testid': 'computer-selector' },
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'computer-to-cloud',
            onClick: () => props.onChange?.('-1'),
          },
          'to-cloud',
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            'data-testid': 'computer-to-personal',
            onClick: () => props.onChange?.('555'),
          },
          'to-personal',
        ),
      );
    },
  };
});

// 工作目录弹窗桩：捕获 props 供断言 sandboxId 与直接驱动 onConfirm
const dirPicker = vi.hoisted(() => ({ props: {} as Record<string, any> }));
vi.mock('@/components/ChatInputHome/WorkspaceDirPickerModal', async () => {
  const React = await import('react');
  return {
    default: (props: any) => {
      dirPicker.props = props;
      return props.open
        ? React.createElement('div', { 'data-testid': 'dir-picker' })
        : null;
    },
  };
});

// 空间选择器桩
const spaceSelector = vi.hoisted(() => ({ props: {} as Record<string, any> }));
vi.mock('@/components/ChatInputHome/SpaceSelector', async () => {
  const React = await import('react');
  return {
    default: (props: any) => {
      spaceSelector.props = props;
      return React.createElement('div', { 'data-testid': 'space-selector' });
    },
  };
});

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
  async () => {
    const React = await import('react');
    return {
      default: () => React.createElement('div', { 'data-testid': 'debug-fab' }),
    };
  },
);

// 语音底座桩：Provider 消费 render-prop（isVoiceActive=false），子槽原样透传
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

const HOME_DRAFT_KEY = 'chat_draft:home';

function renderHomeInput(props: Record<string, any> = {}) {
  return render(
    <ChatInputUnified
      onEnter={vi.fn()}
      draftKey="home"
      isTaskAgentActive
      selectedComputerId="555"
      onComputerSelect={vi.fn()}
      onWorkspaceDirChange={vi.fn()}
      {...props}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

afterEach(cleanup);

describe('工作目录栏（首页我的电脑场景）', () => {
  it('个人电脑 + 提供目录回调时渲染，弹窗收到所选电脑 id', () => {
    renderHomeInput();
    expect(
      screen.getByText('PC.Components.WorkspaceDir.defaultDir'),
    ).toBeInTheDocument();
    expect(dirPicker.props.sandboxId).toBe('555');
  });

  it('云电脑（-1）/ 禁用个人电脑 / 不传回调时均不渲染', () => {
    const { unmount } = renderHomeInput({ selectedComputerId: '-1' });
    expect(
      screen.queryByText('PC.Components.WorkspaceDir.defaultDir'),
    ).not.toBeInTheDocument();
    unmount();

    renderHomeInput({ disablePersonalComputer: true });
    expect(
      screen.queryByText('PC.Components.WorkspaceDir.defaultDir'),
    ).not.toBeInTheDocument();
  });

  it('disablePersonalComputer 透传电脑选择器 cloudOnly', () => {
    renderHomeInput({ disablePersonalComputer: true });
    expect(computer.props.cloudOnly).toBe(true);
  });

  it('切回云电脑时一并清空工作目录', () => {
    const onComputerSelect = vi.fn();
    const onWorkspaceDirChange = vi.fn();
    renderHomeInput({
      workspaceDir: '/Users/demo/project',
      onComputerSelect,
      onWorkspaceDirChange,
    });
    fireEvent.click(screen.getByTestId('computer-to-cloud'));
    expect(onComputerSelect).toHaveBeenCalledWith('-1');
    expect(onWorkspaceDirChange).toHaveBeenCalledWith('');
  });

  it('目录弹窗确认后回调所选目录', () => {
    const onWorkspaceDirChange = vi.fn();
    renderHomeInput({ onWorkspaceDirChange });
    dirPicker.props.onConfirm('/Users/demo/work');
    expect(onWorkspaceDirChange).toHaveBeenCalledWith('/Users/demo/work');
  });
});

describe('首页工具栏能力', () => {
  it('空间选择器按开关渲染并接收受控 props', () => {
    const onSpaceSelect = vi.fn();
    const { rerender } = renderHomeInput({ showSpaceSelector: false });
    expect(screen.queryByTestId('space-selector')).not.toBeInTheDocument();

    rerender(
      <ChatInputUnified
        onEnter={vi.fn()}
        draftKey="home"
        isTaskAgentActive
        selectedComputerId="555"
        showSpaceSelector
        selectedSpaceId={9}
        onSpaceSelect={onSpaceSelect}
      />,
    );
    expect(screen.getByTestId('space-selector')).toBeInTheDocument();
    expect(spaceSelector.props.selectedSpaceId).toBe(9);
    expect(spaceSelector.props.onSpaceSelect).toBe(onSpaceSelect);
  });

  it('推荐标签 pill 展示与取消', () => {
    const onClearSelectedTag = vi.fn();
    renderHomeInput({
      selectedTag: { label: 'AI 教育专家' },
      onClearSelectedTag,
    });
    expect(screen.getByText('AI 教育专家')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear selected tag' }));
    expect(onClearSelectedTag).toHaveBeenCalledTimes(1);
  });

  it('showDebugFab 默认渲染，首页场景传 false 关闭', () => {
    const { unmount } = renderHomeInput();
    expect(screen.getByTestId('debug-fab')).toBeInTheDocument();
    unmount();

    renderHomeInput({ showDebugFab: false });
    expect(screen.queryByTestId('debug-fab')).not.toBeInTheDocument();
  });

  it('召唤专家 chip 展示名称并可取消', () => {
    const onClearSummonedExpert = vi.fn();
    renderHomeInput({
      summonedExpert: { agentId: 8, name: '张三教授' },
      onClearSummonedExpert,
    });
    expect(screen.getByText('张三教授')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Common.Global.delete' }),
    );
    expect(onClearSummonedExpert).toHaveBeenCalledTimes(1);
  });

  it('ref 暴露 focus/clear 并转发到编辑器', () => {
    const ref = createRef<ChatInputUnifiedRef>();
    render(<ChatInputUnified ref={ref} onEnter={vi.fn()} draftKey="home" />);
    ref.current?.clear();
    ref.current?.focus();
    expect(editor.clear).toHaveBeenCalled();
    expect(editor.focus).toHaveBeenCalled();
  });
});

describe('能力弹窗开放范围（专家仅首页开放）', () => {
  it('默认不含专家类型，showExpertCapability 开放', () => {
    const { unmount } = renderHomeInput();
    expect(editor.lastProps.capabilityResourceTypes).not.toContain('expert');
    unmount();

    renderHomeInput({ showExpertCapability: true });
    expect(editor.lastProps.capabilityResourceTypes).toContain('expert');
  });

  it('onExpertAgentSelect 提供时专家选中路由到外部回调（首页切换会话智能体）', () => {
    const { unmount } = renderHomeInput();
    // 未提供时走内部 expertComponents 通道（函数存在但非外部回调）
    const internalSelect = editor.lastProps.onExpertSelect;
    expect(typeof internalSelect).toBe('function');
    unmount();

    const external = vi.fn();
    renderHomeInput({ onExpertAgentSelect: external });
    expect(editor.lastProps.onExpertSelect).toBe(external);
  });
});

describe('首页草稿（draftKey=home）', () => {
  it('挂载恢复 home 草稿到编辑器', () => {
    saveDraft('home', { version: 1, text: '上次未发送的输入' });
    renderHomeInput();
    expect(screen.getByTestId('mention-editor').textContent).toContain(
      '上次未发送的输入',
    );
  });

  it('发送后清除 home 草稿（isClearInput=false 亦然）', async () => {
    const onEnter = vi.fn();
    saveDraft('home', { version: 1, text: '待发送内容' });
    renderHomeInput({ onEnter, isClearInput: false });
    // 编辑器桩的 onPressEnter 直接触发组件发送链路
    fireEvent.click(screen.getByTestId('mention-editor'));
    editor.lastProps.onPressEnter();
    await waitFor(() => expect(onEnter).toHaveBeenCalled());
    expect(onEnter.mock.calls[0][0]).toBe('待发送内容');
    // 已发送内容不再是草稿
    expect(loadDraft('home')).toBeNull();
    expect(localStorage.getItem(HOME_DRAFT_KEY)).toBeNull();
  });
});
