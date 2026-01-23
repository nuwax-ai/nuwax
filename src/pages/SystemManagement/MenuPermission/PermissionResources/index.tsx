import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, message, Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import { apiDeleteResource, apiGetResourceList } from './api';
import ResourceFormModal from './components/ResourceFormModal';
import ResourceItem from './components/ResourceItem';
import styles from './index.less';
import type { ResourceInfo, ResourceTreeOption } from './type';

const cx = classNames.bind(styles);

/**
 * 权限资源管理页面
 * 管理系统中的模块、菜单、接口、组件等权限资源
 */
const PermissionResources: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceInfo | null>();
  const [parentResource, setParentResource] =
    useState<ResourceTreeOption | null>();
  const [deleteLoadingMap, setDeleteLoadingMap] = useState<
    Record<number, boolean>
  >({});

  // 根据条件查询权限资源列表（树形结构）
  const {
    run: runGetResourceList,
    data: resourceList,
    loading,
  } = useRequest(apiGetResourceList, {
    manual: true,
  });

  useEffect(() => {
    // 根据条件查询权限资源列表（树形结构）
    runGetResourceList();
  }, []);

  // 删除资源
  const { run: runDelete } = useRequest(apiDeleteResource, {
    manual: true,
    loadingDelay: 300,
    onBefore: (resourceId: number) => {
      setDeleteLoadingMap((prev) => ({ ...prev, [resourceId]: true }));
    },
    onSuccess: () => {
      message.success('删除成功');
      runGetResourceList();
    },
    onError: () => {
      message.error('删除失败');
    },
    onFinally: (resourceId: number) => {
      setDeleteLoadingMap((prev) => ({ ...prev, [resourceId]: false }));
    },
  });

  // 处理编辑
  const handleEdit = (resource: ResourceTreeOption) => {
    // 将 ResourceTreeOption 转换为 ResourceInfo
    const resourceInfo: ResourceInfo = {
      id: resource.id,
      code: resource.code,
      name: resource.name,
      description: resource.description,
      source: resource.source,
      type: resource.type,
      parentId: resource.parentId,
      path: resource.path,
      icon: resource.icon,
      sortIndex: resource.sortIndex,
      status: resource.status,
      visible: resource.visible,
    };
    setEditingResource(resourceInfo);
    setIsEdit(true);
    setModalOpen(true);
  };

  // 处理删除
  const handleDelete = (resource: ResourceTreeOption) => {
    runDelete(resource?.id);
  };

  // 处理新增
  const handleAdd = () => {
    setEditingResource(null);
    setParentResource(null);
    setIsEdit(false);
    setModalOpen(true);
  };

  // 处理新增子资源
  const handleAddChild = (parentResource: ResourceTreeOption) => {
    console.log(parentResource, '处理新增子资源');
    setEditingResource(null);
    setParentResource(parentResource);
    setIsEdit(false);
    setModalOpen(true);
  };

  // 处理Modal关闭
  const handleModalCancel = () => {
    setModalOpen(false);
    setEditingResource(null);
    setParentResource(null);
  };

  // 处理Modal成功
  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingResource(null);
    setParentResource(null);
    runGetResourceList();
    message.success(isEdit ? '编辑成功' : '创建成功');
  };

  return (
    <div className={cx(styles.container)}>
      {/* 页面头部 */}
      <div className={cx(styles.header)}>
        <div className={cx(styles.headerLeft)}>
          <h1 className={cx(styles.title)}>权限资源管理</h1>
          <p className={cx(styles.description)}>
            管理系统中的模块、菜单、接口、组件等权限资源
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className={cx(styles.addButton)}
        >
          新增资源
        </Button>
      </div>

      {/* 资源列表 */}
      <div className={cx(styles.content)}>
        <Spin spinning={loading}>
          {!resourceList?.length ? (
            <Empty
              description="暂无资源数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className={cx(styles.empty)}
            />
          ) : (
            <div className={cx(styles.resourceList)}>
              {resourceList?.map((resource: ResourceTreeOption) => (
                <ResourceItem
                  key={resource.id}
                  resource={resource}
                  level={0}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                  deleteLoading={deleteLoadingMap[resource.id] || false}
                />
              ))}
            </div>
          )}
        </Spin>
      </div>

      {/* 新增/编辑资源Modal */}
      <ResourceFormModal
        open={modalOpen}
        isEdit={isEdit}
        resourceInfo={editingResource}
        parentResource={parentResource}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default PermissionResources;
