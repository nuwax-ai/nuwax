import Login from '@/pages/Login';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  configureServerHost: vi.fn(),
  fetch: vi.fn(),
  createQrCode: vi.fn(),
  qrStatus: vi.fn(),
  finishLogin: vi.fn(),
  refreshUserInfo: vi.fn(),
  loadMenus: vi.fn(),
  initI18n: vi.fn(),
  navigateAfterLogin: vi.fn(),
  search: '',
}));

vi.mock('umi', () => ({
  history: { replace: vi.fn() },
  useSearchParams: () => [new URLSearchParams(h.search)],
  useModel: (name: string) =>
    name === 'tenantConfigInfo'
      ? { loadEnd: true, tenantConfigInfo: {}, runTenantConfig: vi.fn() }
      : { loadMenus: h.loadMenus },
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...args: unknown[]) => [key, ...args].join(' '),
  initI18n: h.initI18n,
  syncLangFromUserInfo: vi.fn(),
}));
vi.mock('@/hooks/useRequestPromiseBridge', () => ({
  default: () => ({ runWithPromise: vi.fn(), loading: false }),
}));
vi.mock('@/services/account', () => ({ apiLogin: vi.fn() }));
vi.mock('@/services/qrLogin', () => ({
  apiCreateQrLoginCode: h.createQrCode,
  apiGetQrLoginStatus: h.qrStatus,
}));
vi.mock('@/services/authIdp', () => ({
  apiAuthIdpLoginList: async () => ({ code: '0000', data: { items: [] } }),
}));
vi.mock('@/services/unifiedThemeService', () => ({
  unifiedThemeService: { clearUserThemeConfig: vi.fn() },
}));
vi.mock('@/services/userService', () => ({
  UserService: { refreshUserInfo: h.refreshUserInfo },
}));
vi.mock('@/utils/authNavigation', () => ({ navigateToAuthUrl: vi.fn() }));
vi.mock('@/utils/businessAuth', () => ({ finishBusinessLogin: h.finishLogin }));
vi.mock('@/utils/idpNavigation', () => ({
  completeDesktopIdpReturn: async () => 'none',
  startIdpNavigation: vi.fn(),
}));
vi.mock('@/utils/loginNavigation', () => ({
  navigateAfterLogin: h.navigateAfterLogin,
  replaceLoginStep: vi.fn(),
}));
vi.mock('@/utils/common', () => ({
  isValidEmail: vi.fn(),
  isValidPhone: vi.fn(),
  validatePassword: vi.fn(),
}));
vi.mock('@/components/AliyunCaptcha', () => ({ default: () => null }));
vi.mock('@/components/business-component/ImageCaptcha', () => ({
  default: () => null,
  imageCaptchaRules: () => [],
}));
vi.mock('@/components/SiteFooter', () => ({ default: () => null }));
vi.mock('@/pages/Login/BasicLayout', () => ({
  default: ({ children }: any) => children,
}));
vi.mock('@/pages/Login/IdpLoginButtons', () => ({
  default: ({ trailingAction }: any) => trailingAction,
}));
vi.mock('@/pages/Login/index.less', () => ({ default: {} }));
vi.mock('@/pages/Login/QrCodeLogin/index.less', () => ({ default: {} }));
vi.mock('@/components/business-component/AppStartup/index.less', () => ({
  default: {},
}));
vi.mock('@/pages/Login/LoginLangSwitcher', () => ({ default: () => null }));
vi.mock('@/pages/Login/SiteProtocol', () => ({ default: () => null }));

let originalBridge: unknown;
beforeEach(() => {
  originalBridge = (window as any).NuwaClawBridge;
  h.configureServerHost.mockReset().mockResolvedValue({ success: true });
  h.search = '';
  h.createQrCode.mockReset().mockResolvedValue({
    code: '0000',
    data: {
      sceneId: 'scene',
      pollToken: 'private-poll-token',
      qrContent: 'https://example.com/qrlogin/scene',
      expireSeconds: 120,
    },
  });
  h.qrStatus
    .mockReset()
    .mockResolvedValue({ code: '0000', data: { status: 'WAITING' } });
  h.finishLogin.mockReset().mockResolvedValue('ready');
  h.refreshUserInfo
    .mockReset()
    .mockResolvedValue({ id: 1, phone: 'current-user' });
  h.loadMenus.mockReset().mockResolvedValue(undefined);
  h.initI18n.mockReset().mockResolvedValue(undefined);
  h.navigateAfterLogin.mockReset();
  // 模拟 HTTPS 登录页访问 HTTP 企业地址时的浏览器拦截。
  h.fetch.mockReset().mockRejectedValue(new TypeError('Failed to fetch'));
  vi.stubGlobal('fetch', h.fetch);
  (window as any).NuwaClawBridge = {
    host: { getProduct: () => 'nuwax' },
    auth: { configureServerHost: h.configureServerHost },
  };
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.removeItem('PHONE');
  localStorage.removeItem('EXPIRE_DATE');
  if (originalBridge === undefined) delete (window as any).NuwaClawBridge;
  else (window as any).NuwaClawBridge = originalBridge;
});

describe('扫码登录接入现有登录页', () => {
  it('确认后离开页面，迟到的会话同步不再加载菜单或跳转', async () => {
    let resolveSession!: (value: string) => void;
    h.finishLogin.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSession = resolve;
      }),
    );
    h.qrStatus.mockResolvedValueOnce({
      code: '0000',
      data: { status: 'CONFIRMED', token: '' },
    });
    const { unmount } = render(<Login />);
    fireEvent.click(await screen.findByText('PC.Pages.Login.qrLogin'));
    await waitFor(() => expect(h.finishLogin).toHaveBeenCalledOnce());
    unmount();
    await act(async () => {
      resolveSession('ready');
    });
    expect(h.refreshUserInfo).not.toHaveBeenCalled();
    expect(h.loadMenus).not.toHaveBeenCalled();
    expect(h.navigateAfterLogin).not.toHaveBeenCalled();
  });
  it('确认后复用 Cookie 收尾、菜单和语言初始化，保留原始业务深链', async () => {
    const redirect = '/space/8?source=qr#tasks';
    h.search = `redirect=${encodeURIComponent(redirect)}`;
    h.qrStatus.mockResolvedValueOnce({
      code: '0000',
      data: {
        status: 'CONFIRMED',
        token: '',
        expireDate: '2030-01-01',
        resetPass: 1,
      },
    });
    localStorage.setItem('PHONE', 'previous-user');
    render(<Login />);
    fireEvent.click(await screen.findByText('PC.Pages.Login.qrLogin'));
    await waitFor(() => expect(h.navigateAfterLogin).toHaveBeenCalledOnce());
    expect(h.finishLogin).toHaveBeenCalledOnce();
    expect(h.finishLogin).toHaveBeenCalledWith('');
    expect(h.refreshUserInfo).toHaveBeenCalledOnce();
    expect(h.loadMenus).toHaveBeenCalledOnce();
    expect(h.loadMenus).toHaveBeenCalledWith(true);
    expect(h.initI18n).toHaveBeenCalledOnce();
    expect(h.initI18n).toHaveBeenCalledWith(true);
    expect(h.navigateAfterLogin.mock.calls[0][1]).toBe(redirect);
    expect(localStorage.getItem('PHONE')).toBe('current-user');
    expect(localStorage.getItem('EXPIRE_DATE')).toBe('2030-01-01');
  });

  it('切回密码登录会取消扫码会话；取消协议勾选也停止轮询', async () => {
    render(<Login />);
    fireEvent.click(await screen.findByText('PC.Pages.Login.qrLogin'));
    await screen.findByRole('img', { name: 'PC.Pages.Login.qrCodeLabel' });
    const firstSignal = h.createQrCode.mock.calls[0][0] as AbortSignal;
    fireEvent.click(screen.getByText('PC.Pages.Login.passwordLogin'));
    expect(firstSignal.aborted).toBe(true);
    expect(
      screen.getByPlaceholderText(
        'PC.Pages.Login.inputUnifiedAccountPlaceholder',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('PC.Pages.Login.qrLogin'));
    await screen.findByRole('img', { name: 'PC.Pages.Login.qrCodeLabel' });
    const secondSignal = h.createQrCode.mock.calls[1][0] as AbortSignal;
    fireEvent.click(screen.getByRole('checkbox'));
    expect(secondSignal.aborted).toBe(true);
    expect(
      screen.queryByRole('img', { name: 'PC.Pages.Login.qrCodeLabel' }),
    ).toBeNull();
  });

  it('宿主会话同步失败时留在扫码页并显示重试入口', async () => {
    h.qrStatus.mockResolvedValueOnce({
      code: '0000',
      data: { status: 'CONFIRMED', token: '' },
    });
    h.finishLogin.mockResolvedValueOnce('host-cookie-sync-failed');
    render(<Login />);
    fireEvent.click(await screen.findByText('PC.Pages.Login.qrLogin'));
    await screen.findByText('PC.Pages.Login.hostSessionSyncFailed');
    expect(
      screen.getByRole('button', { name: 'PC.Pages.Login.qrRefresh' }),
    ).toBeEnabled();
    expect(h.navigateAfterLogin).not.toHaveBeenCalled();
    expect(h.loadMenus).not.toHaveBeenCalled();
  });
});

async function openEnterprise(domain: string) {
  render(<Login />);
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'PC.Pages.Login.enterpriseLogin',
    }),
  );
  const dialog = screen.getByRole('dialog');
  const input = within(dialog).getByRole('textbox');
  fireEvent.change(input, { target: { value: domain } });
  const confirm = within(dialog).getByRole('button', {
    name: 'PC.Pages.Login.enterpriseSwitchConfirm',
  });
  return { dialog, input, confirm };
}

describe('客户端企业登录', () => {
  it.each([
    [' http://8.163.48.96/ ', 'http://8.163.48.96'],
    ['https://enterprise.example:8443/', 'https://enterprise.example:8443'],
    ['enterprise.example', 'https://enterprise.example'],
  ])(
    '地址 %s 直接交由客户端切换，不受页面 fetch 限制',
    async (input, origin) => {
      const { confirm } = await openEnterprise(input);
      fireEvent.click(confirm);
      await waitFor(() =>
        expect(h.configureServerHost).toHaveBeenCalledWith(origin),
      );
      expect(h.fetch).not.toHaveBeenCalled();
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    },
  );

  it('切换失败时展示客户端错误，保留输入并允许重试', async () => {
    h.configureServerHost.mockResolvedValueOnce({
      success: false,
      error: 'Failed to stop business services',
    });
    const { dialog, input, confirm } = await openEnterprise(
      'http://8.163.48.96',
    );
    fireEvent.click(confirm);
    await within(dialog).findByText(/Failed to stop business services/);
    expect(input).toHaveValue('http://8.163.48.96');
    fireEvent.click(confirm);
    await waitFor(() => expect(h.configureServerHost).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('桥调用异常被消费，失败后仍可重试', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      h.configureServerHost.mockRejectedValueOnce(new Error('IPC unavailable'));
      const { dialog, confirm } = await openEnterprise('http://8.163.48.96');
      fireEvent.click(confirm);
      await within(dialog).findByText(/IPC unavailable/);
      fireEvent.click(confirm);
      await waitFor(() =>
        expect(h.configureServerHost).toHaveBeenCalledTimes(2),
      );
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    } finally {
      warn.mockRestore();
    }
  });

  it('空地址按回车不会调用客户端', async () => {
    const { dialog, input, confirm } = await openEnterprise('   ');
    expect(confirm).toBeDisabled();
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    await within(dialog).findByText('PC.Pages.Login.enterpriseDomainRequired');
    expect(h.configureServerHost).not.toHaveBeenCalled();
  });
});
