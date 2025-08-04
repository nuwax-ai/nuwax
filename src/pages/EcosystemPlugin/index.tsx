import type { EcosystemCardProps } from '@/components/EcosystemCard';
import PluginDetailDrawer, {
  type EcosystemDetailDrawerData,
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
import { App, Button, Empty, Input, Select, Tabs } from 'antd';
import classNames from 'classnames';
import { useCallback, useEffect, useState } from 'react';
import styles from './index.less';
const cx = classNames.bind(styles);
const { Search } = Input;
const PAGE_SIZE = 24;

import EcosystemCard from '@/components/EcosystemCard';
import Loading from '@/components/Loading';
import { CREATED_TABS } from '@/constants/common.constants';
const defaultTabs = CREATED_TABS.filter((item) =>
  [AgentComponentTypeEnum.Plugin].includes(item.key),
);
/**
 * 生态市场插件页面
 * 展示插件列表，包括全部、已启用和我的分享三个标签页
 */
export default function EcosystemPlugin() {
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
    pageSize: PAGE_SIZE,
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

        const params = {
          queryFilter: {
            dataType: EcosystemDataTypeEnum.PLUGIN, // 只查询插件类型
            subTabType,
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
        console.error('获取插件列表失败:', error);
        message.error('获取插件列表失败');
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
   * 标签页切换时重新获取数据
   */
  useEffect(() => {
    refreshPluginList();
  }, [activeTab]);

  /**
   * 将后端数据转换为插件卡片数据
   */
  const convertToPluginCard = (config: ClientConfigVo): EcosystemCardProps => {
    // 根据分享状态确定标签
    const isMyShare = activeTab === TabTypeEnum.SHARED;
    const isAll = activeTab === TabTypeEnum.ALL;
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
      // isNewVersion: true,
      isNewVersion: config.isNewVersion || false,
      author: config.author || '',
      dataType: config.dataType as EcosystemDataTypeEnum,
      ownedFlag: config.ownedFlag,
      targetType: config.targetType as AgentComponentTypeEnum,
      configParamJson: config.serverConfigParamJson,
      localConfigParamJson: config.localConfigParamJson,
      isEnabled: config.useStatus === EcosystemUseStatusEnum.ENABLED,
      publishDoc: config.publishDoc,
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
   * 处理插件详情抽屉关闭
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
      message.error('操作失败');
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
   * 停用插件处理函数
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
  const handleCreateShare = () => {
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
        dataType: EcosystemDataTypeEnum.PLUGIN,
        targetType: values.targetType || AgentComponentTypeEnum.Plugin,
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

  const fetchPluginData = async (
    page: number,
    pageSize: number,
    append = false,
  ) => {
    setLoading(true);
    try {
      // 获取数据的API调用
      const response = await getClientConfigList({
        queryFilter: {
          dataType: EcosystemDataTypeEnum.PLUGIN,
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
    fetchPluginData(page, pagination.pageSize, append);
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
            placeholder="搜索插件"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={handleSearch}
            onClear={() => handleSearch('')}
            allowClear
          />
          <Button type="primary" onClick={handleCreateShare}>
            创建分享
          </Button>
        </div>
      );
    }
    return (
      <div className={cx(styles.headerRight)}>
        <SelectCategory
          targetType={AgentComponentTypeEnum.Plugin}
          onChange={(value) => handleCategoryChange(value)}
        />
        <Search
          className={cx(styles.searchInput)}
          placeholder="搜索插件"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={handleSearch}
          onClear={() => handleSearch('')}
          allowClear
        />
      </div>
    );
  };
  const [show, setShow] = useState(false);
  const [shareModalData, setShareModalData] =
    useState<EcosystemShareModalData | null>(null);
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);
  // 查询智能体配置组件列表
  const onSelectedComponent = (item: CreatedNodeItem) => {
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
   * 处理插件卡片点击事件
   */
  const handleCardClick = async (config: ClientConfigVo) => {
    // 如果是我的分享标签页，则进入编辑模式
    if (activeTab === 'shared') {
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
        try {
          const detail = await getClientConfigDetail(config.uid);
          if (detail) {
            setSelectedPlugin(detail);
            setDrawerVisible(true);
          }
        } catch (error) {
          message.error('获取插件详情失败');
        }
      }
    }
  };

  const handleOffline = async (uid: string): Promise<boolean> => {
    let result = null;
    try {
      // 下线插件
      result = await offlineClientConfig(uid);
    } catch (error) {
      message.error('下线失败');
      return false;
    }
    if (result) {
      message.success('插件已下线');
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
        <h3 className={cx(styles.title)}>插件</h3>
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
          className={cx(styles.pluginList, 'flex-1', 'overflow-y')}
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
            <div className={cx(styles['list-section'])}>
              {pluginData.records?.map((config) => (
                <EcosystemCard
                  key={config?.uid}
                  {...convertToPluginCard(config)}
                  onClick={() => handleCardClick(config)}
                />
              ))}
            </div>
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
        </div>
      </div>

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
        type={EcosystemDataTypeEnum.PLUGIN}
        targetType={AgentComponentTypeEnum.Plugin}
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
      />
      {/*添加插件、工作流、知识库、数据库弹窗*/}
      <SelectComponent
        checkTag={AgentComponentTypeEnum.Plugin}
        onAdded={onSelectedComponent}
        open={show}
        onCancel={() => setShow(false)}
        tabs={defaultTabs}
        addComponents={addComponents}
      />
    </>
  );
}
