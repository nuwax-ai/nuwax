import { PHONE } from '@/constants/home.constants';
import ResetPassword from '@/layouts/Setting/ResetPassword';
import SettingEmail from '@/layouts/Setting/SettingEmail';
import SensitiveWordFormModal from '@/pages/SystemManagement/SystemConfig/SensitiveWord/SensitiveWordFormModal';
import {
  SensitiveWordActionEnum,
  SensitiveWordCategoryEnum,
  SensitiveWordMatchTypeEnum,
  type SensitiveWordInfo,
} from '@/types/interfaces/sensitiveWord';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  send: vi.fn(),
  image: vi.fn(),
}));
vi.mock('umi', () => ({
  useRequest: () => ({ run: vi.fn(), loading: false }),
  useModel: (name: string) =>
    name === 'tenantConfigInfo'
      ? { tenantConfigInfo: { openImageCaptcha: 1 } }
      : { userInfo: {}, setUserInfo: vi.fn() },
}));
vi.mock('@/services/account', () => ({
  apiResetPassword: vi.fn(),
  apiBindEmail: vi.fn(),
  apiImageCaptcha: h.image,
}));
vi.mock('@/hooks/useSendCode', () => ({
  default: () => ({ runSendCode: h.send }),
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('@/layouts/Setting/ResetPassword/index.less', () => ({
  default: {
    container: 'reset-password',
    form: 'form',
    input: 'input',
    btn: 'btn',
  },
}));
vi.mock('@/layouts/Setting/SettingEmail/index.less', () => ({
  default: {
    container: 'setting-email',
    form: 'form',
    input: 'input',
    btn: 'btn',
  },
}));
// 只隔离弹窗外壳，保留实际 ProForm 字段、Antd Form 校验与页面提交逻辑。
vi.mock('@/components/ProComponents', async () => {
  const { Form } = await import('antd');
  return {
    XModalForm: ({ open, form, onFinish, children }: any) =>
      open ? (
        <Form form={form} onFinish={onFinish}>
          {children}
          <button type="submit">保存</button>
        </Form>
      ) : null,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  h.send.mockReset().mockResolvedValue({ code: '0000' });
  localStorage.setItem('AUTH_TYPE', '1');
  localStorage.setItem(PHONE, '13800009300');
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('C3 登录态设置发码', () => {
  it.each([
    {
      name: '重置密码',
      Component: ResetPassword,
      type: 'RESET_PASSWORD',
      params: { phone: '13800009300' },
    },
    {
      name: '绑定邮箱',
      Component: SettingEmail,
      type: 'BIND_EMAIL',
      params: { email: 'bind@example.test' },
    },
  ])(
    '$name 在图码开关开启时直接发码，失败后可立即重试且不取图',
    async ({ Component, type, params }) => {
      render(<Component />);
      if (type === 'BIND_EMAIL')
        fireEvent.change(
          screen.getByRole('textbox', {
            name: 'PC.Layouts.Setting.SettingEmail.emailAddress',
          }),
          { target: { value: params.email } },
        );
      expect(
        screen.queryByText('PC.Components.ImageCaptcha.label'),
      ).not.toBeInTheDocument();
      h.send.mockRejectedValueOnce(new Error('发送失败'));
      const button = screen.getByRole('button', { name: /sendCode/ });
      fireEvent.click(button);
      await waitFor(() => expect(h.send).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(button).toBeEnabled());
      fireEvent.click(button);
      await waitFor(() => expect(h.send).toHaveBeenCalledTimes(2));
      expect(h.send).toHaveBeenLastCalledWith({ type, ...params });
      expect(h.image).not.toHaveBeenCalled();
    },
  );
  it('绑定邮箱字段不合法时不发码，修正后仍可发送', async () => {
    render(<SettingEmail />);
    fireEvent.click(screen.getByRole('button', { name: /sendCode/ }));
    expect(
      await screen.findByText(
        'PC.Layouts.Setting.SettingEmail.inputEmailAddress',
      ),
    ).toBeInTheDocument();
    expect(h.send).not.toHaveBeenCalled();
    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'PC.Layouts.Setting.SettingEmail.emailAddress',
      }),
      { target: { value: 'bind@example.test' } },
    );
    fireEvent.click(screen.getByRole('button', { name: /sendCode/ }));
    await waitFor(() => expect(h.send).toHaveBeenCalledTimes(1));
  });
});

const baseRecord: SensitiveWordInfo = {
  id: 1,
  word: '独立敏感词',
  category: SensitiveWordCategoryEnum.Illegal,
  matchType: SensitiveWordMatchTypeEnum.Contain,
  action: SensitiveWordActionEnum.Replace,
  status: 1,
};
const replacement = () =>
  screen.getByRole('textbox', {
    name: /PC.Pages.SystemSensitiveWord.replaceChar/,
  });

describe('C4 敏感词单字符配置', () => {
  it('新增默认不展示字段；切换替换后默认星号，断开连接提交不带字段', async () => {
    const save = vi.fn().mockResolvedValue(true);
    render(<SensitiveWordFormModal open onCancel={() => {}} onFinish={save} />);
    expect(
      screen.queryByRole('textbox', {
        name: /PC.Pages.SystemSensitiveWord.replaceChar/,
      }),
    ).not.toBeInTheDocument();
    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'PC.Pages.SystemSensitiveWord.word',
      }),
      { target: { value: ' 新增词 ' } },
    );
    fireEvent.click(
      screen.getByRole('radio', {
        name: 'PC.Pages.SystemSensitiveWord.actionReplace',
      }),
    );
    expect(
      await screen.findByRole('textbox', {
        name: /PC.Pages.SystemSensitiveWord.replaceChar/,
      }),
    ).toHaveValue('*');
    fireEvent.click(
      screen.getByRole('radio', {
        name: 'PC.Pages.SystemSensitiveWord.actionDisconnect',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0]).toMatchObject({
      word: '新增词',
      action: 'DISCONNECT',
    });
    expect(save.mock.calls[0][0]).not.toHaveProperty('replaceChar');
  });
  it.each([undefined, null, '', '#'])(
    '编辑回显 %s，空值按星号保存且只提交一个字符',
    async (replaceChar) => {
      const save = vi.fn().mockResolvedValue(true);
      render(
        <SensitiveWordFormModal
          open
          record={{ ...baseRecord, replaceChar }}
          onCancel={() => {}}
          onFinish={save}
        />,
      );
      await waitFor(() =>
        expect(replacement()).toHaveValue(replaceChar || '*'),
      );
      fireEvent.change(replacement(), { target: { value: '' } });
      fireEvent.click(screen.getByRole('button', { name: '保存' }));
      await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
      expect(save.mock.calls[0][0]).toMatchObject({
        action: 'REPLACE',
        replaceChar: '*',
      });
    },
  );
  it('多字符值无法提交，修正为单字符后可保存', async () => {
    const save = vi.fn().mockResolvedValue(true);
    render(
      <SensitiveWordFormModal
        open
        record={baseRecord}
        onCancel={() => {}}
        onFinish={save}
      />,
    );
    await waitFor(() => expect(replacement()).toHaveValue('*'));
    expect(replacement()).toHaveAttribute('maxlength', '1');
    // 模拟绕过输入框长度限制的粘贴/赋值，仍须由表单规则拒绝。
    fireEvent.change(replacement(), { target: { value: '**' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    expect(
      await screen.findByText(
        'PC.Pages.SystemSensitiveWord.replaceCharInvalid',
      ),
    ).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(replacement(), { target: { value: '#' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0]).toMatchObject({ replaceChar: '#' });
  });
  it('切换编辑记录和新增时不沿用上一条的替换字符', async () => {
    const props = {
      open: true,
      onCancel: () => {},
      onFinish: vi.fn().mockResolvedValue(true),
    };
    const view = render(
      <SensitiveWordFormModal
        {...props}
        record={{ ...baseRecord, replaceChar: '#' }}
      />,
    );
    await waitFor(() => expect(replacement()).toHaveValue('#'));
    view.rerender(
      <SensitiveWordFormModal {...props} record={{ ...baseRecord, id: 2 }} />,
    );
    await waitFor(() => expect(replacement()).toHaveValue('*'));
    view.rerender(<SensitiveWordFormModal {...props} record={null} />);
    fireEvent.click(
      screen.getByRole('radio', {
        name: 'PC.Pages.SystemSensitiveWord.actionReplace',
      }),
    );
    await waitFor(() => expect(replacement()).toHaveValue('*'));
  });
});
