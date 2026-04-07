import { VERIFICATION_CODE_LEN } from '@/constants/common.constants';
import useCountDown from '@/hooks/useCountDown';
import useSendCode from '@/hooks/useSendCode';
import { apiBindEmail } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import { SendCodeEnum } from '@/types/enums/login';
import type { BindEmailParams } from '@/types/interfaces/login';
import { isValidEmail, isValidPhone } from '@/utils/common';
import { customizeRequiredNoStarMark } from '@/utils/form';
import { Button, Form, FormProps, Input, message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 邮箱绑定
 */
const SettingEmail: React.FC = () => {
  const { countDown, setCountDown, onClearTimer, handleCount } = useCountDown();
  const { runSendCode } = useSendCode();
  const [form] = Form.useForm<BindEmailParams>();
  const { userInfo, setUserInfo } = useModel('userInfo');

  // 获取当前登录方式是否为手机登录,如果是手机登录,则为true,否则为false
  const authType = localStorage.getItem('AUTH_TYPE') === '1';

  // 绑定邮箱
  const { run, loading } = useRequest(apiBindEmail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: BindEmailParams[]) => {
      message.success(dict('PC.Layouts.Setting.SettingEmail.bindSuccess'));
      form.resetFields();
      setCountDown(0);
      onClearTimer();

      // 更新用户信息
      if (params[0]?.email) {
        setUserInfo({
          ...userInfo,
          email: params[0].email,
        });
      } else if (params[0]?.phone) {
        setUserInfo({
          ...userInfo,
          phone: params[0].phone,
        });
      }
    },
    onError: () => {
      setCountDown(0);
      onClearTimer();
    },
  });

  // 绑定事件
  const handlerBindEmail: FormProps<BindEmailParams>['onFinish'] = (values) => {
    run(values);
  };

  const handleSendCode = () => {
    const fieldName: 'phone' | 'email' = authType ? 'email' : 'phone';
    form.validateFields([fieldName]).then((values) => {
      handleCount();
      runSendCode({
        type: SendCodeEnum.BIND_EMAIL,
        [fieldName]: values[fieldName],
      });
    });
  };

  return (
    <div className={cx(styles.container)}>
      <h3>
        {authType
          ? dict('PC.Layouts.Setting.SettingEmail.emailBindTitle')
          : dict('PC.Layouts.Setting.SettingEmail.phoneBindTitle')}
      </h3>
      <Form
        layout="vertical"
        form={form}
        rootClassName={cx(styles.form)}
        requiredMark={customizeRequiredNoStarMark}
        onFinish={handlerBindEmail}
      >
        <Form.Item
          name={authType ? 'email' : 'phone'}
          label={
            authType
              ? dict('PC.Layouts.Setting.SettingEmail.emailAddress')
              : dict('PC.Layouts.Setting.SettingEmail.phoneNumber')
          }
          rules={[
            {
              required: true,
              message: authType
                ? dict('PC.Layouts.Setting.SettingEmail.inputEmailAddress')
                : dict('PC.Layouts.Setting.SettingEmail.inputPhoneNumber'),
            },
            {
              validator(_, value) {
                if (!value) return Promise.resolve();
                if (authType) {
                  return isValidEmail(value)
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error(
                          dict(
                            'PC.Layouts.Setting.SettingEmail.inputCorrectEmail',
                          ),
                        ),
                      );
                } else {
                  return isValidPhone(value)
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error(
                          dict(
                            'PC.Layouts.Setting.SettingEmail.inputCorrectPhone',
                          ),
                        ),
                      );
                }
              },
            },
          ]}
        >
          <Input
            placeholder={
              authType
                ? dict('PC.Layouts.Setting.SettingEmail.inputEmailAddress')
                : dict('PC.Layouts.Setting.SettingEmail.inputPhoneNumber')
            }
          />
        </Form.Item>
        <Form.Item
          name="code"
          label={dict('PC.Layouts.Setting.SettingEmail.verificationCode')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Layouts.Setting.SettingEmail.inputVerificationCode',
              ),
            },
            {
              validator(_, value) {
                if (!value || value?.length === VERIFICATION_CODE_LEN) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    dict('PC.Layouts.Setting.SettingEmail.inputCorrectCode'),
                  ),
                );
              },
            },
          ]}
        >
          <div className={cx('flex', 'content-between')}>
            <Input
              rootClassName={styles.input}
              placeholder={dict(
                'PC.Layouts.Setting.SettingEmail.placeholderCode',
              )}
            />
            {countDown < 60 && countDown > 0 ? (
              <Button rootClassName={styles.btn} disabled type="primary">
                {`${countDown}s`}
              </Button>
            ) : (
              <Button
                rootClassName={styles.btn}
                type="primary"
                onClick={handleSendCode}
              >
                {dict('PC.Layouts.Setting.SettingEmail.sendCode')}
              </Button>
            )}
          </div>
        </Form.Item>
        <Form.Item>
          <Button block type="primary" htmlType="submit" loading={loading}>
            {dict('PC.Layouts.Setting.SettingEmail.bind')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default SettingEmail;
