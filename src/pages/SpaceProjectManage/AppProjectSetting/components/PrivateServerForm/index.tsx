import { dict } from '@/services/i18nRuntime';
import { Input, Select } from 'antd';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 私服表单值 */
export interface PrivateServerFormValue {
  /** 访问协议 */
  scheme: 'http' | 'https';
  /** 服务器地址 */
  host: string;
  /** 应用端口 */
  appPort: string;
  /** 管理端口 */
  agentPort: string;
}

export interface PrivateServerFormProps {
  /** 当前表单值 */
  value: PrivateServerFormValue;
  /** 字段变更 */
  onChange: (next: PrivateServerFormValue) => void;
  /** 已保存行只读 */
  disabled?: boolean;
}

const DEFAULT_VALUE: PrivateServerFormValue = {
  scheme: 'https',
  host: '',
  appPort: '',
  agentPort: '',
};

/**
 * 私有服务器表单：协议、地址、应用端口、管理端口。
 *
 * @param props.value 当前值
 * @param props.onChange 变更回调
 * @returns 表单区域
 */
const PrivateServerForm: React.FC<PrivateServerFormProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const patch = useCallback(
    (partial: Partial<PrivateServerFormValue>) => {
      onChange({ ...value, ...partial });
    },
    [onChange, value],
  );

  return (
    <div className={cx(styles.fields)}>
      <div className={cx(styles.field, styles.protocol)}>
        <Select
          value={value.scheme}
          disabled={disabled}
          className={cx(styles.select)}
          popupMatchSelectWidth
          onChange={(scheme) => patch({ scheme })}
          options={[
            {
              value: 'http',
              label: dict('PC.Pages.AppProjectSetting.protocolHttp'),
            },
            {
              value: 'https',
              label: dict('PC.Pages.AppProjectSetting.protocolHttps'),
            },
          ]}
        />
      </div>
      <div className={cx(styles.field)}>
        <Input
          value={value.host}
          disabled={disabled}
          onChange={(event) => patch({ host: event.target.value })}
          placeholder={dict('PC.Pages.AppProjectSetting.serverIpPlaceholder')}
        />
      </div>
      <div className={cx(styles.field)}>
        <Input
          value={value.appPort}
          disabled={disabled}
          onChange={(event) => patch({ appPort: event.target.value })}
          placeholder={dict('PC.Pages.AppProjectSetting.appPortPlaceholder')}
        />
      </div>
      <div className={cx(styles.field)}>
        <Input
          value={value.agentPort}
          disabled={disabled}
          onChange={(event) => patch({ agentPort: event.target.value })}
          placeholder={dict('PC.Pages.AppProjectSetting.managePortPlaceholder')}
        />
      </div>
    </div>
  );
};

export const getEmptyPrivateServerForm = (): PrivateServerFormValue => ({
  ...DEFAULT_VALUE,
});

export default PrivateServerForm;
