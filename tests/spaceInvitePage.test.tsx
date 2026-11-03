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
  spaces: vi.fn(),
  replace: vi.fn(),
  setSpaceList: vi.fn(),
  setCurrentSpaceInfo: vi.fn(),
}));
vi.mock('umi', () => ({
  useParams: () => ({ code: mocks.code }),
  history: { replace: mocks.replace },
  useModel: () => ({
    setSpaceList: mocks.setSpaceList,
    setCurrentSpaceInfo: mocks.setCurrentSpaceInfo,
  }),
}));
vi.mock('@/constants/home.constants', () => ({ SPACE_ID: 'SPACE_ID' }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/services/spaceInvite', () => ({
  apiGetSpaceInviteInfo: mocks.info,
  apiJoinSpaceInvite: mocks.join,
}));
vi.mock('@/services/workspace', () => ({ apiSpaceList: mocks.spaces }));
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
  mocks.spaces
    .mockReset()
    .mockResolvedValue(ok([{ id: 1140, name: '测试团队' }]));
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

  it('确认前不入团；快速重复点击只发一次请求，成功刷新空间列表', async () => {
    let resolveJoin!: (value: unknown) => void;
    mocks.join.mockReturnValue(
      new Promise((resolve) => {
        resolveJoin = resolve;
      }),
    );
    render(<SpaceInvite />);
    const button = await screen.findByRole('button', { name: key('join') });
    expect(mocks.join).not.toHaveBeenCalled();
    fireEvent.click(button);
    fireEvent.click(button);
    expect(mocks.join).toHaveBeenCalledTimes(1);
    await act(async () => resolveJoin(ok(null)));
    expect(await screen.findByText(key('joinedSuccess'))).toBeInTheDocument();
    await waitFor(() =>
      expect(mocks.setSpaceList).toHaveBeenCalledWith([
        { id: 1140, name: '测试团队' },
      ]),
    );
    expect(localStorage.getItem('SPACE_ID')).toBe('1140');
  });

  it('失败可重试；空间列表刷新失败不撤销已成功的入团结果', async () => {
    mocks.join
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(ok(null));
    mocks.spaces.mockRejectedValue(new Error('network'));
    render(<SpaceInvite />);
    fireEvent.click(await screen.findByRole('button', { name: key('join') }));
    expect(await screen.findByText(key('joinFailed'))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: key('join') }));
    expect(await screen.findByText(key('joinedSuccess'))).toBeInTheDocument();
    expect(mocks.join).toHaveBeenCalledTimes(2);
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
  });

  it('入团时被作废则展示最新状态，不继续保留旧的加入按钮', async () => {
    mocks.info
      .mockResolvedValueOnce(ok(active))
      .mockResolvedValueOnce(ok({ status: 'Disabled', spaceId: null }));
    mocks.join.mockResolvedValue({ code: '5000', message: 'disabled' });
    render(<SpaceInvite />);
    fireEvent.click(await screen.findByRole('button', { name: key('join') }));
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
    mocks.info.mockResolvedValue(ok({ ...active, spaceName: '新团队' }));
    view.rerender(<SpaceInvite />);
    expect(await screen.findByText('新团队')).toBeInTheDocument();
    await act(async () => resolveOld(ok(active)));
    expect(screen.queryByText('测试团队')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: key('join') }));
    await waitFor(() => expect(mocks.join).toHaveBeenCalledWith('new-code'));
  });
});
