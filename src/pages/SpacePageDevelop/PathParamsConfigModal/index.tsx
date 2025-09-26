import { CloseOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';
import PathParamsConfigContent from './PathParamsConfigContent';

const cx = classNames.bind(styles);

/**
 * 路径参数配置弹窗Props
 */
interface PathParamsConfigModalProps {
  open: boolean;
  onCancel: () => void;
}

/**
 * 路径参数配置弹窗
 */
const PathParamsConfigModal: React.FC<PathParamsConfigModalProps> = ({
  open,
  onCancel,
}) => {
  const [pathParams, setPathParams] = useState<any[]>([]);
  // 当前路径参数key
  const [key, setKey] = useState<string>('');

  useEffect(() => {
    setPathParams([]);
    setKey('');
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
            <h3>路径参数配置</h3>
            <ul>
              {pathParams.map((item) => {
                return (
                  <li
                    key={item.type}
                    className={cx(styles.item, 'cursor-pointer', {
                      [styles.checked]: key === item.key,
                    })}
                    onClick={() => setKey(item.key)}
                  >
                    {item.label}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className={cx('flex-1', styles.right)}>
            <PathParamsConfigContent key={key} />
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

export default PathParamsConfigModal;
