import AliyunCaptcha from '@/components/AliyunCaptcha';
import { VERIFICATION_CODE_LEN } from '@/constants/common.constants';
import { ACCESS_TOKEN, EXPIRE_DATE, PHONE } from '@/constants/home.constants';
import useCountDown from '@/hooks/useCountDown';
import useSendCode from '@/hooks/useSendCode';
import BasicLayout from '@/pages/Login/BasicLayout';
import { apiLoginCode } from '@/services/account';
import { SendCodeEnum } from '@/types/enums/login';
import type { ILoginResult } from '@/types/interfaces/login';
import { CodeLogin } from '@/types/interfaces/login';
import { getNumbersOnly } from '@/utils/common';
import { LeftOutlined } from '@ant-design/icons';
import { Button, Input, InputRef } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useLocation, useModel, useNavigate, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const DefaultCode = Array(VERIFICATION_CODE_LEN).fill(null);
const VerifyCode: React.FC = () => {
  const elementId = 'aliyun-captcha-sms';
  const location = useLocation();
  const navigate = useNavigate();
  const { countDown, handleCount } = useCountDown();
  const { runSendCode, sendLoading } = useSendCode();
  const [codeString, setCodeString] = useState<string>('');
  const [errorString, setErrorString] = useState<string>('');
  const inputRef = useRef<InputRef | null>(null);
  const { phoneOrEmail, areaCode, authType, captchaVerifyParam } =
    location.state;

  const { tenantConfigInfo, setTitle } = useModel('tenantConfigInfo');

  const handleClick = () => {
    inputRef.current!.focus({
      preventScroll: true,
      cursor: 'end',
    });
  };

  // 验证码登录
  const { run: runLoginCode } = useRequest(apiLoginCode, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ILoginResult, params: CodeLogin[]) => {
      const { resetPass, expireDate, token } = result;
      localStorage.setItem(ACCESS_TOKEN, token);
      localStorage.setItem(EXPIRE_DATE, expireDate);
      localStorage.setItem(PHONE, params[0].phone);
      // 判断用户是否设置过密码，如果未设置过，需要弹出密码设置框让用户设置密码
      if (!resetPass) {
        history.push('/set-password');
      } else {
        navigate('/', { replace: true });
      }
    },
  });

  const codes = useMemo(() => {
    const newCodes = DefaultCode.slice(0);
    // 如果codeString存在，则将codeString的值赋值给newCodes
    if (!!codeString) {
      let i = 0;
      while (i < codeString.length) {
        newCodes[i] = codeString.charAt(i);
        i++;
      }
    }
    return newCodes;
  }, [codeString]);

  const codeIndex = useMemo(() => codeString?.length || 0, [codeString]);

  // 明确 HTMLInputElement 对应的事件对象类型
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      const numberString = getNumbersOnly(value) as string;
      const _codeString = numberString.substring(0, VERIFICATION_CODE_LEN);
      setCodeString(_codeString);
      if (_codeString.length < VERIFICATION_CODE_LEN && errorString) {
        setErrorString('');
      }
      // 验证码输入完毕后自动触发登录
      if (_codeString.length === VERIFICATION_CODE_LEN && !sendLoading) {
        // 使用setTimeout确保状态更新完成后再执行登录
        setTimeout(() => {
          const data = {
            code: _codeString,
            phoneOrEmail,
          };
          runLoginCode(data);
        }, 100);
      }
    },
    [errorString, sendLoading, phoneOrEmail, runLoginCode],
  );

  // 发送验证码
  const handleSendCode = (captchaVerifyParam: string) => {
    handleCount();
    const isPhone = authType === 1;
    const _params = {
      type: SendCodeEnum.LOGIN_OR_REGISTER,
      [isPhone ? 'phone' : 'email']: phoneOrEmail,
      ...(captchaVerifyParam && { captchaVerifyParam }),
    };
    runSendCode(_params);
  };

  const isNeedAliyunCaptcha = () => {
    const { captchaSceneId, captchaPrefix, openCaptcha } =
      tenantConfigInfo || {};
    // 只有同时满足三个条件才启用验证码：场景ID存在、身份标存在、开启验证码
    return !!(
      tenantConfigInfo &&
      captchaSceneId !== '' &&
      captchaPrefix !== '' &&
      openCaptcha
    );
  };

  const handlerSuccess = (value: string = '') => {
    handleSendCode(value);
  };

  useEffect(() => {
    handleClick();
    // 发送验证码

    if (!isNeedAliyunCaptcha()) {
      //不需要阿里云验证码，直接执行登录/验证码逻辑
      handlerSuccess();
    }

    // 设置页面title
    setTitle();
  }, []);

  const handleReady = () => {
    if (isNeedAliyunCaptcha()) {
      // document.getElementById(elementId)?.click();
      handlerSuccess(captchaVerifyParam);
    }
  };

  const handleVerify = () => {
    const data = {
      code: codeString,
      phoneOrEmail,
    };
    runLoginCode(data);
  };

  const handleSendCodeInit = () => {
    const { captchaSceneId, captchaPrefix, openCaptcha } =
      tenantConfigInfo || {};
    // 只有同时满足三个条件才启用验证码：场景ID存在、身份标存在、开启验证码
    const needAliyunCaptcha = !!(
      tenantConfigInfo &&
      captchaSceneId !== '' &&
      captchaPrefix !== '' &&
      openCaptcha
    );
    // 如果需要阿里云验证码，则点击按钮触发验证码
    if (needAliyunCaptcha) {
      document.getElementById(elementId)?.click();
    } else {
      //不需要阿里云验证码，直接执行登录/验证码逻辑
      handlerSuccess();
    }
  };

  const handleClickReSendCode = useCallback(() => {
    if (countDown > 0) {
      return;
    }
    handleSendCodeInit();
  }, [tenantConfigInfo, handlerSuccess]);

  const handleEnter = useCallback(
    (e: KeyboardEvent): void => {
      if (e.keyCode === 13 || e.which === 13) {
        if (codeString?.length !== VERIFICATION_CODE_LEN || sendLoading) {
          return;
        }
        handleVerify();
      }
    },
    [codeString, sendLoading],
  );

  useEffect(() => {
    window.addEventListener('keyup', handleEnter);
    return () => {
      window.removeEventListener('keyup', handleEnter);
    };
  }, [handleEnter]);

  return (
    <BasicLayout>
      <div className={cx(styles.container)}>
        <div className={cx(styles.inner, 'flex', 'flex-col', 'items-center')}>
          <div className={cx(styles.back)}>
            <Button
              color="default"
              variant="filled"
              shape="circle"
              icon={<LeftOutlined />}
              onClick={() => history.back()}
            />
          </div>
          <h3>
            {phoneOrEmail?.includes('@') ? '输入邮箱验证码' : '输入短信验证码'}
          </h3>
          <p>
            {`验证码已发送至${
              phoneOrEmail?.includes('@') ? '你的邮箱 ' : '手机号 '
            }`}
            {`${!phoneOrEmail?.includes('@') ? areaCode : ''} ${phoneOrEmail}`}
          </p>
          <div className={cx(styles['code-container'])}>
            {codes.map((code, index) => {
              return (
                <span
                  onClick={handleClick}
                  key={index}
                  className={cx(
                    styles['code-item'],
                    codeIndex === index && !code ? styles.active : null,
                    errorString ? styles.error : null,
                  )}
                >
                  {code}
                </span>
              );
            })}
          </div>
          <div className={cx(styles['count-down-container'])}>
            {countDown > 0 && (
              <span className={styles['count-down']}>{countDown}s后</span>
            )}
            <span
              className={cx(
                styles['resend-btn'],
                countDown > 0 ? null : styles.active,
                'cursor-pointer',
              )}
              onClick={handleClickReSendCode}
            >
              重新获取
            </span>
          </div>
        </div>
        <Input
          ref={inputRef}
          onChange={handleChange}
          className={cx(styles.input)}
          autoComplete="off"
          value={codes.join('')}
        />
        <Button id="aliyun-captcha-sms" style={{ display: 'none' }} />
        <AliyunCaptcha
          config={tenantConfigInfo}
          doAction={handlerSuccess}
          onReady={handleReady}
          elementId="aliyun-captcha-sms"
        />
      </div>
    </BasicLayout>
  );
};

export default VerifyCode;
