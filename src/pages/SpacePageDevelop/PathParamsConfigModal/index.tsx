import { CreateUpdateModeEnum } from '@/types/enums/common';
import { PathParamsConfigModalProps } from '@/types/interfaces/pageDev';
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import AddPathModal from './AddPathModal';
import styles from './index.less';
import PathParamsConfigContent from './PathParamsConfigContent';

const cx = classNames.bind(styles);

/**
 * 路径参数配置弹窗
 */
const PathParamsConfigModal: React.FC<PathParamsConfigModalProps> = ({
  spaceId,
  open,
  onCancel,
}) => {
  // 路径参数列表
  const [pathParams, setPathParams] = useState<any[]>([]);
  // 当前路径参数key
  const [key, setKey] = useState<string>('');
  // 添加路径参数弹窗是否打开
  const [addPathModalOpen, setAddPathModalOpen] = useState<boolean>(false);

  useEffect(() => {
    console.log('spaceId', spaceId);
    setPathParams([]);
    setKey('');
  }, []);

  const handleDel = (key: string) => {
    setPathParams(pathParams.filter((item) => item.key !== key));
  };

  const handleEdit = (key: string) => {
    setKey(key);
  };

  return (
    <>
      <Modal
        centered
        open={open}
        onCancel={onCancel}
        destroyOnHidden
        className={cx(styles['modal-container'])}
        modalRender={() => (
          <div className={cx(styles.container, 'flex', 'overflow-hide')}>
            {/* 左侧区域 */}
            <div className={cx(styles.left)}>
              <h3>路径参数配置</h3>
              {/* 路径参数列表 */}
              <ul>
                {pathParams.map((item) => {
                  return (
                    <li
                      key={item.type}
                      className={cx(
                        styles.item,
                        'cursor-pointer',
                        'flex',
                        'items-center',
                        'gap-10',
                        {
                          [styles.checked]: key === item.key,
                        },
                      )}
                      onClick={() => setKey(item.key)}
                    >
                      <div
                        className={cx(styles.label, 'text-ellipsis', 'flex-1')}
                      >
                        {item.label}
                      </div>
                      <span
                        className={cx(
                          styles['icon-box'],
                          'cursor-pointer',
                          'hover-box',
                        )}
                      >
                        <EditOutlined onClick={() => handleEdit(item.key)} />
                      </span>
                      <span
                        className={cx(
                          styles['icon-box'],
                          'cursor-pointer',
                          'hover-box',
                        )}
                      >
                        <DeleteOutlined onClick={() => handleDel(item.key)} />
                      </span>
                    </li>
                  );
                })}
              </ul>
              {/* 新增路径 */}
              <Button
                type="text"
                className={cx(styles['add-path-params'])}
                onClick={() => setAddPathModalOpen(true)}
                icon={<PlusOutlined />}
              ></Button>
            </div>
            {/* 内容区域 */}
            <div className={cx('flex-1', styles.right)}>
              <PathParamsConfigContent key={key} />
            </div>
            {/* 关闭按钮 */}
            <Button
              type="text"
              className={cx(styles.close, 'cursor-pointer')}
              onClick={onCancel}
              icon={<CloseOutlined />}
            />
          </div>
        )}
      />
      {/* 添加路径弹窗 */}
      <AddPathModal
        mode={CreateUpdateModeEnum.Create}
        open={addPathModalOpen}
        onCancel={() => setAddPathModalOpen(false)}
        onConfirm={() => setAddPathModalOpen(false)}
      />
    </>
  );
};

export default PathParamsConfigModal;
