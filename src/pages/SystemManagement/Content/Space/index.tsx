/**
 * 空间管理页面
 *
 * 功能：
 * - 空间列表展示（ProTable）
 * - 支持名称、创建人模糊搜索
 * - 支持名称、创建时间、修改时间排序（接口排序）
 * - 操作列：查看、删除（使用 TableActions 组件）
 */
import TableActions, { ActionItem } from '@/components/TableActions';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { message, Modal } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useMemo, useRef } from 'react';

/** 空间信息类型定义 */
export interface SpaceInfo {
  /** 空间ID */
  id: number;
  /** 空间名称 */
  name: string;
  /** 空间描述 */
  description?: string;
  /** 创建人 */
  creator: string;
  /** 创建时间 */
  createdAt: string;
  /** 修改时间 */
  updatedAt: string;
}

/** 接口请求参数 */
interface SpaceListParams {
  /** 当前页码 */
  current?: number;
  /** 每页条数 */
  pageSize?: number;
  /** 名称搜索（模糊） */
  name?: string;
  /** 创建人搜索（模糊） */
  creator?: string;
  /** 排序字段 */
  sortField?: 'name' | 'createdAt' | 'updatedAt';
  /** 排序方式 */
  sortOrder?: 'ascend' | 'descend';
}

/** 接口响应类型 */
interface SpaceListResponse {
  data: SpaceInfo[];
  total: number;
  success: boolean;
}

// ========== 假数据 ==========
const mockData: SpaceInfo[] = [
  {
    id: 1,
    name: '默认工作空间',
    description: '系统默认创建的工作空间',
    creator: '管理员',
    createdAt: '2025-01-01 10:00:00',
    updatedAt: '2025-01-20 15:30:00',
  },
  {
    id: 2,
    name: '研发团队空间',
    description: '研发部门专用空间，用于代码审查和协作',
    creator: '张三',
    createdAt: '2025-01-05 09:15:00',
    updatedAt: '2025-01-22 11:45:00',
  },
  {
    id: 3,
    name: '产品运营空间',
    description: '产品和运营团队的协作空间',
    creator: '李四',
    createdAt: '2025-01-10 14:20:00',
    updatedAt: '2025-01-21 16:00:00',
  },
  {
    id: 4,
    name: '测试环境空间',
    description: '用于测试环境的独立空间',
    creator: '王五',
    createdAt: '2025-01-12 08:00:00',
    updatedAt: '2025-01-23 09:30:00',
  },
  {
    id: 5,
    name: '客户演示空间',
    description: '对外客户演示使用的空间',
    creator: '赵六',
    createdAt: '2025-01-15 13:45:00',
    updatedAt: '2025-01-19 10:20:00',
  },
];

/**
 * 模拟接口请求
 * TODO: 对接正式接口时，替换此函数
 */
const fetchSpaceList = async (
  params: SpaceListParams,
): Promise<SpaceListResponse> => {
  // 模拟网络延迟
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => setTimeout(resolve, 300));

  let result = [...mockData];

  // 名称模糊搜索
  if (params.name) {
    const keyword = params.name.toLowerCase();
    result = result.filter((item) => item.name.toLowerCase().includes(keyword));
  }

  // 创建人模糊搜索
  if (params.creator) {
    const keyword = params.creator.toLowerCase();
    result = result.filter((item) =>
      item.creator.toLowerCase().includes(keyword),
    );
  }

  // 排序
  if (params.sortField && params.sortOrder) {
    const sortField = params.sortField;
    const isAscend = params.sortOrder === 'ascend';

    result.sort((a, b) => {
      let compareResult = 0;
      if (sortField === 'name') {
        compareResult = a.name.localeCompare(b.name);
      } else if (sortField === 'createdAt') {
        compareResult = dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix();
      } else if (sortField === 'updatedAt') {
        compareResult = dayjs(a.updatedAt).unix() - dayjs(b.updatedAt).unix();
      }
      return isAscend ? compareResult : -compareResult;
    });
  }

  // 分页
  const current = params.current || 1;
  const pageSize = params.pageSize || 10;
  const start = (current - 1) * pageSize;
  const end = start + pageSize;
  const pageData = result.slice(start, end);

  return {
    data: pageData,
    total: result.length,
    success: true,
  };
};

/**
 * 模拟删除接口
 * TODO: 对接正式接口时，替换此函数
 */
const deleteSpace = async (id: number): Promise<boolean> => {
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => setTimeout(resolve, 200));
  console.log('删除空间:', id);
  return true;
};

const Space: React.FC = () => {
  const actionRef = useRef<ActionType>();

  /**
   * 查看空间详情
   */
  const handleView = useCallback((record: SpaceInfo) => {
    // TODO: 跳转到详情页或打开详情弹窗
    Modal.info({
      title: '空间详情',
      content: (
        <div>
          <p>
            <strong>名称：</strong>
            {record.name}
          </p>
          <p>
            <strong>描述：</strong>
            {record.description || '-'}
          </p>
          <p>
            <strong>创建人：</strong>
            {record.creator}
          </p>
          <p>
            <strong>创建时间：</strong>
            {record.createdAt}
          </p>
          <p>
            <strong>修改时间：</strong>
            {record.updatedAt}
          </p>
        </div>
      ),
    });
  }, []);

  /**
   * 删除空间
   */
  const handleDelete = useCallback(async (record: SpaceInfo) => {
    const success = await deleteSpace(record.id);
    if (success) {
      message.success('删除成功');
      actionRef.current?.reload();
    } else {
      message.error('删除失败');
    }
  }, []);

  /**
   * 操作列配置
   */
  const getActions = useCallback(
    (record: SpaceInfo): ActionItem<SpaceInfo>[] => [
      {
        key: 'view',
        label: '查看',
        onClick: handleView,
      },
      {
        key: 'delete',
        label: '删除',
        type: 'danger',
        confirm: {
          title: (
            <span>
              确定要删除 <b>{record.name}</b> 吗？
            </span>
          ),
          description: '此操作无法撤销，所有相关数据将被永久删除。',
        },
        onClick: handleDelete,
      },
    ],
    [handleView, handleDelete],
  );

  /**
   * 表格列定义
   */
  const columns: ProColumns<SpaceInfo>[] = useMemo(
    () => [
      {
        title: '名称',
        dataIndex: 'name',
        width: 180,
        ellipsis: true,
        sorter: true, // 支持排序
        fieldProps: {
          placeholder: '请输入名称',
          allowClear: true,
        },
      },
      {
        title: '描述',
        dataIndex: 'description',
        width: 250,
        ellipsis: true,
        hideInSearch: true, // 不参与搜索
        render: (_, record) => record.description || '-',
      },
      {
        title: '创建人',
        dataIndex: 'creator',
        width: 120,
        ellipsis: true,
        fieldProps: {
          placeholder: '请输入创建人',
          allowClear: true,
        },
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        align: 'center',
        width: 170,
        hideInSearch: true,
        sorter: true, // 支持排序
      },
      {
        title: '修改时间',
        dataIndex: 'updatedAt',
        align: 'center',
        width: 170,
        hideInSearch: true,
        sorter: true, // 支持排序
      },
      {
        title: '操作',
        valueType: 'option',
        fixed: 'right',
        align: 'center',
        width: 180,
        render: (_, record) => (
          <TableActions<SpaceInfo>
            record={record}
            actions={getActions(record)}
          />
        ),
      },
    ],
    [getActions],
  );

  /**
   * ProTable request 函数
   */
  const request = useCallback(
    async (
      params: SpaceListParams & {
        current?: number;
        pageSize?: number;
      },
      sort: Record<string, 'ascend' | 'descend' | null>,
    ) => {
      // 解析排序参数
      let sortField: SpaceListParams['sortField'];
      let sortOrder: SpaceListParams['sortOrder'];

      const sortKeys = Object.keys(sort);
      if (sortKeys.length > 0) {
        const key = sortKeys[0] as 'name' | 'createdAt' | 'updatedAt';
        if (sort[key]) {
          sortField = key;
          sortOrder = sort[key] as 'ascend' | 'descend';
        }
      }

      const response = await fetchSpaceList({
        current: params.current,
        pageSize: params.pageSize,
        name: params.name,
        creator: params.creator,
        sortField,
        sortOrder,
      });

      return {
        data: response.data,
        total: response.total,
        success: response.success,
      };
    },
    [],
  );

  return (
    <WorkspaceLayout title="空间" hideScroll>
      <ProTable<SpaceInfo>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={request}
        debounceTime={300}
        toolBarRender={false}
        options={false}
        cardProps={{ bodyStyle: { padding: 0 } }}
        pagination={{
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (total) => `共 ${total} 条`,
          defaultPageSize: 10,
        }}
        search={{
          span: 6,
          labelWidth: 70,
          defaultCollapsed: false,
          style: {
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: 0,
          },
        }}
      />
    </WorkspaceLayout>
  );
};

export default Space;
