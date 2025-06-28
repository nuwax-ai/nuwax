import { apiKnowledgeQaList } from '@/services/knowledge';
import {
  KnowledgeQAInfo,
  KnowledgeQaListParams,
} from '@/types/interfaces/knowledge';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import { Button, Empty, Popconfirm, Spin, Table, TableProps, Tag } from 'antd';
import cx from 'classnames';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export interface QaTableListRef {
  refresh: () => void;
}
export interface QaTableListProps {
  spaceId: number;
  kbId: number;
  onEdit: (record: KnowledgeQAInfo) => void;
  onDelete: (record: KnowledgeQAInfo) => void;
  question: string;
}

/**
 * 知识库QA问答列表组件
 */
const QaTableList = forwardRef<QaTableListRef, QaTableListProps>(
  (props, ref) => {
    // QA问答内容
    const columns = [
      {
        title: 'ID',
        dataIndex: 'id',
        width: 150,
        fixed: 'left',
      },
      {
        title: '问题',
        dataIndex: 'question',
        render: (text: string) => {
          return (
            <div className={cx('text-ellipsis')} title={text}>
              {text}
            </div>
          );
        },
      },
      {
        title: '答案',
        dataIndex: 'answer',
        render: (text: string) => {
          return (
            <div className={cx('text-ellipsis')} title={text}>
              {text}
            </div>
          );
        },
      },
      {
        title: '向量化',
        dataIndex: 'hasEmbedding',
        width: 100,
        fixed: 'right',
        render: (value: boolean) => {
          if (value) {
            return <Tag color="success">已完成</Tag>;
          }
          return <Tag color="processing">构建中</Tag>;
        },
      },
      {
        title: '操作',
        dataIndex: 'action',
        width: 100,
        align: 'center',
        fixed: 'right',
        render: (text: string, record: KnowledgeQAInfo) => {
          return (
            <div className={cx('flex', 'flex-row', 'content-around')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => props.onEdit(record)}
              />
              <Popconfirm
                title="您确定要删除此QA问答吗?"
                description={record.question}
                icon={<ExclamationCircleFilled />}
                onConfirm={() => props.onDelete(record)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="text" icon={<DeleteOutlined />} />
              </Popconfirm>
            </div>
          );
        },
      },
    ];
    const [data, setData] = useState<KnowledgeQAInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [tableParams, setTableParams] = useState<KnowledgeQaListParams>({
      current: 1,
      pageSize: 20,
      queryFilter: {
        spaceId: props.spaceId,
        question: props.question,
        kbId: props.kbId,
      },
      orders: [],
      filters: [],
      columns: [],
    });

    // 获取QA列表数据
    const fetchQaList = () => {
      setLoading(true);
      apiKnowledgeQaList(tableParams)
        .then((res) => {
          const { current, size, total = 0, records } = res.data;
          setTotal(total);
          setData(Array.isArray(records) ? records : []);
          setTableParams((prev) => ({
            ...prev,
            pageSize: size,
            current: current,
          }));
        })
        .finally(() => {
          setLoading(false);
        });
    };

    // 监听分页和筛选变化
    useEffect(() => {
      fetchQaList();
    }, [
      tableParams.current,
      tableParams.pageSize,
      tableParams.queryFilter.question,
    ]);

    // 监听props变化，更新查询条件
    useEffect(() => {
      // 当外部筛选条件变化时，重置到第一页
      setTableParams((prev) => ({
        ...prev,
        queryFilter: {
          spaceId: props.spaceId,
          question: props.question,
          kbId: props.kbId,
        },
        current: 1, // 重置到第一页
      }));
    }, [props.spaceId, props.kbId, props.question]);

    // 暴露刷新方法给父组件
    useImperativeHandle(ref, () => ({
      refresh: fetchQaList,
    }));

    const handleTableChange: TableProps['onChange'] = (pagination) => {
      setTableParams((prev) => {
        const newParams = {
          ...prev,
          current: pagination.current || 1,
          pageSize: pagination.pageSize || 10,
        };

        // 如果页面大小变化，清空数据
        if (pagination.pageSize !== prev.pageSize) {
          setData([]);
        }

        return newParams;
      });
    };

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <Spin spinning={loading} delay={200} />
        ) : data.length > 0 ? (
          <Table
            rowKey="id"
            columns={columns}
            rowHoverable={false}
            dataSource={data}
            loading={loading}
            height={'auto'}
            pagination={{
              total,
              current: tableParams.current,
              pageSize: tableParams.pageSize,
            }}
            onChange={handleTableChange as any}
            scroll={{
              scrollToFirstRowOnChange: true,
              x: 'max-content',
              y: 'calc(100vh - 257px)',
            }}
          />
        ) : (
          <Empty description="暂无数据" />
        )}
      </div>
    );
  },
);

export default QaTableList;
