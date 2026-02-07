import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import {
  apiGetRoleBoundDataPermissionList,
  apiRoleBindDataPermission,
} from '@/pages/SystemManagement/MenuPermission/services/role-manage';
import {
  apiSystemResourceAgentListByIds,
  apiSystemResourcePageListByIds,
} from '@/pages/UserManage/user-manage';
import { apiPublishedAgentList } from '@/services/square';
import { apiSystemModelList } from '@/services/systemManage';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { AgentConfigInfo } from '@/types/interfaces/agent';
import type { CustomPageDto } from '@/types/interfaces/pageDev';
import type { Page } from '@/types/interfaces/request';
import type {
  SquarePublishedItemInfo,
  SquarePublishedListParams,
} from '@/types/interfaces/square';
import type { ModelConfigDto } from '@/types/interfaces/systemManage';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Table,
  Tabs,
  message,
} from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiGetGroupBoundDataPermissionList,
  apiGroupBindDataPermission,
} from '../../services/user-group-manage';
import { DataPermission } from '../../types/role-manage';
import ResourceItem from './components/ResourceItem';
import styles from './index.less';

const cx = classNames.bind(styles);

interface DataPermissionModalProps {
  /** 是否打开 */
  open: boolean;
  /** 目标ID */
  targetId: number;
  type: 'role' | 'userGroup';
  /** 名称 */
  name?: string;
  /** 取消回调 */
  onCancel: () => void;
}

type TabKey = 'model' | 'agent' | 'page' | 'dataPermission';

// 模型列表表格列
const modelColumns: TableColumnsType<ModelConfigDto> = [
  {
    title: '模型名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
    ellipsis: true,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
];

// Tab 配置（只包含标签名称）
const tabItems = [
  {
    key: 'model',
    label: '模型',
  },
  {
    key: 'agent',
    label: '智能体',
  },
  {
    key: 'page',
    label: '网页应用',
  },
  {
    key: 'dataPermission',
    label: '数据',
  },
];

/**
 * 数据权限设置弹窗组件
 * 用于配置角色的数据权限，包括模型、智能体、应用页面和数据权限
 */
const DataPermissionModal: React.FC<DataPermissionModalProps> = ({
  open,
  targetId,
  type = 'role',
  name,
  onCancel,
}) => {
  const [form] = Form.useForm();
  // 当前激活的tab
  const [activeTab, setActiveTab] = useState<TabKey>('model');
  // 智能体列表
  const [agentList, setAgentList] = useState<SquarePublishedItemInfo[]>([]);
  // 应用页面列表
  const [pageList, setPageList] = useState<SquarePublishedItemInfo[]>([]);
  // 选中的模型ID列表
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  // 选中的智能体ID列表
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  // 选中的应用页面关联的agentId列表（此处应该是页面的devAgentId字段值列表）
  const [selectedPageAgentIds, setSelectedPageAgentIds] = useState<number[]>(
    [],
  );
  // 已选中的智能体详情列表（通过ID列表查询）
  const [selectedAgentList, setSelectedAgentList] = useState<AgentConfigInfo[]>(
    [],
  );
  // 已选中的应用页面详情列表（通过ID列表查询）
  const [selectedPageList, setSelectedPageList] = useState<CustomPageDto[]>([]);
  // 智能体搜索关键字
  const [agentSearchKw, setAgentSearchKw] = useState<string>('');
  // 网页应用搜索关键字
  const [pageSearchKw, setPageSearchKw] = useState<string>('');
  // 智能体分页状态
  const [agentPage, setAgentPage] = useState<number>(1);
  const [agentHasMore, setAgentHasMore] = useState<boolean>(false);
  // 网页应用分页状态
  const [pagePage, setPagePage] = useState<number>(1);
  const [pageHasMore, setPageHasMore] = useState<boolean>(false);
  // 滚动容器引用
  const agentListScrollRef = useRef<HTMLDivElement>(null);
  const pageListScrollRef = useRef<HTMLDivElement>(null);
  // 存储查询到的数据权限中的 modelIds，用于处理异步加载问题
  const [fetchedModelIds, setFetchedModelIds] = useState<number[] | null>(null);

  // 模型列表
  const {
    data: modelList,
    loading: modelLoading,
    run: runModelList,
  } = useRequest(apiSystemModelList, {
    manual: true,
  });

  // 根据类型选择查询接口
  const getDataPermissionApi =
    type === 'role'
      ? apiGetRoleBoundDataPermissionList
      : apiGetGroupBoundDataPermissionList;

  // 查询数据权限（用于编辑回显）
  const { run: runGetDataPermission } = useRequest(getDataPermissionApi, {
    manual: true,
    onSuccess: (result: DataPermission) => {
      if (!result) return;

      // 回显表单数据
      form.setFieldsValue({
        tokenLimit: {
          limitPerDay: result.tokenLimit?.limitPerDay ?? -1,
        },
        maxSpaceCount: result.maxSpaceCount ?? -1,
        maxAgentCount: result.maxAgentCount ?? -1,
        maxPageAppCount: result.maxPageAppCount ?? -1,
        maxKnowledgeCount: result.maxKnowledgeCount ?? -1,
        knowledgeStorageLimitGb: result.knowledgeStorageLimitGb ?? -1,
        maxDataTableCount: result.maxDataTableCount ?? -1,
        maxScheduledTaskCount: result.maxScheduledTaskCount ?? -1,
        agentComputerMemoryGb: result.agentComputerMemoryGb ?? 4,
        agentComputerCpuCores: result.agentComputerCpuCores ?? 2,
        agentFileStorageDays: result.agentFileStorageDays ?? -1,
        agentDailyConversationLimit: result.agentDailyConversationLimit ?? -1,
        pageDailyConversationLimit: result.pageDailyConversationLimit ?? -1,
      });

      // 存储查询到的 modelIds，用于后续处理
      if (result.modelIds && result.modelIds.length > 0) {
        setFetchedModelIds(result.modelIds);
        // 如果返回的不是 [-1]，直接设置选中状态
        if (!(result.modelIds.length === 1 && result.modelIds[0] === -1)) {
          setSelectedModelIds(result.modelIds);
        }
      } else {
        setFetchedModelIds(null);
      }

      // 回显智能体选择
      if (result.agentIds && result.agentIds.length > 0) {
        setSelectedAgentIds(result.agentIds);
      }

      // 回显应用页面选择
      if (result.pageAgentIds && result.pageAgentIds.length > 0) {
        setSelectedPageAgentIds(result.pageAgentIds);
      }
    },
  });

  // 根据ID列表查询智能体详情（已选中的智能体）
  const { run: runGetAgentListByIds } = useRequest(
    apiSystemResourceAgentListByIds,
    {
      manual: true,
      onSuccess: (result: AgentConfigInfo[]) => {
        setSelectedAgentList(result || []);
      },
    },
  );

  // 根据ID列表查询网页应用详情（已选中的网页应用）
  const { run: runGetPageListByIds } = useRequest(
    apiSystemResourcePageListByIds,
    {
      manual: true,
      onSuccess: (result: CustomPageDto[]) => {
        setSelectedPageList(result || []);
      },
    },
  );

  // 广场-已发布智能体列表接口（智能体列表）
  const { loading: agentLoading, run: runAgentList } = useRequest(
    apiPublishedAgentList,
    {
      manual: true,
      onSuccess: (
        result: Page<SquarePublishedItemInfo>,
        params?: SquarePublishedListParams[],
      ) => {
        const records = result.records || [];
        const currentPage = params?.[0]?.page || 1;
        const totalPages = result.pages || 0;

        // 判断是否还有更多数据
        setAgentHasMore(currentPage < totalPages);

        // 如果是第一页（搜索或首次加载），直接替换列表
        if (currentPage === 1) {
          setAgentList(records);
        } else {
          // 加载更多时，合并新数据
          setAgentList((prev) => {
            // 合并新数据和已有数据，去重
            const existingIds = new Set(prev.map((item) => item.targetId));
            const newItems = records.filter(
              (item) => !existingIds.has(item.targetId),
            );
            return [...prev, ...newItems];
          });
        }
      },
    },
  );

  // 广场-已发布应用页面列表接口
  const { loading: pageLoading, run: runAgentPageList } = useRequest(
    apiPublishedAgentList,
    {
      manual: true,
      onSuccess: (
        result: Page<SquarePublishedItemInfo>,
        params?: SquarePublishedListParams[],
      ) => {
        const records = result.records || [];
        const currentPage = params?.[0]?.page || 1;
        const totalPages = result.pages || 0;

        // 判断是否还有更多数据
        setPageHasMore(currentPage < totalPages);

        // 如果是第一页（搜索或首次加载），直接替换列表
        if (currentPage === 1) {
          setPageList(records);
        } else {
          // 加载更多时，合并新数据
          setPageList((prev) => {
            // 合并新数据和已有数据，去重
            const existingIds = new Set(prev.map((item) => item.targetId));
            const newItems = records.filter(
              (item) => !existingIds.has(item.targetId),
            );
            return [...prev, ...newItems];
          });
        }
      },
    },
  );

  // 当弹窗打开时，加载数据
  useEffect(() => {
    if (open) {
      // 加载模型列表
      runModelList();

      // 如果是编辑模式，查询数据权限用于回显
      if (targetId) {
        runGetDataPermission(targetId);
      }
    } else {
      // 重置表单
      form.resetFields();
      form.setFieldsValue({
        tokenLimit: {
          limitPerDay: -1,
        },
        maxSpaceCount: -1,
        maxAgentCount: -1,
        maxPageAppCount: -1,
        maxKnowledgeCount: -1,
        knowledgeStorageLimitGb: -1,
        maxDataTableCount: -1,
        maxScheduledTaskCount: -1,
        agentComputerMemoryGb: 4,
        agentComputerCpuCores: 2,
        agentFileStorageDays: -1,
        agentDailyConversationLimit: -1,
        pageDailyConversationLimit: -1,
      });
      // 重置已选中的数据
      setSelectedModelIds([]);
      setSelectedAgentIds([]);
      setSelectedPageAgentIds([]);
      setFetchedModelIds(null);
      setAgentList([]);
      setPageList([]);
      setActiveTab('model');
      setSelectedAgentList([]);
      setSelectedPageList([]);
      setAgentSearchKw('');
      setPageSearchKw('');
      setAgentPage(1);
      setPagePage(1);
      setAgentHasMore(false);
      setPageHasMore(false);
    }
  }, [open, targetId]);

  // 当 modelList 加载完成且需要回显所有模型时，设置选中状态
  useEffect(() => {
    if (
      modelList &&
      modelList.length > 0 &&
      fetchedModelIds &&
      fetchedModelIds.length === 1 &&
      fetchedModelIds[0] === -1
    ) {
      // 如果查询到的 modelIds 是 [-1]，代表选择的是所有模型
      // 将 modelList 中所有项的 id 都添加到 selectedModelIds
      const allModelIds = modelList.map((model: ModelConfigDto) => model.id);
      setSelectedModelIds(allModelIds);
    }
  }, [modelList, fetchedModelIds]);

  // 模型行选择配置
  const modelRowSelection: TableRowSelection<ModelConfigDto> = {
    selectedRowKeys: selectedModelIds,
    onChange: (keys) => {
      setSelectedModelIds(keys as number[]);
    },
  };

  // 智能体行选择配置（使用 targetId 作为选中 ID）
  const toggleAgentSelected = (targetId: number) => {
    // 添加到右侧列表并更新详情（不从左侧列表移除）
    setSelectedAgentIds((prev) => {
      if (prev.includes(targetId)) {
        return prev;
      }
      const newIds = [...prev, targetId];
      if (newIds.length > 0) {
        runGetAgentListByIds({
          agentIds: newIds,
        });
      }
      return newIds;
    });
  };

  // 从右侧删除智能体，添加回左侧
  const removeAgentFromSelected = (agentId: number) => {
    // 从右侧ID列表移除
    setSelectedAgentIds((prev) => prev.filter((id) => id !== agentId));

    // 从右侧列表移除
    setSelectedAgentList((prev) => prev.filter((item) => item.id !== agentId));

    // 重新搜索以获取该项并添加回左侧列表
    runAgentList({
      page: 1,
      pageSize: 1000,
      targetType: AgentComponentTypeEnum.Agent,
      targetSubType: 'ChatBot',
      kw: agentSearchKw,
    });
  };

  // 应用页面行选择配置（使用 targetId 作为选中 ID）
  const togglePageSelected = (targetId: number) => {
    // 添加到右侧列表并更新详情（不从左侧列表移除）
    setSelectedPageAgentIds((prev) => {
      if (prev.includes(targetId)) {
        return prev;
      }
      const newIds = [...prev, targetId];
      if (newIds.length > 0) {
        runGetPageListByIds({
          agentIds: newIds,
        });
      }
      return newIds;
    });
  };

  // 从右侧删除网页应用
  const removePageFromSelected = (agentId: number) => {
    // 从右侧ID列表移除
    setSelectedPageAgentIds((prev) => prev.filter((id) => id !== agentId));

    // 从右侧列表移除
    setSelectedPageList((prev) =>
      prev.filter((item) => item.devAgentId !== agentId),
    );
    // 注意：不再需要重新搜索，因为左侧列表已经保留了该项
  };

  // 根据类型选择接口
  const apiUrl =
    type === 'role' ? apiRoleBindDataPermission : apiGroupBindDataPermission;

  // 保存数据权限
  const { run: runBindDataPermission, loading: bindLoading } = useRequest(
    apiUrl,
    {
      manual: true,
      onSuccess: () => {
        message.success('数据权限保存成功');
        onCancel();
      },
    },
  );

  const handleOk = async () => {
    if (!targetId) {
      message.error('ID缺失，无法保存数据权限');
      return;
    }

    const formValues: DataPermission = (await form.validateFields()) || {};

    // 处理模型ID：全部模型传[-1],未选中任何模型不传值
    let modelIds: number[] | undefined;
    if (selectedModelIds.length > 0) {
      // 检查是否选中了全部模型
      const isAllSelected =
        modelList?.length > 0 && selectedModelIds.length === modelList.length;
      modelIds = isAllSelected ? [-1] : selectedModelIds;
    } else {
      modelIds = [0]; // 0表示不选择任何模型(后端约定)
    }

    const idKey = type === 'role' ? 'roleId' : 'groupId';
    const params = {
      [idKey]: targetId,
      dataPermission: {
        ...formValues,
        tokenLimit: {
          limitPerDay: formValues?.tokenLimit?.limitPerDay || -1,
        },
        modelIds,
        agentIds: selectedAgentIds,
        pageAgentIds: selectedPageAgentIds,
      },
    };

    runBindDataPermission(params);
  };

  // 处理 Tab 切换
  const handleTabChange = (key: string) => {
    const tabKey = key as TabKey;
    setActiveTab(tabKey);

    // 只针对智能体和网页应用 tab 做额外处理
    if (tabKey === 'agent') {
      // 右侧：根据选中的ID列表查询已选择的智能体
      if (selectedAgentIds.length > 0) {
        runGetAgentListByIds({
          agentIds: selectedAgentIds,
        });
      } else {
        setSelectedAgentList([]);
      }
      // 首次切换到智能体 tab 时，加载第一页数据
      if (agentList.length === 0 && !agentLoading) {
        setAgentPage(1);
        runAgentList({
          page: 1,
          pageSize: 20,
          targetType: AgentComponentTypeEnum.Agent,
          targetSubType: 'ChatBot',
          kw: agentSearchKw || undefined,
        });
      }
    } else if (tabKey === 'page') {
      // 右侧：根据选中的ID列表查询已选择的网页应用
      if (selectedPageAgentIds.length > 0) {
        runGetPageListByIds({
          agentIds: selectedPageAgentIds,
        });
      } else {
        setSelectedPageList([]);
      }
      // 首次切换到网页应用 tab 时，加载第一页数据
      if (pageList.length === 0 && !pageLoading) {
        setPagePage(1);
        runAgentPageList({
          page: 1,
          pageSize: 20,
          targetType: AgentComponentTypeEnum.Agent,
          targetSubType: 'PageApp',
          kw: pageSearchKw || undefined,
          category: '',
        });
      }
    }
  };

  // 渲染 Tab 内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'model':
        return (
          <Table<ModelConfigDto>
            className={cx(styles.modelTable)}
            columns={modelColumns}
            dataSource={modelList || []}
            loading={modelLoading}
            rowKey="id"
            rowSelection={modelRowSelection}
            pagination={false}
            scroll={{ y: 400 }}
          />
        );
      case 'agent':
        return (
          <div className={cx('flex', 'h-full')}>
            {/* 左侧：搜索 + 可选智能体列表（支持滚动加载） */}
            <div
              className={cx(
                'flex',
                'flex-col',
                'h-full',
                'flex-1',
                'overflow-hide',
              )}
            >
              <Input.Search
                key="agentSearch"
                placeholder="搜索智能体"
                allowClear
                className={cx(styles.searchInput)}
                value={agentSearchKw}
                onChange={(e) => {
                  setAgentSearchKw(e.target.value);
                }}
                onSearch={(value) => {
                  setAgentSearchKw(value);
                  setAgentPage(1);
                  // 平滑滚动到顶部
                  if (agentListScrollRef.current) {
                    agentListScrollRef.current.scrollTo({
                      top: 0,
                      behavior: 'smooth',
                    });
                  }
                  runAgentList({
                    page: 1,
                    pageSize: 20,
                    targetType: AgentComponentTypeEnum.Agent,
                    targetSubType: 'ChatBot',
                    kw: value,
                  });
                }}
              />
              <div
                ref={agentListScrollRef}
                id="agent-list-scroll"
                className={cx('flex-1', 'overflow-y')}
                style={{ height: '100%', overflowY: 'auto' }}
              >
                {agentLoading && !agentList?.length ? (
                  <div
                    className={cx(
                      'h-full',
                      'flex',
                      'items-center',
                      'content-center',
                    )}
                  >
                    <Loading />
                  </div>
                ) : (
                  <InfiniteScrollDiv
                    scrollableTarget="agent-list-scroll"
                    list={agentList}
                    hasMore={agentHasMore}
                    onScroll={() => {
                      if (!agentLoading && agentHasMore) {
                        const nextPage = agentPage + 1;
                        setAgentPage(nextPage);
                        runAgentList({
                          page: nextPage,
                          pageSize: 20,
                          targetType: AgentComponentTypeEnum.Agent,
                          targetSubType: 'ChatBot',
                          kw: agentSearchKw || undefined,
                        });
                      }
                    }}
                  >
                    {agentList?.map((item) => (
                      <ResourceItem
                        key={item.targetId}
                        icon={item.icon}
                        name={item.name}
                        description={item.description}
                        targetId={item.targetId}
                        onAdd={toggleAgentSelected}
                        isAdded={selectedAgentIds.includes(item.targetId)}
                      />
                    ))}
                  </InfiniteScrollDiv>
                )}
              </div>
            </div>
            {/* 分割线 */}
            <div className={cx(styles.rightSeparator)} />
            {/* 右侧：已选择的智能体列表（通过ID列表查询） */}
            <div className={cx(styles.rightList, 'flex-1')}>
              {selectedAgentList.length ? (
                selectedAgentList.map((item) => (
                  <ResourceItem
                    key={item.id}
                    icon={item.icon}
                    name={item.name}
                    description={item.description}
                    targetId={item.id}
                    onDelete={removeAgentFromSelected}
                  />
                ))
              ) : (
                <div className={cx(styles.empty)}>暂无已选智能体</div>
              )}
            </div>
          </div>
        );
      case 'page':
        return (
          <div className={cx('flex', 'h-full')}>
            {/* 左侧：搜索 + 可选网页应用列表（支持滚动加载） */}
            <div
              className={cx(
                'flex',
                'flex-col',
                'h-full',
                'flex-1',
                'overflow-hide',
              )}
            >
              <Input.Search
                key="pageSearch"
                placeholder="搜索网页应用"
                allowClear
                className={cx(styles.searchInput)}
                value={pageSearchKw}
                onChange={(e) => {
                  setPageSearchKw(e.target.value);
                }}
                onSearch={(value) => {
                  setPageSearchKw(value);
                  setPagePage(1);
                  // 平滑滚动到顶部
                  if (pageListScrollRef.current) {
                    pageListScrollRef.current.scrollTo({
                      top: 0,
                      behavior: 'smooth',
                    });
                  }
                  runAgentPageList({
                    page: 1,
                    pageSize: 20,
                    targetType: AgentComponentTypeEnum.Agent,
                    targetSubType: 'PageApp',
                    kw: value || undefined,
                    category: '',
                  });
                }}
              />
              <div
                ref={pageListScrollRef}
                id="page-list-scroll"
                className={cx('flex-1', 'overflow-y')}
                style={{ height: '100%', overflowY: 'auto' }}
              >
                {pageLoading && !pageList?.length ? (
                  <div
                    className={cx(
                      'h-full',
                      'flex',
                      'items-center',
                      'content-center',
                    )}
                  >
                    <Loading />
                  </div>
                ) : (
                  <InfiniteScrollDiv
                    scrollableTarget="page-list-scroll"
                    list={pageList}
                    hasMore={pageHasMore}
                    onScroll={() => {
                      if (!pageLoading && pageHasMore) {
                        const nextPage = pagePage + 1;
                        setPagePage(nextPage);
                        runAgentPageList({
                          page: nextPage,
                          pageSize: 20,
                          targetType: AgentComponentTypeEnum.Agent,
                          targetSubType: 'PageApp',
                          kw: pageSearchKw || undefined,
                          category: '',
                        });
                      }
                    }}
                  >
                    {pageList?.map((item) => (
                      <ResourceItem
                        key={item.targetId}
                        icon={item.coverImg || item.icon}
                        name={item.name}
                        description={item.description}
                        targetId={item.targetId}
                        onAdd={togglePageSelected}
                        isAdded={selectedPageAgentIds.includes(item.targetId)}
                      />
                    ))}
                  </InfiniteScrollDiv>
                )}
              </div>
            </div>
            <div className={cx(styles.rightSeparator)} />
            {/* 右侧：已选择的网页应用列表（通过ID列表查询） */}
            <div
              className={cx(styles.rightList, 'flex-1', 'overflow-y', 'h-full')}
            >
              {selectedPageList.length ? (
                selectedPageList.map((item) => (
                  <ResourceItem
                    key={item.devAgentId}
                    icon={item.coverImg || item.icon}
                    name={item.name}
                    description={item.description}
                    targetId={item.devAgentId}
                    onDelete={removePageFromSelected}
                  />
                ))
              ) : (
                <div className={cx(styles.empty)}>暂无已选网页应用</div>
              )}
            </div>
          </div>
        );
      case 'dataPermission':
        return (
          <div className={cx(styles.dataPermissionFormWrapper)}>
            <Form
              form={form}
              layout="vertical"
              className={cx(styles.dataPermissionForm)}
            >
              <Row gutter={[16, 0]}>
                <Col span={12}>
                  <Form.Item
                    label="每日token限制"
                    name={['tokenLimit', 'limitPerDay']}
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: '每日 token 限制，-1 表示不限制',
                    }}
                  >
                    <InputNumber
                      placeholder="请输入每日token限制数量"
                      className={cx('w-full')}
                      min={-1}
                      max={1000000000000000}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="可创建工作空间数量"
                    name="maxSpaceCount"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: '可创建工作空间数量，-1 表示不限制',
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="可创建智能体数量"
                    name="maxAgentCount"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: '可创建智能体数量，-1 表示不限制',
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="可创建网页应用数量"
                    name="maxPageAppCount"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: '可创建网页应用数量，-1 表示不限制',
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="可创建知识库数量"
                    name="maxKnowledgeCount"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: '可创建知识库数量，-1 表示不限制',
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="知识库存储空间上限 (GB)"
                    name="knowledgeStorageLimitGb"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title:
                        '-1表示不限制, 0表示无权限, 精度为0.001GB, 1GB=1024MB, 1MB=1024KB',
                    }}
                  >
                    <InputNumber
                      className={cx('w-full')}
                      min={-1}
                      step={0.001}
                      precision={3}
                      formatter={(value) => {
                        if (value === undefined || value === null) return '';
                        const num = Number(value);
                        // 如果是整数，不显示小数部分
                        if (Number.isInteger(num)) {
                          return String(num);
                        }
                        // 如果有小数，保留最多3位小数，并去除末尾的0
                        return num.toFixed(3).replace(/\.?0+$/, '');
                      }}
                      parser={(value) => {
                        if (!value) return value as any;
                        const num = parseFloat(value);
                        return isNaN(num) ? (value as any) : num;
                      }}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="可创建数据表数量"
                    name="maxDataTableCount"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: '可创建数据表数量，-1 表示不限制',
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="可创建定时任务数量"
                    name="maxScheduledTaskCount"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: '可创建定时任务数量，-1 表示不限制',
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="智能体电脑内存(GB)"
                    name="agentComputerMemoryGb"
                    initialValue={4}
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: '智能体电脑内存 (GB，留空表示使用默认值4GB)',
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={0} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="智能体电脑 CPU 核心数"
                    name="agentComputerCpuCores"
                    initialValue={2}
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: '智能体电脑 CPU 核心数（留空表示使用默认值）',
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={0} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="通用智能体每天对话次数限制"
                    name="agentDailyConversationLimit"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: '通用智能体每天对话次数，-1表示不限制',
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label="网页应用每天对话次数"
                    name="pageDailyConversationLimit"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: '网页应用每天对话次数，-1表示不限制',
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title={`数据权限设置 - ${name}`}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定"
      cancelText="取消"
      confirmLoading={bindLoading}
      width={700}
    >
      <div className={cx(styles.tabsContentWrapper)}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
        />
        <div className={cx(styles.tabContent)}>{renderTabContent()}</div>
      </div>
    </Modal>
  );
};

export default DataPermissionModal;
