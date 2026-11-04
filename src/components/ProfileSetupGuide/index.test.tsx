import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * L2 新用户「取昵称+设头像」引导弹框：两项均可选、可关闭、
 * 保存昵称走 apiUserUpdate；跳过/空昵称不调接口。
 */

// vitest 禁止直接 import umi 模块，mock 最小面（沿用 PublishComponentModal 测试惯例）
const setUserInfo = vi.fn();
let mockUserInfo: Record<string, unknown> = {
  id: 1,
  tenantId: 1,
  userName: 'user1792564071',
  nickName: '',
};
let mockUploadSuccess: ((url: string) => void) | undefined;

vi.mock('umi', () => ({
  useModel: () => ({ userInfo: mockUserInfo, setUserInfo }),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('@/services/account', () => ({
  apiUserUpdate: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/components/UploadAvatar', () => ({
  // 测试只关心回调链路：上传成功触发 onUploadSuccess(url)
  default: ({
    onUploadSuccess,
  }: {
    onUploadSuccess?: (url: string) => void;
  }) => {
    mockUploadSuccess = onUploadSuccess;
    return (
      <button
        type="button"
        onClick={() => onUploadSuccess?.('https://example.com/a.png')}
      >
        upload
      </button>
    );
  },
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
  mockUserInfo = {
    id: 1,
    tenantId: 1,
    userName: 'user1792564071',
    nickName: '',
  };
  vi.mocked(apiUserUpdate)
    .mockReset()
    .mockResolvedValue(null as never);
  setUserInfo.mockImplementation((user) => {
    mockUserInfo = user;
  });
});

describe('ProfileSetupGuide（L2 引导弹框）', () => {
  it('open=true 渲染标题/昵称输入/跳过/保存', () => {
    renderModal(true);
    expect(
      screen.getByText('PC.Components.ProfileSetupGuide.title'),
    ).toBeTruthy();
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
    fireEvent.change(
      screen.getByPlaceholderText('PC.Pages.Setting.inputNickName'),
      {
        target: { value: '东' },
      },
    );
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
  it('头像保存后保留昵称草稿，保存昵称时保留最新头像', async () => {
    renderModal();
    const input = screen.getByPlaceholderText('PC.Pages.Setting.inputNickName');
    fireEvent.change(input, { target: { value: '昵称草稿' } });
    await act(async () => {
      fireEvent.click(screen.getByText('upload'));
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(input).toHaveValue('昵称草稿');
    await act(async () => {
      fireEvent.click(screen.getByText('PC.Common.Global.save'));
    });
    expect(setUserInfo).toHaveBeenLastCalledWith(
      expect.objectContaining({
        nickName: '昵称草稿',
        avatar: 'https://example.com/a.png',
      }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('保存失败保留草稿并允许重试，不泄漏拒绝', async () => {
    vi.mocked(apiUserUpdate).mockRejectedValueOnce(
      new Error('fixture rejected'),
    );
    renderModal();
    const input = screen.getByPlaceholderText('PC.Pages.Setting.inputNickName');
    fireEvent.change(input, { target: { value: '待重试' } });
    await act(async () => {
      fireEvent.click(screen.getByText('PC.Common.Global.save'));
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(input).toHaveValue('待重试');
    await act(async () => {
      fireEvent.click(screen.getByText('PC.Common.Global.save'));
    });
    expect(apiUserUpdate).toHaveBeenCalledTimes(2);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('同 ID 切换租户后丢弃旧保存结果并清除旧昵称', async () => {
    let resolve!: (value: never) => void;
    vi.mocked(apiUserUpdate).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const view = renderModal();
    fireEvent.change(
      screen.getByPlaceholderText('PC.Pages.Setting.inputNickName'),
      { target: { value: '旧租户昵称' } },
    );
    fireEvent.click(screen.getByText('PC.Common.Global.save'));
    await waitFor(() => expect(apiUserUpdate).toHaveBeenCalledTimes(1));
    mockUserInfo = { ...mockUserInfo, tenantId: 2 };
    view.rerender(<ProfileSetupGuide open onClose={onClose} />);
    await act(async () => {
      resolve(null as never);
    });
    expect(setUserInfo).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.getByPlaceholderText('PC.Pages.Setting.inputNickName'),
    ).toHaveValue('');
  });

  it('关闭重开后旧保存结果不能关闭新弹框或写回缓存', async () => {
    let resolve!: (value: never) => void;
    vi.mocked(apiUserUpdate).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const view = renderModal();
    fireEvent.change(
      screen.getByPlaceholderText('PC.Pages.Setting.inputNickName'),
      { target: { value: '旧草稿' } },
    );
    fireEvent.click(screen.getByText('PC.Common.Global.save'));
    await waitFor(() => expect(apiUserUpdate).toHaveBeenCalledTimes(1));
    view.rerender(<ProfileSetupGuide open={false} onClose={onClose} />);
    view.rerender(<ProfileSetupGuide open onClose={onClose} />);
    await act(async () => {
      resolve(null as never);
    });
    expect(setUserInfo).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('换账号后旧上传回调不能保存到新账号', async () => {
    const view = renderModal();
    const oldUploadSuccess = mockUploadSuccess;
    mockUserInfo = { ...mockUserInfo, id: 2 };
    view.rerender(<ProfileSetupGuide open onClose={onClose} />);
    await act(async () => {
      oldUploadSuccess?.('https://example.com/old.png');
    });
    expect(apiUserUpdate).not.toHaveBeenCalled();
  });
  it('同账号关闭重开后旧上传回调不能写入新弹框', async () => {
    const view = renderModal();
    const oldUploadSuccess = mockUploadSuccess;
    view.rerender(<ProfileSetupGuide open={false} onClose={onClose} />);
    view.rerender(<ProfileSetupGuide open onClose={onClose} />);
    await act(async () => {
      oldUploadSuccess?.('https://example.com/old.png');
    });
    expect(apiUserUpdate).not.toHaveBeenCalled();
  });
  it('引导卸载后旧上传回调不能继续保存资料', async () => {
    const view = renderModal();
    const oldUploadSuccess = mockUploadSuccess;
    view.unmount();
    await act(async () => {
      oldUploadSuccess?.('https://example.com/old.png');
    });
    expect(apiUserUpdate).not.toHaveBeenCalled();
  });
  it('引导卸载后在途保存结果不再写回用户缓存', async () => {
    let resolve!: (value: never) => void;
    vi.mocked(apiUserUpdate).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const view = renderModal();
    fireEvent.change(
      screen.getByPlaceholderText('PC.Pages.Setting.inputNickName'),
      { target: { value: '旧昵称' } },
    );
    fireEvent.click(screen.getByText('PC.Common.Global.save'));
    await waitFor(() => expect(apiUserUpdate).toHaveBeenCalledTimes(1));
    view.unmount();
    await act(async () => {
      resolve(null as never);
    });
    expect(setUserInfo).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
