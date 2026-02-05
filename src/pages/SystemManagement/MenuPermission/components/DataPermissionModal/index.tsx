import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import {
  apiGetRoleBoundDataPermissionList,
  apiRoleBindDataPermission,
} from '@/pages/SystemManagement/MenuPermission/services/role-manage';
import { apiPublishedAgentList } from '@/services/square';
import { apiSystemModelList } from '@/services/systemManage';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { Page } from '@/types/interfaces/request';
import type {
  SquarePublishedItemInfo,
  SquarePublishedListParams,
} from '@/types/interfaces/square';
import type { ModelConfigDto } from '@/types/interfaces/systemManage';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Col, Form, InputNumber, Modal, Row, Table, Tabs, message } from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiGetGroupBoundDataPermissionList,
  apiGroupBindDataPermission,
} from '../../services/user-group-manage';
import { DataPermission } from '../../types/role-manage';
import ResourceList from './components/ResourceList';
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
  // 选中的应用页面ID列表
  const [selectedPageIds, setSelectedPageIds] = useState<number[]>([]);
  // 智能体分页
  const [agentPage, setAgentPage] = useState<number>(1);
  // 智能体是否还有更多
  const [agentHasMore, setAgentHasMore] = useState<boolean>(true);
  // 应用页面分页
  const [pagePage, setPagePage] = useState<number>(1);
  // 应用页面是否还有更多
  const [pageHasMore, setPageHasMore] = useState<boolean>(true);
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
  const { run: runGetDataPermission, loading: getDataPermissionLoading } =
    useRequest(getDataPermissionApi, {
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
          agentComputerSwapGb: result.agentComputerSwapGb ?? 8,
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
        if (result.pageIds && result.pageIds.length > 0) {
          setSelectedPageIds(result.pageIds);
        }
      },
    });

  console.log('getDataPermissionLoading', getDataPermissionLoading);

  // 广场-已发布智能体列表接口（智能体列表）
  const { loading: agentLoading, run: runAgentList } = useRequest(
    apiPublishedAgentList,
    {
      manual: true,
      onSuccess: (
        result: Page<SquarePublishedItemInfo>,
        params?: SquarePublishedListParams[],
      ) => {
        const currentPage = params?.[0]?.page || 1;
        const pageSize = params?.[0]?.pageSize || 30;
        const records = result.records || [];
        setAgentList((prev) =>
          currentPage === 1 ? records : [...prev, ...records],
        );
        setAgentHasMore(records.length >= pageSize);
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
        const currentPage = params?.[0]?.page || 1;
        const pageSize = params?.[0]?.pageSize || 30;
        const records = result.records || [];
        setPageList((prev) =>
          currentPage === 1 ? records : [...prev, ...records],
        );
        setPageHasMore(records.length >= pageSize);
      },
    },
  );

  // 当弹窗打开时，加载数据
  useEffect(() => {
    if (open) {
      // 加载模型列表
      runModelList();

      // 加载智能体列表
      runAgentList({
        page: 1,
        pageSize: 30,
        targetType: AgentComponentTypeEnum.Agent,
        targetSubType: 'ChatBot',
      });

      // 加载应用页面列表
      runAgentPageList({
        page: 1,
        pageSize: 30,
        targetType: AgentComponentTypeEnum.Agent,
        targetSubType: 'PageApp',
      });

      // 如果是编辑模式，查询数据权限用于回显
      if (targetId) {
        runGetDataPermission(targetId);
      }
    } else {
      // 重置表单
      form.resetFields();
      // 重置已选中的数据
      setSelectedModelIds([]);
      setSelectedAgentIds([]);
      setSelectedPageIds([]);
      setFetchedModelIds(null);
      setAgentPage(1);
      setPagePage(1);
      setAgentHasMore(true);
      setPageHasMore(true);
      setAgentList([]);
      setPageList([]);
      setActiveTab('model');
    }
  }, [
    open,
    targetId,
    runModelList,
    runAgentList,
    runAgentPageList,
    runGetDataPermission,
    form,
  ]);

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

  // 智能体滚动加载
  const handleAgentScroll = () => {
    if (agentLoading || !agentHasMore) return;
    const nextPage = agentPage + 1;
    setAgentPage(nextPage);
    runAgentList({
      page: nextPage,
      pageSize: 30,
      targetType: AgentComponentTypeEnum.Agent,
      targetSubType: 'ChatBot',
    });
  };

  // 应用页面滚动加载
  const handlePageScroll = () => {
    if (pageLoading || !pageHasMore) return;
    const nextPage = pagePage + 1;
    setPagePage(nextPage);
    runAgentPageList({
      page: nextPage,
      pageSize: 30,
      targetType: AgentComponentTypeEnum.Agent,
      targetSubType: 'PageApp',
    });
  };

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

  // 模型行选择配置
  const modelRowSelection: TableRowSelection<ModelConfigDto> = {
    selectedRowKeys: selectedModelIds,
    onChange: (keys) => {
      setSelectedModelIds(keys as number[]);
    },
  };

  // 智能体行选择配置（使用 targetId 作为选中 ID）
  const toggleAgentSelected = (targetId: number) => {
    setSelectedAgentIds((prev) =>
      prev.includes(targetId)
        ? prev.filter((id) => id !== targetId)
        : [...prev, targetId],
    );
  };

  // 应用页面行选择配置（使用 targetId 作为选中 ID）
  const togglePageSelected = (targetId: number) => {
    setSelectedPageIds((prev) =>
      prev.includes(targetId)
        ? prev.filter((id) => id !== targetId)
        : [...prev, targetId],
    );
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
        pageIds: selectedPageIds,
      },
    };

    runBindDataPermission(params);
  };

  // Tab 配置
  const tabItems = [
    {
      key: 'model',
      label: '模型',
      children: (
        <Table<ModelConfigDto>
          columns={modelColumns}
          dataSource={modelList || []}
          loading={modelLoading}
          rowKey="id"
          rowSelection={modelRowSelection}
          pagination={false}
          scroll={{ y: 400 }}
        />
      ),
    },
    {
      key: 'agent',
      label: '智能体',
      children: (
        <div id="agentScrollDiv" className={cx(styles.scrollContainer)}>
          <InfiniteScrollDiv
            scrollableTarget="agentScrollDiv"
            list={agentList}
            hasMore={agentHasMore}
            onScroll={handleAgentScroll}
            showLoader={!agentLoading}
          >
            <ResourceList
              list={agentList}
              selectedIds={selectedAgentIds}
              onToggle={toggleAgentSelected}
            />
          </InfiniteScrollDiv>
        </div>
      ),
    },
    {
      key: 'page',
      label: '应用页面',
      children: (
        <div id="pageScrollDiv" className={cx(styles.scrollContainer)}>
          <InfiniteScrollDiv
            scrollableTarget="pageScrollDiv"
            list={pageList}
            hasMore={pageHasMore}
            onScroll={handlePageScroll}
            showLoader={!pageLoading}
          >
            <ResourceList
              list={pageList}
              selectedIds={selectedPageIds}
              onToggle={togglePageSelected}
            />
          </InfiniteScrollDiv>
        </div>
      ),
    },
    {
      key: 'dataPermission',
      label: '数据权限',
      children: (
        <div className={cx(styles.dataPermissionFormWrapper)}>
          <Form
            form={form}
            layout="vertical"
            className={cx(styles.dataPermissionForm)}
          >
            <Row gutter={[16, 0]}>
              <Col span={12}>
                <Form.Item
                  label="每日 token 限制"
                  name={['tokenLimit', 'limitPerDay']}
                  tooltip={{
                    icon: <InfoCircleOutlined />,
                    title: '每日 token 限制，-1 表示不限制',
                  }}
                >
                  <InputNumber className={cx('w-full')} min={-1} />
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
                    title: '知识库存储空间上限(GB)，-1表示不限制',
                  }}
                >
                  <InputNumber className={cx('w-full')} min={-1} />
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
                    title: '智能体电脑内存 (GB，留空表示使用默认值4)',
                  }}
                >
                  <InputNumber className={cx('w-full')} min={0} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="智能体电脑交换分区(GB)"
                  name="agentComputerSwapGb"
                  initialValue={8}
                  tooltip={{
                    icon: <InfoCircleOutlined />,
                    title: '智能体电脑交换分区(GB)，null表示使用默认值8',
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
                  label="通用智能体执行结果文件存储天数"
                  name="agentFileStorageDays"
                  tooltip={{
                    icon: <InfoCircleOutlined />,
                    title: '通用智能体执行结果文件存储天数，-1表示不限制',
                  }}
                >
                  <InputNumber className={cx('w-full')} min={-1} />
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
                  label="应用页面每天对话次数"
                  name="pageDailyConversationLimit"
                  tooltip={{
                    icon: <InfoCircleOutlined />,
                    title: '应用页面每天对话次数，-1表示不限制',
                  }}
                >
                  <InputNumber className={cx('w-full')} min={-1} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </div>
      ),
    },
  ];

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
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
        items={tabItems}
      />
    </Modal>
  );
};

export default DataPermissionModal;
