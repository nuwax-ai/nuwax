import { apiPageDeletePath } from '@/services/pageDev';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  PageAddPathParams,
  PageArgConfig,
  PageDeletePathParams,
  PathParamsConfigModalProps,
} from '@/types/interfaces/pageDev';
import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Modal, Tooltip } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import AddPathModal from './AddPathModal';
import styles from './index.less';
import PathParamsConfigContent from './PathParamsConfigContent';

const cx = classNames.bind(styles);

/**
 * 路径参数配置弹窗
 */
const PathParamsConfigModal: React.FC<PathParamsConfigModalProps> = ({
  open,
  currentPageInfo,
  onCancel,
}) => {
  // 路径参数列表
  const [pathParams, setPathParams] = useState<PageArgConfig[]>([]);
  // 当前路径参数
  const [currentPathParam, setCurrentPathParam] =
    useState<PageArgConfig | null>(null);
  // 添加路径参数弹窗是否打开
  const [addPathModalOpen, setAddPathModalOpen] = useState<boolean>(false);
  // 编辑路径参数信息
  const [editPathInfo, setEditPathInfo] = useState<PageArgConfig | null>(null);
  // 正在删除中的路径数组
  const [deleteLoadingPaths, setDeleteLoadingPaths] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setPathParams(currentPageInfo?.pageArgConfigs || []);
      setCurrentPathParam(currentPageInfo?.pageArgConfigs?.[0] || null);
    }
  }, [open, currentPageInfo]);

  // 删除路径配置
  const { run: runDeletePath } = useRequest(apiPageDeletePath, {
    manual: true,
    debounceWait: 300,
    onSuccess: (_: null, params: PageDeletePathParams[]) => {
      const { pageUri } = params[0];
      const _pathParams =
        pathParams?.filter((item) => item.pageUri !== pageUri) || [];
      setPathParams(_pathParams);
      // 如果当前路径参数被删除，则设置为第一个路径参数
      if (currentPathParam?.pageUri === pageUri) {
        const firstPathParam = _pathParams?.[0] || null;
        setCurrentPathParam(firstPathParam);
      }
    },
    onError: (_: null, params: PageDeletePathParams[]) => {
      const { pageUri } = params[0];
      setDeleteLoadingPaths(
        deleteLoadingPaths.filter((item) => item !== pageUri),
      );
    },
  });

  // 删除路径配置
  const handleDel = (pageUri: string) => {
    setDeleteLoadingPaths([...deleteLoadingPaths, pageUri]);
    runDeletePath({
      projectId: currentPageInfo?.projectId,
      pageUri,
    });
  };

  // 编辑路径参数配置
  const handleEdit = (info: PageArgConfig) => {
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
      const _addPathParam = {
        ...info,
        args: [],
      };
      setPathParams([...pathParams, _addPathParam]);
      // 如果当前路径参数为空，则设置为第一个路径参数
      if (!currentPathParam) {
        setCurrentPathParam(_addPathParam);
      }
    }
  };

  // 取消添加路径参数配置
  const handleCancelAddPath = () => {
    setAddPathModalOpen(false);
    setEditPathInfo(null);
  };

  // 确认保存路径参数配置
  const handleConfirmSave = (info: PageArgConfig) => {
    const _pathParams = cloneDeep(pathParams);
    const index = _pathParams.findIndex(
      (item) => item.pageUri === info.pageUri,
    );
    _pathParams.splice(index, 1, info);
    setPathParams(_pathParams);
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
              <div
                className={cx(
                  'flex',
                  'items-center',
                  'content-between',
                  styles.header,
                )}
              >
                <h3>路径参数配置</h3>
                {/* 新增路径 */}
                <Tooltip title="新增路径">
                  <Button
                    type="primary"
                    onClick={() => setAddPathModalOpen(true)}
                    icon={<PlusOutlined />}
                  >
                    新增
                  </Button>
                </Tooltip>
              </div>
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
                          [styles.checked]:
                            currentPathParam?.pageUri === item.pageUri,
                        },
                      )}
                      onClick={() => setCurrentPathParam(item)}
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
                        <EditOutlined
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                        />
                      </span>
                      <span
                        className={cx(
                          styles['icon-box'],
                          'cursor-pointer',
                          'hover-box',
                        )}
                      >
                        {deleteLoadingPaths.includes(item.pageUri) ? (
                          <LoadingOutlined />
                        ) : (
                          <DeleteOutlined
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDel(item.pageUri);
                            }}
                          />
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
            {/* 内容区域 */}
            <div className={cx('flex-1', styles.right)}>
              <PathParamsConfigContent
                projectId={currentPageInfo?.projectId}
                currentPathParam={currentPathParam}
                onConfirmSave={handleConfirmSave}
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
      {/* 添加路径弹窗 */}
      <AddPathModal
        projectId={currentPageInfo?.projectId}
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
