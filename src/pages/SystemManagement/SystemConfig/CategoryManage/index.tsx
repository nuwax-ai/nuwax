import WorkspaceLayout from '@/components/WorkspaceLayout';
import {
  apiSystemCategoryCreate,
  apiSystemCategoryDelete,
  apiSystemCategoryList,
  apiSystemCategoryUpdate,
} from '@/services/systemManage';
import { CategoryTypeEnum } from '@/types/enums/agent';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { ProList } from '@ant-design/pro-components';
import { App, Button, Segmented, Space } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useRequest } from 'umi';
import CategoryModal, { CategoryItem } from './components/CategoryModal';
import styles from './index.less';

const CategoryManage: React.FC = () => {
  const { modal, message } = App.useApp();
  const { confirm } = modal;
  const [activeKey, setActiveKey] = useState<string>(CategoryTypeEnum.Agent);

  // 弹窗状态
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingData, setEditingData] = useState<CategoryItem | null>(null);

  // 获取分类列表
  const {
    data: dataSource = [],
    loading,
    run: refreshList,
  } = useRequest(
    () => apiSystemCategoryList({ type: activeKey as CategoryTypeEnum }),
    {
      refreshDeps: [activeKey],
    },
  );

  const segmentedOptions = [
    { label: '智能体', value: CategoryTypeEnum.Agent },
    { label: '组件', value: CategoryTypeEnum.Component },
    { label: '应用', value: CategoryTypeEnum.PageApp },
  ];

  // 获取当前分类标签
  const getCurrentCategoryLabel = () => {
    return segmentedOptions.find((t) => t.value === activeKey)?.label || '';
  };

  const getHeaderTitle = () => {
    const label = getCurrentCategoryLabel();
    return (
      <Space align="baseline">
        <span>{label}分类</span>
        <span className="ant-pro-list-header-sub-title">
          {dataSource.length} 项
        </span>
      </Space>
    );
  };

  // 添加分类
  const handleAdd = () => {
    setModalMode('add');
    setEditingData(null);
    setModalOpen(true);
  };

  // 编辑分类
  const handleEdit = (record: CategoryItem) => {
    setModalMode('edit');
    setEditingData(record);
    setModalOpen(true);
  };

  // 删除分类
  const handleDelete = (record: CategoryItem) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除此分类吗？此操作无法撤销。`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await apiSystemCategoryDelete({ id: record.id });
          if (res.success) {
            message.success('分类已删除');
            refreshList();
          }
        } catch (error) {
          console.error('删除分类失败:', error);
        }
      },
    });
  };

  // 提交分类
  const handleModalFinish = async (values: any) => {
    try {
      const params = {
        ...values,
        id: modalMode === 'edit' ? editingData?.id : undefined,
        type: activeKey as CategoryTypeEnum,
      };

      const apiFunc =
        modalMode === 'add' ? apiSystemCategoryCreate : apiSystemCategoryUpdate;
      const res = await apiFunc(params);

      if (res.success) {
        message.success(
          `${getCurrentCategoryLabel()}分类${
            modalMode === 'add' ? '添加' : '修改'
          }成功`,
        );
        refreshList();
        setModalOpen(false);
        return true;
      }
    } catch (error) {
      console.error('保存分类失败:', error);
    }
    return false;
  };

  return (
    <WorkspaceLayout
      title="分类管理"
      leftSlot={
        <Segmented
          options={segmentedOptions}
          value={activeKey}
          onChange={(value) => setActiveKey(value as string)}
        />
      }
    >
      <div className={styles['category-manage-container']}>
        <div className={styles['list-card']}>
          <ProList<CategoryItem>
            rowKey="id"
            loading={loading}
            headerTitle={getHeaderTitle()}
            dataSource={dataSource}
            toolBarRender={() => [
              <Button
                key="add"
                type="primary"
                icon={<PlusOutlined />}
                className={styles['add-btn']}
                onClick={handleAdd}
              >
                添加
              </Button>,
            ]}
            metas={{
              title: {
                dataIndex: 'name',
              },
              description: {
                dataIndex: 'description',
              },
              actions: {
                render: (_, record) => [
                  <EditOutlined
                    key="edit"
                    className={styles['action-icon']}
                    onClick={() => handleEdit(record)}
                  />,
                  <DeleteOutlined
                    key="delete"
                    className={classNames(styles['action-icon'], styles.delete)}
                    onClick={() => handleDelete(record)}
                  />,
                ],
              },
            }}
          />
        </div>
      </div>

      <CategoryModal
        open={modalOpen}
        mode={modalMode}
        categoryLabel={getCurrentCategoryLabel()}
        initialData={editingData}
        onCancel={() => setModalOpen(false)}
        onFinish={handleModalFinish}
      />
    </WorkspaceLayout>
  );
};

export default CategoryManage;
