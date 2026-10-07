import LicenseFeatureGate from '@/components/business-component/LicenseFeatureGate';
import useLicense from '@/hooks/useLicense';
import License from '@/pages/SystemManagement/SystemConfig/License';
import type { LicenseControllerState } from '@/types/interfaces/license';
import { LicenseRequestError, projectLicenseSnapshot } from '@/utils/license';
import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { StrictMode, useEffect, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  read: vi.fn(),
  importLicense: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  permissions: new Set<string>(),
  userInfo: { id: 930, tenantId: 93, role: 'ADMIN' },
  storedUser: { id: 930, tenantId: 93 },
}));

vi.mock('umi', () => ({
  useModel: (name: string) => {
    if (name === 'menuModel')
      return { hasPermission: (code: string) => h.permissions.has(code) };
    if (name === 'userInfo') return { userInfo: h.userInfo };
    throw new Error(`Unexpected model ${name}`);
  },
}));
vi.mock('@/services/license', () => ({
  MAX_LICENSE_FILE_BYTES: 1024 * 1024,
  licenseProvider: {
    available: true,
    read: (signal: AbortSignal) => h.read(signal),
    importLicense: (file: File, signal: AbortSignal) =>
      h.importLicense(file, signal),
  },
}));
vi.mock('@/services/userService', () => ({
  UserService: { getUserInfoFromStorage: () => h.storedUser },
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/pages/SystemManagement/SystemConfig/License/index.less', () => ({
  default: {
    container: 'license-container',
    importForm: 'license-import-form',
  },
}));
vi.mock('@/components/WorkspaceLayout', () => ({
  default: ({
    title,
    rightSlot,
    children,
  }: {
    title: string;
    rightSlot: ReactNode;
    children: ReactNode;
  }) => (
    <main>
      <h1>{title}</h1>
      <nav>{rightSlot}</nav>
      {children}
    </main>
  ),
}));
vi.mock('antd', async (importOriginal) => {
  const original = await importOriginal<typeof import('antd')>();
  return {
    ...original,
    message: { ...original.message, success: h.success, error: h.error },
  };
});

const keys = {
  importAction: 'PC.Pages.License.importAction',
  confirmImport: 'PC.Pages.License.confirmImport',
  enabled: 'PC.Pages.License.featureEnabled',
  unavailable: 'PC.Pages.License.featureUnavailable',
  refresh: 'PC.Common.Global.refresh',
};

function snapshot(subject = '初始企业', canImport = true, enabled = true) {
  return {
    state: 'VALID',
    subject,
    maskedId: 'mock-****-0930',
    canImport,
    features: [{ code: 'example_feature', name: '示例功能', enabled }],
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function showImport() {
  await screen.findByText('初始企业');
  fireEvent.click(screen.getByRole('button', { name: keys.importAction }));
  return screen.findByRole('dialog');
}

async function selectFile(dialog: HTMLElement, file: File) {
  const input = dialog.querySelector<HTMLInputElement>('input[type="file"]');
  expect(input).not.toBeNull();
  fireEvent.change(input!, { target: { files: [file] } });
  await waitFor(() =>
    expect(within(dialog).getByText(file.name)).toBeInTheDocument(),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  h.read.mockReset().mockResolvedValue(snapshot());
  h.importLicense.mockReset().mockResolvedValue(snapshot('更新企业'));
  h.permissions = new Set(['license_query', 'license_import']);
  h.userInfo = { id: 930, tenantId: 93, role: 'ADMIN' };
});
afterEach(cleanup);

describe('实际 License 页面权限与读取边界', () => {
  it('管理员无 license_query 也不能读，刷新和导入入口均不能绕过资源权限', async () => {
    h.permissions = new Set(['license_import']);
    render(<License />);
    expect(screen.getByText('PC.Pages.License.noAccess')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: keys.refresh })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: keys.importAction }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: keys.refresh }));
    await act(async () => {});
    expect(h.read).not.toHaveBeenCalled();
    expect(h.importLicense).not.toHaveBeenCalled();
  });

  it('只有查询权限可以读；即使 provider canImport=true 也不提供导入入口', async () => {
    h.permissions = new Set(['license_query']);
    render(<License />);
    await screen.findByText('初始企业');
    expect(
      screen.queryByRole('button', { name: keys.importAction }),
    ).not.toBeInTheDocument();
    expect(h.read).toHaveBeenCalledTimes(1);
    expect(h.importLicense).not.toHaveBeenCalled();
  });

  it('有导入资源权限仍需当前快照 canImport，provider 的只读结果禁用入口', async () => {
    h.read.mockResolvedValue(snapshot('只读企业', false));
    render(<License />);
    await screen.findByText('只读企业');
    expect(
      screen.getByRole('button', { name: keys.importAction }),
    ).toBeDisabled();
    expect(h.importLicense).not.toHaveBeenCalled();
  });

  it('后发账号读取生效后，旧账号迟到响应不能回显或授权', async () => {
    const oldRead = deferred<unknown>();
    const newRead = deferred<unknown>();
    h.read
      .mockReset()
      .mockReturnValueOnce(oldRead.promise)
      .mockReturnValueOnce(newRead.promise);
    const view = render(<License />);
    await waitFor(() => expect(h.read).toHaveBeenCalledTimes(1));
    const oldSignal = h.read.mock.calls[0][0] as AbortSignal;
    h.userInfo = { id: 931, tenantId: 93, role: 'ADMIN' };
    view.rerender(<License />);
    await waitFor(() => expect(h.read).toHaveBeenCalledTimes(2));
    expect(oldSignal.aborted).toBe(true);
    await act(async () => {
      newRead.resolve(snapshot('新账号企业'));
    });
    await screen.findByText('新账号企业');
    await act(async () => {
      oldRead.resolve(snapshot('旧账号企业'));
    });
    expect(screen.queryByText('旧账号企业')).not.toBeInTheDocument();
    expect(screen.getByText('新账号企业')).toBeInTheDocument();
    expect(screen.getByText(keys.enabled)).toBeInTheDocument();
  });

  it('刷新失败保留展示，但实际功能展示撤销启用；恢复读取后才重新启用', async () => {
    h.read
      .mockReset()
      .mockResolvedValueOnce(snapshot())
      .mockRejectedValueOnce(new LicenseRequestError('network'))
      .mockResolvedValueOnce(snapshot('恢复企业'));
    render(<License />);
    await screen.findByText(keys.enabled);
    fireEvent.click(screen.getByRole('button', { name: keys.refresh }));
    await screen.findByText('PC.Pages.License.error.network');
    expect(screen.getByText('初始企业')).toBeInTheDocument();
    expect(
      screen.getByText('PC.Pages.License.staleSnapshot'),
    ).toBeInTheDocument();
    expect(screen.queryByText(keys.enabled)).not.toBeInTheDocument();
    expect(screen.getByText(keys.unavailable)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: keys.refresh }));
    await screen.findByText('恢复企业');
    expect(screen.getByText(keys.enabled)).toBeInTheDocument();
  });

  it('StrictMode cleanup reset 后仍可再次读取，首次迟到结果不会覆盖第二次读取', async () => {
    const firstRead = deferred<unknown>();
    const secondRead = deferred<unknown>();
    h.read
      .mockReset()
      .mockReturnValueOnce(firstRead.promise)
      .mockReturnValueOnce(secondRead.promise);
    const view = render(
      <StrictMode>
        <License />
      </StrictMode>,
    );
    await waitFor(() => expect(h.read).toHaveBeenCalledTimes(2));
    expect((h.read.mock.calls[0][0] as AbortSignal).aborted).toBe(true);
    expect((h.read.mock.calls[1][0] as AbortSignal).aborted).toBe(false);
    await act(async () => {
      secondRead.resolve(snapshot('StrictMode 当前企业'));
    });
    await screen.findByText('StrictMode 当前企业');
    await act(async () => {
      firstRead.resolve(snapshot('StrictMode 旧企业'));
    });
    expect(screen.queryByText('StrictMode 旧企业')).not.toBeInTheDocument();
    view.unmount();
    expect((h.read.mock.calls[1][0] as AbortSignal).aborted).toBe(false);
  });

  it('页面卸载撤销在途读取，迟到结果不会再渲染', async () => {
    const pending = deferred<unknown>();
    h.read.mockReturnValue(pending.promise);
    const view = render(<License />);
    await waitFor(() => expect(h.read).toHaveBeenCalledTimes(1));
    const signal = h.read.mock.calls[0][0] as AbortSignal;
    view.unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => {
      pending.resolve(snapshot('卸载后企业'));
    });
    expect(screen.queryByText('卸载后企业')).not.toBeInTheDocument();
  });
});

describe('实际 License 页面文件导入', () => {
  it('导入失败保留原文件可重试，成功后关闭弹窗并展示 provider 回包', async () => {
    h.importLicense
      .mockReset()
      .mockRejectedValueOnce(new LicenseRequestError('network'))
      .mockResolvedValueOnce(snapshot('重试后企业'));
    render(<License />);
    const dialog = await showImport();
    const file = new File(['opaque-content'], 'retry-license.lic');
    await selectFile(dialog, file);
    fireEvent.click(
      within(dialog).getByRole('button', { name: keys.confirmImport }),
    );
    await waitFor(() => expect(h.importLicense).toHaveBeenCalledTimes(1));
    await within(dialog).findByText('PC.Pages.License.error.network');
    expect(within(dialog).getByText(file.name)).toBeInTheDocument();
    expect(h.importLicense.mock.calls[0][0]).toBe(file);
    expect(h.success).not.toHaveBeenCalled();
    expect(screen.queryByText(keys.enabled)).not.toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole('button', { name: keys.confirmImport }),
    );
    await waitFor(() => expect(h.importLicense).toHaveBeenCalledTimes(2));
    expect(h.importLicense.mock.calls[1][0]).toBe(file);
    await screen.findByText('重试后企业');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(h.success).toHaveBeenCalledWith('PC.Pages.License.importSuccess');
  });

  it.each([
    ['空文件', 0],
    ['超过 1 MiB', 1024 * 1024 + 1],
  ] as const)('%s 不进入提交，显示文件错误', async (_name, bytes) => {
    render(<License />);
    const dialog = await showImport();
    const input = dialog.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File([new Uint8Array(bytes)], 'invalid-license.lic');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() =>
      expect(h.error).toHaveBeenCalledWith('PC.Pages.License.fileInvalid'),
    );
    expect(within(dialog).queryByText(file.name)).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: keys.confirmImport }),
    ).toBeDisabled();
    expect(h.importLicense).not.toHaveBeenCalled();
  });

  it('无效响应错误在页面与导入弹窗均使用运行时认可的翻译键', async () => {
    h.importLicense.mockRejectedValueOnce(
      new LicenseRequestError('invalid-response'),
    );
    render(<License />);
    const dialog = await showImport();
    await selectFile(dialog, new File(['opaque'], 'retry.lic'));
    fireEvent.click(
      within(dialog).getByRole('button', { name: keys.confirmImport }),
    );
    await waitFor(() =>
      expect(
        screen.getAllByText('PC.Pages.License.error.invalidResponse'),
      ).toHaveLength(2),
    );
    expect(
      screen.queryByText('PC.Pages.License.error.invalid-response'),
    ).not.toBeInTheDocument();
    expect(within(dialog).getByText('retry.lic')).toBeInTheDocument();
  });

  it('导入过程中防重复点击；账号切换清文件和弹窗，迟到成功不提示当前账号激活成功', async () => {
    const pendingImport = deferred<unknown>();
    h.importLicense.mockReturnValue(pendingImport.promise);
    h.read
      .mockResolvedValueOnce(snapshot())
      .mockResolvedValueOnce(snapshot('新账号企业'));
    const view = render(<License />);
    const dialog = await showImport();
    await selectFile(dialog, new File(['opaque'], 'old-account.lic'));
    const confirm = within(dialog).getByRole('button', {
      name: keys.confirmImport,
    });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await waitFor(() => expect(h.importLicense).toHaveBeenCalledTimes(1));
    const signal = h.importLicense.mock.calls[0][1] as AbortSignal;
    h.userInfo = { id: 931, tenantId: 93, role: 'ADMIN' };
    view.rerender(<License />);
    await screen.findByText('新账号企业');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(signal.aborted).toBe(true);
    await act(async () => {
      pendingImport.resolve(snapshot('旧账号导入企业'));
    });
    expect(screen.queryByText('旧账号导入企业')).not.toBeInTheDocument();
    expect(h.success).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: keys.importAction }));
    const newDialog = await screen.findByRole('dialog');
    expect(
      within(newDialog).queryByText('old-account.lic'),
    ).not.toBeInTheDocument();
    expect(
      within(newDialog).getByRole('button', { name: keys.confirmImport }),
    ).toBeDisabled();
  });
});

function executableState(): LicenseControllerState {
  return {
    status: 'ready',
    snapshot: projectLicenseSnapshot(snapshot()),
    error: null,
    providerAvailable: true,
    importAvailable: true,
    operation: null,
  };
}

describe('实际 LicenseFeatureGate 子内容执行边界', () => {
  it('异常响应展示已注册翻译键并撤销执行授权，重试成功后才恢复子内容', async () => {
    const failed = deferred<unknown>();
    const recovered = deferred<unknown>();
    h.read
      .mockReset()
      .mockResolvedValueOnce(snapshot())
      .mockReturnValueOnce(failed.promise)
      .mockReturnValueOnce(recovered.promise);
    const execute = vi.fn();
    function Harness() {
      const { state, controller } = useLicense({ accountKey: '93:930' });
      return (
        <>
          <button type="button" onClick={() => void controller.reload()}>
            测试重试
          </button>
          <LicenseFeatureGate state={state} code="example_feature">
            <button type="button" onClick={execute}>
              执行受控功能
            </button>
          </LicenseFeatureGate>
        </>
      );
    }
    render(<Harness />);
    fireEvent.click(
      await screen.findByRole('button', { name: '执行受控功能' }),
    );
    expect(execute).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '测试重试' }));
    expect(
      screen.queryByRole('button', { name: '执行受控功能' }),
    ).not.toBeInTheDocument();
    await act(async () => {
      // 实际 controller 投影异常响应；不能把非布尔功能标记当作授权。
      failed.resolve({
        ...snapshot(),
        features: [
          { code: 'example_feature', name: '示例功能', enabled: 'yes' },
        ],
      });
    });
    expect(
      await screen.findByText('PC.Pages.License.error.invalidResponse'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('PC.Pages.License.error.invalid-response'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '执行受控功能' }),
    ).not.toBeInTheDocument();
    expect(execute).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '测试重试' }));
    expect(
      screen.queryByText('PC.Pages.License.error.invalidResponse'),
    ).not.toBeInTheDocument();
    await act(async () => recovered.resolve(snapshot()));
    fireEvent.click(
      await screen.findByRole('button', { name: '执行受控功能' }),
    );
    expect(h.read).toHaveBeenCalledTimes(3);
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['首次加载', { ...executableState(), status: 'loading' as const }],
    [
      '读取失败',
      {
        ...executableState(),
        status: 'network' as const,
        error: { kind: 'network' as const },
      },
    ],
    [
      '有效但功能关闭',
      {
        ...executableState(),
        snapshot: projectLicenseSnapshot(snapshot('企业', true, false)),
      },
    ],
    [
      '授权过期',
      {
        ...executableState(),
        snapshot: projectLicenseSnapshot({ ...snapshot(), state: 'EXPIRED' }),
      },
    ],
    ['provider 未接入', { ...executableState(), providerAvailable: false }],
  ])('%s 不挂载可执行 children', (_name, state) => {
    const mount = vi.fn();
    function Executable() {
      useEffect(() => {
        mount();
      }, []);
      return <button type="button">执行受控功能</button>;
    }
    render(
      <LicenseFeatureGate state={state} code="example_feature">
        <Executable />
      </LicenseFeatureGate>,
    );
    expect(
      screen.queryByRole('button', { name: '执行受控功能' }),
    ).not.toBeInTheDocument();
    expect(mount).not.toHaveBeenCalled();
  });

  it('真实 hook 读取成功挂载 children，刷新/失败撤销，恢复成功才能再次执行', async () => {
    const first = deferred<unknown>();
    const failed = deferred<unknown>();
    const recovered = deferred<unknown>();
    h.read
      .mockReset()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(failed.promise)
      .mockReturnValueOnce(recovered.promise);
    const execute = vi.fn();
    function Harness() {
      const { state, controller } = useLicense({ accountKey: '93:930' });
      return (
        <>
          <button type="button" onClick={() => void controller.reload()}>
            测试刷新
          </button>
          <LicenseFeatureGate state={state} code="example_feature">
            <button type="button" onClick={execute}>
              执行受控功能
            </button>
          </LicenseFeatureGate>
        </>
      );
    }
    render(<Harness />);
    expect(
      screen.queryByRole('button', { name: '执行受控功能' }),
    ).not.toBeInTheDocument();
    await act(async () => {
      first.resolve(snapshot());
    });
    fireEvent.click(
      await screen.findByRole('button', { name: '执行受控功能' }),
    );
    expect(execute).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: '测试刷新' }));
    expect(
      screen.queryByRole('button', { name: '执行受控功能' }),
    ).not.toBeInTheDocument();
    await act(async () => {
      failed.reject(new LicenseRequestError('network'));
    });
    expect(
      screen.queryByRole('button', { name: '执行受控功能' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '测试刷新' }));
    await act(async () => {
      recovered.resolve(snapshot());
    });
    fireEvent.click(
      await screen.findByRole('button', { name: '执行受控功能' }),
    );
    expect(execute).toHaveBeenCalledTimes(2);
  });
});
