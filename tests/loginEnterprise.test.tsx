import Login from '@/pages/Login';
import {
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
}));

vi.mock('umi', () => ({
  history: { replace: vi.fn() },
  useSearchParams: () => [new URLSearchParams()],
  useModel: (name: string) =>
    name === 'tenantConfigInfo'
      ? { loadEnd: true, tenantConfigInfo: {}, runTenantConfig: vi.fn() }
      : { loadMenus: vi.fn() },
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...args: unknown[]) => [key, ...args].join(' '),
  initI18n: vi.fn(),
  syncLangFromUserInfo: vi.fn(),
}));
vi.mock('@/hooks/useRequestPromiseBridge', () => ({
  default: () => ({ runWithPromise: vi.fn(), loading: false }),
}));
vi.mock('@/services/account', () => ({ apiLogin: vi.fn() }));
vi.mock('@/services/authIdp', () => ({
  apiAuthIdpLoginList: async () => ({ code: '0000', data: { items: [] } }),
}));
vi.mock('@/services/unifiedThemeService', () => ({
  unifiedThemeService: { clearUserThemeConfig: vi.fn() },
}));
vi.mock('@/services/userService', () => ({ UserService: {} }));
vi.mock('@/utils/authNavigation', () => ({ navigateToAuthUrl: vi.fn() }));
vi.mock('@/utils/businessAuth', () => ({ finishBusinessLogin: vi.fn() }));
vi.mock('@/utils/idpNavigation', () => ({
  completeDesktopIdpReturn: async () => 'none',
  startIdpNavigation: vi.fn(),
}));
vi.mock('@/utils/loginNavigation', () => ({
  navigateAfterLogin: vi.fn(),
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
vi.mock('@/pages/Login/LoginLangSwitcher', () => ({ default: () => null }));
vi.mock('@/pages/Login/SiteProtocol', () => ({ default: () => null }));

let originalBridge: unknown;
beforeEach(() => {
  originalBridge = (window as any).NuwaClawBridge;
  h.configureServerHost.mockReset().mockResolvedValue({ success: true });
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
  if (originalBridge === undefined) delete (window as any).NuwaClawBridge;
  else (window as any).NuwaClawBridge = originalBridge;
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
