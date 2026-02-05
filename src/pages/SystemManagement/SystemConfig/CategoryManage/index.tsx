import WorkspaceLayout from '@/components/WorkspaceLayout';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { ProList } from '@ant-design/pro-components';
import { Button, Modal, Segmented, Space, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import CategoryModal, { CategoryItem } from './components/CategoryModal';
import styles from './index.less';

const { confirm } = Modal;

const CategoryManage: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string>('agent');
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<CategoryItem[]>([]);

  // 弹窗状态
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingData, setEditingData] = useState<CategoryItem | null>(null);

  // 模拟数据加载
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const mockData: CategoryItem[] = [
        {
          id: '1',
          name: '对话助手',
          code: 'dialogue_assistant',
          description: '智能对话与问答类智能体',
        },
        {
          id: '2',
          name: '数据分析',
          code: 'data_analysis',
          description: '数据处理与分析类智能体',
        },
        {
          id: '3',
          name: '内容创作',
          code: 'content_creation',
          description: '文本生成与创作类智能体',
        },
        {
          id: '4',
          name: '代码助手',
          code: 'code_assistant',
          description: '编程辅助与代码生成类智能体',
        },
        {
          id: '5',
          name: '翻译助手',
          code: 'translation_assistant',
          description: '多语言翻译与本地化类智能体',
        },
      ];
      setDataSource(mockData);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [activeKey]);

  const segmentedOptions = [
    { label: '智能体', value: 'agent' },
    { label: '组件', value: 'component' },
    { label: '应用', value: 'application' },
  ];

  const getHeaderTitle = () => {
    const label =
      segmentedOptions.find((t) => t.value === activeKey)?.label || '';
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
      title: '确认删除该分类？',
      icon: <ExclamationCircleOutlined />,
      content: `将会永久删除分类 "${record.name}"，请确认操作。`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        // 模拟接口调用
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
        setDataSource((prev) => prev.filter((item) => item.id !== record.id));
        message.success('分类已删除');
      },
    });
  };

  // 提交分类
  const handleModalFinish = async (values: any) => {
    // 模拟接口调用
    await new Promise((resolve) => {
      setTimeout(resolve, 800);
    });

    if (modalMode === 'add') {
      const newItem: CategoryItem = {
        id: Date.now().toString(),
        name: values.name,
        code: values.code,
        description: values.description,
      };
      setDataSource((prev) => [newItem, ...prev]);
      message.success('分类添加成功');
    } else {
      setDataSource((prev) =>
        prev.map((item) =>
          item.id === editingData?.id
            ? {
                ...item,
                name: values.name,
                code: values.code,
                description: values.description,
              }
            : item,
        ),
      );
      message.success('分类修改成功');
    }
    setModalOpen(false);
    return true;
  };

  // 获取当前分类标签
  const getCurrentCategoryLabel = () => {
    return segmentedOptions.find((t) => t.value === activeKey)?.label || '';
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
