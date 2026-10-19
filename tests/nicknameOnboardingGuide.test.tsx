/**
 * NicknameOnboardingGuide 默认名用户首登昵称/头像引导弹窗行为测试。
 *
 * 守卫契约（规划 7.3：非必填、可跳过、不拦主流程）：
 * - 判定：userName 仍是默认名形态（user+数字）且 nickName 为空才弹；
 * - 跳过：本会话（sessionStorage 级）不再弹，重挂载也不弹；
 * - 保存成功：关窗 + 同步 userInfo 模型与本地缓存，此后条件不再满足不重弹；
 * - 保存失败：弹窗保留并出错误反馈，可重试；
 * - 昵称：非空去首尾空格校验，50 字上限（输入框截断 + 校验兜底）。
 */
import NicknameOnboardingGuide from '@/components/business-component/NicknameOnboardingGuide';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { message as antdMessage } from 'antd';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  apiUserUpdate: vi.fn(),
  getUserInfo: vi.fn(),
  setUserInfo: vi.fn(),
  runTenantConfig: vi.fn(),
  getUserInfoFromStorage: vi.fn(),
  saveUserInfoToStorage: vi.fn(),
}));

/** 测试内可变的 userInfo 模型状态（模拟 umi model 共享状态） */
let userInfoState: Record<string, unknown> | null;

vi.mock('umi', () => ({
  useModel: (name: string) => {
    if (name === 'userInfo') {
      return {
        userInfo: userInfoState,
        getUserInfo: h.getUserInfo,
        setUserInfo: h.setUserInfo,
      };
    }
    if (name === 'tenantConfigInfo') {
      return { runTenantConfig: h.runTenantConfig };
    }
    return {};
  },
}));

vi.mock('@/services/account', () => ({
  apiUserUpdate: h.apiUserUpdate,
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('@/services/userService', () => ({
  UserService: {
    getUserInfoFromStorage: h.getUserInfoFromStorage,
    saveUserInfoToStorage: h.saveUserInfoToStorage,
  },
}));

// 头像上传链路替身：点击模拟「上传成功回调 url」（上传本身由 Uploader 侧专测）
vi.mock('@/components/UploadAvatar', () => ({
  default: ({ onUploadSuccess }: { onUploadSuccess?: (url: string) => void }) => (
    <button
      type="button"
      data-testid="upload-avatar-stub"
      onClick={() => onUploadSuccess?.('https://cdn.example.com/a.png')}
    />
  ),
}));

vi.mock('@/assets/images/avatar.png', () => ({ default: 'avatar.png' }));

vi.mock(
  '@/components/business-component/NicknameOnboardingGuide/index.less',
  () => ({ default: new Proxy({}, { get: (_t, key) => String(key) }) }),
);

// 真实 antd 保证 Modal/Form 校验链路可信，仅打桩 message 静态提示
vi.mock('antd', async (importOriginal) => {
  const original = await importOriginal<typeof import('antd')>();
  return {
    ...original,
    message: { ...original.message, success: vi.fn() },
  };
});

const TITLE_KEY = 'PC.Components.NicknameOnboardingGuide.title';
const SKIP_KEY = 'PC.Components.NicknameOnboardingGuide.skip';
const SAVE_KEY = 'PC.Common.Global.save';
const PLACEHOLDER_KEY =
  'PC.Components.NicknameOnboardingGuide.nickNamePlaceholder';
const REQUIRED_KEY =
  'PC.Components.NicknameOnboardingGuide.nickNameRequired';
const SAVE_FAILED_KEY = 'PC.Components.NicknameOnboardingGuide.saveFailed';

/** 默认名 + 空昵称的典型新用户 */
const defaultNameUser = {
  id: 9,
  userName: 'user9',
  nickName: '',
  avatar: '',
};

const renderGuide = () => render(<NicknameOnboardingGuide />);

const findModalTitle = () => screen.findByText(TITLE_KEY);

const typeNickname = async (text: string) => {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText(PLACEHOLDER_KEY), text);
  return user;
};

beforeEach(() => {
  sessionStorage.clear();
  userInfoState = { ...defaultNameUser };
  // 模拟真实 setUserInfo：函数式更新落回模型状态
  h.setUserInfo.mockImplementation(
    (updater: (prev: Record<string, unknown> | null) => Record<string, unknown>) => {
      userInfoState =
        typeof updater === 'function' ? updater(userInfoState) : updater;
    },
  );
  h.getUserInfo.mockResolvedValue(defaultNameUser);
  h.getUserInfoFromStorage.mockReturnValue({ ...defaultNameUser });
  h.apiUserUpdate.mockReset();
  h.runTenantConfig.mockReset();
  vi.mocked(antdMessage.success).mockClear();
});

afterEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe('判定条件：默认名 + 空昵称才弹', () => {
  it('userName 为默认名形态且昵称为空时弹出引导', async () => {
    renderGuide();
    expect(await findModalTitle()).toBeTruthy();
  });

  it('userName 已是自定义名时不弹', () => {
    userInfoState = { ...defaultNameUser, userName: 'zhangsan' };
    const { container } = renderGuide();
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(TITLE_KEY)).toBeNull();
  });

  it('昵称已设置时不弹', () => {
    userInfoState = { ...defaultNameUser, nickName: '小明' };
    const { container } = renderGuide();
    expect(container).toBeEmptyDOMElement();
  });

  it('用户信息未加载时不弹，并兜底拉取用户信息', async () => {
    userInfoState = null;
    renderGuide();
    await waitFor(() => expect(h.getUserInfo).toHaveBeenCalled());
    expect(screen.queryByText(TITLE_KEY)).toBeNull();
  });
});

describe('跳过：本会话不再弹', () => {
  it('点「跳过」关窗，本会话内重挂载不再弹', async () => {
    const { unmount } = renderGuide();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: SKIP_KEY }));
    expect(screen.queryByText(TITLE_KEY)).toBeNull();
    // 会话级标记已落
    expect(sessionStorage.getItem('NICKNAME_ONBOARDING_SKIPPED_9')).toBe('1');

    // 模拟本会话内路由/布局变化导致的重挂载：条件仍满足但不再弹
    unmount();
    userInfoState = { ...defaultNameUser };
    const { container } = renderGuide();
    await waitFor(() => expect(h.getUserInfo).not.toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});

describe('保存成功：关窗、同步用户信息、不再触发', () => {
  it('提交 trim 后昵称，成功后关窗并同步模型与本地缓存', async () => {
    const { rerender } = renderGuide();
    const user = await typeNickname('  小明  ');
    await user.click(await screen.findByRole('button', { name: SAVE_KEY }));

    await waitFor(() => expect(h.apiUserUpdate).toHaveBeenCalled());
    expect(h.apiUserUpdate).toHaveBeenCalledWith({ nickName: '小明' });
    expect(h.saveUserInfoToStorage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 9, nickName: '小明' }),
    );
    expect(antdMessage.success).toHaveBeenCalled();
    expect(h.runTenantConfig).toHaveBeenCalled();

    // 模型状态已被 setUserInfo 同步：昵称非空，条件不再满足
    expect(userInfoState).toMatchObject({ nickName: '小明' });
    rerender(<NicknameOnboardingGuide />);
    await waitFor(() =>
      expect(screen.queryByText(TITLE_KEY)).toBeNull(),
    );
    expect(sessionStorage.getItem('NICKNAME_ONBOARDING_SKIPPED_9')).toBe('1');
  });

  it('上传头像后保存，头像随昵称一并提交', async () => {
    renderGuide();
    const user = await typeNickname('小明');
    await user.click(screen.getByTestId('upload-avatar-stub'));
    await user.click(await screen.findByRole('button', { name: SAVE_KEY }));
    await waitFor(() => expect(h.apiUserUpdate).toHaveBeenCalled());
    expect(h.apiUserUpdate).toHaveBeenCalledWith({
      nickName: '小明',
      avatar: 'https://cdn.example.com/a.png',
    });
  });
});

describe('保存失败：不关窗、有错误反馈、可重试', () => {
  it('首次失败保留弹窗并提示，重试成功后关闭', async () => {
    h.apiUserUpdate
      .mockRejectedValueOnce(new Error('server error'))
      .mockResolvedValueOnce({ code: '0000', data: null });
    renderGuide();
    const user = await typeNickname('小明');
    await user.click(await screen.findByRole('button', { name: SAVE_KEY }));

    // 失败：弹窗保留 + 弹窗内错误反馈
    expect(await screen.findByText(SAVE_FAILED_KEY)).toBeTruthy();
    expect(screen.getByText(TITLE_KEY)).toBeTruthy();
    expect(antdMessage.success).not.toHaveBeenCalled();

    // 重试成功：关窗
    await user.click(screen.getByRole('button', { name: SAVE_KEY }));
    await waitFor(() => expect(h.apiUserUpdate).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText(TITLE_KEY)).toBeNull());
  });
});

describe('昵称校验：非空去空格 + 50 字上限', () => {
  it('空昵称提交被拦截，不发请求', async () => {
    renderGuide();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: SAVE_KEY }));
    expect(await screen.findByText(REQUIRED_KEY)).toBeTruthy();
    expect(h.apiUserUpdate).not.toHaveBeenCalled();
  });

  it('纯空白昵称提交同样被拦截', async () => {
    renderGuide();
    const user = await typeNickname('   ');
    await user.click(await screen.findByRole('button', { name: SAVE_KEY }));
    expect(await screen.findByText(REQUIRED_KEY)).toBeTruthy();
    expect(h.apiUserUpdate).not.toHaveBeenCalled();
  });

  it('输入超 50 字在 UI 层被截断为 50 字后再提交', async () => {
    renderGuide();
    const user = await typeNickname('a'.repeat(51));
    const input = screen.getByPlaceholderText(
      PLACEHOLDER_KEY,
    ) as HTMLInputElement;
    expect(input.value).toHaveLength(50);
    await user.click(await screen.findByRole('button', { name: SAVE_KEY }));
    await waitFor(() => expect(h.apiUserUpdate).toHaveBeenCalled());
    expect(h.apiUserUpdate).toHaveBeenCalledWith({
      nickName: 'a'.repeat(50),
    });
  });
});
