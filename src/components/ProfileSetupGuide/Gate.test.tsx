import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * L2 引导 Gate：只在「刚完成登录」（sessionStorage 标记）且默认账号形态时弹；
 * 持久会话冷启动（无标记）不弹；标记一次性消费。
 */

let mockUser: Record<string, unknown> | null = null;

const { mockGetUserInfo } = vi.hoisted(() => ({ mockGetUserInfo: vi.fn() }));
vi.mock('umi', () => ({
  useModel: () => ({
    userInfo: mockUser,
    setUserInfo: vi.fn(),
    getUserInfo: mockGetUserInfo,
  }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('@/components/UploadAvatar', () => ({
  default: () => <span />,
}));

vi.mock('@/assets/images/avatar.png', () => ({ default: 'avatar.png' }));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

import ProfileSetupGuideGate from '@/components/ProfileSetupGuide/Gate';
import {
  consumeLoginJustCompleted,
  markLoginJustCompleted,
} from '@/utils/profileSetupGate';

const renderGate = () => render(<ProfileSetupGuideGate active />);

beforeEach(() => {
  sessionStorage.clear();
  mockUser = null;
  mockGetUserInfo.mockReset().mockImplementation(async () => mockUser);
});

describe('ProfileSetupGuideGate（L2 登录门）', () => {
  it('无「刚完成登录」标记（持久会话冷启动）→ 不弹', async () => {
    mockUser = { userName: 'user1792564071', nickName: '' };
    renderGate();
    await act(async () => {});
    expect(
      screen.queryByText('PC.Components.ProfileSetupGuide.title'),
    ).toBeNull();
  });

  it('有标记 + 默认账号形态（user+数字/昵称空）→ 弹引导', async () => {
    mockUser = { userName: 'user1792564071', nickName: '' };
    markLoginJustCompleted();
    renderGate();
    await waitFor(() =>
      expect(
        screen.getByText('PC.Components.ProfileSetupGuide.title'),
      ).toBeTruthy(),
    );
  });

  it('有标记但已设昵称 → 不弹（设置后不再弹口径）', async () => {
    mockUser = { userName: 'user1792564071', nickName: '东' };
    markLoginJustCompleted();
    renderGate();
    await act(async () => {});
    expect(
      screen.queryByText('PC.Components.ProfileSetupGuide.title'),
    ).toBeNull();
  });

  it('有标记但用户信息获取失败 → 不弹不抛错（宁可不弹）', async () => {
    mockGetUserInfo.mockRejectedValueOnce(new Error('offline'));
    markLoginJustCompleted();
    renderGate();
    await act(async () => {});
    expect(
      screen.queryByText('PC.Components.ProfileSetupGuide.title'),
    ).toBeNull();
  });

  it('标记一次性消费：弹框关闭后标记已清空', async () => {
    mockUser = { userName: 'user123', nickName: null };
    markLoginJustCompleted();
    renderGate();
    await waitFor(() =>
      expect(
        screen.getByText('PC.Components.ProfileSetupGuide.skip'),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByText('PC.Components.ProfileSetupGuide.skip'));
    expect(consumeLoginJustCompleted()).toBe(false);
  });

  it('未登录标记为空时 consume 返回 false', () => {
    expect(consumeLoginJustCompleted()).toBe(false);
  });
  it('登录失效后的迟到用户结果不再弹出引导', async () => {
    let resolve!: (user: Record<string, unknown>) => void;
    mockGetUserInfo.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    markLoginJustCompleted();
    const view = renderGate();
    view.rerender(<ProfileSetupGuideGate active={false} />);
    await act(async () => {
      resolve({ userName: 'user123', nickName: '' });
    });
    expect(
      screen.queryByText('PC.Components.ProfileSetupGuide.title'),
    ).toBeNull();
  });

  it('StrictMode 重放 effect 不丢失刚完成登录的判定', async () => {
    mockUser = { userName: 'user123', nickName: '' };
    markLoginJustCompleted();
    render(
      <React.StrictMode>
        <ProfileSetupGuideGate active />
      </React.StrictMode>,
    );
    await waitFor(() =>
      expect(
        screen.getByText('PC.Components.ProfileSetupGuide.title'),
      ).toBeTruthy(),
    );
    expect(mockGetUserInfo).toHaveBeenCalledTimes(1);
  });
});
