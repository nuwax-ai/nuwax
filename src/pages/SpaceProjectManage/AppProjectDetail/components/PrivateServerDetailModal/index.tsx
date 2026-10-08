import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
import { formatDateTimeYmdHms } from '@/utils/dateUtils';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input, Select, Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import type {
  PrivateServerInfo,
  PrivateServerUpdateParams,
} from '../../../services/privateServer';
import styles from './index.less';

const cx = classNames.bind(styles);

const PORT_PATTERN = /^\d+$/;
const API_KEY_MAX_LENGTH = 128;

export interface PrivateServerDetailModalProps {
  /** 是否打开 */
  open: boolean;
  /** 详情加载中 */
  loading?: boolean;
  /** 更新提交中 */
  confirmLoading?: boolean;
  /** 私服详情 */
  server?: PrivateServerInfo;
  /** 关闭 */
  onCancel: () => void;
  /** 提交更新 */
  onUpdate: (data: PrivateServerUpdateParams) => void;
}

/** 弹窗可编辑字段 */
interface DetailFormValue {
  name: string;
  scheme: 'http' | 'https';
  host: string;
  agentPort: string;
  vncPort: string;
  fileServerPort: string;
  apiKey: string;
}

/**
 * 空字段显示占位符。
 *
 * @param value 字段值
 * @returns 展示文案
 */
const displayValue = (value?: string | number | null): string => {
  if (value === undefined || value === null || value === '') {
    return dict('PC.Pages.AppProjectDetail.emptyValue');
  }
  return String(value);
};

/**
 * 时间字段格式化为 YYYY-MM-DD HH:mm:ss。
 *
 * @param value ISO 时间
 * @returns 展示文案
 */
const displayTime = (value?: string | null): string => {
  if (!value) {
    return dict('PC.Pages.AppProjectDetail.emptyValue');
  }
  const formatted = formatDateTimeYmdHms(value);
  return formatted === '-'
    ? dict('PC.Pages.AppProjectDetail.emptyValue')
    : formatted;
};

/**
 * 校验端口是否为 1-65535。
 *
 * @param value 输入值
 * @returns 是否合法
 */
const isValidPort = (value: string): boolean => {
  if (!PORT_PATTERN.test(value.trim())) {
    return false;
  }
  const port = Number(value);
  return port >= 1 && port <= 65535;
};

/**
 * 详情转成可编辑表单。
 *
 * @param server 私服详情
 * @returns 表单值
 */
const toFormValue = (server?: PrivateServerInfo): DetailFormValue => ({
  name: server?.name || '',
  scheme: server?.scheme === 'http' ? 'http' : 'https',
  host: server?.host || '',
  agentPort: server?.agentPort != null ? String(server.agentPort) : '',
  vncPort: server?.vncPort != null ? String(server.vncPort) : '',
  fileServerPort:
    server?.fileServerPort != null ? String(server.fileServerPort) : '',
  apiKey: (server?.apiKey || '').slice(0, API_KEY_MAX_LENGTH),
});

/** 必填且不能只填空格 */
const requiredRule = () => ({
  required: true,
  whitespace: true,
  message: dict('PC.Common.Global.required'),
});

/** 端口必填，且必须在 1-65535 */
const portRules = () => [
  requiredRule(),
  {
    validator: (_rule: unknown, value?: string) => {
      if (!value || !String(value).trim()) {
        return Promise.resolve();
      }
      if (!isValidPort(String(value))) {
        return Promise.reject(
          new Error(dict('PC.Pages.AppProjectDetail.invalidPort')),
        );
      }
      return Promise.resolve();
    },
  },
];

/**
 * 私服详情弹窗：可改项必填，状态与时间只读。底部取消 / 更新。
 *
 * @param props.open 是否打开
 * @param props.loading 详情请求中
 * @param props.confirmLoading 更新提交中
 * @param props.server 私服详情
 * @param props.onCancel 关闭回调
 * @param props.onUpdate 提交更新
 * @returns 详情弹窗
 */
const PrivateServerDetailModal: React.FC<PrivateServerDetailModalProps> = ({
  open,
  loading,
  confirmLoading,
  server,
  onCancel,
  onUpdate,
}) => {
  const [form] = Form.useForm<DetailFormValue>();

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }
    form.setFieldsValue(toFormValue(server));
  }, [form, open, server]);

  /**
   * 校验通过后提交可更新字段。
   *
   * @param values 表单值
   */
  const handleFinish = (values: DetailFormValue) => {
    if (!server?.id) {
      return;
    }
    onUpdate({
      id: server.id,
      name: values.name.trim(),
      scheme: values.scheme,
      host: values.host.trim(),
      agentPort: Number(values.agentPort),
      vncPort: Number(values.vncPort),
      fileServerPort: Number(values.fileServerPort),
      apiKey: values.apiKey.trim().slice(0, API_KEY_MAX_LENGTH),
    });
  };

  const readonlyRows = [
    {
      key: 'status',
      label: dict('PC.Pages.AppProjectDetail.privateServerStatus'),
      value: displayValue(server?.status),
    },
    {
      key: 'version',
      label: dict('PC.Pages.AppProjectDetail.privateServerVersion'),
      value: displayValue(server?.version),
    },
    {
      key: 'lastHealthCheck',
      label: dict('PC.Pages.AppProjectDetail.privateServerLastHealthCheck'),
      value: displayTime(server?.lastHealthCheck),
    },
    {
      key: 'created',
      label: dict('PC.Pages.AppProjectDetail.privateServerCreated'),
      value: displayTime(server?.created),
    },
    {
      key: 'modified',
      label: dict('PC.Pages.AppProjectDetail.privateServerModified'),
      value: displayTime(server?.modified),
    },
  ];

  const renderLabel = (text: string, required = false) => (
    <span>
      {text}
      {required ? customizeRequiredMark('', { required: true }) : null}
    </span>
  );

  return (
    <CustomFormModal
      form={form}
      title={dict('PC.Pages.AppProjectDetail.privateServerDetailTitle')}
      open={open}
      loading={!!confirmLoading}
      okText={dict('PC.Pages.AppProjectDetail.updatePrivateServer')}
      okDisabled={!!loading || !server?.id}
      onCancel={onCancel}
      onConfirm={() => form.submit()}
    >
      <Spin spinning={!!loading}>
        <Form
          form={form}
          requiredMark={customizeRequiredMark}
          disabled={!!loading || !!confirmLoading}
          onFinish={handleFinish}
          autoComplete="off"
        >
          <dl className={cx(styles.list)}>
            <div className={cx(styles.item)}>
              <dt className={cx(styles.label)}>
                {renderLabel(
                  dict('PC.Pages.AppProjectDetail.privateServerName'),
                  true,
                )}
              </dt>
              <dd className={cx(styles.value)}>
                <Form.Item
                  name="name"
                  rules={[requiredRule()]}
                  className={cx(styles['form-item'])}
                >
                  <Input />
                </Form.Item>
              </dd>
            </div>
            <div className={cx(styles.item)}>
              <dt className={cx(styles.label)}>
                {renderLabel(dict('PC.Pages.AppProjectDetail.protocol'), true)}
              </dt>
              <dd className={cx(styles.value)}>
                <Form.Item
                  name="scheme"
                  rules={[
                    {
                      required: true,
                      message: dict('PC.Common.Global.required'),
                    },
                  ]}
                  className={cx(styles['form-item'])}
                >
                  <Select
                    className={cx(styles.select)}
                    popupMatchSelectWidth
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
                </Form.Item>
              </dd>
            </div>
            <div className={cx(styles.item)}>
              <dt className={cx(styles.label)}>
                {renderLabel(dict('PC.Pages.AppProjectDetail.serverIp'), true)}
              </dt>
              <dd className={cx(styles.value)}>
                <Form.Item
                  name="host"
                  rules={[requiredRule()]}
                  className={cx(styles['form-item'])}
                >
                  <Input
                    placeholder={dict(
                      'PC.Pages.AppProjectDetail.serverIpPlaceholder',
                    )}
                  />
                </Form.Item>
              </dd>
            </div>
            <div className={cx(styles.item)}>
              <dt className={cx(styles.label)}>
                {renderLabel(dict('PC.Pages.AppProjectDetail.agentPort'), true)}
              </dt>
              <dd className={cx(styles.value)}>
                <Form.Item
                  name="agentPort"
                  rules={portRules()}
                  className={cx(styles['form-item'])}
                >
                  <Input
                    placeholder={dict(
                      'PC.Pages.AppProjectDetail.agentPortPlaceholder',
                    )}
                  />
                </Form.Item>
              </dd>
            </div>
            <div className={cx(styles.item)}>
              <dt className={cx(styles.label)}>
                {renderLabel(dict('PC.Pages.AppProjectDetail.vncPort'), true)}
              </dt>
              <dd className={cx(styles.value)}>
                <Form.Item
                  name="vncPort"
                  rules={portRules()}
                  className={cx(styles['form-item'])}
                >
                  <Input
                    placeholder={dict(
                      'PC.Pages.AppProjectDetail.vncPortPlaceholder',
                    )}
                  />
                </Form.Item>
              </dd>
            </div>
            <div className={cx(styles.item)}>
              <dt className={cx(styles.label)}>
                {renderLabel(
                  dict('PC.Pages.AppProjectDetail.fileServerPort'),
                  true,
                )}
              </dt>
              <dd className={cx(styles.value)}>
                <Form.Item
                  name="fileServerPort"
                  rules={portRules()}
                  className={cx(styles['form-item'])}
                >
                  <Input
                    placeholder={dict(
                      'PC.Pages.AppProjectDetail.fileServerPortPlaceholder',
                    )}
                  />
                </Form.Item>
              </dd>
            </div>
            <div className={cx(styles.item)}>
              <dt className={cx(styles.label)}>
                {renderLabel(
                  dict('PC.Pages.AppProjectDetail.privateServerApiKey'),
                  true,
                )}
              </dt>
              <dd className={cx(styles.value)}>
                <Form.Item
                  name="apiKey"
                  rules={[
                    requiredRule(),
                    {
                      max: API_KEY_MAX_LENGTH,
                      message: dict(
                        'PC.Pages.AppProjectDetail.privateServerApiKeyMax',
                      ),
                    },
                  ]}
                  className={cx(styles['form-item'])}
                >
                  <Input maxLength={API_KEY_MAX_LENGTH} />
                </Form.Item>
              </dd>
            </div>
            {readonlyRows.map((row) => (
              <div key={row.key} className={cx(styles.item)}>
                <dt className={cx(styles.label)}>{row.label}</dt>
                <dd className={cx(styles.value)}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </Form>
      </Spin>
    </CustomFormModal>
  );
};

export default PrivateServerDetailModal;
