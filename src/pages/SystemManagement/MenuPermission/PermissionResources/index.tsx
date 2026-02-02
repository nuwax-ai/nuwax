import { modalConfirm } from '@/utils/ant-custom';
import {
  AppstoreOutlined,
  DownOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Empty, message, Space, Spin, Table, Tag } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useRequest } from 'umi';
import {
  apiDeleteResource,
  apiGetResourceList,
} from '../services/permission-resources';
import {
  ResourceSourceEnum,
  ResourceTypeEnum,
  ResourceVisibleEnum,
  type ResourceInfo,
  type ResourceTreeNode,
} from '../types/permission-resources';
import ResourceFormModal from './components/ResourceFormModal';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 权限资源管理页面
 * 管理系统中的模块、菜单、接口、组件等权限资源
 */
const PermissionResources: React.FC = () => {
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceInfo | null>();
  const [parentResource, setParentResource] =
    useState<ResourceTreeNode | null>();
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

  // 监听 location.state 变化
  // 当 state 中存在 _t 变量时，说明是通过菜单切换过来的，需要清空 query 参数
  useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      // 根据条件查询权限资源列表（树形结构）
      runGetResourceList();
    }
  }, [location.state]);

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
  const handleEdit = (resource: ResourceTreeNode) => {
    // 将 ResourceTreeNode 转换为 ResourceInfo
    const resourceInfo: ResourceInfo = {
      id: resource.id,
      code: resource.code || '',
      name: resource.name || '',
      description: resource.description,
      source: resource.source || ResourceSourceEnum.SystemBuiltIn,
      type: resource.type || ResourceTypeEnum.Module,
      parentId: resource.parentId,
      path: resource.path,
      icon: resource.icon,
      sortIndex: resource.sortIndex || 0,
      visible: resource.visible || ResourceVisibleEnum.Visible,
    };
    setEditingResource(resourceInfo);
    setIsEdit(true);
    setModalOpen(true);
  };

  // 处理删除确认
  const handleDeleteConfirm = (resource: ResourceTreeNode) => {
    modalConfirm('删除资源', `确认删除资源 "${resource.name}" 吗？`, () => {
      runDelete(resource?.id);
      return new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
    });
  };

  // 处理新增
  const handleAdd = () => {
    setEditingResource(null);
    setParentResource(null);
    setIsEdit(false);
    setModalOpen(true);
  };

  // 处理新增子资源
  const handleAddChild = (parentResource: ResourceTreeNode) => {
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
  };

  // 获取资源类型显示文本
  const getResourceTypeText = (type?: ResourceTypeEnum): string => {
    switch (type) {
      case ResourceTypeEnum.Module:
        return '模块';
      case ResourceTypeEnum.Component:
        return '组件';
      default:
        return '未知';
    }
  };

  // 转换数据格式，为树形数据添加 key 字段，并过滤掉根节点（id为0）
  const tableData = useMemo(() => {
    const transformData = (data: ResourceTreeNode[]): any[] => {
      return data
        .filter((item) => item.id !== 0) // 过滤掉根节点
        .map((item) => ({
          ...item,
          key: item.id,
          children: item.children?.length
            ? transformData(item.children)
            : undefined,
        }));
    };
    if (!resourceList || !resourceList.length) {
      return [];
    }
    // 如果第一个节点是根节点（id为0），则只返回其子节点
    if (resourceList.length === 1 && resourceList[0].id === 0) {
      const rootNode = resourceList[0];
      return rootNode.children?.length ? transformData(rootNode.children) : [];
    }
    // 否则过滤掉所有 id 为 0 的节点
    return transformData(resourceList);
  }, [resourceList]);

  // 定义表格列
  const columns: TableColumnsType<ResourceTreeNode & { key: number }> = [
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 100,
      render: (icon: string, record: ResourceTreeNode) => (
        <div className={cx(styles.iconCell)}>
          {icon ? (
            <img
              src={icon}
              alt={record.name || '资源图标'}
              className={cx(styles.resourceIcon)}
            />
          ) : (
            <div className={cx(styles.defaultIcon)}>
              <AppstoreOutlined />
            </div>
          )}
        </div>
      ),
    },
    {
      title: '资源名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: ResourceTypeEnum) => (
        <Tag>{getResourceTypeText(type)}</Tag>
      ),
    },
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string) => code || '--',
    },
    {
      title: '路由路径',
      dataIndex: 'path',
      key: 'path',
      width: 200,
      ellipsis: true,
      render: (path: string) => path || '--',
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right',
      render: (_: any, record: ResourceTreeNode) => (
        <Space size="small">
          {record.type !== ResourceTypeEnum.Component && (
            <Button
              type="link"
              size="small"
              onClick={() => handleAddChild(record)}
            >
              新增子资源
            </Button>
          )}
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            loading={deleteLoadingMap[record.id] || false}
            onClick={() => handleDeleteConfirm(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

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
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增资源
        </Button>
      </div>

      {/* 资源列表 */}
      <div className={cx(styles.content)}>
        <Spin spinning={loading}>
          {!tableData?.length ? (
            <Empty
              description="暂无资源数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className={cx(styles.empty)}
            />
          ) : (
            <Table<ResourceTreeNode & { key: number }>
              columns={columns}
              dataSource={tableData}
              pagination={false}
              scroll={{ x: 'max-content' }}
              className={cx(styles.table)}
              expandable={{
                expandIcon: ({ expanded, onExpand, record }) =>
                  record.children ? (
                    <DownOutlined
                      className={cx(styles.icon, {
                        [styles['rotate-0']]: expanded,
                      })}
                      onClick={(e) => onExpand(record, e)}
                    />
                  ) : (
                    <DownOutlined
                      className={cx(styles.icon, styles['icon-hidden'])}
                    />
                  ),
              }}
            />
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
