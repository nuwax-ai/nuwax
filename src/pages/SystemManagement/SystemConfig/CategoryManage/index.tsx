import WorkspaceLayout from '@/components/WorkspaceLayout';
import { t } from '@/services/i18nRuntime';
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
import { useLocation, useModel, useRequest } from 'umi';
import CategoryModal, { CategoryItem } from './components/CategoryModal';
import styles from './index.less';

const CategoryManage: React.FC = () => {
  const { hasPermission } = useModel('menuModel');
  const { modal, message } = App.useApp();
  const { confirm } = modal;
  const [activeKey, setActiveKey] = useState<string>(CategoryTypeEnum.Agent);
  const location = useLocation();

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

  // 监听 location.state 变化
  React.useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      setActiveKey(CategoryTypeEnum.Agent);
      refreshList();
    }
  }, [location.state, refreshList]);

  const segmentedOptions = [
    {
      label: t('PC.Pages.SystemConfigCategoryManage.agent'),
      value: CategoryTypeEnum.Agent,
    },
    {
      label: t('PC.Pages.SystemConfigCategoryManage.webApp'),
      value: CategoryTypeEnum.PageApp,
    },
    {
      label: t('PC.Pages.SystemConfigCategoryManage.component'),
      value: CategoryTypeEnum.Component,
    },
  ];

  // 获取当前分类标签
  const getCurrentCategoryLabel = () => {
    return segmentedOptions.find((t) => t.value === activeKey)?.label || '';
  };

  const getHeaderTitle = () => {
    const label = getCurrentCategoryLabel();
    return (
      <Space align="baseline">
        <span style={{ fontSize: 14 }}>
          {t('PC.Pages.SystemConfigCategoryManage.categoryType', label)}
        </span>
        <span
          className="ant-pro-list-header-sub-title"
          style={{ fontSize: 14 }}
        >
          {t(
            'PC.Pages.SystemConfigCategoryManage.itemCount',
            String(dataSource.length),
          )}
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
      title: t('PC.Pages.SystemConfigCategoryManage.confirmDeleteTitle'),
      icon: <ExclamationCircleOutlined />,
      content: t('PC.Pages.SystemConfigCategoryManage.confirmDeleteContent'),
      okText: t('PC.Common.Global.confirm'),
      cancelText: t('PC.Common.Global.cancel'),
      onOk: async () => {
        try {
          const res = await apiSystemCategoryDelete({ id: record.id });
          if (res.success) {
            message.success(
              t('PC.Pages.SystemConfigCategoryManage.deletedSuccessfully'),
            );
            refreshList();
          }
        } catch (error) {
          console.error(
            t('PC.Pages.SystemConfigCategoryManage.deleteFailed'),
            error,
          );
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
          modalMode === 'add'
            ? t(
                'PC.Pages.SystemConfigCategoryManage.addSuccessWithType',
                getCurrentCategoryLabel(),
              )
            : t(
                'PC.Pages.SystemConfigCategoryManage.editSuccessWithType',
                getCurrentCategoryLabel(),
              ),
        );
        refreshList();
        setModalOpen(false);
        return true;
      }
    } catch (error) {
      console.error(t('PC.Pages.SystemConfigCategoryManage.saveFailed'), error);
    }
    return false;
  };

  return (
    <WorkspaceLayout
      title={t('PC.Pages.SystemConfigCategoryManage.pageTitle')}
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
              hasPermission('category_config_add') && (
                <Button
                  key="add"
                  type="primary"
                  icon={<PlusOutlined />}
                  className={styles['add-btn']}
                  onClick={handleAdd}
                >
                  {t('PC.Pages.SystemConfigCategoryManage.add')}
                </Button>
              ),
            ]}
            metas={{
              title: {
                dataIndex: 'name',
                render: (_, record) => (
                  <span style={{ fontSize: 14 }}>{record.name}</span>
                ),
              },
              description: {
                dataIndex: 'description',
                render: (_, record) => (
                  <span style={{ fontSize: 12 }}>{record.description}</span>
                ),
              },
              actions: {
                render: (_, record) => [
                  <EditOutlined
                    key="edit"
                    className={classNames(styles['action-icon'], {
                      [styles.disabled]: !hasPermission(
                        'category_config_modify',
                      ),
                    })}
                    onClick={() => {
                      if (!hasPermission('category_config_modify')) return;
                      handleEdit(record);
                    }}
                  />,
                  <DeleteOutlined
                    key="delete"
                    className={classNames(
                      styles['action-icon'],
                      styles.delete,
                      {
                        [styles.disabled]: !hasPermission(
                          'category_config_delete',
                        ),
                      },
                    )}
                    onClick={() => {
                      if (!hasPermission('category_config_delete')) return;
                      handleDelete(record);
                    }}
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
