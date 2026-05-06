/**
 * 知识图谱 - 文档表格列表
 */
import type { KnowledgeTripleDocumentInfo } from '@/types/interfaces/knowledge';
import {
  //CopyOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  PlayCircleOutlined,
} from '@ant-design/icons';
import {
  Button,
  Input,
  message,
  Popconfirm,
  Space,
  Table,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import styles from './GraphDocTable.less';

// 时间格式化函数
const formatDateTime = (time: string) => {
  if (!time) return '-';
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss');
};

interface GraphDocTableProps {
  documentList: KnowledgeTripleDocumentInfo[];
  loading?: boolean;
  onRowClick?: (record: KnowledgeTripleDocumentInfo) => void;
  onBatchDelete?: (ids: number[]) => void;
  onBatchConfig?: (ids: number[]) => void;
  onToggleGraph?: (id: number, enable: boolean) => void;
  onDelete?: (id: number) => void;
  onGenerateGraph?: (id: number) => void;
}

const getStatusTag = (status?: number) => {
  const statusConfig: Record<number, { color: string; text: string }> = {
    1: { color: '#F97316', text: '构建中' },
    2: { color: '#22C55E', text: '可用' },
    10: { color: '#EF4444', text: '不可用' },
  };

  const config = statusConfig[status ?? 0] || {
    color: '#94A3B8',
    text: '待处理',
  };

  return (
    <div className={styles.statusTag}>
      <span
        className={styles.statusDot}
        style={{ backgroundColor: config.color }}
      />
      <span className={styles.statusText}>{config.text}</span>
    </div>
  );
};

const GraphDocTable: React.FC<GraphDocTableProps> = ({
  documentList,
  loading,
  onRowClick,
  onBatchDelete,
  //onBatchConfig,
  onDelete,
  onGenerateGraph,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 根据搜索关键词过滤数据
  const filteredData = documentList.filter((item) =>
    item.documentName?.toLowerCase().includes(searchKeyword.toLowerCase()),
  );

  // 批量删除
  const handleBatchDelete = () => {
    // 检查选中的数据中是否有没有生成知识图谱的数据
    const selectedRecords = documentList.filter((item) =>
      selectedRowKeys.includes(item.documentId),
    );

    const hasUnavailable = selectedRecords.some(
      (record) => record.tripleStatus !== 2,
    );

    if (hasUnavailable) {
      message.warning('存在没有生成知识图谱的数据，不能进行删除操作');
      return;
    }

    onBatchDelete?.(selectedRowKeys as number[]);
    setSelectedRowKeys([]);
  };

  const columns: ColumnsType<KnowledgeTripleDocumentInfo> = [
    {
      title: 'ID',
      dataIndex: 'documentId',
      key: 'documentId',
      width: 100,
      align: 'center',
      render: (id: number) => <span>{id}</span>,
    },
    {
      title: '文档名称',
      dataIndex: 'documentName',
      key: 'documentName',
      width: 240,
      render: (text: string, record) => {
        const isAvailable = record.tripleStatus === 2;
        return (
          <div className={styles.nameCell}>
            {isAvailable ? (
              <a
                className={styles.docName}
                onClick={(e) => {
                  e.stopPropagation();
                  onRowClick?.(record);
                }}
                title={text}
              >
                {text}
              </a>
            ) : (
              <span className={styles.docNameDisabled} title={text}>
                {text}
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'tripleStatus',
      key: 'tripleStatus',
      width: 100,
      align: 'center',
      render: (status: number) => getStatusTag(status),
    },
    {
      title: '文件类型',
      dataIndex: 'fileType',
      key: 'fileType',
      width: 100,
      align: 'center',
      render: (type: string) => type || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdTime',
      key: 'createdTime',
      width: 180,
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedTime',
      key: 'updatedTime',
      width: 180,
      render: (time: string) => formatDateTime(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      align: 'center',
      fixed: 'right',
      render: (_, record) => {
        const isUnavailable = record.tripleStatus === 10;
        const isNotStarted = record.tripleStatus === 0;

        return (
          <Space size="small">
            {(isNotStarted || isUnavailable) && (
              <Popconfirm
                title="确定要生成知识图谱吗？"
                description={record.documentName}
                icon={<ExclamationCircleFilled />}
                onConfirm={() => onGenerateGraph?.(record.documentId)}
                okText="确定"
                cancelText="取消"
              >
                <Tooltip title="生成知识图谱">
                  <Button
                    type="text"
                    style={{ color: '#1890ff' }}
                    icon={<PlayCircleOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            )}
            {/* {isBuilding ? null : isAvailable ? (
              <Popconfirm
                title="确定要关闭图谱吗？"
                description={record.documentName}
                icon={<ExclamationCircleFilled />}
                onConfirm={() => onToggleGraph?.(record.documentId, false)}
                okText="确定"
                cancelText="取消"
              >
                <Tooltip title="关闭图谱">
                  <Button
                    type="text"
                    danger
                    icon={<StopOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            ) : null} */}
            {record.tripleStatus === 2 && (
              <Popconfirm
                title="确定要删除此文档吗？"
                description={record.documentName}
                icon={<ExclamationCircleFilled />}
                onConfirm={() => onDelete?.(record.documentId)}
                okText="确定"
                cancelText="取消"
              >
                <Tooltip title="删除">
                  <Button type="text" icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record: KnowledgeTripleDocumentInfo) => ({
      disabled: record.tripleStatus !== 2,
    }),
  };

  return (
    <div className={styles.container}>
      {/* 操作栏 */}
      <div className={styles.toolbar}>
        <Input.Search
          placeholder="搜索文档名称"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          allowClear
          style={{ width: 240, marginRight: 10 }}
        />
        <Popconfirm
          title="批量删除"
          description={`确定要删除选中的 ${selectedRowKeys.length} 个文档吗？`}
          onConfirm={handleBatchDelete}
          disabled={selectedRowKeys.length === 0}
          okText="确定"
          cancelText="取消"
        >
          <Button
            type="primary"
            icon={<DeleteOutlined />}
            disabled={selectedRowKeys.length === 0}
          >
            批量删除
          </Button>
        </Popconfirm>
      </div>

      {/* 表格 */}
      <Table<KnowledgeTripleDocumentInfo>
        columns={columns}
        dataSource={filteredData}
        rowKey="documentId"
        loading={loading}
        rowHoverable={false}
        rowSelection={rowSelection}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 篇文档`,
        }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default GraphDocTable;
