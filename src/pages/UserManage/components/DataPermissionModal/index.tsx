import { apiSystemModelList } from '@/services/systemManage';
import { AgentConfigInfo } from '@/types/interfaces/agent';
import { CustomPageDto } from '@/types/interfaces/pageDev';
import type { ModelConfigDto } from '@/types/interfaces/systemManage';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Col, Empty, Form, InputNumber, Modal, Row, Table, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiSystemResourceAgentListByIds,
  apiSystemResourcePageListByIds,
  apiSystemUserDataPermission,
  UserDataPermission,
} from '../../user-manage';
import ResourceList from './components/ResourceList';
import styles from './index.less';

const cx = classNames.bind(styles);

interface DataPermissionModalProps {
  /** 是否打开 */
  open: boolean;
  /** 用户ID */
  userId: number;
  /** 用户名称 */
  userName?: string;
  /** 取消回调 */
  onCancel: () => void;
}

type TabKey = 'model' | 'agent' | 'page' | 'dataPermission';

/**
 * 用户数据权限查看弹窗组件
 * 用于查看用户的数据权限，包括模型、智能体、应用页面和数据权限
 */
const DataPermissionModal: React.FC<DataPermissionModalProps> = ({
  open,
  userId,
  userName,
  onCancel,
}) => {
  const [form] = Form.useForm();
  // 当前激活的tab
  const [activeTab, setActiveTab] = useState<TabKey>('model');
  // 智能体列表
  const [agentList, setAgentList] = useState<AgentConfigInfo[]>([]);
  // 应用页面列表
  const [pageList, setPageList] = useState<CustomPageDto[]>([]);
  // 选中的智能体ID列表
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  // 选中的应用页面ID列表
  const [selectedPageIds, setSelectedPageIds] = useState<number[]>([]);
  // 存储查询到的数据权限中的 modelIds，用于处理异步加载问题
  const [fetchedModelIds, setFetchedModelIds] = useState<number[] | null>(null);

  const [filteredModelList, setFilteredModelList] = useState<ModelConfigDto[]>(
    [],
  );

  // 模型列表
  const {
    data: modelList,
    loading: modelLoading,
    run: runModelList,
  } = useRequest(apiSystemModelList, {
    manual: true,
  });

  // 查询用户数据权限
  const { run: runGetDataPermission, loading: dataPermissionLoading } =
    useRequest(apiSystemUserDataPermission, {
      manual: true,
      onSuccess: (result: UserDataPermission) => {
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
          agentDailyConversationLimit: result.agentDailyConversationLimit ?? -1,
          pageDailyConversationLimit: result.pageDailyConversationLimit ?? -1,
        });

        setFetchedModelIds(result.modelIds || null);
        setSelectedAgentIds(result.agentIds || []);
        setSelectedPageIds(result.pageIds || []);
      },
    });

  // 根据ID列表查询智能体
  const { loading: agentLoading, run: runGetAgentList } = useRequest(
    apiSystemResourceAgentListByIds,
    {
      manual: true,
      onSuccess: (result: AgentConfigInfo[]) => {
        setAgentList(result || []);
      },
    },
  );

  // 根据ID列表查询应用页面列表
  const { loading: pageLoading, run: runGetPageList } = useRequest(
    apiSystemResourcePageListByIds,
    {
      manual: true,
      onSuccess: (result: CustomPageDto[]) => {
        setPageList(result || []);
      },
    },
  );

  // 当弹窗打开时，加载数据
  useEffect(() => {
    if (open && userId) {
      // 先查询用户数据权限
      runGetDataPermission(userId);
      // 加载模型列表（因为模型 tab 是默认显示的）
      runModelList();
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
        agentDailyConversationLimit: -1,
        pageDailyConversationLimit: -1,
      });
      // 重置已选中的数据
      setFilteredModelList([]);
      setSelectedAgentIds([]);
      setSelectedPageIds([]);
      setFetchedModelIds(null);
      setAgentList([]);
      setPageList([]);
      setActiveTab('model');
    }
  }, [open, userId]);

  // 当 modelList 加载完成且需要回显所有模型时，设置选中状态
  useEffect(() => {
    if (
      modelList &&
      modelList.length > 0 &&
      fetchedModelIds &&
      fetchedModelIds.length > 0
    ) {
      // 如果查询到的 modelIds 是 [-1]，代表选择的是所有模型
      if (fetchedModelIds.length === 1 && fetchedModelIds[0] === -1) {
        setFilteredModelList(modelList);
      } else {
        const _list = modelList.filter((model: ModelConfigDto) =>
          fetchedModelIds?.includes(model.id),
        );
        setFilteredModelList(_list || []);
      }
    }
  }, [modelList, fetchedModelIds]);

  // 处理 tab 切换
  const handleTabChange = (key: string) => {
    const tabKey = key as TabKey;
    setActiveTab(tabKey);

    // 只针对智能体和应用页面 tab 加载数据
    if (tabKey === 'agent') {
      if (selectedAgentIds.length > 0) {
        // 切换到智能体 tab 时，根据权限 ID 列表查询智能体数据
        runGetAgentList(selectedAgentIds);
      } else {
        // 如果没有权限，清空列表
        setAgentList([]);
      }
    } else if (tabKey === 'page') {
      if (selectedPageIds.length > 0) {
        // 切换到应用页面 tab 时，根据权限 ID 列表查询应用页面数据
        runGetPageList(selectedPageIds);
      } else {
        // 如果没有权限，清空列表
        setPageList([]);
      }
    }
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

  // 智能体列表（直接使用查询结果，因为接口已经根据 ID 列表过滤）
  const filteredAgentList = agentList;

  // 应用页面列表（直接使用查询结果，因为接口已经根据 ID 列表过滤）
  const filteredPageList = pageList;

  // 检查是否有数据
  const hasModelData = filteredModelList.length > 0;
  const hasAgentData = filteredAgentList.length > 0;
  const hasPageData = filteredPageList.length > 0;

  // Tab 配置
  const tabItems = [
    {
      key: 'model',
      label: '模型',
      children: hasModelData ? (
        <Table<ModelConfigDto>
          columns={modelColumns}
          dataSource={filteredModelList}
          loading={modelLoading || dataPermissionLoading}
          rowKey="id"
          pagination={false}
          scroll={{ y: 400 }}
        />
      ) : (
        <div
          className={cx(
            'flex',
            'items-center',
            'content-center',
            styles.dataPermissionFormWrapper,
          )}
        >
          <Empty description="暂无权限" />
        </div>
      ),
    },
    {
      key: 'agent',
      label: '智能体',
      children: agentLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
      ) : hasAgentData ? (
        <div className={cx(styles.scrollContainer)}>
          <ResourceList list={filteredAgentList} />
        </div>
      ) : (
        <div
          className={cx(
            'flex',
            'items-center',
            'content-center',
            styles.dataPermissionFormWrapper,
          )}
        >
          <Empty description="暂无权限" />
        </div>
      ),
    },
    {
      key: 'page',
      label: '网页应用',
      children: pageLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>
      ) : hasPageData ? (
        <div className={cx(styles.scrollContainer)}>
          <ResourceList list={filteredPageList} />
        </div>
      ) : (
        <div
          className={cx(
            'flex',
            'items-center',
            'content-center',
            styles.dataPermissionFormWrapper,
          )}
        >
          <Empty description="暂无权限" />
        </div>
      ),
    },
    {
      key: 'dataPermission',
      label: '数据',
      children: (
        <div className={cx(styles.dataPermissionFormWrapper)}>
          <Form
            form={form}
            layout="vertical"
            className={cx(styles.dataPermissionForm)}
            disabled={true}
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
      ),
    },
  ];

  return (
    <Modal
      title={`数据权限 - ${userName || ''}`}
      open={open}
      onCancel={onCancel}
      width={700}
      footer={null}
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
    </Modal>
  );
};

export default DataPermissionModal;
