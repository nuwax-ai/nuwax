import { REVERSE_PROXY_ACTIONS } from '@/constants/pageDev.constants';
import { ReverseProxyEnum } from '@/types/enums/pageDev';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';
import ReverseProxyContentConfig from './ReverseProxyContentConfig';

const cx = classNames.bind(styles);

/**
 * 反向代理弹窗Props
 */
interface ReverseProxyModalProps {
  open: boolean;
  onCancel: () => void;
}

/**
 * 反向代理弹窗
 */
const ReverseProxyModal: React.FC<ReverseProxyModalProps> = ({
  open,
  onCancel,
}) => {
  // 当前反向代理类型
  const [currentReverseProxyType, setCurrentReverseProxyType] =
    useState<ReverseProxyEnum>(ReverseProxyEnum.Dev);

  useEffect(() => {
    setCurrentReverseProxyType(ReverseProxyEnum.Dev);
  }, []);

  return (
    <Modal
      centered
      open={open}
      onCancel={onCancel}
      destroyOnHidden
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div className={cx(styles.container, 'flex', 'overflow-hide')}>
          <div className={cx(styles.left)}>
            <h3>反向代理</h3>
            <ul>
              {REVERSE_PROXY_ACTIONS.map((item) => {
                return (
                  <li
                    key={item.type}
                    className={cx(styles.item, 'cursor-pointer', {
                      [styles.checked]: currentReverseProxyType === item.type,
                    })}
                    onClick={() => setCurrentReverseProxyType(item.type)}
                  >
                    {item.label}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className={cx('flex-1', styles.right)}>
            <ReverseProxyContentConfig type={currentReverseProxyType} />
          </div>
          <Button
            type="text"
            className={cx(styles.close, 'cursor-pointer')}
            onClick={onCancel}
            icon={<CloseOutlined />}
          />
        </div>
      )}
    />
  );
};

export default ReverseProxyModal;
