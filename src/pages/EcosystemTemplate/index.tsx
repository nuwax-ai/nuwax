import EcosystemCard, { EcosystemCardProps } from '@/components/EcosystemCard';
import PluginDetailDrawer, {
  EcosystemDetailDrawerData,
} from '@/components/EcosystemDetailDrawer';
import SelectCategory from '@/components/EcosystemSelectCategory';
import EcosystemShareModal, {
  EcosystemShareModalData,
} from '@/components/EcosystemShareModal';
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
  Dropdown,
  Input,
  List,
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
const PAGE_SIZE = 24;
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
  const selectTargetTypeRef = useRef<string>('');
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
        shareStatus = -1,
        categoryCode = '',
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

  /**
   * 初始化数据
   */
  useEffect(() => {
    selectTargetTypeRef.current = '';
    refreshPluginList();
  }, []);

  /**
   * 标签页切换时重新获取数据
   */
  useEffect(() => {
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

      // 获取数据的API调用
      const response = await getClientConfigList({
        queryFilter: {
          dataType: EcosystemDataTypeEnum.TEMPLATE,
          subTabType,
          targetType:
            selectTargetTypeRef.current === ''
              ? undefined
              : selectTargetTypeRef.current,
          name: searchKeyword || undefined,
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
   * 处理模板卡片点击事件
   */
  const handleCardClick = async (config: ClientConfigVo): Promise<boolean> => {
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
      return true;
    } else {
      // 获取详细信息
      if (config.uid) {
        try {
          const detail = await getClientConfigDetail(config.uid);
          if (detail) {
            setSelectedPlugin(detail);
            setDrawerVisible(true);
            return true;
          }
        } catch (error) {
          message.error('获取插件详情失败');
        }
      }
    }
    return false;
  };

  const handleOffline = async (uid: string): Promise<boolean> => {
    // 下线插件
    let result = null;
    try {
      result = await offlineClientConfig(uid);
    } catch (error) {
      message.error('下线失败');
      return false;
    }

    if (result) {
      message.success('模板已下线');
      refreshPluginList();
      return true;
    }
    message.error('下线失败');
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
    refreshPluginList({
      shareStatus: value,
    });
  };

  const handleCategoryChange = (value: string) => {
    refreshPluginList({
      categoryCode: value === '' ? undefined : value,
    });
  };

  const handleTargetTypeChange = (value: string) => {
    selectTargetTypeRef.current = value;
    refreshPluginList();
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
            onClear={() => handleSearch('')}
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
          onClear={() => handleSearch('')}
          allowClear
        />
      </div>
    );
  };

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.contentCard)}>
        <h3 className={cx(styles.title)}>模板</h3>
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

        <div
          className={cx(styles.pluginList)}
          style={{
            height: 'calc(100vh - 100px)',
            overflowY: 'auto',
          }}
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
          <List
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
          />
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
        onCancel={() => setShow(false)}
        addComponents={addComponents}
        {...selectComponentProps}
      />
    </div>
  );
}
