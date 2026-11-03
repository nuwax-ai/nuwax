import SpaceInvite from '@/pages/SpaceInvite';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  code: 'abc',
  info: vi.fn(),
  join: vi.fn(),
  replace: vi.fn(),
}));
vi.mock('umi', () => ({
  useParams: () => ({ code: mocks.code }),
  history: { replace: mocks.replace },
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/spaceInvite', () => ({
  apiGetSpaceInviteInfo: mocks.info,
  apiJoinSpaceInvite: mocks.join,
}));
vi.mock('@/pages/SpaceInvite/index.less', () => ({ default: {} }));

const active = {
  status: 'Active',
  spaceId: 1140,
  spaceName: '测试团队',
  role: 'User',
  expire: null,
  joined: false,
};
const ok = (data: unknown) => ({ code: '0000', data });
const key = (suffix: string) => `PC.Pages.SpaceInvite.${suffix}`;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.code = 'abc';
  mocks.info.mockReset().mockResolvedValue(ok(active));
  mocks.join.mockReset().mockResolvedValue(ok(null));
});
afterEach(cleanup);

describe('邀请入团流程', () => {
  it('匿名用户回到带邀请码的完整登录目标', async () => {
    mocks.info.mockResolvedValue({
      code: '4011',
      message: '/login?redirect=incorrect',
    });
    render(<SpaceInvite />);
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        '/login?redirect=%2Finvite%2Fspace%2Fabc',
      ),
    );
    expect(mocks.join).not.toHaveBeenCalled();
  });

  it('登录后自动加入；重复点击不重复提交，成功通过站内路由直达邀请对应 IM 团队群', async () => {
    let resolveJoin!: (value: unknown) => void;
    mocks.join.mockReturnValue(
      new Promise((resolve) => {
        resolveJoin = resolve;
      }),
    );
    render(<SpaceInvite />);
    const button = await screen.findByRole('button', { name: key('join') });
    await waitFor(() => expect(mocks.join).toHaveBeenCalledTimes(1));
    fireEvent.click(button);
    fireEvent.click(button);
    expect(mocks.join).toHaveBeenCalledTimes(1);
    await act(async () => resolveJoin(ok(null)));
    expect(await screen.findByText(key('joinedSuccess'))).toBeInTheDocument();
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        '/instant-message?spaceId=1140',
      ),
    );
  });

  it('自动入团失败不跳错误群，重试成功后才打开 IM', async () => {
    mocks.join
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(ok(null));
    render(<SpaceInvite />);
    expect(await screen.findByText(key('joinFailed'))).toBeInTheDocument();
    expect(mocks.replace).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: key('join') }));
    expect(await screen.findByText(key('joinedSuccess'))).toBeInTheDocument();
    expect(mocks.join).toHaveBeenCalledTimes(2);
    expect(mocks.replace).toHaveBeenCalledWith('/instant-message?spaceId=1140');
  });

  it.each(['Expired', 'Disabled'])('%s 邀请不显示加入操作', async (status) => {
    mocks.info.mockResolvedValue(ok({ status, spaceId: null }));
    render(<SpaceInvite />);
    expect(
      await screen.findByText(
        key(status === 'Expired' ? 'expiredTitle' : 'disabledTitle'),
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: key('join') }),
    ).not.toBeInTheDocument();
  });

  it('已有成员不再次提交加入', async () => {
    mocks.info.mockResolvedValue(ok({ ...active, joined: true }));
    render(<SpaceInvite />);
    expect(await screen.findByText(key('alreadyJoined'))).toBeInTheDocument();
    expect(mocks.join).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith('/instant-message?spaceId=1140');
  });

  it('入团时被作废则展示最新状态，不继续保留旧的加入按钮', async () => {
    mocks.info
      .mockResolvedValueOnce(ok(active))
      .mockResolvedValueOnce(ok({ status: 'Disabled', spaceId: null }));
    mocks.join.mockResolvedValue({ code: '5000', message: 'disabled' });
    render(<SpaceInvite />);
    expect(await screen.findByText(key('disabledTitle'))).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: key('join') }),
    ).not.toBeInTheDocument();
  });

  it('切换邀请码后忽略旧请求，防止展示或加入上一个团队', async () => {
    let resolveOld!: (value: unknown) => void;
    mocks.info.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const view = render(<SpaceInvite />);
    mocks.code = 'new-code';
    mocks.info.mockResolvedValue(
      ok({ ...active, spaceId: 2222, spaceName: '新团队' }),
    );
    view.rerender(<SpaceInvite />);
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith(
        '/instant-message?spaceId=2222',
      ),
    );
    await act(async () => resolveOld(ok(active)));
    expect(screen.queryByText('测试团队')).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.join).toHaveBeenCalledWith('new-code'));
    expect(mocks.replace).toHaveBeenCalledWith('/instant-message?spaceId=2222');
    expect(mocks.replace).not.toHaveBeenCalledWith(
      '/instant-message?spaceId=1140',
    );
  });
});
