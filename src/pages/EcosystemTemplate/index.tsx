import Created from '@/components/Created';
import EcosystemShareModal from '@/components/EcosystemShareModal';
import type { PluginCardProps } from '@/components/PluginCard';
import PluginCard from '@/components/PluginCard';
import PluginDetailDrawer from '@/components/PluginDetailDrawer';
import {
  createClientConfigDraft,
  getClientConfigDetail,
  getClientConfigList,
  offlineClientConfig,
  saveAndPublishClientConfig,
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
  IPageClientConfigVo,
} from '@/types/interfaces/ecosystem';
import {
  EcosystemDataTypeEnum,
  EcosystemShareStatusEnum,
  EcosystemSubTabTypeEnum,
  EcosystemUseStatusEnum,
} from '@/types/interfaces/ecosystem';
import { PlusOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { App, Button, Card, Col, Input, Row, Spin, Tabs } from 'antd';
import classNames from 'classnames';
import { useCallback, useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);
const { Search } = Input;

/**
 * 扩展的插件详情类型，包含额外的详情信息
 */
interface ExtendedPluginProps extends PluginCardProps {
  version?: string;
  author?: string;
  publishTime?: string;
  shareStatus?: number;
  uid?: string;
  [key: string]: any; // 允许其他属性
}

/**
 * 生态市场插件页面
 * 展示插件列表，包括全部、已启用和我的分享三个标签页
 */
export default function EcosystemTemplate() {
  const { message } = App.useApp();
  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  // 当前激活的标签页
  const [activeTab, setActiveTab] = useState<string>('all');
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
    pageSize: 12,
  });

  /**
   * 获取插件列表数据
   */
  const fetchPluginList = useCallback(
    async (
      tabType: string = activeTab,
      keyword: string = searchKeyword,
      page: number = pagination.current,
      pageSize: number = pagination.pageSize,
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

        const params = {
          queryFilter: {
            dataType: EcosystemDataTypeEnum.TEMPLATE, // 只查询模板类型
            subTabType,
            name: keyword || undefined,
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
    fetchPluginList();
  }, [fetchPluginList]);

  /**
   * 标签页切换时重新获取数据
   */
  useEffect(() => {
    setPagination({ current: 1, pageSize: 12 });
    fetchPluginList(activeTab, searchKeyword, 1, 12);
  }, [activeTab]);

  /**
   * 将后端数据转换为插件卡片数据
   */
  const convertToPluginCard = (config: ClientConfigVo): PluginCardProps => {
    // 根据分享状态确定标签
    let tag: string | undefined;
    let tagColor: string | undefined;

    if (config.isNewVersion) {
      tag = '有新版本';
      tagColor = '#ff4d4f';
    } else if (config.shareStatus === EcosystemShareStatusEnum.PUBLISHED) {
      tag = '官方推荐';
      tagColor = '#1890ff';
    }
    const isMyShare = activeTab === 'shared';
    return {
      icon:
        config.icon ||
        'https://agent-1251073634.cos.ap-chengdu.myqcloud.com/store/b5fdb62e8b994a418d0fdfae723ee827.png',
      title: config.name || '未命名插件',
      description: config.description || '暂无描述',
      tag,
      tagColor,
      isNewVersion: config.isNewVersion,
      configParamJson: config.configParamJson,
      localConfigParamJson: config.configParamJson,
      isEnabled: config.useStatus === EcosystemUseStatusEnum.ENABLED,
      shareStatus: isMyShare ? config.shareStatus : undefined, // 仅在我的分享中使用
      publishDoc: config.publishDoc,
    };
  };

  /**
   * 处理搜索
   */
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
    setPagination({ current: 1, pageSize: 12 });
    fetchPluginList(activeTab, value, 1, 12);
  };

  /**
   * 处理插件详情抽屉关闭
   */
  const handleDetailClose = () => {
    setSelectedPlugin(null);
    setDrawerVisible(false);
  };

  /**
   * 处理插件启用/禁用切换
   */
  const handleToggleEnable = async () => {
    if (!selectedPlugin?.uid) return;

    try {
      // 这里需要调用启用/禁用的API
      // 目前后端接口中没有提供，可以通过更新草稿的方式实现
      const newUseStatus =
        selectedPlugin.useStatus === EcosystemUseStatusEnum.ENABLED
          ? EcosystemUseStatusEnum.DISABLED
          : EcosystemUseStatusEnum.ENABLED;

      // 如果是草稿状态，可以直接更新
      if (selectedPlugin.shareStatus === EcosystemShareStatusEnum.DRAFT) {
        const updateParams: ClientConfigUpdateDraftReqDTO = {
          uid: selectedPlugin.uid,
          name: selectedPlugin.name || '',
          description: selectedPlugin.description,
          dataType: selectedPlugin.dataType || EcosystemDataTypeEnum.PLUGIN,
          targetType: selectedPlugin.targetType,
          targetId: selectedPlugin.targetId,
          categoryCode: selectedPlugin.categoryCode,
          categoryName: selectedPlugin.categoryName,
          useStatus: newUseStatus,
          author: selectedPlugin.author,
          publishDoc: selectedPlugin.publishDoc,
          configParamJson:
            typeof selectedPlugin.configParamJson === 'string'
              ? selectedPlugin.configParamJson
              : JSON.stringify(selectedPlugin.configParamJson || {}),
          configJson:
            typeof selectedPlugin.configJson === 'string'
              ? selectedPlugin.configJson
              : JSON.stringify(selectedPlugin.configJson || {}),
          icon: selectedPlugin.icon,
        };

        const result = await updateClientConfigDraft(updateParams);
        if (result) {
          setSelectedPlugin(result);
          message.success(
            newUseStatus === EcosystemUseStatusEnum.ENABLED
              ? '插件已启用'
              : '插件已禁用',
          );
          // 刷新列表
          fetchPluginList();
        } else {
          message.error('操作失败');
        }
      } else {
        message.info('只有草稿状态的插件可以修改启用状态');
      }
    } catch (error) {
      console.error('切换插件状态失败:', error);
      message.error('操作失败');
    }
  };

  /**
   * 更新配置处理函数
   */
  const handleUpdate = () => {
    if (!selectedPlugin) return;

    setEditingPlugin(selectedPlugin);
    setIsEditMode(true);
    setDrawerVisible(false);
    setShareModalVisible(true);
  };

  /**
   * 停用插件处理函数
   */
  const handleDisable = async () => {
    if (!selectedPlugin?.uid) return;

    try {
      // 如果是已发布状态，调用下线接口
      if (selectedPlugin.shareStatus === EcosystemShareStatusEnum.PUBLISHED) {
        const result = await offlineClientConfig(selectedPlugin.uid);
        if (result) {
          message.success('插件已下线');
          setDrawerVisible(false);
          fetchPluginList();
        } else {
          message.error('下线失败');
        }
      } else {
        // 其他状态可以考虑删除或禁用
        message.info('当前状态无法下线');
      }
    } catch (error) {
      console.error('停用插件失败:', error);
      message.error('操作失败');
    }
  };

  /**
   * 创建分享
   */
  const handleCreateShare = () => {
    setIsEditMode(false);
    setEditingPlugin(null);
    setShareModalVisible(true);
  };

  /**
   * 关闭分享弹窗
   */
  const handleCloseShareModal = () => {
    setShareModalVisible(false);
    setEditingPlugin(null);
  };

  const refreshPluginListAndReset = () => {
    fetchPluginList();
    setShareModalVisible(false);
    setEditingPlugin(null);
  };

  /**
   * 保存分享
   */
  const handleSaveShare = async (values: any, isDraft: boolean) => {
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
      } else {
        message.error('操作失败');
      }
    } catch (error) {
      console.error('保存分享失败:', error);
      message.error('操作失败');
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
    fetchPluginList(
      activeTab,
      searchKeyword,
      page,
      pageSize || pagination.pageSize,
    );
  };

  /**
   * 渲染右侧操作区域
   */
  const renderExtraContent = () => {
    if (activeTab === 'shared') {
      return (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateShare}
          className={cx(styles.createShareButton)}
        >
          创建分享
        </Button>
      );
    }
    return null;
  };

  // 配置 Tabs 的 items
  const tabItems: TabsProps['items'] = [
    {
      key: 'all',
      label: `全部`,
    },
    {
      key: 'enabled',
      label: `已启用`,
    },
    {
      key: 'shared',
      label: `我的分享`,
    },
  ];

  const [show, setShow] = useState(false);
  const [pluginInfo, setPluginInfo] = useState<PluginShareModalData | null>(
    null,
  );
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);
  // 查询智能体配置组件列表
  const onAddedPlugin = (item: CreatedNodeItem) => {
    item.type = item.targetType;
    item.typeId = item.targetId;
    setShow(false);
    setPluginInfo({
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
  const handlePluginClick = async (config: ClientConfigVo) => {
    // 如果是我的分享标签页，则进入编辑模式
    if (activeTab === 'shared') {
      setEditingPlugin(config);
      setIsEditMode(true);
      setShareModalVisible(true);
      setShow(false);
      const targetType = config.targetType;
      const item: PluginShareModalData = {
        uid: config.uid,
        name: config.name || '',
        description: config.description || '',
        targetType,
        targetId: (config.targetId || '').toString(),
        author: config.author || '',
        publishDoc: config.publishDoc || '',
        shareStatus: config.shareStatus,
        configParamJson: config.configParamJson,
      };
      setPluginInfo(item);
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
      message.success('插件已下线');
      fetchPluginList();
    } else {
      message.error('下线失败');
    }
  };

  return (
    <div className={cx(styles.container)}>
      <Card className={cx(styles.contentCard)} title="模板" variant="outlined">
        <div className={cx(styles.header)}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className={cx(styles.tabs)}
            items={tabItems}
          />

          <div className={cx(styles.headerRight)}>
            {renderExtraContent()}
            <Search
              className={cx(styles.searchInput)}
              placeholder="搜索插件"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={handleSearch}
              allowClear
            />
          </div>
        </div>

        <Spin spinning={loading}>
          <div className={cx(styles.pluginList)}>
            <Row gutter={[16, 16]}>
              {pluginData.records?.map((config, index) => (
                <Col
                  span={6}
                  key={config.uid || index}
                  className={cx(styles.pluginCol)}
                >
                  <PluginCard
                    {...convertToPluginCard(config)}
                    onClick={() => handlePluginClick(config)}
                  />
                </Col>
              ))}
            </Row>

            {/* 分页组件 */}
            {pluginData.total && pluginData.total > 0 && (
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
            )}
          </div>
        </Spin>
      </Card>

      {/* 插件详情抽屉 */}
      <PluginDetailDrawer
        visible={drawerVisible}
        plugin={
          selectedPlugin
            ? ({
                ...convertToPluginCard(selectedPlugin),
                // 添加额外的详情信息
                version: selectedPlugin.versionNumber?.toString(),
                author: selectedPlugin.author,
                publishTime: selectedPlugin.publishTime,
                shareStatus: selectedPlugin.shareStatus,
              } as ExtendedPluginProps)
            : undefined
        }
        onClose={handleDetailClose}
        onToggleEnable={handleToggleEnable}
        onUpdate={handleUpdate}
        onDisable={handleDisable}
      />

      {/* 插件分享弹窗 */}
      <EcosystemShareModal
        type={EcosystemDataTypeEnum.TEMPLATE}
        visible={shareModalVisible}
        isEdit={isEditMode}
        onClose={handleCloseShareModal}
        onOffline={handleOffline}
        onSave={handleSaveShare}
        data={pluginInfo}
        onAddPlugin={() => {
          setShow(true);
        }}
        onRemovePlugin={() => {
          setPluginInfo(null);
          setAddComponents([]);
        }}
      />
      {/*添加插件、工作流、知识库、数据库弹窗*/}
      <Created
        checkTag={AgentComponentTypeEnum.Agent}
        onAdded={onAddedPlugin}
        open={show}
        onCancel={() => setShow(false)}
        addComponents={addComponents}
        hideTop={[
          AgentComponentTypeEnum.Table,
          AgentComponentTypeEnum.Knowledge,
          AgentComponentTypeEnum.Plugin,
        ]}
      />
    </div>
  );
}
