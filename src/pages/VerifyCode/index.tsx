import { getNumbersOnly } from '@/utils/common';
import type { InputRef } from 'antd';
import { Button, Input } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const VERIFICATION_CODE_LEN = 6;
const COUNT_DOWN_LEN = 60;

const DefaultCode = Array(VERIFICATION_CODE_LEN).fill(null);
const VerifyCode: React.FC = () => {
  const location = useLocation();
  const [countDown, setCountDown] = useState<number>(COUNT_DOWN_LEN);
  const [codeString, setCodeString] = useState<string>('');
  const [errorString, setErrorString] = useState<string>('');
  const inputRef = useRef<InputRef | null>(null);
  const timer = useRef<ReturnType<typeof setInterval>>();
  console.log(location);
  const { phoneNumber, areaCode } = location.state;

  const handleClick = () => {
    inputRef.current!.focus({
      preventScroll: true,
      cursor: 'end',
    });
  };

  // todo
  const loading = null;

  // const {run, loading} = useRequest(apiValidEmailCode, {
  //   manual: true,
  //   debounceWait: 300,
  //   onSuccess: async (res, params) => {
  //     if (res.code === SUCCESS_CODE) {
  //       return onSuccess(params[0].email);
  //     }
  //     setErrorString(res.msg);
  //     handleClick();
  //   },
  // });

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

  const handleCount = () => {
    let startCount = COUNT_DOWN_LEN;
    setCountDown(startCount);

    timer.current = setInterval(() => {
      startCount--;
      setCountDown(startCount);
      if (startCount === 0) {
        clearInterval(timer.current);
        timer.current = undefined;
      }
    }, 1000);
  };

  const handleSendCode = async () => {
    handleCount();
    // const params = {
    //   email,
    //   type,
    // };
    // await apiSendEmail(params);
    // message.success(SEND_SUCCESS);
  };

  useEffect(() => {
    handleClick();
    handleCount();
    return () => {
      clearInterval(timer.current);
      timer.current = undefined;
    };
  }, []);

  const handleVerify = () => {
    // const data = {
    //   code: codeString,
    //   email,
    //   type,
    // };
    // run(data);
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
        <span className={styles.phone}>{`${areaCode} ${phoneNumber}`}</span>
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
          <span className={styles['count-down']}>
            <span className={styles.time}>{countDown}s</span>
          </span>
        ) : (
          <span className={styles['count-down']} onClick={handleSendCode}>
            重新发送 <span className={styles.time}>{countDown}</span>
          </span>
        )}
        <div className={cx('flex', 'content-between', 'w-full', styles.footer)}>
          <Button className={cx('flex-1')}>上一步</Button>
          <Button className={cx('flex-1')} type="primary">
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
