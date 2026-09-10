import CreateNormalProjectModal from '@/pages/SpaceProjectManage/components/CreateNormalProjectModal';
import { apiNormalProjectCreate } from '@/services/appDev';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/pages/SpaceProjectManage/components/CreateNormalProjectModal/index.less',
  () => ({ default: {} }),
);
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/appDev', () => ({
  apiNormalProjectCreate: vi
    .fn()
    .mockResolvedValue({ code: '0000', data: { id: 7 } }),
}));
vi.mock('@/services/systemManage', () => ({
  apiGetUserSelectableSandboxList: vi.fn().mockResolvedValue({
    code: '0000',
    data: {
      sandboxes: [
        { name: 'A', sandboxId: 11 },
        { name: 'B', sandboxId: 22 },
      ],
    },
  }),
}));
vi.mock('@/components/ChatInputHome/WorkspaceDirPickerModal', () => ({
  default: ({ open, onConfirm }: any) =>
    open ? (
      <button type="button" onClick={() => onConfirm('/computer-a/project')}>
        pick A directory
      </button>
    ) : null,
}));
vi.mock('antd', () => ({
  Modal: ({ children, footer }: any) => (
    <div>
      {children}
      {footer}
    </div>
  ),
  Button: ({ children, onClick }: any) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  Input: ({ value, onChange }: any) => (
    <input aria-label="name" value={value} onChange={onChange} />
  ),
  Select: ({ value, onChange, options }: any) => (
    <select
      aria-label="computer"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o: any) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
  Dropdown: ({ children, menu }: any) => (
    <div>
      {children}
      <button
        type="button"
        onClick={() => menu.onClick({ key: 'pick-folder' })}
      >
        open picker
      </button>
    </div>
  ),
  Spin: () => null,
  message: { warning: vi.fn(), success: vi.fn(), error: vi.fn() },
}));
describe('创建项目切换个人电脑', () => {
  it('选过 A 的目录后切换 B，提交 B 时不携带 A 的路径', async () => {
    render(
      <CreateNormalProjectModal
        open
        spaceId={1}
        onCancel={() => {}}
        onConfirm={() => {}}
      />,
    );
    await screen.findByRole('option', { name: 'A' });
    fireEvent.change(screen.getByLabelText('name'), {
      target: { value: 'project' },
    });
    fireEvent.change(screen.getByLabelText('computer'), {
      target: { value: '11' },
    });
    fireEvent.click(screen.getByText('open picker'));
    fireEvent.click(screen.getByText('pick A directory'));
    fireEvent.change(screen.getByLabelText('computer'), {
      target: { value: '22' },
    });
    fireEvent.click(screen.getByText('PC.Common.Global.confirm'));
    await waitFor(() =>
      expect(apiNormalProjectCreate).toHaveBeenCalledWith({
        spaceId: 1,
        name: 'project',
        sandboxId: 22,
        workspaceDir: undefined,
      }),
    );
  });
});
