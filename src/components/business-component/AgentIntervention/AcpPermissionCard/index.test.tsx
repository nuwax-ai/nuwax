import { fireEvent, render, screen } from '@testing-library/react';
import type { AcpPermissionInteraction } from '../types/acpIntervention';
import AcpPermissionCard from './index';

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string, ...args: string[]) => {
    const dict: Record<string, string> = {
      'PC.Components.AcpPermissionCard.defaultTitle': '权限审批',
      'PC.Components.AcpPermissionCard.eyebrow': '安全确认',
      'PC.Components.AcpPermissionCard.submitted': '已提交',
      'PC.Components.AcpPermissionCard.shortcutHint': '{0} ({1})',
      'PC.Components.AcpPermissionCard.allowOnce': '允许一次',
      'PC.Components.AcpPermissionCard.allowAlways': '始终允许',
      'PC.Components.AcpPermissionCard.rejectOnce': '拒绝',
      'PC.Components.AcpPermissionCard.option.bypassPermissions':
        '是，并绕过所有权限',
      'PC.Components.AcpPermissionCard.option.auto': '是，并使用 auto 模式',
      'PC.Components.AcpPermissionCard.option.acceptEdits':
        '是，并自动接受编辑',
      'PC.Components.AcpPermissionCard.option.default': '是，手动逐项审批编辑',
      'PC.Components.AcpPermissionCard.option.plan': '否，继续完善计划',
    };
    const template = dict[key] ?? key;
    return args.reduce(
      (text, item, index) => text.replace(`{${index}}`, item),
      template,
    );
  },
}));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_: any, key: string) => String(key) }),
}));

vi.mock('./useAcpPermissionShortcuts', () => ({
  useAcpPermissionShortcuts: vi.fn(),
  getAcpPermissionShortcutHint: vi.fn(() => ''),
}));

function createInteraction(
  overrides: Partial<AcpPermissionInteraction> = {},
): AcpPermissionInteraction {
  return {
    intervention: {
      id: 'itv-001',
      revision: 1,
      kind: 'approval',
      status: 'pending',
      sessionId: 'sess-001',
      source: 'acp_permission',
      engine: 'claude-code',
      protocol: 'acp',
      callbackTarget: { kind: 'electron', targetId: 'tgt-1' },
      schemaRef: 'acp/permission/v1',
      acp: {
        method: 'session/request_permission',
        request: {
          sessionId: 'sess-001',
          toolCall: {
            toolCallId: 'tc-001',
            title: '执行 bash 命令',
            kind: 'bash',
          },
          options: [
            { optionId: 'opt-1', kind: 'allow_once', name: '允许一次' },
            { optionId: 'opt-2', kind: 'allow_always', name: '始终允许' },
            { optionId: 'opt-3', kind: 'reject_once', name: '拒绝一次' },
            { optionId: 'opt-4', kind: 'reject_always', name: '始终拒绝' },
          ],
        },
      },
      createdAt: Date.now(),
    },
    responseStatus: 'pending',
    selectedOptionId: undefined,
    errorMessage: undefined,
    ...overrides,
  } as AcpPermissionInteraction;
}

describe('AcpPermissionCard', () => {
  it('renders only visible options (excludes reject_always)', () => {
    const onRespond = vi.fn();
    render(
      <AcpPermissionCard
        interaction={createInteraction()}
        onRespond={onRespond}
        keyboardShortcutsEnabled={false}
      />,
    );

    expect(screen.getByText('允许一次')).toBeTruthy();
    expect(screen.getByText('始终允许')).toBeTruthy();
    expect(screen.getByText('拒绝')).toBeTruthy();
    expect(screen.queryByText('始终拒绝')).toBeNull();
  });

  it('calls onRespond with correct payload when an option is double-clicked', () => {
    const onRespond = vi.fn();
    render(
      <AcpPermissionCard
        interaction={createInteraction()}
        onRespond={onRespond}
        keyboardShortcutsEnabled={false}
      />,
    );

    // 单击仅选中（activeIndex），双击确认提交
    fireEvent.click(screen.getByText('允许一次'));
    expect(onRespond).not.toHaveBeenCalled();
    fireEvent.dblClick(screen.getByText('允许一次'));

    expect(onRespond).toHaveBeenCalledTimes(1);
    expect(onRespond).toHaveBeenCalledWith({
      outcome: { outcome: 'selected', optionId: 'opt-1' },
    });
  });

  it('shows submitted tag and disables buttons when submitted', () => {
    const onRespond = vi.fn();
    render(
      <AcpPermissionCard
        interaction={createInteraction({ responseStatus: 'submitted' })}
        onRespond={onRespond}
        keyboardShortcutsEnabled={false}
      />,
    );

    expect(screen.getByText('已提交')).toBeTruthy();

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('shows loading on the submit button when submitting', () => {
    render(
      <AcpPermissionCard
        interaction={createInteraction({
          responseStatus: 'submitting',
          selectedOptionId: 'opt-1',
        })}
        onRespond={vi.fn()}
        keyboardShortcutsEnabled={false}
      />,
    );

    // 选项按钮的 loading 已注释（见组件），loading 态落在底部确认按钮
    const buttons = screen.getAllByRole('button');
    const submitBtn = buttons[buttons.length - 1];
    expect(submitBtn.className).toContain('loading');
  });

  it('renders distinct mode labels for switch_mode (ExitPlanMode) options', () => {
    render(
      <AcpPermissionCard
        interaction={createInteraction({
          intervention: {
            ...createInteraction().intervention,
            acp: {
              method: 'session/request_permission',
              request: {
                sessionId: 'sess-001',
                toolCall: {
                  toolCallId: 'tc-plan',
                  title: 'Ready to code?',
                  kind: 'switch_mode',
                },
                options: [
                  {
                    optionId: 'bypassPermissions',
                    kind: 'allow_always',
                    name: 'Yes, and bypass permissions',
                  },
                  {
                    optionId: 'auto',
                    kind: 'allow_always',
                    name: 'Yes, and use "auto" mode',
                  },
                  {
                    optionId: 'acceptEdits',
                    kind: 'allow_always',
                    name: 'Yes, and auto-accept edits',
                  },
                  {
                    optionId: 'default',
                    kind: 'allow_once',
                    name: 'Yes, and manually approve edits',
                  },
                  {
                    optionId: 'plan',
                    kind: 'reject_once',
                    name: 'No, keep planning',
                  },
                ],
              },
            },
          },
        })}
        onRespond={vi.fn()}
        keyboardShortcutsEnabled={false}
      />,
    );

    // 不再出现三个坍缩的「始终允许」：optionId 专属文案优先
    expect(screen.getByText('是，并绕过所有权限')).toBeTruthy();
    expect(screen.getByText('是，并使用 auto 模式')).toBeTruthy();
    expect(screen.getByText('是，并自动接受编辑')).toBeTruthy();
    expect(screen.getByText('是，手动逐项审批编辑')).toBeTruthy();
    expect(screen.getByText('否，继续完善计划')).toBeTruthy();
  });

  it('falls back to engine option names when same-kind labels would collide', () => {
    render(
      <AcpPermissionCard
        interaction={createInteraction({
          intervention: {
            ...createInteraction().intervention,
            acp: {
              method: 'session/request_permission',
              request: {
                sessionId: 'sess-001',
                toolCall: {
                  toolCallId: 'tc-x',
                  title: '切换',
                  kind: 'other',
                },
                options: [
                  {
                    optionId: 'mode-a',
                    kind: 'allow_always',
                    name: 'Mode A（引擎语义）',
                  },
                  {
                    optionId: 'mode-b',
                    kind: 'allow_always',
                    name: 'Mode B（引擎语义）',
                  },
                ],
              },
            },
          },
        })}
        onRespond={vi.fn()}
        keyboardShortcutsEnabled={false}
      />,
    );

    // 非 switch_mode 且无 optionId 翻译：重复 kind 退到引擎 name 而非重复的「始终允许」
    expect(screen.getByText('Mode A（引擎语义）')).toBeTruthy();
    expect(screen.getByText('Mode B（引擎语义）')).toBeTruthy();
  });

  it('shows error message when failed', () => {
    render(
      <AcpPermissionCard
        interaction={createInteraction({
          responseStatus: 'failed',
          errorMessage: '网络错误',
        })}
        onRespond={vi.fn()}
        keyboardShortcutsEnabled={false}
      />,
    );

    expect(screen.getByText('网络错误')).toBeTruthy();
  });

  it('disables all buttons when onRespond is undefined', () => {
    render(
      <AcpPermissionCard
        interaction={createInteraction()}
        keyboardShortcutsEnabled={false}
      />,
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it('renders eyebrow text when docked', () => {
    render(
      <AcpPermissionCard
        interaction={createInteraction()}
        docked
        onRespond={vi.fn()}
        keyboardShortcutsEnabled={false}
      />,
    );

    expect(screen.getByText('安全确认')).toBeTruthy();
  });
});
