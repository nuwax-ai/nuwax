import Loading from '@/components/custom/Loading';
import EcosystemCard, { EcosystemCardProps } from '@/components/EcosystemCard';
import PluginDetailDrawer from '@/components/EcosystemDetailDrawer';
import SelectCategory from '@/components/EcosystemSelectCategory';
import EcosystemShareModal, {
  EcosystemShareModalData,
} from '@/components/EcosystemShareModal';
import NoMoreDivider from '@/components/NoMoreDivider';
import SelectComponent from '@/components/SelectComponent';
import { CREATED_TABS } from '@/constants/common.constants';
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
  withdrawClientConfig,
} from '@/services/ecosystem';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { NodeTypeEnum } from '@/types/enums/common';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import type {
  ClientConfigSaveReqDTO,
  ClientConfigUpdateDraftReqDTO,
  ClientConfigVo,
  EcosystemDetailDrawerData,
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
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Dropdown,
  Empty,
  Input,
  Segmented,
  Select,
  Space,
} from 'antd';
import classNames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';
const cx = classNames.bind(styles);
const { Search } = Input;
const PAGE_SIZE = 24;

const SPACE_SQUARE_SEGMENTED_LIST =
  TabItems?.map((item) => ({
    label: item.label,
    value: item.key,
  })) || [];

/**
 * 生态市场模板页面
 * 展示模板列表，包括全部、已启用和我的分享三个标签页
 */
export default function EcosystemTemplate() {
  const { message } = App.useApp();
  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  // 当前激活的标签页
  const [activeTab, setActiveTab] = useState<EcosystemTabTypeEnum>(
    TabTypeEnum.ALL,
  );
  // 模板详情抽屉是否可见
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  // 当前选中的模板
  const [selectedPlugin, setSelectedPlugin] = useState<ClientConfigVo | null>(
    null,
  );
  // 分享弹窗是否可见
  const [shareModalVisible, setShareModalVisible] = useState<boolean>(false);
  // 是否是编辑模式
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  // 当前编辑的模板
  const [editingPlugin, setEditingPlugin] = useState<ClientConfigVo | null>(
    null,
  );
  const selectTargetTypeRef = useRef<{
    targetType: string;
    categoryCode: string;
    shareStatus: number;
  }>({
    targetType: '',
    categoryCode: '',
    shareStatus: -1,
  });

  const [selectComponentProps, setSelectComponentProps] = useState<{
    checkTag: AgentComponentTypeEnum;
    tabs: { label: string; key: AgentComponentTypeEnum }[];
  }>({
    checkTag: AgentComponentTypeEnum.Workflow,
    tabs: CREATED_TABS.filter((item) =>
      [AgentComponentTypeEnum.Workflow].includes(item.key),
    ),
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
    size: PAGE_SIZE,
    records: [],
    total: 0,
    current: 1,
    pages: 0,
  });

  // 分页参数
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: PAGE_SIZE,
  });

  /**
   * 获取模板列表数据
   */
  const fetchPluginList = useCallback(
    async (
      {
        tabType,
        keyword = '',
        page = 1,
        pageSize = PAGE_SIZE,
      }: FetchPluginListParams = {} as FetchPluginListParams,
    ) => {
      setLoading(true);

      try {
        // 根据标签页类型确定查询参数
        let subTabType: number;
        switch (tabType) {
          case TabTypeEnum.ALL:
            subTabType = EcosystemSubTabTypeEnum.ALL;
            break;
          case TabTypeEnum.ENABLED:
            subTabType = EcosystemSubTabTypeEnum.ENABLED;
            break;
          case TabTypeEnum.SHARED:
            subTabType = EcosystemSubTabTypeEnum.MY_SHARE;
            break;
          default:
            subTabType = EcosystemSubTabTypeEnum.ALL;
        }
        const { targetType, categoryCode, shareStatus } =
          selectTargetTypeRef.current;
        const params = {
          queryFilter: {
            dataType: EcosystemDataTypeEnum.TEMPLATE, // 只查询模板类型
            subTabType,
            targetType: targetType === '' ? undefined : targetType,
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
        setPluginData({
          size: pageSize,
          records: [],
          total: 0,
          current: page,
          pages: 0,
        });

        const result = await getClientConfigList(params);
        setPluginData(result);
      } catch (error) {
        console.error('获取模板列表失败:', error);
        message.error('获取模板列表失败');
      } finally {
        setLoading(false);
      }
    },
    [activeTab, searchKeyword, pagination.current, pagination.pageSize],
  );
  const refreshPluginList = (
    options?: Partial<FetchPluginListParams> | undefined,
  ) => {
    setPagination({ current: 1, pageSize: PAGE_SIZE });
    fetchPluginList({
      tabType: activeTab,
      keyword: options?.keyword === undefined ? searchKeyword : options.keyword,
      page: 1,
      pageSize: PAGE_SIZE,
      ...(options || {}),
    });
  };

  const handleResetQueryFilter = useCallback(() => {
    selectTargetTypeRef.current['categoryCode'] = '';
    selectTargetTypeRef.current['targetType'] = '';
    selectTargetTypeRef.current['shareStatus'] = -1;
    setSearchKeyword('');
  }, []);

  /**
   * 标签页切换时重新获取数据
   */
  useEffect(() => {
    handleResetQueryFilter();
    refreshPluginList();
  }, [activeTab]);

  /**
   * 将后端数据转换为插件卡片数据
   */
  const convertToTemplateCard = (
    config: ClientConfigVo,
  ): EcosystemCardProps => {
    const isAll = activeTab === TabTypeEnum.ALL;
    const isMyShare = activeTab === TabTypeEnum.SHARED;
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
      dataType: config.dataType as EcosystemDataTypeEnum,
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
    refreshPluginList({ keyword: value });
  };

  /**
   * 处理模板详情抽屉关闭
   */
  const handleDetailClose = () => {
    setSelectedPlugin(null);
    setDrawerVisible(false);
  };
  /**
   * 更新配置处理函数
   */
  const handleUpdateAndEnable = async (values: any[]): Promise<boolean> => {
    if (!selectedPlugin) return false;
    let result = null;
    try {
      result = await updateAndEnableClientConfig({
        uid: selectedPlugin.uid as string,
        configParamJson: JSON.stringify(values),
      });
    } catch (error) {
      message.error('更新失败');
      return false;
    }
    if (result) {
      setDrawerVisible(false);
      message.success('更新成功');
      refreshPluginList();
      return true;
    }
    message.error('更新失败');
    return false;
  };

  /**
   * 停用模板处理函数
   */
  const handleDisable = async (): Promise<boolean> => {
    if (!selectedPlugin?.uid) return false;
    let result = null;
    try {
      // 如果是已发布状态，调用下线接口
      result = await disableClientConfig(selectedPlugin.uid);
    } catch (error) {
      message.error('下线失败');
      return false;
    }
    if (result) {
      message.success('已下线');
      setDrawerVisible(false);
      refreshPluginList();
      return true;
    }
    message.error('下线失败');
    return false;
  };

  /**
   * 创建分享
   */
  const handleCreateShare = (type: AgentComponentTypeEnum) => {
    setSelectComponentProps({
      checkTag: type,
      tabs: CREATED_TABS.filter((item) => [type].includes(item.key)),
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
    handleResetQueryFilter();
    refreshPluginList();
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

  const fetchTemplateData = async (
    page: number,
    pageSize: number,
    append = false,
  ) => {
    setLoading(true);
    try {
      // 根据标签页类型确定查询参数
      let subTabType: number;
      switch (activeTab) {
        case TabTypeEnum.ALL:
          subTabType = EcosystemSubTabTypeEnum.ALL;
          break;
        case TabTypeEnum.ENABLED:
          subTabType = EcosystemSubTabTypeEnum.ENABLED;
          break;
        case TabTypeEnum.SHARED:
          subTabType = EcosystemSubTabTypeEnum.MY_SHARE;
          break;
        default:
          subTabType = EcosystemSubTabTypeEnum.ALL;
      }
      const { targetType, categoryCode, shareStatus } =
        selectTargetTypeRef.current;
      // 获取数据的API调用
      const response = await getClientConfigList({
        queryFilter: {
          dataType: EcosystemDataTypeEnum.TEMPLATE,
          subTabType,
          targetType: targetType === '' ? undefined : targetType,
          name: searchKeyword || undefined,
          categoryCode: categoryCode === '' ? undefined : categoryCode,
          shareStatus: shareStatus === -1 ? undefined : shareStatus,
        },
        current: page,
        pageSize,
        orders: [
          {
            column: 'created',
            asc: false,
          },
        ],
      });

      // 如果是追加模式，合并数据
      if (append && pluginData.records) {
        setPluginData({
          ...response,
          records: [...(pluginData.records || []), ...(response.records || [])],
        });
      } else {
        setPluginData(response);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理分页变化
   */
  const handlePageChange = (page: number, append = false) => {
    if (loading) return;

    setPagination((prev) => ({ ...prev, current: page }));

    // 获取数据的函数需要修改，支持追加模式
    fetchTemplateData(page, pagination.pageSize, append);
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
    item.type = item.targetType as unknown as NodeTypeEnum;
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
        type: item.targetType,
        targetId: item.targetId,
        status: AgentAddComponentStatusEnum.Added,
      },
    ]);
  };

  /**
   * 处理模板卡片点击事件
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
      setShareModalProps({
        targetType: targetType as AgentComponentTypeEnum,
        type: EcosystemDataTypeEnum.TEMPLATE,
      });
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
        try {
          const detail = await getClientConfigDetail(config.uid);
          if (detail) {
            setSelectedPlugin(detail);
            setDrawerVisible(true);
          }
        } catch (error) {
          message.error('获取详情失败');
        }
      }
    }
  };

  const handleOffline = async (uid: string): Promise<boolean> => {
    // 下线插件
    let result = null;
    try {
      result = await offlineClientConfig(uid);
    } catch (error) {
      return false;
    }

    if (result) {
      message.success('模板已下线');
      refreshPluginList();
      return true;
    }
    return false;
  };

  const handleWithdraw = async (uid: string): Promise<boolean> => {
    // 撤回审批
    let result = null;
    try {
      result = await withdrawClientConfig(uid);
    } catch (error) {
      return false;
    }

    if (result) {
      message.success('模板已撤销发布');
      refreshPluginList();
      return true;
    }
    return false;
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
    selectTargetTypeRef.current['shareStatus'] = value;
    refreshPluginList();
  };

  const handleCategoryChange = (value: string) => {
    selectTargetTypeRef.current['categoryCode'] = value;
    refreshPluginList();
  };

  const handleTargetTypeChange = (value: string) => {
    selectTargetTypeRef.current['targetType'] = value;
    selectTargetTypeRef.current['categoryCode'] = '';
    refreshPluginList();
  };

  /**
   * 渲染右侧操作区域
   */
  const renderExtraContent = () => {
    if (activeTab === TabTypeEnum.SHARED) {
      return (
        <div className={cx(styles.headerRight)}>
          <Search
            className={cx(styles.searchInput)}
            placeholder="搜索模板"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={handleSearch}
            onClear={() => handleSearch('')}
            allowClear
          />
          <Dropdown menu={menuProps}>
            <Button type="primary">
              <PlusOutlined />
              创建分享
              <DownOutlined />
            </Button>
          </Dropdown>
        </div>
      );
    }
    return (
      <div className={cx(styles.headerRight)}>
        {selectTargetTypeRef.current.targetType && (
          <SelectCategory
            targetType={selectTargetTypeRef.current.targetType}
            onChange={(value) => handleCategoryChange(value)}
          />
        )}
        <Search
          className={cx(styles.searchInput)}
          placeholder="搜索模板"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={handleSearch}
          onClear={() => handleSearch('')}
          allowClear
        />
      </div>
    );
  };

  return (
    <>
      <div
        className={cx(
          styles.container,
          'flex',
          'flex-col',
          'h-full',
          'overflow-hide',
        )}
      >
        <div className={cx(styles.header)}>
          <Space>
            <h3 className={cx(styles.title)}>模板</h3>
            <Segmented
              className={cx(styles.segmented)}
              options={SPACE_SQUARE_SEGMENTED_LIST}
              value={activeTab}
              onChange={(value: string) =>
                setActiveTab(value as EcosystemTabTypeEnum)
              }
            />
            {activeTab === TabTypeEnum.SHARED ? (
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
                style={{ width: 100 }}
                value={selectTargetTypeRef.current.shareStatus}
                onChange={(value) => handleShareStatusChange(value)}
              />
            ) : (
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
                value={selectTargetTypeRef.current.targetType}
                onChange={(value: string) => handleTargetTypeChange(value)}
              />
            )}
          </Space>
          {renderExtraContent()}
        </div>
        <div
          className={cx(styles.pluginList, 'flex-1', 'scroll-container-hide')}
          onScroll={(e) => {
            // 当滚动到距离底部100px时加载更多
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            if (
              scrollHeight - scrollTop - clientHeight < 100 &&
              !loading &&
              pagination.current < (pluginData.pages || 0)
            ) {
              handlePageChange(pagination.current + 1, true); // 添加参数表示追加数据而不是替换
            }
          }}
        >
          {loading && pluginData?.records?.length === 0 ? (
            <Loading className={cx('h-full')} />
          ) : pluginData?.records?.length ? (
            <>
              <div className={cx(styles['list-section'])}>
                {pluginData.records?.map((config) => (
                  <EcosystemCard
                    key={config?.uid}
                    {...convertToTemplateCard(config)}
                    onClick={async () => await handleCardClick(config)}
                  />
                ))}
              </div>
              {!(pagination.current < (pluginData.pages || 0)) && (
                <NoMoreDivider />
              )}
            </>
          ) : (
            <div
              className={cx('flex', 'h-full', 'items-center', 'content-center')}
            >
              <Empty
                className={cx(
                  'flex',
                  'flex-col',
                  'items-center',
                  'content-center',
                )}
                description="暂无数据"
              />
            </div>
          )}
          {/* <List
            grid={{ gutter: 16, column: 4 }}
            dataSource={pluginData.records || []}
            renderItem={(config) => (
              <List.Item>
                <EcosystemCard
                  {...convertToTemplateCard(config)}
                  onClick={() => handleCardClick(config)}
                />
              </List.Item>
            )}
            loadMore={
              loading ? (
                <div style={{ textAlign: 'center', margin: '12px 0' }}>
                  <Spin />
                </div>
              ) : pluginData.total &&
                pluginData.total > 0 &&
                pagination.current >= (pluginData.pages || 0) ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '12px 0',
                    color: '#ccc',
                  }}
                >
                  没有更多数据了
                </div>
              ) : null
            }
          /> */}
        </div>
      </div>

      {/* 模板详情抽屉 */}
      <PluginDetailDrawer
        visible={drawerVisible}
        data={
          selectedPlugin ? convertToDetailDrawer(selectedPlugin) : undefined
        }
        onClose={handleDetailClose}
        onUpdateAndEnable={handleUpdateAndEnable}
        onDisable={handleDisable}
      />

      {/* 模板分享弹窗 */}
      <EcosystemShareModal
        visible={shareModalVisible}
        isEdit={isEditMode}
        onClose={handleCloseShareModal}
        onOffline={handleOffline}
        onWithdraw={handleWithdraw}
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
      {/*添加工作流、智能体弹窗*/}
      <SelectComponent
        onAdded={onSelectedComponent}
        open={show}
        disableCollect={true}
        onCancel={() => setShow(false)}
        addComponents={addComponents}
        {...selectComponentProps}
      />
    </>
  );
}
