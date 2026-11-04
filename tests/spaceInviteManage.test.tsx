import InviteMember from '@/pages/TeamSetting/components/InviteMember';
import '@/utils/setupDayjsPlugins';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  lang: 'zh' as 'zh' | 'en',
  create: vi.fn(),
  list: vi.fn(),
  disable: vi.fn(),
  qr: vi.fn(),
}));
vi.mock('@/services/i18nRuntime', async () => {
  const { I18N_KEY_REGEX, MIN_ZH_I18N_MAP, MIN_EN_I18N_MAP } = await import(
    '@/constants/i18n.constants'
  );
  return {
    dict: (key: string, ...values: string[]) => {
      if (
        /\.status(?:Active|Expired|Disabled)$/.test(key) &&
        I18N_KEY_REGEX.test(key)
      ) {
        return (
          (mocks.lang === 'zh' ? MIN_ZH_I18N_MAP : MIN_EN_I18N_MAP)[key] || key
        );
      }
      return [key, ...values].join(' ');
    },
  };
});
vi.mock('@/services/spaceInvite', () => ({
  apiCreateSpaceInvite: mocks.create,
  apiListSpaceInvites: mocks.list,
  apiDisableSpaceInvite: mocks.disable,
  apiGetSpaceInviteQr: mocks.qr,
}));
vi.mock('@/utils/clipboard', () => ({ copyTextToClipboard: vi.fn() }));
vi.mock('@/pages/TeamSetting/components/InviteMember.less', () => ({
  default: {},
}));

const invite = {
  id: 1,
  spaceId: 1140,
  inviteUrl: 'https://example.com/invite/space/abc',
  role: 'User',
  status: 'Active',
  expire: null,
};
const key = (suffix: string) => `PC.Pages.SpaceInvite.${suffix}`;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.lang = 'zh';
  mocks.create.mockReset().mockResolvedValue({ code: '0000', data: invite });
  mocks.list.mockReset().mockResolvedValue({ code: '0000', data: [] });
  mocks.qr
    .mockReset()
    .mockRejectedValue(new Error('QR temporarily unavailable'));
});
afterEach(cleanup);

describe('团队邀请管理', () => {
  it.each([
    ['zh', 'Active', '有效'],
    ['zh', 'Expired', '已过期'],
    ['zh', 'Disabled', '已作废'],
    ['en', 'Active', 'Active'],
    ['en', 'Expired', 'Expired'],
    ['en', 'Disabled', 'Disabled'],
  ] as const)(
    '%s 语言的 %s 状态使用合法词条显示为 %s',
    async (lang, status, label) => {
      mocks.lang = lang;
      mocks.list.mockResolvedValue({
        code: '0000',
        data: [{ ...invite, status }],
      });
      render(<InviteMember spaceId={1140} open onCancel={vi.fn()} />);
      fireEvent.click(screen.getByRole('tab', { name: key('historyTab') }));
      expect(await screen.findByText(label)).toBeInTheDocument();
      expect(screen.queryByText(key(status))).not.toBeInTheDocument();
    },
  );
  it('打开弹窗不创建记录，手动生成默认邀请为普通成员且 7 天过期', async () => {
    render(<InviteMember spaceId={1140} open onCancel={vi.fn()} />);
    await waitFor(() => expect(mocks.list).toHaveBeenCalledWith(1140));
    expect(mocks.create).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: key('generate') }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    const params = mocks.create.mock.calls[0][0];
    expect(params).toMatchObject({ spaceId: 1140, role: 'User' });
    expect(
      Math.abs(Date.parse(params.expire) - Date.now() - 7 * 86400000),
    ).toBeLessThan(3000);
    expect(
      await screen.findByDisplayValue(invite.inviteUrl),
    ).toBeInTheDocument();
  });

  it('选择管理员和永久有效时不发送 expire，生成失败可再次点击', async () => {
    mocks.create.mockRejectedValueOnce(new Error('network'));
    render(<InviteMember spaceId={1140} open onCancel={vi.fn()} />);
    fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
    fireEvent.click(await screen.findByText('PC.Pages.TeamSetting.roleAdmin'));
    fireEvent.mouseDown(screen.getAllByRole('combobox')[1]);
    fireEvent.click(await screen.findByText(key('never')));
    const button = screen.getByRole('button', { name: key('generate') });
    fireEvent.click(button);
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(button.querySelector('.anticon-loading')).toBeNull(),
    );
    expect(mocks.create.mock.calls[0][0]).toEqual({
      spaceId: 1140,
      role: 'Admin',
    });
    fireEvent.click(button);
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(2));
  });

  it('作废成功后更新状态并清除二维码入口', async () => {
    mocks.list.mockResolvedValue({ code: '0000', data: [invite] });
    mocks.disable.mockResolvedValue({ code: '0000' });
    render(<InviteMember spaceId={1140} open onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('tab', { name: key('historyTab') }));
    fireEvent.click(
      await screen.findByRole('button', { name: key('disable') }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'OK' }));
    await waitFor(() => expect(mocks.disable).toHaveBeenCalledWith(1));
    expect(await screen.findByText('已作废')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: key('viewQr') }),
    ).not.toBeInTheDocument();
  });
});
