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
  /** Agent 端口 */
  agentPort: string;
  /** VNC 端口 */
  vncPort: string;
  /** 文件服务端口 */
  fileServerPort: string;
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
  agentPort: '',
  vncPort: '',
  fileServerPort: '',
};

/**
 * 私有服务器表单：协议、地址、Agent 端口、VNC 端口、文件服务端口。
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
              label: dict('PC.Pages.AppProjectDetail.protocolHttp'),
            },
            {
              value: 'https',
              label: dict('PC.Pages.AppProjectDetail.protocolHttps'),
            },
          ]}
        />
      </div>
      <div className={cx(styles.field)}>
        <Input
          value={value.host}
          disabled={disabled}
          onChange={(event) => patch({ host: event.target.value })}
          placeholder={dict('PC.Pages.AppProjectDetail.serverIpPlaceholder')}
        />
      </div>
      <div className={cx(styles.field)}>
        <Input
          value={value.agentPort}
          disabled={disabled}
          onChange={(event) => patch({ agentPort: event.target.value })}
          placeholder={dict('PC.Pages.AppProjectDetail.agentPortPlaceholder')}
        />
      </div>
      <div className={cx(styles.field)}>
        <Input
          value={value.vncPort}
          disabled={disabled}
          onChange={(event) => patch({ vncPort: event.target.value })}
          placeholder={dict('PC.Pages.AppProjectDetail.vncPortPlaceholder')}
        />
      </div>
      <div className={cx(styles.field)}>
        <Input
          value={value.fileServerPort}
          disabled={disabled}
          onChange={(event) => patch({ fileServerPort: event.target.value })}
          placeholder={dict(
            'PC.Pages.AppProjectDetail.fileServerPortPlaceholder',
          )}
        />
      </div>
    </div>
  );
};

export const getEmptyPrivateServerForm = (): PrivateServerFormValue => ({
  ...DEFAULT_VALUE,
});

export default PrivateServerForm;
