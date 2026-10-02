import AccountBind from '@/layouts/Setting/AccountBind';
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  identityList: vi.fn(),
  idpList: vi.fn(),
  unbind: vi.fn(),
  confirm: vi.fn(),
  success: vi.fn(),
}));
vi.mock('@/services/authIdp', () => ({
  apiUserIdentityList: h.identityList,
  apiAuthIdpLoginList: h.idpList,
  apiUserIdentityUnbind: h.unbind,
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/utils/ant-custom', () => ({ modalConfirm: h.confirm }));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => <span /> }));
vi.mock('@/layouts/Setting/AccountBind/index.less', () => ({
  default: { container: 'account-bind' },
}));
vi.mock('antd', async (importOriginal) => {
  const original = await importOriginal<typeof import('antd')>();
  return { ...original, message: { ...original.message, success: h.success } };
});
const identity = {
  id: 1,
  idpId: 2,
  providerName: '已绑定方式',
  externalUserName: 'external-user',
};
const providers = [
  { id: 2, type: 'OAUTH2', name: '已绑定方式' },
  { id: 3, type: 'CAS', name: '未绑定方式' },
];
const response = (data: unknown) => ({ code: '0000', data });
const errorKey = 'PC.Layouts.Setting.AccountBind.loadFailed';
const emptyKey = 'PC.Layouts.Setting.AccountBind.empty';
const refreshKey = 'PC.Common.Global.refresh';
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
beforeEach(() => {
  vi.clearAllMocks();
  h.identityList.mockReset().mockResolvedValue(response([identity]));
  h.idpList.mockReset().mockResolvedValue(response({ items: providers }));
  h.unbind.mockReset().mockResolvedValue(response(null));
});
afterEach(cleanup);

describe('真实账号绑定面板的读取失败与恢复', () => {
  it('首屏请求失败不显示成功空态，刷新成功空列表后才显示空态', async () => {
    const initial = deferred<unknown>();
    h.identityList.mockReturnValueOnce(initial.promise);
    render(<AccountBind />);
    expect(screen.queryByText(emptyKey)).not.toBeInTheDocument();
    await act(async () => {
      initial.reject(new Error('network'));
    });
    expect(await screen.findByText(errorKey)).toBeInTheDocument();
    expect(screen.queryByText(emptyKey)).not.toBeInTheDocument();
    h.identityList.mockResolvedValueOnce(response([]));
    fireEvent.click(screen.getByRole('button', { name: refreshKey }));
    expect(await screen.findByText(emptyKey)).toBeInTheDocument();
    expect(screen.queryByText(errorKey)).not.toBeInTheDocument();
  });
  it.each([{ code: '4033', data: [] }, response(null), response({})])(
    '业务失败/无效列表不能当成没有绑定 (%#)',
    async (value) => {
      h.identityList.mockResolvedValueOnce(value);
      render(<AccountBind />);
      expect(await screen.findByText(errorKey)).toBeInTheDocument();
      expect(screen.queryByText(emptyKey)).not.toBeInTheDocument();
    },
  );
  it('登录方式读取失败不伪装成没有可绑定入口', async () => {
    h.idpList.mockRejectedValueOnce(new Error('providers offline'));
    render(<AccountBind />);
    expect(await screen.findByText(errorKey)).toBeInTheDocument();
    expect(screen.queryByText(emptyKey)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: refreshKey }));
    expect(await screen.findByText('external-user')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '未绑定方式' })).toBeEnabled();
  });
  it('解绑后的刷新失败保留此前列表并撤销操作，重试成功后再替换', async () => {
    render(<AccountBind />);
    await screen.findByText('external-user');
    h.identityList.mockRejectedValueOnce(new Error('refresh offline'));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Layouts.Setting.AccountBind.unbind',
      }),
    );
    await act(async () => {
      await h.confirm.mock.calls[0][2]();
    });
    expect(await screen.findByText(errorKey)).toBeInTheDocument();
    expect(screen.getByText('external-user')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'PC.Layouts.Setting.AccountBind.unbind',
      }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: '未绑定方式' })).toBeDisabled();
    h.identityList.mockResolvedValueOnce(response([]));
    fireEvent.click(screen.getByRole('button', { name: refreshKey }));
    await screen.findByText(emptyKey);
    expect(screen.queryByText('external-user')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '已绑定方式' })).toBeEnabled();
  });
  it('StrictMode 旧读迟到不能覆盖新列表或清掉新错误', async () => {
    const older = deferred<unknown>();
    h.identityList.mockReturnValueOnce(older.promise);
    render(
      <StrictMode>
        <AccountBind />
      </StrictMode>,
    );
    expect(await screen.findByText('external-user')).toBeInTheDocument();
    await act(async () => {
      older.resolve(response([]));
    });
    expect(screen.getByText('external-user')).toBeInTheDocument();
    expect(screen.queryByText(emptyKey)).not.toBeInTheDocument();
  });
  it('卸载后迟到刷新不产生成功提示或继续发解绑请求', async () => {
    const view = render(<AccountBind />);
    await screen.findByText('external-user');
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Layouts.Setting.AccountBind.unbind',
      }),
    );
    const confirm = h.confirm.mock.calls[0][2];
    view.unmount();
    await act(async () => {
      await confirm();
    });
    expect(h.unbind).not.toHaveBeenCalled();
    expect(h.success).not.toHaveBeenCalled();
  });
});
