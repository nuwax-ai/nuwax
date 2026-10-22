/**
 * VerifyCode 页面关键行为测试（NW-124 / NW-049 / U-DK/PC1 前端加固）：
 * - 输入填满自动提交登录，pending 期间重复输入/回车不再发第二次请求
 * - 登录 pending 期间页面出现「正在登录」反馈
 * - 验证码失效类登录失败：清空已输入码、展示引导文案、放开重发冷却
 * - 重发流程进行中连点不重复触发发码
 */
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockRunLoginCode,
  mockRunSendCode,
  mockUseRequestOptions,
  mockLocationState,
  mockTenantConfig,
  mockFinishBusinessLogin,
  mockNavigateAfterLogin,
  mockSetTitle,
  mockLoadMenus,
} = vi.hoisted(() => ({
  /** useRequest(apiLoginCode) 返回的 run；由测试用例注入 onSuccess/onError 行为 */
  mockRunLoginCode: vi.fn(),
  /** useSendCode 返回的 runSendCode */
  mockRunSendCode: vi.fn(),
  /** 最新渲染捕获的 useRequest options（onSuccess/onError 由测试驱动） */
  mockUseRequestOptions: { current: null as any },
  mockLocationState: { current: {} as any },
  mockTenantConfig: { current: {} as any },
  mockFinishBusinessLogin: vi.fn(),
  mockNavigateAfterLogin: vi.fn(),
  mockSetTitle: vi.fn(),
  mockLoadMenus: vi.fn(),
}));

vi.mock('umi', () => ({
  history: { push: vi.fn(), replace: vi.fn(), go: vi.fn(), back: vi.fn() },
  useLocation: () => ({
    state: mockLocationState.current,
    pathname: '/verify-code',
  }),
  useSearchParams: () => [new URLSearchParams(''), vi.fn()],
  useModel: (name: string) => {
    if (name === 'tenantConfigInfo')
      return {
        tenantConfigInfo: mockTenantConfig.current,
        setTitle: mockSetTitle,
      };
    if (name === 'menuModel') return { loadMenus: mockLoadMenus };
    return {};
  },
  useRequest: (_service: unknown, options: any) => {
    // 组件依赖 ahooks 每渲染刷新 options 的行为，这里同步捕获最新回调
    mockUseRequestOptions.current = options;
    return { run: mockRunLoginCode, loading: false };
  },
}));

vi.mock('@/services/account', () => ({ apiLoginCode: vi.fn() }));

vi.mock('@/hooks/useSendCode', () => ({
  default: () => ({ runSendCode: mockRunSendCode, sendLoading: false }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  syncLangFromUserInfo: vi.fn(),
}));

vi.mock('@/services/userService', () => ({
  UserService: { refreshUserInfo: vi.fn().mockResolvedValue({}) },
}));

vi.mock('@/utils/businessAuth', () => ({
  finishBusinessLogin: mockFinishBusinessLogin,
}));

vi.mock('@/utils/authNavigation', () => ({
  navigateToAuthUrl: vi.fn(),
}));

vi.mock('@/utils/loginNavigation', () => ({
  navigateAfterLogin: mockNavigateAfterLogin,
  replaceLoginStep: vi.fn(),
}));

vi.mock('@/utils/hostBridge', () => ({
  hostBridge: { layout: { setSecondMenuAvailable: vi.fn() } },
}));

vi.mock('@/components/AliyunCaptcha', () => ({
  default: React.forwardRef((_props: unknown, _ref: unknown) => null),
}));

vi.mock('@/components/base/SvgIcon', () => ({
  default: () => <span data-testid="svg-icon" />,
}));

vi.mock('@/pages/Login/BasicLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/components/business-component/ImageCaptcha', () => ({
  // 关闭图形验证码场景仅消费 useImageCaptcha 的取参语义
  useImageCaptcha: (enabled: boolean) => ({
    take: () => (enabled ? null : ({} as any)),
    refresh: vi.fn(),
    inputProps: {},
  }),
  default: () => null,
}));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

import VerifyCode from './index';

/** 无阿里云验证码配置：mount 即自动发一次码并进入倒计时 */
const plainTenantConfig = {
  openCaptcha: 0,
  captchaSceneId: '',
  captchaPrefix: '',
  openImageCaptcha: 0,
};

const loginSuccessResult = {
  resetPass: true,
  expireDate: '2099-01-01',
  token: 'token',
  redirect: null,
};

const typeCode = (code: string) => {
  const input = document.querySelector('input') as HTMLInputElement;
  fireEvent.change(input, { target: { value: code } });
};

describe('验证码登录页提交与重发加固', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockLocationState.current = {
      phoneOrEmail: '13800138000',
      areaCode: '86',
      authType: 1,
      captchaVerifyParam: '',
    };
    mockTenantConfig.current = { ...plainTenantConfig };
    mockFinishBusinessLogin.mockResolvedValue('ready');
    mockRunSendCode.mockResolvedValue({ code: '0000', success: true });
    mockRunLoginCode.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('输入填满自动提交一次，登录未完成时重复输入与回车不再触发第二次请求', async () => {
    let settleLogin!: () => void;
    mockRunLoginCode.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          settleLogin = resolve;
        }),
    );

    render(<VerifyCode />);

    await act(async () => {
      typeCode('123456');
      vi.advanceTimersByTime(200);
    });
    expect(mockRunLoginCode).toHaveBeenCalledTimes(1);
    // 提交后立即出现「正在登录」反馈（NW-124）
    expect(screen.getByText('PC.Pages.VerifyCode.loggingIn')).toBeTruthy();

    // pending 期间再次输入完整码并连按回车：均被提交锁挡住
    await act(async () => {
      typeCode('654321');
      vi.advanceTimersByTime(200);
      fireEvent.keyUp(window, { key: 'Enter', keyCode: 13 });
      fireEvent.keyUp(window, { key: 'Enter', keyCode: 13 });
    });
    expect(mockRunLoginCode).toHaveBeenCalledTimes(1);

    await act(async () => {
      settleLogin();
      await mockUseRequestOptions.current.onSuccess(loginSuccessResult, [
        { code: '123456', phoneOrEmail: '13800138000' },
      ]);
    });
    expect(mockRunLoginCode).toHaveBeenCalledTimes(1);
    expect(mockNavigateAfterLogin).toHaveBeenCalled();
  });

  it('验证码失效类失败清空已输入码、展示引导文案并放开重发冷却（NW-049）', async () => {
    render(<VerifyCode />);
    // 倒计时进行中（55s）：失效失败后应立即清零放开重发
    await act(async () => {
      vi.advanceTimersByTime(1000 * 5);
    });
    expect(screen.getByText(/55/)).toBeTruthy();

    await act(async () => {
      typeCode('123456');
      vi.advanceTimersByTime(200);
    });
    expect(mockRunLoginCode).toHaveBeenCalledTimes(1);

    // 后端验证码失效时的 BizError（原始文案「校验参数异常」）
    await act(async () => {
      await mockUseRequestOptions.current.onError({
        name: 'BizError',
        message: '校验参数异常',
        info: { code: '4000', message: '校验参数异常' },
      });
    });

    expect(screen.getByText('PC.Pages.VerifyCode.codeInvalidTip')).toBeTruthy();
    // 输入已清空（六格为空），可直接重新输入新码
    expect(document.querySelector('input')?.value).toBe('');
    // 冷却已放开：倒计时文案消失，可直接点击重发
    expect(screen.queryByText(/55/)).toBeNull();
  });

  it('重发流程进行中连点不重复触发发码（U-DK/PC1）', async () => {
    let settleSend!: () => void;
    mockRunSendCode.mockImplementationOnce(() => {
      // mount 自动发码：进入倒计时后由测试手动放行
      return new Promise<void>((resolve) => {
        settleSend = resolve;
      });
    });

    render(<VerifyCode />);
    await act(async () => {
      vi.advanceTimersByTime(1000 * 61);
    });
    // 倒计时结束后自动发码仍未完成（pending），此时模拟其成功结束
    await act(async () => {
      settleSend();
    });
    expect(mockRunSendCode).toHaveBeenCalledTimes(1);

    // 点击重发 → 新一轮发码 pending；锁未释放前连点不再触发
    mockRunSendCode.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          settleSend = resolve;
        }),
    );
    const resend = screen.getByText('PC.Pages.VerifyCode.resend');
    await act(async () => {
      fireEvent.click(resend);
    });
    expect(mockRunSendCode).toHaveBeenCalledTimes(2);
    await act(async () => {
      fireEvent.click(resend);
      fireEvent.click(resend);
    });
    expect(mockRunSendCode).toHaveBeenCalledTimes(2);

    await act(async () => {
      settleSend();
    });
  });
});
