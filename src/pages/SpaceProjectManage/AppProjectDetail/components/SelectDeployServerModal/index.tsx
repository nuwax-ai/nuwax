import { dict } from '@/services/i18nRuntime';
import { Empty, Modal, Radio, Spin } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { PrivateServerInfo } from '../../../services/privateServer';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface SelectDeployServerModalProps {
  /** 是否打开 */
  open: boolean;
  /** 私服列表 */
  servers: PrivateServerInfo[];
  /** 当前选中的私服 ID */
  selectedId?: number;
  /** 列表加载中 */
  loading?: boolean;
  /** 保存中 */
  confirmLoading?: boolean;
  /** 选中变更 */
  onSelect: (id: number) => void;
  /** 保存 */
  onSave: () => void;
  /** 关闭 */
  onCancel: () => void;
}

/**
 * 拼接私服访问地址，缺字段时尽量展示已有部分。
 *
 * @param server 私服
 * @returns 如 https://host:8080
 */
const formatServerAddress = (server: PrivateServerInfo): string => {
  const host = [server.scheme, server.host].filter(Boolean).join('://');
  if (!server.appPort) {
    return host || dict('PC.Pages.AppProjectDetail.emptyValue');
  }
  return host ? `${host}:${server.appPort}` : String(server.appPort);
};

/**
 * 选择部署私服弹窗：单选且必须选中一台后才能保存。
 *
 * @param props.open 是否打开
 * @param props.servers 可选私服
 * @param props.selectedId 当前选中 ID
 * @param props.onSave 保存回调
 * @returns 选择弹窗
 */
const SelectDeployServerModal: React.FC<SelectDeployServerModalProps> = ({
  open,
  servers,
  selectedId,
  loading,
  confirmLoading,
  onSelect,
  onSave,
  onCancel,
}) => {
  const canSave = servers.some((item) => item.id === selectedId);

  return (
    <Modal
      title={dict('PC.Pages.AppProjectDetail.selectPrivateServerTitle')}
      open={open}
      onOk={onSave}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okButtonProps={{ disabled: !canSave }}
      okText={dict('PC.Common.Global.save')}
      cancelText={dict('PC.Common.Global.cancel')}
      destroyOnHidden
    >
      <Spin spinning={!!loading}>
        {servers.length ? (
          <Radio.Group
            className={cx(styles.list)}
            value={selectedId ?? null}
            onChange={(event) => onSelect(Number(event.target.value))}
          >
            {servers.map((server) => (
              <div
                key={server.id}
                className={cx(styles.item, {
                  [styles.active]: selectedId === server.id,
                })}
                onClick={() => onSelect(server.id)}
              >
                <Radio value={server.id} />
                <div className={cx(styles.body)}>
                  <span className={cx(styles.name)}>
                    {server.name || formatServerAddress(server)}
                  </span>
                  {server.name ? (
                    <span className={cx(styles.meta)}>
                      {formatServerAddress(server)}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </Radio.Group>
        ) : (
          <Empty
            description={dict('PC.Pages.AppProjectDetail.emptyPrivateServer')}
          />
        )}
      </Spin>
    </Modal>
  );
};

export default SelectDeployServerModal;
