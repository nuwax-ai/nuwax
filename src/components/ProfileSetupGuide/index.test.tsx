import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * L2 新用户「取昵称+设头像」引导弹框：两项均可选、可关闭、
 * 保存昵称走 apiUserUpdate；跳过/空昵称不调接口。
 */

// vitest 禁止直接 import umi 模块，mock 最小面（沿用 PublishComponentModal 测试惯例）
const setUserInfo = vi.fn();
let mockUserInfo = { userName: 'user1792564071', nickName: '' };

vi.mock('umi', () => ({
  useModel: () => ({ userInfo: mockUserInfo, setUserInfo }),
  useRequest: (service: (...args: any[]) => any, options: any = {}) => ({
    run: (...args: any[]) => {
      Promise.resolve()
        .then(() => service(...args))
        .then((data: any) => options.onSuccess?.(data, args))
        .catch(() => options.onError?.());
    },
    loading: false,
  }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('@/services/account', () => ({
  apiUserUpdate: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/components/UploadAvatar', () => ({
  // 测试只关心回调链路：上传成功触发 onUploadSuccess(url)
  default: ({ onUploadSuccess }: { onUploadSuccess?: (url: string) => void }) => (
    <button
      type="button"
      onClick={() => onUploadSuccess?.('https://example.com/a.png')}
    >
      upload
    </button>
  ),
}));

vi.mock('@/assets/images/avatar.png', () => ({ default: 'avatar.png' }));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));

import ProfileSetupGuide from '@/components/ProfileSetupGuide';
import { apiUserUpdate } from '@/services/account';

const onClose = vi.fn();

const renderModal = (open = true) =>
  render(<ProfileSetupGuide open={open} onClose={onClose} />);

beforeEach(() => {
  vi.clearAllMocks();
  mockUserInfo = { userName: 'user1792564071', nickName: '' };
});

describe('ProfileSetupGuide（L2 引导弹框）', () => {
  it('open=true 渲染标题/昵称输入/跳过/保存', () => {
    renderModal(true);
    expect(screen.getByText('PC.Components.ProfileSetupGuide.title')).toBeTruthy();
    expect(
      screen.getByPlaceholderText('PC.Pages.Setting.inputNickName'),
    ).toBeTruthy();
    expect(
      screen.getByText('PC.Components.ProfileSetupGuide.skip'),
    ).toBeTruthy();
    expect(screen.getByText('PC.Common.Global.save')).toBeTruthy();
  });

  it('open=false 不渲染', () => {
    renderModal(false);
    expect(
      screen.queryByText('PC.Components.ProfileSetupGuide.title'),
    ).toBeNull();
  });

  it('跳过：直接关闭，不调保存接口', () => {
    renderModal(true);
    fireEvent.click(screen.getByText('PC.Components.ProfileSetupGuide.skip'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(apiUserUpdate).not.toHaveBeenCalled();
  });

  it('空昵称点保存：只关闭，不调接口（两项均可选）', () => {
    renderModal(true);
    fireEvent.click(screen.getByText('PC.Common.Global.save'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(apiUserUpdate).not.toHaveBeenCalled();
  });

  it('填昵称点保存：apiUserUpdate({nickName}) 并更新 userInfo', async () => {
    renderModal(true);
    fireEvent.change(screen.getByPlaceholderText('PC.Pages.Setting.inputNickName'), {
      target: { value: '东' },
    });
    await act(async () => {
      fireEvent.click(screen.getByText('PC.Common.Global.save'));
    });
    expect(apiUserUpdate).toHaveBeenCalledWith({ nickName: '东' });
    expect(setUserInfo).toHaveBeenCalledWith(
      expect.objectContaining({ nickName: '东', userName: 'user1792564071' }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('上传头像成功：立即 apiUserUpdate({avatar})', async () => {
    renderModal(true);
    await act(async () => {
      fireEvent.click(screen.getByText('upload'));
    });
    expect(apiUserUpdate).toHaveBeenCalledWith({
      avatar: 'https://example.com/a.png',
    });
  });
});
