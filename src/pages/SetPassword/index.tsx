import SvgIcon from '@/components/base/SvgIcon';
import BasicLayout from '@/pages/Login/BasicLayout';
import { apiSetPassword } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import type { SetPasswordFieldType } from '@/types/interfaces/login';
import { navigateToAuthUrl } from '@/utils/authNavigation';
import { validatePassword } from '@/utils/common';
import { navigateAfterLogin, replaceLoginStep } from '@/utils/loginNavigation';
import { Button, Form, FormProps, Input } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { history, useModel, useRequest, useSearchParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 设置密码
 */
const SetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { setTitle } = useModel('tenantConfigInfo');
  const { loadMenus } = useModel('menuModel');

  const { runAsync, loading } = useRequest(apiSetPassword, {
    manual: true,
  });

  useEffect(() => {
    // 设置页面title
    setTitle();
  }, []);

  const onFinish: FormProps<SetPasswordFieldType>['onFinish'] = async ({
    password,
  }) => {
    try {
      await runAsync({ password });
      await loadMenus(true);
      navigateAfterLogin(
        history,
        searchParams.get('redirect'),
        null,
        navigateToAuthUrl,
      );
    } catch {
      // 请求层已经提示，保留表单供重试，不泄漏事件处理器的拒绝。
    }
  };

  return (
    <BasicLayout>
      <div className={cx(styles.container)}>
        <div className={cx(styles.back)}>
          <Button
            color="default"
            variant="filled"
            shape="circle"
            icon={<SvgIcon name="icons-nav-backward" />}
            onClick={() =>
              replaceLoginStep(history, 'login', searchParams.get('redirect'))
            }
          />
        </div>
        <Form
          rootClassName={cx(styles.form, 'flex', 'flex-col')}
          name="login"
          validateTrigger="onBlur"
          onFinish={onFinish}
        >
          <Form.Item>
            <h3 className={cx(styles.title)}>
              {dict('PC.Pages.SetPassword.title')}
            </h3>
            <p className={cx(styles['sub-title'])}>
              {dict('PC.Pages.SetPassword.description')}
            </p>
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: dict('PC.Pages.SetPassword.passwordRequired'),
              },
              {
                validator(_, value) {
                  if (!value || validatePassword(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error(dict('PC.Pages.SetPassword.invalidPassword')),
                  );
                },
              },
            ]}
          >
            <Input.Password
              rootClassName={cx(styles.input)}
              placeholder={dict('PC.Pages.SetPassword.passwordPlaceholder')}
              autoComplete="off"
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            rules={[
              {
                required: true,
                message: dict('PC.Pages.SetPassword.confirmPasswordRequired'),
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const _password = getFieldValue('password');
                  if (!value || _password === value) {
                    return Promise.resolve();
                  }
                  if (_password && _password !== value) {
                    return Promise.reject(
                      new Error(dict('PC.Pages.SetPassword.passwordMismatch')),
                    );
                  }
                  return Promise.reject(
                    new Error(
                      dict('PC.Pages.SetPassword.confirmPasswordInvalid'),
                    ),
                  );
                },
              }),
            ]}
          >
            <Input.Password
              rootClassName={cx(styles.input)}
              placeholder={dict(
                'PC.Pages.SetPassword.confirmPasswordPlaceholder',
              )}
              autoComplete="off"
            />
          </Form.Item>
          <Form.Item className={cx(styles.login)}>
            <Button
              className={cx(styles.btn)}
              block
              type="primary"
              loading={loading}
              htmlType="submit"
            >
              {dict('PC.Common.Global.confirm')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </BasicLayout>
  );
};

export default SetPassword;
