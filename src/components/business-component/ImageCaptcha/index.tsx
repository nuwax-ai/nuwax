import { apiImageCaptcha } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import type { ImageCaptchaParams } from '@/types/interfaces/login';
import { ReloadOutlined } from '@ant-design/icons';
import { Input, message, Spin } from 'antd';
import classNames from 'classnames';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 图形验证码值：原样回传给登录 / 发码接口 */
export interface ImageCaptchaValue {
  captchaId?: string;
  captchaCode?: string;
}

export interface ImageCaptchaRef {
  /** 换一张并清空输入（提交失败后调用：验证码按一次性处理） */
  refresh: () => void;
}

interface ImageCaptchaProps {
  value?: ImageCaptchaValue;
  onChange?: (value: ImageCaptchaValue) => void;
  /** 输入框额外类名（复用页面既有输入框样式） */
  inputClassName?: string;
  placeholder?: string;
}

/**
 * 图形验证码输入（租户开启 openImageCaptcha 时使用）
 *
 * 作为 Form.Item 受控组件使用；与阿里云验证码相互独立。
 * 规则由 imageCaptchaRules 提供，保证未取到图或未填写时拦截提交。
 */
const ImageCaptcha = forwardRef<ImageCaptchaRef, ImageCaptchaProps>(
  ({ value, onChange, inputClassName, placeholder }, ref) => {
    const [image, setImage] = useState('');
    const [loading, setLoading] = useState(false);
    // 丢弃过期响应：连续点击换图时只采用最后一次
    const requestSeqRef = useRef(0);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    const refresh = useCallback(async () => {
      const seq = ++requestSeqRef.current;
      setLoading(true);
      try {
        const res = await apiImageCaptcha();
        if (seq !== requestSeqRef.current) return;
        setImage(res.data?.image || '');
        onChangeRef.current?.({
          captchaId: res.data?.captchaId,
          captchaCode: '',
        });
      } catch {
        if (seq !== requestSeqRef.current) return;
        setImage('');
        onChangeRef.current?.({ captchaId: undefined, captchaCode: '' });
      } finally {
        if (seq === requestSeqRef.current) setLoading(false);
      }
    }, []);

    useImperativeHandle(ref, () => ({ refresh }), [refresh]);

    useEffect(() => {
      refresh();
    }, [refresh]);

    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.row)}>
          <Input
            className={cx(styles.input, inputClassName)}
            value={value?.captchaCode}
            maxLength={8}
            autoComplete="off"
            placeholder={
              placeholder ?? dict('PC.Components.ImageCaptcha.placeholder')
            }
            onChange={(e) =>
              onChange?.({ ...value, captchaCode: e.target.value.trim() })
            }
          />
          <button
            type="button"
            className={cx(styles.image)}
            title={dict('PC.Components.ImageCaptcha.refresh')}
            aria-label={dict('PC.Components.ImageCaptcha.refresh')}
            onClick={refresh}
          >
            <Spin spinning={loading} size="small">
              {image ? (
                <img src={image} alt="" />
              ) : (
                <span className={cx(styles.placeholder)}>
                  <ReloadOutlined />
                </span>
              )}
            </Spin>
          </button>
        </div>
        <div className={cx(styles.hint)}>
          {dict('PC.Components.ImageCaptcha.unclear')}
          <a onClick={refresh}>{dict('PC.Components.ImageCaptcha.refresh')}</a>
        </div>
      </div>
    );
  },
);

/** Form.Item 校验规则：必须已取到图且填写了验证码 */
export const imageCaptchaRules = () => [
  {
    validator(_: unknown, v?: ImageCaptchaValue) {
      if (!v?.captchaId) {
        return Promise.reject(
          new Error(dict('PC.Components.ImageCaptcha.loadFailed')),
        );
      }
      if (!v.captchaCode) {
        return Promise.reject(
          new Error(dict('PC.Components.ImageCaptcha.required')),
        );
      }
      return Promise.resolve();
    },
  },
];

/**
 * 发码场景（不走表单整体校验）用：受控值 + 取参 + 换一张。
 * 验证码一次性，调用方在每次发送结束后 refresh。
 */
export function useImageCaptcha(enabled: boolean) {
  const ref = useRef<ImageCaptchaRef>(null);
  const [value, setValue] = useState<ImageCaptchaValue>();
  // 阿里云验证码回调可能持有旧闭包，取值走 ref
  const valueRef = useRef<ImageCaptchaValue>();
  const onChange = useCallback((next: ImageCaptchaValue) => {
    valueRef.current = next;
    setValue(next);
  }, []);

  /** 取发码参数：未开启返回 {}；未填写时提示并返回 null（调用方中止发送） */
  const take = useCallback((): ImageCaptchaParams | null => {
    if (!enabled) return {};
    const current = valueRef.current;
    if (!current?.captchaId || !current.captchaCode) {
      message.warning(dict('PC.Components.ImageCaptcha.required'));
      return null;
    }
    return { captchaId: current.captchaId, captchaCode: current.captchaCode };
  }, [enabled]);

  const refresh = useCallback(() => ref.current?.refresh(), []);

  return { take, refresh, inputProps: { ref, value, onChange } };
}

export default ImageCaptcha;
