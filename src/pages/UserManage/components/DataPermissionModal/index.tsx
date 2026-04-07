import Loading from '@/components/custom/Loading';
import {
  DataPermissionTabKey,
  getDataPermissionTabItems,
} from '@/pages/SystemManagement/MenuPermission/components/DataPermissionModal';
import type { OpenApiConfigInfo } from '@/pages/SystemManagement/MenuPermission/types/role-manage';
import {
  apiGetOpenApiList,
  OpenApiPermissionTargetTypeEnum,
} from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import { apiSystemModelList } from '@/services/systemManage';
import type { OpenApiDefinition } from '@/types/interfaces/account';
import { AgentConfigInfo } from '@/types/interfaces/agent';
import { CustomPageDto } from '@/types/interfaces/pageDev';
import type {
  KnowledgeInfoById,
  ModelConfigDto,
} from '@/types/interfaces/systemManage';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Col, Empty, Form, InputNumber, Modal, Row, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiSystemResourceAgentListByIds,
  apiSystemResourceKnowledgeListByIds,
  apiSystemResourcePageListByIds,
  apiSystemUserDataPermission,
  UserDataPermission,
} from '../../user-manage';
import ResourceItem from './components/ResourceItem';
import UserOpenApiPermissionPanel from './components/UserOpenApiPermissionPanel';
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
  const [activeTab, setActiveTab] = useState<DataPermissionTabKey>('model');

  // ============================= 模型 =============================
  // 存储查询到的数据权限中的 modelIds，用于处理异步加载问题
  const [fetchedModelIds, setFetchedModelIds] = useState<number[] | null>(null);

  // 已选中的模型列表（通过ID列表过滤）
  const [filteredModelList, setFilteredModelList] = useState<ModelConfigDto[]>(
    [],
  );

  // ============================= 智能体 =============================
  // 智能体列表
  const [agentList, setAgentList] = useState<AgentConfigInfo[]>([]);
  // 选中的智能体ID列表
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);

  // ============================= 应用页面 =============================
  // 应用页面列表
  const [pageList, setPageList] = useState<CustomPageDto[]>([]);
  // 选中的应用页面关联的agentId列表（此处应该是页面的devAgentId字段值列表）
  const [selectedPageAgentIds, setSelectedPageAgentIds] = useState<number[]>(
    [],
  );

  // ============================= 知识库 =============================
  // 知识库列表
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeInfoById[]>([]);
  // 选中的知识库ID列表
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<number[]>(
    [],
  );

  // API 权限：用户数据权限接口返回的勾选与限流配置
  const [userOpenApiConfigs, setUserOpenApiConfigs] = useState<
    OpenApiConfigInfo[]
  >([]);
  const [openApiTreeData, setOpenApiTreeData] = useState<OpenApiDefinition[]>(
    [],
  );
  const [openApiListLoading, setOpenApiListLoading] = useState(false);

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
          agentDailyPromptLimit: result.agentDailyPromptLimit ?? -1,
          pageDailyPromptLimit: result.pageDailyPromptLimit ?? -1,
        });

        setFetchedModelIds(result.modelIds || null);
        setSelectedAgentIds(result.agentIds || []);
        setSelectedPageAgentIds(result.pageAgentIds || []);
        // 知识库ID列表
        setSelectedKnowledgeIds(result?.knowledgeIds || []);
        // API 权限
        setUserOpenApiConfigs(result.openApiConfigs || []);
      },
    });

  /** 加载开放 API 树（与查看用户 API 权限一致，目标类型为 User） */
  const loadOpenApiTree = useCallback(async () => {
    setOpenApiListLoading(true);
    try {
      const res = await apiGetOpenApiList(OpenApiPermissionTargetTypeEnum.User);
      if (res.success && res.data) {
        setOpenApiTreeData(res.data);
      }
    } catch (e) {
      console.error(e);
      setOpenApiTreeData([]);
    } finally {
      setOpenApiListLoading(false);
    }
  }, []);

  // 根据ID列表查询智能体
  const { loading: agentLoading, run: runGetAgentListByIds } = useRequest(
    apiSystemResourceAgentListByIds,
    {
      manual: true,
      onSuccess: (result: AgentConfigInfo[]) => {
        setAgentList(result || []);
      },
    },
  );

  // 根据ID列表查询应用页面列表
  const { loading: pageLoading, run: runGetPageListByIds } = useRequest(
    apiSystemResourcePageListByIds,
    {
      manual: true,
      onSuccess: (result: CustomPageDto[]) => {
        setPageList(result || []);
      },
    },
  );

  // ======================================= 知识库 =======================================
  // 根据ID列表查询知识库列表
  const { loading: knowledgeLoading, run: runGetKnowledgeListByIds } =
    useRequest(apiSystemResourceKnowledgeListByIds, {
      manual: true,
      onSuccess: (result: KnowledgeInfoById[]) => {
        setKnowledgeList(result || []);
      },
    });

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
        agentDailyPromptLimit: -1,
        pageDailyPromptLimit: -1,
      });
      // 重置已选中的数据
      setFilteredModelList([]);
      setSelectedAgentIds([]);
      setSelectedPageAgentIds([]);
      setFetchedModelIds(null);
      setAgentList([]);
      setPageList([]);
      setActiveTab('model');

      // ======================================= 知识库 =======================================
      // 知识库列表
      setKnowledgeList([]);
      // 选中的知识库ID列表
      setSelectedKnowledgeIds([]);

      // ======================================= API 权限 =======================================
      setUserOpenApiConfigs([]);
      setOpenApiTreeData([]);
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
      const _list = modelList.filter((model: ModelConfigDto) =>
        fetchedModelIds.includes(model.id),
      );
      setFilteredModelList(_list || []);
    }
  }, [modelList, fetchedModelIds]);

  // 处理 tab 切换
  const handleTabChange = (key: string) => {
    const tabKey = key as DataPermissionTabKey;
    setActiveTab(tabKey);

    // 按需加载各 Tab 数据
    switch (tabKey) {
      case 'agent':
        if (selectedAgentIds.length > 0) {
          runGetAgentListByIds({
            agentIds: selectedAgentIds,
          });
        }
        break;
      case 'page':
        if (selectedPageAgentIds.length > 0) {
          runGetPageListByIds({
            agentIds: selectedPageAgentIds,
          });
        }
        break;
      case 'knowledge':
        if (selectedKnowledgeIds.length > 0) {
          runGetKnowledgeListByIds({
            knowledgeIds: selectedKnowledgeIds,
          });
        }
        break;
      case 'apiPermission':
        if (openApiTreeData.length === 0 && !openApiListLoading) {
          loadOpenApiTree();
        }
        break;
      default:
        break;
    }
  };

  // 检查是否有数据
  const hasModelData = filteredModelList.length > 0;
  const hasAgentData = agentList.length > 0;
  const hasPageData = pageList.length > 0;

  // 渲染 Tab 内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'model':
        return (modelLoading || dataPermissionLoading) &&
          !filteredModelList?.length ? (
          <div
            className={cx('h-full', 'flex', 'items-center', 'content-center')}
          >
            <Loading />
          </div>
        ) : hasModelData ? (
          <div className={cx('flex-1', 'overflow-y', 'h-full')}>
            {filteredModelList?.map((item: ModelConfigDto) => (
              <ResourceItem
                key={item.id}
                showIcon={false}
                name={item.name}
                description={item.description}
              />
            ))}
          </div>
        ) : (
          <div
            className={cx('flex', 'items-center', 'content-center', 'h-full')}
          >
            <Empty description={dict('PC.Common.Global.noData')} />
          </div>
        );
      case 'agent':
        return agentLoading && !agentList?.length ? (
          <div
            className={cx('h-full', 'flex', 'items-center', 'content-center')}
          >
            <Loading />
          </div>
        ) : hasAgentData ? (
          <div className={cx('flex-1', 'overflow-y', 'h-full')}>
            {agentList.map((item) => (
              <ResourceItem
                key={item.id}
                icon={item.icon}
                name={item.name}
                description={item.description}
              />
            ))}
          </div>
        ) : (
          <div
            className={cx('flex', 'items-center', 'content-center', 'h-full')}
          >
            <Empty description={dict('PC.Common.Global.noData')} />
          </div>
        );
      case 'page':
        return pageLoading && !pageList?.length ? (
          <div
            className={cx('h-full', 'flex', 'items-center', 'content-center')}
          >
            <Loading />
          </div>
        ) : hasPageData ? (
          <div className={cx('flex-1', 'overflow-y', 'h-full')}>
            {pageList.map((item) => (
              <ResourceItem
                key={item.devAgentId}
                icon={item.coverImg || item.icon}
                name={item.name}
                description={item.description}
              />
            ))}
          </div>
        ) : (
          <div
            className={cx('flex', 'items-center', 'content-center', 'h-full')}
          >
            <Empty description={dict('PC.Common.Global.noData')} />
          </div>
        );
      case 'knowledge':
        return knowledgeLoading && !knowledgeList?.length ? (
          <div
            className={cx('h-full', 'flex', 'items-center', 'content-center')}
          >
            <Loading />
          </div>
        ) : knowledgeList?.length > 0 ? (
          <div className={cx('flex-1', 'overflow-y', 'h-full')}>
            {knowledgeList.map((item) => (
              <ResourceItem
                key={item.id}
                icon={item.icon}
                name={item.name}
                description={item.description}
              />
            ))}
          </div>
        ) : (
          <div
            className={cx('flex', 'items-center', 'content-center', 'h-full')}
          >
            <Empty description="暂无数据" />
          </div>
        );
      case 'dataPermission':
        return (
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
                    label={dict(
                      'PC.Pages.UserManage.DataPermissionModal.dailyTokenLimit',
                    )}
                    name={['tokenLimit', 'limitPerDay']}
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: dict(
                        'PC.Pages.UserManage.DataPermissionModal.dailyTokenLimitTooltip',
                      ),
                    }}
                  >
                    <InputNumber
                      placeholder={dict(
                        'PC.Pages.UserManage.DataPermissionModal.dailyTokenLimitPlaceholder',
                      )}
                      className={cx('w-full')}
                      min={-1}
                      max={1000000000000000}
                    />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={dict(
                      'PC.Pages.UserManage.DataPermissionModal.maxSpaceCount',
                    )}
                    name="maxSpaceCount"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: dict(
                        'PC.Pages.UserManage.DataPermissionModal.maxSpaceCountTooltip',
                      ),
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={dict(
                      'PC.Pages.UserManage.DataPermissionModal.maxAgentCount',
                    )}
                    name="maxAgentCount"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: dict(
                        'PC.Pages.UserManage.DataPermissionModal.maxAgentCountTooltip',
                      ),
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={dict(
                      'PC.Pages.UserManage.DataPermissionModal.maxPageAppCount',
                    )}
                    name="maxPageAppCount"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: dict(
                        'PC.Pages.UserManage.DataPermissionModal.maxPageAppCountTooltip',
                      ),
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={dict(
                      'PC.Pages.UserManage.DataPermissionModal.maxKnowledgeCount',
                    )}
                    name="maxKnowledgeCount"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: dict(
                        'PC.Pages.UserManage.DataPermissionModal.maxKnowledgeCountTooltip',
                      ),
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={dict(
                      'PC.Pages.UserManage.DataPermissionModal.knowledgeStorageLimitGb',
                    )}
                    name="knowledgeStorageLimitGb"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: dict(
                        'PC.Pages.UserManage.DataPermissionModal.knowledgeStorageLimitGbTooltip',
                      ),
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={dict(
                      'PC.Pages.UserManage.DataPermissionModal.maxDataTableCount',
                    )}
                    name="maxDataTableCount"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: dict(
                        'PC.Pages.UserManage.DataPermissionModal.maxDataTableCountTooltip',
                      ),
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={dict(
                      'PC.Pages.UserManage.DataPermissionModal.maxScheduledTaskCount',
                    )}
                    name="maxScheduledTaskCount"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: dict(
                        'PC.Pages.UserManage.DataPermissionModal.maxScheduledTaskCountTooltip',
                      ),
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={dict(
                      'PC.Pages.UserManage.DataPermissionModal.agentComputerMemoryGb',
                    )}
                    name="agentComputerMemoryGb"
                    initialValue={4}
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: dict(
                        'PC.Pages.UserManage.DataPermissionModal.agentComputerMemoryGbTooltip',
                      ),
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={0} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={dict(
                      'PC.Pages.UserManage.DataPermissionModal.agentComputerCpuCores',
                    )}
                    name="agentComputerCpuCores"
                    initialValue={2}
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: dict(
                        'PC.Pages.UserManage.DataPermissionModal.agentComputerCpuCoresTooltip',
                      ),
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={0} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={dict(
                      'PC.Pages.UserManage.DataPermissionModal.agentDailyPromptLimit',
                    )}
                    name="agentDailyPromptLimit"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: dict(
                        'PC.Pages.UserManage.DataPermissionModal.agentDailyPromptLimitTooltip',
                      ),
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    label={dict(
                      'PC.Pages.UserManage.DataPermissionModal.pageDailyPromptLimit',
                    )}
                    name="pageDailyPromptLimit"
                    tooltip={{
                      icon: <InfoCircleOutlined />,
                      title: dict(
                        'PC.Pages.UserManage.DataPermissionModal.pageDailyPromptLimitTooltip',
                      ),
                    }}
                  >
                    <InputNumber className={cx('w-full')} min={-1} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        );
      case 'apiPermission':
        return (
          <UserOpenApiPermissionPanel
            openApiListLoading={openApiListLoading}
            openApiTreeData={openApiTreeData}
            openApiConfigs={userOpenApiConfigs}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      title={dict(
        'PC.Pages.UserManage.DataPermissionModal.dataPermissionTitle',
        userName || '',
      )}
      open={open}
      onCancel={onCancel}
      width={700}
      footer={null}
    >
      <div className={cx(styles.tabsContentWrapper)}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={getDataPermissionTabItems()}
        />
        <div className={cx(styles.tabContent)}>{renderTabContent()}</div>
      </div>
    </Modal>
  );
};

export default DataPermissionModal;
