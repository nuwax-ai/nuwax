import { dict } from '@/services/i18nRuntime';
import { apiKnowledgeDocumentList, apiKnowledgeQaList } from '@/services/knowledge';
import {
  KnowledgeQAInfo,
  KnowledgeQaListParams,
} from '@/types/interfaces/knowledge';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import { Button, Empty, Input, Popconfirm, Select, Table, TableProps, Tag } from 'antd';
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
  // 新增：让子组件能修改父组件的 question 状态
  onQuestionChange?: (q: string) => void;
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
        title: dict('PC.Pages.SpaceKnowledge.QaTableList.question'),
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
        title: dict('PC.Pages.SpaceKnowledge.QaTableList.answer'),
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
        title: dict('PC.Pages.SpaceKnowledge.QaTableList.vectorized'),
        dataIndex: 'hasEmbedding',
        width: 100,
        fixed: 'right',
        render: (value: boolean) => {
          if (value) {
            return (
              <Tag color="success">
                {dict('PC.Pages.SpaceKnowledge.QaTableList.completed')}
              </Tag>
            );
          }
          return (
            <Tag color="processing">
              {dict('PC.Pages.SpaceKnowledge.QaTableList.building')}
            </Tag>
          );
        },
      },
      {
        title: dict('PC.Pages.SpaceKnowledge.QaTableList.action'),
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
                title={dict(
                  'PC.Pages.SpaceKnowledge.QaTableList.confirmDeleteQa',
                )}
                description={record.question}
                icon={<ExclamationCircleFilled />}
                onConfirm={() => props.onDelete(record)}
                okText={dict('PC.Common.Global.confirm')}
                cancelText={dict('PC.Common.Global.cancel')}
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
    const [docIdFilter, setDocIdFilter] = useState<number | undefined>(undefined);
    const [docOptions, setDocOptions] = useState<
      Array<{ label: string; value: number }>
    >([]);

    // 哨兵值：用于在 antd Select 的 options 里表达「全部」语义。
    // 选择「全部」option 时 onChange 收到 -1，此处再翻译成 undefined 透传到后端。
    const ALL_SENTINEL = -1;
    const [tableParams, setTableParams] = useState<KnowledgeQaListParams>({
      current: 1,
      pageSize: 48,
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
    const fetchQaList = (params: KnowledgeQaListParams) => {
      setLoading(true);
      apiKnowledgeQaList(params)
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
      fetchQaList(tableParams);
    }, [
      tableParams.current,
      tableParams.pageSize,
      tableParams.queryFilter.question,
      tableParams.queryFilter.docId,
    ]);

    // 加载文档列表(用于文档下拉筛选)
    useEffect(() => {
      apiKnowledgeDocumentList({
        current: 1,
        pageSize: 200,
        queryFilter: { kbId: props.kbId, name: '' },
      })
        .then((res) => {
          const list = (res?.data?.records || []).map(
            (d: any) => ({
              label:
                d.docName || d.name || dict(
                  'PC.Pages.SpaceKnowledge.QaTableList.docPrefix',
                  d.id,
                ),
              value: d.id,
            }),
          );
          setDocOptions(list);
        })
        .catch(() => setDocOptions([]));
    }, [props.kbId]);

    // 同步 docIdFilter 到 tableParams.queryFilter.docId
    useEffect(() => {
      setTableParams((prev) => ({
        ...prev,
        queryFilter: {
          ...prev.queryFilter,
          docId: docIdFilter,
        },
        current: 1,
      }));
    }, [docIdFilter]);

    // 监听props变化，更新查询条件
    useEffect(() => {
      // 当外部筛选条件变化时，重置到第一页
      setTableParams((prev) => ({
        ...prev,
        queryFilter: {
          spaceId: props.spaceId,
          question: props.question,
          kbId: props.kbId,
          docId: docIdFilter,
        },
        current: 1, // 重置到第一页
      }));
    }, [props.spaceId, props.kbId, props.question]);

    // 暴露刷新方法给父组件
    useImperativeHandle(ref, () => ({
      refresh: () => fetchQaList(tableParams),
    }));

    const handleTableChange: TableProps['onChange'] = (pagination) => {
      setTableParams((prev) => {
        const newParams = {
          ...prev,
          current: pagination.current || 1,
          pageSize: pagination.pageSize || 15,
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        }}
      >
        {/* 工具栏：文档筛选 + 问题搜索同一行靠左 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 12,
            padding: '8px 0',
            width: '100%',
          }}
        >
          <Select
            style={{ width: 220 }}
            placeholder={dict('PC.Pages.SpaceKnowledge.QaTableList.allDocs')}
            value={docIdFilter === undefined ? ALL_SENTINEL : docIdFilter}
            onChange={(v) =>
              setDocIdFilter(v === ALL_SENTINEL ? undefined : v)
            }
            options={[
              { label: dict('PC.Common.Global.all'), value: ALL_SENTINEL },
              {
                label: dict(
                  'PC.Pages.SpaceKnowledge.QaTableList.manualAddOrBatchImport',
                ),
                value: 0,
              },
              ...docOptions,
            ]}
          />
          <Input.Search
            placeholder={dict('PC.Pages.SpaceKnowledge.Index.searchQuestion')}
            value={props.question}
            onChange={(e) => props.onQuestionChange?.(e.target.value)}
            onSearch={(v) => props.onQuestionChange?.(v)}
            allowClear
            style={{ width: 240 }}
          />
        </div>
        {data.length > 0  ? (
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
          <Empty description={dict('PC.Common.Global.noData')} />
        )}
      </div>
    );
  },
);

export default QaTableList;
