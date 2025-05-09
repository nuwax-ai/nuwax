import { apiKnowledgeQaList } from '@/services/knowledge';
import {
  KnowledgeQAInfo,
  KnowledgeQaListParams,
} from '@/types/interfaces/knowledge';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Table, TableProps } from 'antd';
import cx from 'classnames';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

const QaTableList = forwardRef(
  (
    props: {
      spaceId: number;
      question: string;
      kbId: number;
      onEdit: (record: KnowledgeQAInfo) => void;
      onDelete: (record: KnowledgeQAInfo) => void;
    },
    ref,
  ) => {
    // QA问答内容
    const columns = [
      {
        title: 'ID',
        dataIndex: 'id',
      },
      {
        title: '问题',
        dataIndex: 'question',
      },
      {
        title: '答案',
        dataIndex: 'answer',
      },
      {
        title: '操作',
        dataIndex: 'action',
        render: (text: string, record: KnowledgeQAInfo) => {
          return (
            <div className={cx('flex', 'flex-row', 'gap-2')}>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => props.onEdit(record)}
              >
                编辑
              </Button>
              <Button
                type="link"
                icon={<DeleteOutlined />}
                color="danger"
                onClick={() => props.onDelete(record)}
              >
                删除
              </Button>
            </div>
          );
        },
      },
    ];
    const [data, setData] = useState<KnowledgeQAInfo[]>();
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [tableParams, setTableParams] = useState<KnowledgeQaListParams>({
      current: 1,
      pageSize: 10,
      queryFilter: {
        spaceId: props.spaceId,
        question: props.question,
        kbId: props.kbId,
      },
      orders: [],
      filters: [],
      columns: [],
    });
    const fetchQaList = () => {
      setLoading(true);
      apiKnowledgeQaList(tableParams).then((res) => {
        const { current, size, total = 0, records } = res.data;
        setTotal(total);
        setData(Array.isArray(records) ? records : []);
        setLoading(false);
        setTableParams({
          ...tableParams,
          pageSize: size,
          current: current,
        });
      });
    };
    useEffect(() => {
      fetchQaList();
    }, [tableParams.current, tableParams.pageSize, tableParams.filters]);
    // 暴露刷新方法给父组件
    useImperativeHandle(ref, () => ({
      refresh: fetchQaList,
    }));

    const handleTableChange: TableProps['onChange'] = (pagination) => {
      setTableParams({
        ...tableParams,
        current: pagination.current || 1,
        pageSize: pagination.pageSize || 10,
      });

      // `dataSource` is useless since `pageSize` changed
      if (pagination.pageSize !== tableParams?.pageSize) {
        setData([]);
      }
    };

    return (
      <div
        className={cx(
          'flex',
          'flex-1',
          'items-center',
          'justify-center',
          'h-full',
        )}
      >
        <Table
          ref={ref as any}
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            total,
            current: tableParams.current,
            pageSize: tableParams.pageSize,
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content', y: 'calc(100vh - 230px)' }}
        />
      </div>
    );
  },
);

export default QaTableList;
