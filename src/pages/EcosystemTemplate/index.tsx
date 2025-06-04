import EcosystemCard, { EcosystemCardProps } from '@/components/EcosystemCard';
import PluginDetailDrawer, {
  EcosystemDetailDrawerData,
} from '@/components/EcosystemDetailDrawer';
import SelectCategory from '@/components/EcosystemSelectCategory';
import EcosystemShareModal, {
  EcosystemShareModalData,
} from '@/components/EcosystemShareModal';
import SelectComponent from '@/components/SelectComponent';
import { TabItems, TabTypeEnum } from '@/constants/ecosystem.constants';
import {
  createClientConfigDraft,
  disableClientConfig,
  getClientConfigDetail,
  getClientConfigList,
  offlineClientConfig,
  saveAndPublishClientConfig,
  updateAndEnableClientConfig,
  updateAndPublishClientConfig,
  updateClientConfigDraft,
} from '@/services/ecosystem';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import type {
  ClientConfigSaveReqDTO,
  ClientConfigUpdateDraftReqDTO,
  ClientConfigVo,
  EcosystemTabTypeEnum,
  FetchPluginListParams,
  IPageClientConfigVo,
} from '@/types/interfaces/ecosystem';
import {
  EcosystemDataTypeEnum,
  EcosystemShareStatusEnum,
  EcosystemSubTabTypeEnum,
  EcosystemUseStatusEnum,
} from '@/types/interfaces/ecosystem';
import { DownOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Tabs,
} from 'antd';
import classNames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';
const cx = classNames.bind(styles);
const { Search } = Input;

/**
 * 生态市场插件页面
 * 展示插件列表，包括全部、已启用和我的分享三个标签页
 */
export default function EcosystemTemplate() {
  const { message } = App.useApp();
  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  // 当前激活的标签页
  const [activeTab, setActiveTab] = useState<EcosystemTabTypeEnum>(
    TabTypeEnum.ALL,
  );
  // 插件详情抽屉是否可见
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  // 当前选中的插件
  const [selectedPlugin, setSelectedPlugin] = useState<ClientConfigVo | null>(
    null,
  );
  // 分享弹窗是否可见
  const [shareModalVisible, setShareModalVisible] = useState<boolean>(false);
  // 是否是编辑模式
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  // 当前编辑的插件
  const [editingPlugin, setEditingPlugin] = useState<ClientConfigVo | null>(
    null,
  );
  const selectTargetTypeRef = useRef<string>('');
  const [selectComponentProps, setSelectComponentProps] = useState<{
    checkTag: AgentComponentTypeEnum;
    hideTop: AgentComponentTypeEnum[];
  }>({
    checkTag: AgentComponentTypeEnum.Workflow,
    hideTop: [
      AgentComponentTypeEnum.Table,
      AgentComponentTypeEnum.Knowledge,
      AgentComponentTypeEnum.Plugin,
    ],
  });
  const [shareModalProps, setShareModalProps] = useState<{
    targetType: AgentComponentTypeEnum;
    type: EcosystemDataTypeEnum;
  }>({
    targetType: AgentComponentTypeEnum.Workflow,
    type: EcosystemDataTypeEnum.TEMPLATE,
  });

  // 数据状态
  const [loading, setLoading] = useState<boolean>(false);
  const [pluginData, setPluginData] = useState<IPageClientConfigVo>({
    size: 10,
    records: [],
    total: 0,
    current: 1,
    pages: 0,
  });

  // 分页参数
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 12,
  });

  /**
   * 获取插件列表数据
   */
  const fetchPluginList = useCallback(
    async (
      {
        tabType,
        keyword = '',
        page = 1,
        pageSize = 12,
        shareStatus = -1,
        categoryCode = '',
      }: FetchPluginListParams = {} as FetchPluginListParams,
    ) => {
      setLoading(true);

      try {
        // 根据标签页类型确定查询参数
        let subTabType: number;
        switch (tabType) {
          case 'all':
            subTabType = EcosystemSubTabTypeEnum.ALL;
            break;
          case 'enabled':
            subTabType = EcosystemSubTabTypeEnum.ENABLED;
            break;
          case 'shared':
            subTabType = EcosystemSubTabTypeEnum.MY_SHARE;
            break;
          default:
            subTabType = EcosystemSubTabTypeEnum.ALL;
        }

        console.log('selectTargetTypeRef', selectTargetTypeRef.current);

        const params = {
          queryFilter: {
            dataType: EcosystemDataTypeEnum.TEMPLATE, // 只查询模板类型
            subTabType,
            targetType:
              selectTargetTypeRef.current === ''
                ? undefined
                : selectTargetTypeRef.current,
            name: keyword || undefined,
            shareStatus: shareStatus === -1 ? undefined : shareStatus,
            categoryCode: categoryCode || undefined,
          },
          current: page,
          pageSize,
          orders: [
            {
              column: 'created',
              asc: false, // 按创建时间降序
            },
          ],
        };

        const result = await getClientConfigList(params);
        setPluginData(result);
      } catch (error) {
        console.error('获取插件列表失败:', error);
        message.error('获取插件列表失败');
      } finally {
        setLoading(false);
      }
    },
    [activeTab, searchKeyword, pagination.current, pagination.pageSize],
  );

  /**
   * 初始化数据
   */
  useEffect(() => {
    selectTargetTypeRef.current = '';
    fetchPluginList();
  }, [fetchPluginList]);

  /**
   * 标签页切换时重新获取数据
   */
  useEffect(() => {
    setPagination({ current: 1, pageSize: 12 });
    fetchPluginList({
      tabType: activeTab,
      keyword: searchKeyword,
      page: 1,
      pageSize: 12,
    });
  }, [activeTab]);

  /**
   * 将后端数据转换为插件卡片数据
   */
  const convertToTemplateCard = (
    config: ClientConfigVo,
  ): EcosystemCardProps => {
    const isAll = activeTab === 'all';
    const isMyShare = activeTab === 'shared';
    return {
      icon: config.icon || '',
      title: config.name || '未命名插件',
      description: config.description || '暂无描述',
      isNewVersion: config.isNewVersion,
      author: config.author || '',
      targetType: config.targetType as AgentComponentTypeEnum,
      configParamJson: config.serverConfigParamJson,
      localConfigParamJson: config.localConfigParamJson,
      isEnabled: isAll
        ? config.useStatus === EcosystemUseStatusEnum.ENABLED
        : undefined,
      shareStatus: isMyShare ? config.shareStatus : undefined, // 仅在我的分享中使用
      publishDoc: config.publishDoc,
    };
  };
  const convertToDetailDrawer = (
    config: ClientConfigVo,
  ): EcosystemDetailDrawerData => {
    return {
      icon: config.icon || '',
      title: config.name || '未命名插件',
      description: config.description || '暂无描述',
      isNewVersion: config.isNewVersion || false,
      author: config.author || '',
      targetType: config.targetType as AgentComponentTypeEnum,
      configParamJson: config.serverConfigParamJson,
      localConfigParamJson: config.localConfigParamJson,
      isEnabled: config.useStatus === EcosystemUseStatusEnum.ENABLED,
      publishDoc: config.publishDoc,
      ownedFlag: config.ownedFlag,
    };
  };

  /**
   * 处理搜索
   */
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setPagination({ current: 1, pageSize: 12 });
    fetchPluginList({
      tabType: activeTab,
      keyword: value,
      page: 1,
      pageSize: 12,
    });
  };

  /**
   * 处理插件详情抽屉关闭
   */
  const handleDetailClose = () => {
    setSelectedPlugin(null);
    setDrawerVisible(false);
  };
  /**
   * 更新配置处理函数
   */
  const handleUpdateAndEnable = async (values: any[]) => {
    if (!selectedPlugin) return;
    setDrawerVisible(false);
    const result = await updateAndEnableClientConfig({
      uid: selectedPlugin.uid,
      configParamJson: JSON.stringify(values),
    });
    if (result) {
      message.success('更新成功');
      fetchPluginList();
    } else {
      message.error('更新失败');
    }
  };

  /**
   * 停用插件处理函数
   */
  const handleDisable = async () => {
    if (!selectedPlugin?.uid) return;

    try {
      // 如果是已发布状态，调用下线接口
      const result = await disableClientConfig(selectedPlugin.uid);
      if (result) {
        message.success('插件已下线');
        setDrawerVisible(false);
        fetchPluginList();
      } else {
        message.error('下线失败');
      }
    } catch (error) {
      console.error('停用插件失败:', error);
      message.error('操作失败');
    }
  };

  /**
   * 创建分享
   */
  const handleCreateShare = (type: AgentComponentTypeEnum) => {
    setSelectComponentProps({
      checkTag: type,
      hideTop:
        type === AgentComponentTypeEnum.Workflow
          ? [
              AgentComponentTypeEnum.Table,
              AgentComponentTypeEnum.Knowledge,
              AgentComponentTypeEnum.Plugin,
              AgentComponentTypeEnum.Agent,
            ]
          : [
              AgentComponentTypeEnum.Workflow,
              AgentComponentTypeEnum.Table,
              AgentComponentTypeEnum.Knowledge,
              AgentComponentTypeEnum.Plugin,
            ],
    });
    setShareModalProps({
      targetType: type,
      type: EcosystemDataTypeEnum.TEMPLATE,
    });
    setIsEditMode(false);
    setEditingPlugin(null);
    setShareModalVisible(true);
  };

  const refreshPluginListAndReset = () => {
    fetchPluginList();
    setShareModalVisible(false);
    setEditingPlugin(null);
  };

  /**
   * 保存分享
   */
  const handleSaveShare = async (
    values: any,
    isDraft: boolean,
  ): Promise<boolean> => {
    try {
      const params: ClientConfigSaveReqDTO | ClientConfigUpdateDraftReqDTO = {
        name: values.name,
        description: values.description,
        dataType: EcosystemDataTypeEnum.TEMPLATE,
        targetType: values.targetType || AgentComponentTypeEnum.Workflow,
        targetId: values.targetId,
        categoryCode: values.categoryCode,
        categoryName: values.categoryName,
        useStatus: values.useStatus || EcosystemUseStatusEnum.ENABLED,
        author: values.author,
        publishDoc: values.publishDoc,
        configParamJson: values.configParamJson,
        // configJson: values.configJson,
        icon: values.icon,
      };
      let result: ClientConfigVo | null = null;

      if (isEditMode && editingPlugin?.uid) {
        // 更新草稿
        const updateParams = {
          ...params,
          uid: editingPlugin.uid,
        } as ClientConfigUpdateDraftReqDTO;
        if (isDraft) {
          result = await updateClientConfigDraft(updateParams);
        } else {
          result = await updateAndPublishClientConfig(updateParams);
        }
      } else {
        // 创建新草稿或发布
        if (isDraft) {
          result = await createClientConfigDraft(
            params as ClientConfigSaveReqDTO,
          );
        } else {
          result = await saveAndPublishClientConfig(
            params as ClientConfigSaveReqDTO,
          );
        }
      }

      if (result) {
        message.success(isEditMode ? '更新成功' : '创建成功');
        refreshPluginListAndReset();
        return true;
      } else {
        message.error('操作失败');
        return false;
      }
    } catch (error) {
      console.error('保存分享失败:', error);
      message.error('操作失败');
      return false;
    }
  };

  /**
   * 处理分页变化
   */
  const handlePageChange = (page: number, pageSize?: number) => {
    const newPagination = {
      current: page,
      pageSize: pageSize || pagination.pageSize,
    };
    setPagination(newPagination);
    fetchPluginList({
      tabType: activeTab,
      keyword: searchKeyword,
      page,
      pageSize: pageSize || pagination.pageSize,
    });
  };

  /**
   * 渲染右侧操作区域
   */
  const menuProps = {
    items: [
      {
        key: AgentComponentTypeEnum.Workflow,
        label: '工作流',
      },
      {
        key: AgentComponentTypeEnum.Agent,
        label: '智能体',
      },
    ],
    onClick: (e: any) => {
      handleCreateShare(e.key);
    },
  };

  const [show, setShow] = useState(false);
  const [shareModalData, setShareModalData] =
    useState<EcosystemShareModalData | null>(null);
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);
  // 查询智能体配置组件列表
  const onSelectedComponent = (item: CreatedNodeItem) => {
    item.type = item.targetType;
    item.typeId = item.targetId;
    setShow(false);
    setShareModalData({
      icon: item.icon,
      name: item.name,
      description: item.description,
      targetType: item.targetType,
      targetId: item.targetId.toString(),
      shareStatus: EcosystemShareStatusEnum.DRAFT,
    });
    setAddComponents([
      {
        type: item.type,
        targetId: item.targetId,
        status: AgentAddComponentStatusEnum.Added,
      },
    ]);
  };

  /**
   * 处理插件卡片点击事件
   */
  const handleCardClick = async (config: ClientConfigVo) => {
    // 如果是我的分享标签页，则进入编辑模式
    if (activeTab === TabTypeEnum.SHARED) {
      setEditingPlugin(config);
      setIsEditMode(true);
      setShareModalVisible(true);
      setShow(false);
      const targetType = config.targetType;
      const item: EcosystemShareModalData = {
        icon: config.icon || '',
        uid: config.uid,
        name: config.name || '',
        description: config.description || '',
        targetType: targetType as AgentComponentTypeEnum,
        targetId: (config.targetId || '').toString(),
        author: config.author || '',
        publishDoc: config.publishDoc || '',
        shareStatus: config.shareStatus,
        configParamJson: config.configParamJson || '',
      };
      setShareModalData(item);
      setAddComponents([
        {
          type: targetType as AgentComponentTypeEnum,
          targetId: Number(item.targetId) || 0,
          status: AgentAddComponentStatusEnum.Added,
        },
      ]);
    } else {
      // 获取详细信息
      if (config.uid) {
        const detail = await getClientConfigDetail(config.uid);
        if (detail) {
          setSelectedPlugin(detail);
          setDrawerVisible(true);
        } else {
          message.error('获取插件详情失败');
        }
      }
    }
  };

  const handleOffline = async (uid: string) => {
    // 下线插件
    const result = await offlineClientConfig(uid);
    if (result) {
      message.success('模板已下线');
      fetchPluginList();
    } else {
      message.error('下线失败');
    }
  };
  /**
   * 关闭分享弹窗
   */
  const handleCloseShareModal = () => {
    setShareModalVisible(false);
    setEditingPlugin(null);
    setShareModalData(null);
    setAddComponents([]);
  };
  const handleShareStatusChange = (value: number) => {
    setPagination({ current: 1, pageSize: 12 });
    fetchPluginList({
      tabType: activeTab,
      keyword: searchKeyword,
      page: 1,
      pageSize: 12,
      shareStatus: value,
    });
  };

  const handleCategoryChange = (value: string) => {
    setPagination({ current: 1, pageSize: 12 });
    fetchPluginList({
      tabType: activeTab,
      keyword: searchKeyword,
      page: 1,
      pageSize: 12,
      categoryCode: value === '' ? undefined : value,
    });
  };

  const handleTargetTypeChange = (value: string) => {
    selectTargetTypeRef.current = value;
    setPagination({ current: 1, pageSize: 12 });
    fetchPluginList({
      tabType: activeTab,
      keyword: searchKeyword,
      page: 1,
      pageSize: 12,
    });
  };

  /**
   * 渲染右侧操作区域
   */
  const renderExtraContent = () => {
    if (activeTab === TabTypeEnum.SHARED) {
      return (
        <div className={cx(styles.headerRight)}>
          <Select
            options={[
              {
                label: '全部',
                value: -1,
              },
              {
                label: '已发布',
                value: 3,
              },
              {
                label: '审核中',
                value: 2,
              },
              {
                label: '已下线',
                value: 4,
              },
            ]}
            defaultValue={-1}
            onChange={(value) => handleShareStatusChange(value)}
            className={cx(styles.select)}
          />
          <Search
            className={cx(styles.searchInput)}
            placeholder="搜索模板"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={handleSearch}
            allowClear
          />
          <Dropdown menu={menuProps} className={cx(styles.createShareButton)}>
            <Button type="primary">
              <Space>
                创建分享
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        </div>
      );
    }
    return (
      <div className={cx(styles.headerRight)}>
        <Select
          options={[
            {
              label: '全部',
              value: '',
            },
            {
              label: '智能体',
              value: AgentComponentTypeEnum.Agent,
            },
            {
              label: '工作流',
              value: AgentComponentTypeEnum.Workflow,
            },
          ]}
          style={{ width: 100 }}
          defaultValue={''}
          onChange={(value: string) => handleTargetTypeChange(value)}
        />
        {selectTargetTypeRef.current && (
          <SelectCategory
            targetType={selectTargetTypeRef.current}
            onChange={(value) => handleCategoryChange(value)}
          />
        )}
        <Search
          className={cx(styles.searchInput)}
          placeholder="搜索模板"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={handleSearch}
          allowClear
        />
      </div>
    );
  };

  return (
    <div className={cx(styles.container)}>
      <Card className={cx(styles.contentCard)} title="模板" variant="outlined">
        <div className={cx(styles.header)}>
          <Tabs
            activeKey={activeTab}
            onChange={(value: string) =>
              setActiveTab(value as EcosystemTabTypeEnum)
            }
            className={cx(styles.tabs)}
            items={TabItems}
          />

          {renderExtraContent()}
        </div>

        <Spin spinning={loading}>
          <div className={cx(styles.pluginList)}>
            <Row gutter={[16, 16]}>
              {pluginData.records?.map((config, index) => (
                <Col span={6} key={config.uid || index}>
                  <EcosystemCard
                    {...convertToTemplateCard(config)}
                    onClick={() => handleCardClick(config)}
                  />
                </Col>
              ))}
            </Row>

            {/* 分页组件 */}
            {pluginData.total && pluginData.total > 0 ? (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Button
                  disabled={pagination.current <= 1}
                  onClick={() => handlePageChange(pagination.current - 1)}
                  style={{ marginRight: 8 }}
                >
                  上一页
                </Button>
                <span style={{ margin: '0 16px' }}>
                  第 {pagination.current} 页，共 {pluginData.pages || 0}{' '}
                  页，总计 {pluginData.total} 条
                </span>
                <Button
                  disabled={pagination.current >= (pluginData.pages || 0)}
                  onClick={() => handlePageChange(pagination.current + 1)}
                >
                  下一页
                </Button>
              </div>
            ) : (
              <Empty description="暂无数据" />
            )}
          </div>
        </Spin>
      </Card>

      {/* 插件详情抽屉 */}
      <PluginDetailDrawer
        visible={drawerVisible}
        data={
          selectedPlugin ? convertToDetailDrawer(selectedPlugin) : undefined
        }
        onClose={handleDetailClose}
        onUpdateAndEnable={handleUpdateAndEnable}
        onDisable={handleDisable}
      />

      {/* 插件分享弹窗 */}
      <EcosystemShareModal
        visible={shareModalVisible}
        isEdit={isEditMode}
        onClose={handleCloseShareModal}
        onOffline={handleOffline}
        onSave={handleSaveShare}
        data={shareModalData}
        onAddComponent={() => {
          setShow(true);
        }}
        onRemoveComponent={() => {
          setShareModalData(null);
          setAddComponents([]);
        }}
        {...shareModalProps}
      />
      {/*添加插件、工作流、知识库、数据库弹窗*/}
      <SelectComponent
        onAdded={onSelectedComponent}
        open={show}
        onCancel={() => setShow(false)}
        addComponents={addComponents}
        {...selectComponentProps}
      />
    </div>
  );
}
