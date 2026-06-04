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
    expect(screen.getByText('拒绝一次')).toBeTruthy();
    expect(screen.queryByText('始终拒绝')).toBeNull();
  });

  it('calls onRespond with correct payload when an option is clicked', () => {
    const onRespond = vi.fn();
    render(
      <AcpPermissionCard
        interaction={createInteraction()}
        onRespond={onRespond}
        keyboardShortcutsEnabled={false}
      />,
    );

    fireEvent.click(screen.getByText('允许一次'));

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

  it('shows loading on the selected option when submitting', () => {
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

    const buttons = screen.getAllByRole('button');
    // antd applies "ant-btn-loading" class when loading
    const allowOnceBtn = buttons[0];
    expect(allowOnceBtn.className).toContain('loading');
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
