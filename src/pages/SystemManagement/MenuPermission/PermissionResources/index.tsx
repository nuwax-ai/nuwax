import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, message, Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import { apiDeleteResource, apiGetResourceList } from './api';
import ResourceFormModal from './components/ResourceFormModal';
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
  const [editingResource, setEditingResource] = useState<ResourceInfo>();

  // 查询资源列表
  const {
    run: runGetResourceList,
    data: resourceList,
    loading,
  } = useRequest(apiGetResourceList, {
    manual: true,
  });

  useEffect(() => {
    runGetResourceList();
  }, []);

  // 删除资源
  const { run: runDelete } = useRequest(apiDeleteResource, {
    manual: true,
    onSuccess: () => {
      message.success('删除成功');
      runGetResourceList();
    },
    onError: () => {
      message.error('删除失败');
    },
  });

  // 处理编辑
  const handleEdit = (resource: ResourceTreeOption) => {
    setEditingResource(resource);
    setIsEdit(true);
    setModalOpen(true);
  };

  // 处理删除
  const handleDelete = (resource: ResourceTreeOption) => {
    runDelete(resource?.id);
  };

  console.log(handleEdit, handleDelete);

  // 处理新增
  const handleAdd = () => {
    setEditingResource(undefined);
    setIsEdit(false);
    setModalOpen(true);
  };

  // 处理Modal关闭
  const handleModalCancel = () => {
    setModalOpen(false);
    setEditingResource(undefined);
  };

  // 处理Modal成功
  const handleModalSuccess = () => {
    setModalOpen(false);
    setEditingResource(undefined);
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
              {/* TODO: 这里可以添加资源列表的展示，比如树形表格 */}
              <div>资源列表展示区域（待实现）</div>
            </div>
          )}
        </Spin>
      </div>

      {/* 新增/编辑资源Modal */}
      <ResourceFormModal
        open={modalOpen}
        isEdit={isEdit}
        resourceInfo={editingResource}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
};

export default PermissionResources;
