import { VERIFICATION_CODE_LEN } from '@/constants/common.constants';
import { ACCESS_TOKEN, EXPIRE_DATE } from '@/constants/home.constants';
import { apiLoginCode, apiSendCode } from '@/services/account';
import { SendCodeEnum } from '@/types/enums/login';
import type { ILoginResult } from '@/types/interfaces/login';
import { getNumbersOnly } from '@/utils/common';
import type { InputRef } from 'antd';
import { Button, Input, message } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history, useLocation, useNavigate, useRequest } from 'umi';
import styles from './index.less';
import useCountDown from '@/hooks/useCountDown';

const cx = classNames.bind(styles);

const DefaultCode = Array(VERIFICATION_CODE_LEN).fill(null);
const VerifyCode: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {countDown, handleCount} = useCountDown();
  const [codeString, setCodeString] = useState<string>('');
  const [errorString, setErrorString] = useState<string>('');
  const inputRef = useRef<InputRef | null>(null);
  const { phone, areaCode } = location.state;

  const handleClick = () => {
    inputRef.current!.focus({
      preventScroll: true,
      cursor: 'end',
    });
  };

  // 发送验证码
  const { run, loading } = useRequest(apiSendCode, {
    debounceWait: 300,
    defaultParams: {
      type: SendCodeEnum.LOGIN_OR_REGISTER,
      phone,
    },
    onSuccess: () => {
      message.success('验证码已发送');
    },
  });

  // 验证码登录
  const { run: runLoginCode, loadingLoginCode } = useRequest(apiLoginCode, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: ILoginResult) => {
      const { resetPass, expireDate, token } = result;
      localStorage.setItem(ACCESS_TOKEN, token);
      localStorage.setItem(EXPIRE_DATE, expireDate);
      // 判断用户是否设置过密码，如果未设置过，需要弹出密码设置框让用户设置密码
      if (!resetPass) {
        history.push('/set-password');
      } else {
        navigate('/', { replace: true });
      }
    },
  });

  const codes = useMemo(() => {
    if (!codeString) {
      return DefaultCode.slice(0);
    }
    let i = 0;
    const newCodes = DefaultCode.slice(0);
    while (i < codeString.length) {
      newCodes[i] = codeString.charAt(i);
      i++;
    }
    return newCodes;
  }, [codeString]);

  const codeIndex = useMemo(() => codeString?.length || 0, [codeString]);

  const handleChange = useCallback(
    (e) => {
      const { value } = e.target;
      const numberString = getNumbersOnly(value) as string;
      const _codeString = numberString.substring(0, VERIFICATION_CODE_LEN);
      setCodeString(_codeString);
      if (_codeString.length < VERIFICATION_CODE_LEN && errorString) {
        setErrorString('');
      }
    },
    [codes, errorString],
  );

  const handleSendCode = async () => {
    handleCount();
    run({
      type: SendCodeEnum.LOGIN_OR_REGISTER,
      phone,
    });
  };

  useEffect(() => {
    handleClick();
    handleCount();
  }, []);

  const handleVerify = () => {
    const data = {
      code: codeString,
      phone,
    };
    runLoginCode(data);
  };

  const handleEnter = useCallback(
    (e) => {
      if (e.keyCode === 13 || e.which === 13) {
        if (codeString?.length !== VERIFICATION_CODE_LEN || loading) {
          return;
        }
        handleVerify();
      }
    },
    [codeString, loading],
  );

  useEffect(() => {
    window.addEventListener('keyup', handleEnter);
    return () => {
      window.removeEventListener('keyup', handleEnter);
    };
  }, [handleEnter]);

  return (
    <div
      className={cx(
        styles.container,
        'h-full',
        'flex',
        'items-center',
        'content-center',
      )}
    >
      <div className={cx(styles.inner, 'flex', 'flex-col', 'items-center')}>
        <h3>输入短信验证码</h3>
        <p>验证码已发送至手机号</p>
        <span className={styles.phone}>{`+${areaCode} ${phone}`}</span>
        <div className={cx(styles['code-container'])}>
          {codes.map((code, index) => {
            return (
              <span
                onClick={handleClick}
                key={index}
                className={cx(
                  styles['code-item'],
                  codeIndex === index ? styles.active : null,
                  errorString ? styles.error : null,
                )}
              >
                {code}
              </span>
            );
          })}
        </div>
        {countDown > 0 ? (
          <span className={styles['count-down']}>{countDown}s</span>
        ) : (
          <span
            className={cx(styles['resend-btn'], 'cursor-pointer')}
            onClick={handleSendCode}
          >
            重新发送
          </span>
        )}
        <div className={cx('flex', 'content-between', 'w-full', styles.footer)}>
          <Button className={cx('flex-1')} onClick={() => history.back()}>
            上一步
          </Button>
          <Button
            loading={loadingLoginCode}
            className={cx(
              'flex-1',
              codeString?.length !== VERIFICATION_CODE_LEN &&
                styles['next-step'],
            )}
            type="primary"
            disabled={codeString?.length !== VERIFICATION_CODE_LEN}
            onClick={handleVerify}
          >
            下一步
          </Button>
        </div>
      </div>
      <Input
        ref={inputRef}
        onChange={handleChange}
        className={cx(styles.input)}
        value={codes.join('')}
      />
    </div>
  );
};

export default VerifyCode;
