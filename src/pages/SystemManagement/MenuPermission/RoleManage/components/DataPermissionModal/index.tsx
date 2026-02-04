import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import { apiRoleBindDataPermission } from '@/pages/SystemManagement/MenuPermission/services/role-manage';
import { apiPublishedAgentList } from '@/services/square';
import { apiSystemModelList } from '@/services/systemManage';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { Page } from '@/types/interfaces/request';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import type { ModelConfigDto } from '@/types/interfaces/systemManage';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
  Col,
  Form,
  InputNumber,
  Modal,
  Row,
  Switch,
  Table,
  Tabs,
  message,
} from 'antd';
import type { TableRowSelection } from 'antd/es/table/interface';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import ResourceList from './components/ResourceList';
import styles from './index.less';

const cx = classNames.bind(styles);

interface DataPermissionModalProps {
  /** 是否打开 */
  open: boolean;
  /** 角色ID */
  roleId?: number;
  /** 角色名称 */
  roleName?: string;
  /** 取消回调 */
  onCancel: () => void;
  /** 成功回调 */
  onSuccess?: () => void;
}

type TabKey = 'model' | 'agent' | 'page' | 'dataPermission';

/**
 * 数据权限设置弹窗组件
 * 用于配置角色的数据权限，包括模型、智能体、应用页面和数据权限
 */
const DataPermissionModal: React.FC<DataPermissionModalProps> = ({
  open,
  roleId,
  roleName,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState<TabKey>('model');
  const [agentList, setAgentList] = useState<SquarePublishedItemInfo[]>([]);
  const [pageList, setPageList] = useState<SquarePublishedItemInfo[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<number[]>([]);
  const [agentPage, setAgentPage] = useState<number>(1);
  const [agentHasMore, setAgentHasMore] = useState<boolean>(true);
  const [pagePage, setPagePage] = useState<number>(1);
  const [pageHasMore, setPageHasMore] = useState<boolean>(true);

  // 模型列表
  const {
    data: modelList,
    loading: modelLoading,
    run: runModelList,
  } = useRequest(apiSystemModelList, {
    manual: true,
  });

  // 广场-已发布智能体列表接口 （智能体列表、应用页面列表）
  const { loading: agentLoading, run: runAgentList } = useRequest(
    apiPublishedAgentList,
    {
      manual: true,
      onSuccess: (result: Page<SquarePublishedItemInfo>, params?: [any]) => {
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

  const { loading: pageLoading, run: runAgentPageList } = useRequest(
    apiPublishedAgentList,
    {
      manual: true,
      onSuccess: (result: Page<SquarePublishedItemInfo>, params?: [any]) => {
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
      // 重置表单
      form.resetFields();
      // 重置已选中的数据
      setSelectedModelIds([]);
      setSelectedAgentIds([]);
      setSelectedPageIds([]);
      setAgentPage(1);
      setPagePage(1);
      setAgentHasMore(true);
      setPageHasMore(true);
      setAgentList([]);
      setPageList([]);

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
    }
  }, [open, runModelList, runAgentList, runAgentPageList, form]);

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

  // 保存数据权限
  const { run: runBindDataPermission, loading: bindLoading } = useRequest(
    apiRoleBindDataPermission,
    {
      manual: true,
      onSuccess: () => {
        message.success('数据权限保存成功');
        onSuccess?.();
      },
      onError: () => {
        message.error('数据权限保存失败，请稍后重试');
      },
    },
  );

  const handleOk = async () => {
    if (!roleId) {
      message.error('角色ID缺失，无法保存数据权限');
      return;
    }

    let formValues: any = {};
    try {
      formValues = await form.validateFields();
    } catch {
      return;
    }

    // 是否允许API外部调用，1-允许，0-不允许
    const allowApiExternalCall =
      typeof formValues.allowApiExternalCall === 'boolean'
        ? formValues.allowApiExternalCall
          ? 1
          : 0
        : formValues.allowApiExternalCall;

    runBindDataPermission({
      roleId,
      dataPermission: {
        ...formValues,
        modelIds: selectedModelIds,
        agentIds: selectedAgentIds,
        pageIds: selectedPageIds,
        allowApiExternalCall,
      },
    });
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
                  <InputNumber style={{ width: '100%' }} min={-1} />
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
                  <InputNumber style={{ width: '100%' }} min={-1} />
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
                  <InputNumber style={{ width: '100%' }} min={-1} />
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
                  <InputNumber style={{ width: '100%' }} min={-1} />
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
                  <InputNumber style={{ width: '100%' }} min={-1} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="知识库存储空间上限 (GB)"
                  name="knowledgeStorageLimitGb"
                  tooltip={{
                    icon: <InfoCircleOutlined />,
                    title: '知识库存储空间上限 (GB，-1 表示不限制)',
                  }}
                >
                  <InputNumber style={{ width: '100%' }} min={-1} />
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
                  <InputNumber style={{ width: '100%' }} min={-1} />
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
                  <InputNumber style={{ width: '100%' }} min={-1} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="是否允许 API 外部调用"
                  name="allowApiExternalCall"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="允许" unCheckedChildren="不允许" />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="智能体电脑内存 (GB)"
                  name="agentComputerMemoryGb"
                  initialValue={4}
                  tooltip={{
                    icon: <InfoCircleOutlined />,
                    title: '智能体电脑内存 (GB，留空表示默认)',
                  }}
                >
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="智能体电脑 CPU 核心数"
                  name="agentComputerCpuCores"
                  initialValue={2}
                  tooltip={{
                    icon: <InfoCircleOutlined />,
                    title: '智能体电脑 CPU 核心数（留空表示默认）',
                  }}
                >
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="执行结果文件存储天数"
                  name="agentFileStorageDays"
                  tooltip={{
                    icon: <InfoCircleOutlined />,
                    title: '执行结果文件存储天数（-1 表示不限制）',
                  }}
                >
                  <InputNumber style={{ width: '100%' }} min={-1} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  label="每天对话次数限制"
                  name="agentDailyConversationLimit"
                  tooltip={{
                    icon: <InfoCircleOutlined />,
                    title: '每天对话次数限制（-1 表示不限制）',
                  }}
                >
                  <InputNumber style={{ width: '100%' }} min={-1} />
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
      title={`数据权限设置 - ${roleName || ''}`}
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
