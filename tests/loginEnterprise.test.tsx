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
  passwordLogin: vi.fn(),
  apiPasswordLogin: vi.fn(),
  realPasswordRequests: false,
  validatePassword: vi.fn(),
  search: '',
  tenantConfig: {} as {
    openQrLogin?: number | null;
    openCaptcha?: number;
    captchaSceneId?: string;
    captchaPrefix?: string;
  },
  loadEnd: true,
}));

vi.mock('umi', () => ({
  history: { replace: vi.fn() },
  useSearchParams: () => [new URLSearchParams(h.search)],
  useModel: (name: string) =>
    name === 'tenantConfigInfo'
      ? {
          loadEnd: h.loadEnd,
          tenantConfigInfo: h.tenantConfig,
          runTenantConfig: vi.fn(),
        }
      : { loadMenus: h.loadMenus },
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...args: unknown[]) => [key, ...args].join(' '),
  initI18n: h.initI18n,
  syncLangFromUserInfo: vi.fn(),
}));
vi.mock('ahooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ahooks')>();
  return {
    ...actual,
    useRequest: (...args: Parameters<typeof actual.useRequest>) =>
      h.realPasswordRequests
        ? actual.useRequest(...args)
        : { runAsync: h.passwordLogin, loading: false },
  };
});
vi.mock('@/services/account', () => ({ apiLogin: h.apiPasswordLogin }));
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
  validatePassword: h.validatePassword,
}));
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
  h.tenantConfig = {};
  h.loadEnd = true;
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
  h.passwordLogin.mockReset().mockResolvedValue({});
  h.apiPasswordLogin.mockReset();
  h.realPasswordRequests = false;
  h.validatePassword.mockReset().mockReturnValue(true);
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
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete window.__captchaInitAt;
  localStorage.removeItem('PHONE');
  localStorage.removeItem('EXPIRE_DATE');
  if (originalBridge === undefined) delete (window as any).NuwaClawBridge;
  else (window as any).NuwaClawBridge = originalBridge;
});

describe('扫码登录接入现有登录页', () => {
  beforeEach(() => {
    h.tenantConfig = { openQrLogin: 1 };
  });

  it.each([undefined, null, 0])(
    '配置为 %s 时隐藏扫码入口，不发起二维码请求',
    async (openQrLogin) => {
      h.tenantConfig = { openQrLogin };
      render(<Login />);
      await screen.findByText('PC.Pages.Login.passwordLogin');
      expect(screen.queryByText('PC.Pages.Login.qrLogin')).toBeNull();
      expect(
        screen.queryByRole('button', {
          name: 'PC.Pages.Login.switchToQrLogin',
        }),
      ).toBeNull();
      expect(screen.getAllByRole('radio')).toHaveLength(2);
      expect(h.createQrCode).not.toHaveBeenCalled();
      expect(h.qrStatus).not.toHaveBeenCalled();
    },
  );

  it('开启后默认展示扫码页，账号登录标签由右上角切换后呈现', async () => {
    render(<Login />);
    await screen.findByRole('img', { name: 'PC.Pages.Login.qrCodeLabel' });
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(h.createQrCode).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Pages.Login.switchToAccountLogin',
      }),
    );
    const options = screen.getAllByRole('radio');
    expect(options.map((option) => option.parentElement?.textContent)).toEqual([
      'PC.Pages.Login.passwordLogin',
      'PC.Pages.Login.codeLoginOrRegister',
    ]);
    expect(options[0]).toBeChecked();
    expect(
      screen.getByRole('button', { name: 'PC.Pages.Login.switchToQrLogin' }),
    ).toBeEnabled();
  });

  it('配置异步返回开启后直接展示扫码页，不先展示账号表单', async () => {
    h.loadEnd = false;
    h.tenantConfig = {};
    const { rerender } = render(<Login />);
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(h.createQrCode).not.toHaveBeenCalled();
    h.loadEnd = true;
    h.tenantConfig = { openQrLogin: 1 };
    rerender(<Login />);
    await screen.findByRole('img', { name: 'PC.Pages.Login.qrCodeLabel' });
    expect(screen.queryByRole('radiogroup')).toBeNull();
    expect(h.createQrCode).toHaveBeenCalledOnce();
  });

  it('扫码与账号登录往返切换会取消旧扫码请求，并保留验证码登录选项', async () => {
    render(<Login />);
    await screen.findByRole('img', { name: 'PC.Pages.Login.qrCodeLabel' });
    const firstSignal = h.createQrCode.mock.calls[0][0] as AbortSignal;
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Pages.Login.switchToAccountLogin',
      }),
    );
    expect(firstSignal.aborted).toBe(true);
    fireEvent.click(screen.getByText('PC.Pages.Login.codeLoginOrRegister'));
    expect(screen.getAllByRole('radio')[1]).toBeChecked();
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Pages.Login.switchToQrLogin' }),
    );
    await screen.findByRole('img', { name: 'PC.Pages.Login.qrCodeLabel' });
    expect(h.createQrCode).toHaveBeenCalledTimes(2);
    const secondSignal = h.createQrCode.mock.calls[1][0] as AbortSignal;
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Pages.Login.switchToAccountLogin',
      }),
    );
    expect(secondSignal.aborted).toBe(true);
    expect(screen.getAllByRole('radio')[1]).toBeChecked();
    expect(
      screen.queryByPlaceholderText('PC.Pages.Login.inputPasswordPlaceholder'),
    ).toBeNull();
  });

  it('扫码中关闭配置会取消请求，回到密码登录且不消费迟到确认', async () => {
    let resolveStatus!: (value: unknown) => void;
    h.qrStatus.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStatus = resolve;
      }),
    );
    const { rerender } = render(<Login />);
    await waitFor(() => expect(h.qrStatus).toHaveBeenCalledOnce());
    const signal = h.createQrCode.mock.calls[0][0] as AbortSignal;
    h.tenantConfig = { openQrLogin: 0 };
    rerender(<Login />);
    expect(signal.aborted).toBe(true);
    expect(screen.queryByText('PC.Pages.Login.qrLogin')).toBeNull();
    expect(screen.getAllByRole('radio')[0]).toBeChecked();
    expect(
      screen.getByPlaceholderText('PC.Pages.Login.inputPasswordPlaceholder'),
    ).toBeInTheDocument();
    await act(async () => {
      resolveStatus({
        code: '0000',
        data: { status: 'CONFIRMED', token: '' },
      });
    });
    expect(h.finishLogin).not.toHaveBeenCalled();
    expect(h.navigateAfterLogin).not.toHaveBeenCalled();
  });

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
    await waitFor(() => expect(h.finishLogin).toHaveBeenCalledOnce());
    expect(
      screen.getByRole('button', {
        name: 'PC.Pages.Login.switchToAccountLogin',
      }),
    ).toBeDisabled();
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
    await screen.findByRole('img', { name: 'PC.Pages.Login.qrCodeLabel' });
    const firstSignal = h.createQrCode.mock.calls[0][0] as AbortSignal;
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Pages.Login.switchToAccountLogin',
      }),
    );
    expect(firstSignal.aborted).toBe(true);
    expect(
      screen.getByPlaceholderText(
        'PC.Pages.Login.inputUnifiedAccountPlaceholder',
      ),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'PC.Pages.Login.switchToQrLogin' }),
    );
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

interface LoginCaptchaSdk {
  button: string;
  getInstance: (instance: { destroyCaptcha: () => void }) => void;
  captchaVerifyCallback: (param: string) => Promise<unknown>;
}

describe('扫码与账号登录往返时的阿里云验证码', () => {
  let instances: Array<{
    sdk: LoginCaptchaSdk;
    destroy: ReturnType<typeof vi.fn>;
    click: ReturnType<typeof vi.fn>;
  }>;
  let respondToClick: boolean;

  beforeEach(() => {
    instances = [];
    respondToClick = true;
    h.tenantConfig = {
      openQrLogin: 1,
      openCaptcha: 1,
      captchaSceneId: 'scene-A',
      captchaPrefix: 'prefix',
    };
    vi.stubGlobal('initAliyunCaptcha', (sdk: LoginCaptchaSdk) => {
      const button = document.querySelector(sdk.button)!;
      const click = vi.fn(() => {
        if (respondToClick) void sdk.captchaVerifyCallback('current-token');
      });
      button.addEventListener('click', click);
      const destroy = vi.fn(() => button.removeEventListener('click', click));
      instances.push({ sdk, destroy, click });
      sdk.getInstance({ destroyCaptcha: destroy });
    });
  });

  async function openAccount() {
    const view = render(<Login />);
    await screen.findByRole('img', { name: 'PC.Pages.Login.qrCodeLabel' });
    vi.useFakeTimers();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'PC.Pages.Login.switchToAccountLogin',
      }),
    );
    return view;
  }

  async function submitPassword() {
    fireEvent.change(
      screen.getByPlaceholderText(
        'PC.Pages.Login.inputUnifiedAccountPlaceholder',
      ),
      { target: { value: 'test-account' } },
    );
    fireEvent.change(
      screen.getByPlaceholderText('PC.Pages.Login.inputPasswordPlaceholder'),
      { target: { value: 'test-password' } },
    );
    await act(async () => {
      fireEvent.submit(document.querySelector('form')!);
    });
  }

  it('初始扫码页不初始化，快速往返与密码短信标签共用首次创建的实例', async () => {
    const view = render(<Login />);
    await screen.findByRole('img', { name: 'PC.Pages.Login.qrCodeLabel' });
    expect(instances).toHaveLength(0);
    expect(document.getElementById('captcha-element')).toBeNull();
    for (let round = 0; round < 4; round++) {
      fireEvent.click(
        screen.getByRole('button', {
          name: 'PC.Pages.Login.switchToAccountLogin',
        }),
      );
      expect(instances).toHaveLength(1);
      fireEvent.click(screen.getByText('PC.Pages.Login.codeLoginOrRegister'));
      fireEvent.click(screen.getByText('PC.Pages.Login.passwordLogin'));
      expect(instances).toHaveLength(1);
      fireEvent.click(
        screen.getByRole('button', { name: 'PC.Pages.Login.switchToQrLogin' }),
      );
      await screen.findByRole('img', { name: 'PC.Pages.Login.qrCodeLabel' });
      expect(instances[0].destroy).not.toHaveBeenCalled();
      await instances[0].sdk.captchaVerifyCallback('late-token');
    }
    expect(h.passwordLogin).not.toHaveBeenCalled();
    view.unmount();
    expect(instances[0].destroy).toHaveBeenCalledOnce();
    expect(window.__captchaInitAt).toBeUndefined();
  });

  it('初始化前提交不会在就绪后自动重放，必须重新点击登录', async () => {
    await openAccount();
    const button = document.querySelector<HTMLButtonElement>(
      'form button[type="submit"]',
    )!;
    expect(button.disabled).toBe(true);
    await submitPassword();
    await act(() => vi.advanceTimersByTimeAsync(5100));
    expect(button.disabled).toBe(false);
    expect(instances[0].click).not.toHaveBeenCalled();
    expect(h.passwordLogin).not.toHaveBeenCalled();
    await submitPassword();
    expect(instances[0].click).toHaveBeenCalledOnce();
  });

  it('取参后配置变化取消旧的验证等待，新一轮仍能正常提交且防重复点击', async () => {
    const view = await openAccount();
    await act(() => vi.advanceTimersByTimeAsync(5100));
    await submitPassword();
    expect(instances[0].click).toHaveBeenCalledOnce();
    expect(h.passwordLogin).not.toHaveBeenCalled();
    h.tenantConfig = { ...h.tenantConfig, captchaSceneId: 'scene-B' };
    view.rerender(<Login />);
    await act(() => vi.advanceTimersByTimeAsync(5100));
    expect(instances).toHaveLength(2);
    expect(h.passwordLogin).not.toHaveBeenCalled();
    await instances[0].sdk.captchaVerifyCallback('old-token');
    await submitPassword();
    await submitPassword();
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(h.passwordLogin).toHaveBeenCalledOnce();
    expect(h.passwordLogin).toHaveBeenCalledWith({
      phoneOrEmail: 'test-account',
      password: 'test-password',
      captchaVerifyParam: 'current-token',
    });
  });

  it('无弹窗超时会销毁旧验证轮次，迟到回调不能污染重试', async () => {
    await openAccount();
    await act(() => vi.advanceTimersByTimeAsync(5100));
    respondToClick = false;
    await submitPassword();
    await act(() => vi.advanceTimersByTimeAsync(3300));
    expect(instances).toHaveLength(2);
    expect(instances[0].destroy).toHaveBeenCalledOnce();
    await instances[0].sdk.captchaVerifyCallback('late-token');
    expect(h.passwordLogin).not.toHaveBeenCalled();
    respondToClick = true;
    await act(() => vi.advanceTimersByTimeAsync(5100));
    await submitPassword();
    await act(() => vi.advanceTimersByTimeAsync(500));
    expect(h.passwordLogin).toHaveBeenCalledOnce();
  });

  it('实际请求失败会消费拒绝并解锁，下一次请求成功后完成登录收尾', async () => {
    h.realPasswordRequests = true;
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      h.apiPasswordLogin
        .mockRejectedValueOnce(new Error('用户不存在或密码错误'))
        .mockResolvedValueOnce({ data: { token: 'current-token' } });
      await openAccount();
      await act(() => vi.advanceTimersByTimeAsync(5100));
      await submitPassword();
      await act(() => vi.advanceTimersByTimeAsync(800));
      expect(h.apiPasswordLogin).toHaveBeenCalledOnce();
      expect(h.finishLogin).not.toHaveBeenCalled();
      expect(
        screen.getByRole('button', { name: 'PC.Pages.Login.switchToQrLogin' }),
      ).toBeEnabled();
      await submitPassword();
      await act(() => vi.advanceTimersByTimeAsync(800));
      expect(h.apiPasswordLogin).toHaveBeenCalledTimes(2);
      expect(h.finishLogin).toHaveBeenCalledOnce();
      expect(h.finishLogin).toHaveBeenCalledWith('current-token');
    } finally {
      error.mockRestore();
    }
  });

  it('登录请求期间离页，迟到成功不能再同步会话或导航', async () => {
    h.realPasswordRequests = true;
    let finish!: (value: unknown) => void;
    h.apiPasswordLogin.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const view = await openAccount();
    await act(() => vi.advanceTimersByTimeAsync(5100));
    await submitPassword();
    await act(() => vi.advanceTimersByTimeAsync(800));
    expect(h.apiPasswordLogin).toHaveBeenCalledOnce();
    view.unmount();
    await act(async () => {
      finish({ data: { token: 'old-token' } });
    });
    expect(h.finishLogin).not.toHaveBeenCalled();
    expect(h.loadMenus).not.toHaveBeenCalled();
    expect(h.navigateAfterLogin).not.toHaveBeenCalled();
  });
});
