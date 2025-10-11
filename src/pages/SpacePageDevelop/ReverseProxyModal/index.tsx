import { REVERSE_PROXY_ACTIONS } from '@/constants/pageDev.constants';
import { ReverseProxyEnum } from '@/types/enums/pageDev';
import {
  ProxyConfig,
  ReverseProxyModalProps,
} from '@/types/interfaces/pageDev';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';
import ReverseProxyContentConfig from './ReverseProxyContentConfig';

const cx = classNames.bind(styles);

/**
 * 反向代理弹窗
 */
const ReverseProxyModal: React.FC<ReverseProxyModalProps> = ({
  open,
  projectId,
  defaultProxyConfigs,
  onCancel,
}) => {
  // 当前反向代理类型 可用值:dev,prod
  const [reverseProxyType, setReverseProxyType] = useState<ReverseProxyEnum>(
    ReverseProxyEnum.Dev,
  );
  // 当前反向代理配置
  const [proxyConfigs, setProxyConfigs] = useState<ProxyConfig[]>([]);

  useEffect(() => {
    // 默认选中开发环境
    setReverseProxyType(ReverseProxyEnum.Dev);
    // // 默认选中开发环境配置
    // const _proxyConfig = defaultProxyConfigs?.filter((item) => item.env === ReverseProxyEnum.Dev) || [];
    // setProxyConfigs(_proxyConfig);
    setProxyConfigs(defaultProxyConfigs || []);
  }, [defaultProxyConfigs]);

  const handleClick = (type: ReverseProxyEnum) => {
    setReverseProxyType(type);
    const _proxyConfig =
      defaultProxyConfigs?.filter((item) => item.env === type) || [];
    setProxyConfigs(_proxyConfig);
  };

  const handleConfirm = (configs: ProxyConfig[]) => {
    // const _proxyConfig = proxyConfigs?.filter((item) => item.env !== reverseProxyType) || [];
    // _proxyConfig.push(...configs);
    // setProxyConfigs(_proxyConfig);
    setProxyConfigs(configs);
  };

  return (
    <Modal
      centered
      open={open}
      onCancel={onCancel}
      destroyOnHidden
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div className={cx(styles.container, 'flex', 'overflow-hide')}>
          {/* 左侧部分 */}
          <div className={cx(styles.left)}>
            <h3>反向代理</h3>
            <ul>
              {REVERSE_PROXY_ACTIONS.map((item) => {
                return (
                  <li
                    key={item.type}
                    className={cx(styles.item, 'cursor-pointer', {
                      [styles.checked]: reverseProxyType === item.type,
                    })}
                    onClick={() => handleClick(item.type)}
                  >
                    {item.label}
                  </li>
                );
              })}
            </ul>
          </div>
          {/* 右侧部分 */}
          <div className={cx('flex-1', styles.right)}>
            <ReverseProxyContentConfig
              projectId={projectId}
              reverseProxyType={reverseProxyType}
              proxyConfigs={proxyConfigs}
              onConfirm={handleConfirm}
            />
          </div>
          {/* 关闭按钮 */}
          <Button
            type="text"
            className={cx(styles.close)}
            onClick={onCancel}
            icon={<CloseOutlined />}
          />
        </div>
      )}
    />
  );
};

export default ReverseProxyModal;
