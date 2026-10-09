import { dict } from '@/services/i18nRuntime';
import { Input, Select } from 'antd';
import React, { useCallback } from 'react';
import styles from './index.less';

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
  /** 已保存行用文本展示，不渲染输入控件 */
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
 * 只读单元格文案。
 *
 * @param text 展示内容
 * @param title 悬停全文
 * @returns 文本节点
 */
const renderText = (text: string, title?: string) => (
  <span className={styles.readonly} title={title}>
    {text}
  </span>
);

/**
 * 私有服务器表单，按表格单元格输出。
 * 已保存行用文本，新增行才渲染 Select / Input。
 *
 * @param props.value 当前值
 * @param props.onChange 变更回调
 * @param props.disabled 已保存时为 true，改为纯文本
 * @returns 五个 td
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

  if (disabled) {
    return (
      <>
        <td className={styles.protocol}>{renderText(value.scheme)}</td>
        <td className={styles.host}>{renderText(value.host, value.host)}</td>
        <td className={styles.agent}>{renderText(value.agentPort)}</td>
        <td className={styles.vnc}>{renderText(value.vncPort)}</td>
        <td className={styles.file}>{renderText(value.fileServerPort)}</td>
      </>
    );
  }

  return (
    <>
      <td className={styles.protocol}>
        <Select
          value={value.scheme}
          className={styles.select}
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
      </td>
      <td className={styles.host}>
        <Input
          value={value.host}
          onChange={(event) => patch({ host: event.target.value })}
          placeholder={dict('PC.Pages.AppProjectDetail.serverIpPlaceholder')}
        />
      </td>
      <td className={styles.agent}>
        <Input
          value={value.agentPort}
          onChange={(event) => patch({ agentPort: event.target.value })}
          placeholder={dict('PC.Pages.AppProjectDetail.agentPortPlaceholder')}
        />
      </td>
      <td className={styles.vnc}>
        <Input
          value={value.vncPort}
          onChange={(event) => patch({ vncPort: event.target.value })}
          placeholder={dict('PC.Pages.AppProjectDetail.vncPortPlaceholder')}
        />
      </td>
      <td className={styles.file}>
        <Input
          value={value.fileServerPort}
          onChange={(event) => patch({ fileServerPort: event.target.value })}
          placeholder={dict(
            'PC.Pages.AppProjectDetail.fileServerPortPlaceholder',
          )}
        />
      </td>
    </>
  );
};

export const getEmptyPrivateServerForm = (): PrivateServerFormValue => ({
  ...DEFAULT_VALUE,
});

export default PrivateServerForm;
