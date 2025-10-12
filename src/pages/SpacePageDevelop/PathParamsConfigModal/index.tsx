import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  PageAddPathParams,
  PageArgConfig,
  PathParamsConfigModalProps,
} from '@/types/interfaces/pageDev';
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
  open,
  projectId,
  defaultPageArgConfigs,
  onCancel,
}) => {
  // 路径参数列表
  const [pathParams, setPathParams] = useState<PageArgConfig[]>([]);
  // 当前路径参数key
  const [key, setKey] = useState<string>('');
  // 添加路径参数弹窗是否打开
  const [addPathModalOpen, setAddPathModalOpen] = useState<boolean>(false);
  // 编辑路径参数信息
  const [editPathInfo, setEditPathInfo] = useState<PageArgConfig | null>(null);

  useEffect(() => {
    setPathParams(defaultPageArgConfigs || []);
    setKey('');
  }, [defaultPageArgConfigs]);

  const handleDel = (pageUri: string) => {
    setPathParams(pathParams.filter((item) => item.pageUri !== pageUri));
  };

  const handleEdit = (info: PageArgConfig) => {
    const { pageUri } = info;
    setKey(pageUri);
    setEditPathInfo(info);
    setAddPathModalOpen(true);
  };

  /**
   * 确认添加路径参数配置
   * @param info 新增路径参数配置
   * @param editPathInfo 编辑路径参数配置信息
   */
  const handleConfirmAddPath = (
    info: PageAddPathParams,
    editPathInfo: PageArgConfig | null,
  ) => {
    setAddPathModalOpen(false);
    setEditPathInfo(null);
    // 编辑路径参数配置
    if (editPathInfo) {
      const _pathParams = [...pathParams];
      // 当前编辑项索引值
      const index = _pathParams.findIndex(
        (item) => item.pageUri === editPathInfo.pageUri,
      );
      // 编辑路径参数配置
      _pathParams.splice(index, 1, {
        ...editPathInfo,
        ...info,
      });
      setPathParams(_pathParams);
    } else {
      // 新增路径参数配置
      const { pageUri, name, description } = info;
      setPathParams([
        ...pathParams,
        {
          pageUri,
          name,
          description,
          args: [],
        },
      ]);
    }
  };

  // 取消添加路径参数配置
  const handleCancelAddPath = () => {
    setAddPathModalOpen(false);
    setEditPathInfo(null);
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
                      key={item.pageUri}
                      className={cx(
                        styles.item,
                        'cursor-pointer',
                        'flex',
                        'items-center',
                        'gap-10',
                        {
                          [styles.checked]: key === item.pageUri,
                        },
                      )}
                      onClick={() => setKey(item.pageUri)}
                    >
                      <div
                        className={cx(styles.label, 'text-ellipsis', 'flex-1')}
                      >
                        {item.name}
                      </div>
                      <span
                        className={cx(
                          styles['icon-box'],
                          'cursor-pointer',
                          'hover-box',
                        )}
                      >
                        <EditOutlined onClick={() => handleEdit(item)} />
                      </span>
                      <span
                        className={cx(
                          styles['icon-box'],
                          'cursor-pointer',
                          'hover-box',
                        )}
                      >
                        <DeleteOutlined
                          onClick={() => handleDel(item.pageUri)}
                        />
                      </span>
                    </li>
                  );
                })}
              </ul>
              {/* 新增路径 */}
              <Button
                type="primary"
                className={cx(styles['add-path-params'])}
                onClick={() => setAddPathModalOpen(true)}
                icon={<PlusOutlined />}
              >
                新增路径
              </Button>
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
        projectId={projectId}
        mode={
          editPathInfo
            ? CreateUpdateModeEnum.Update
            : CreateUpdateModeEnum.Create
        }
        editPathInfo={editPathInfo}
        open={addPathModalOpen}
        onCancel={handleCancelAddPath}
        onConfirm={handleConfirmAddPath}
      />
    </>
  );
};

export default PathParamsConfigModal;
