import Created from '@/components/Created';
import EcosystemShareModal, {
  EcosystemShareModalProps,
} from '@/components/EcosystemShareModal';
import type { PluginCardProps } from '@/components/PluginCard';
import PluginCard from '@/components/PluginCard';
import PluginDetailDrawer from '@/components/PluginDetailDrawer';
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
export default function EcosystemPlugin() {
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
            dataType: EcosystemDataTypeEnum.PLUGIN, // 只查询插件类型
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
      configParamJson: config.serverConfigParamJson,
      localConfigParamJson: config.localConfigParamJson,
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
  const [pluginInfo, setPluginInfo] = useState<EcosystemShareModalProps | null>(
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
      const item: EcosystemShareModalProps = {
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
      <Card className={cx(styles.contentCard)} title="插件" variant="outlined">
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
                <Col span={6} key={config.uid || index}>
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
        onUpdateAndEnable={handleUpdateAndEnable}
        onDisable={handleDisable}
      />

      {/* 插件分享弹窗 */}
      <EcosystemShareModal
        type={EcosystemDataTypeEnum.PLUGIN}
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
        checkTag={AgentComponentTypeEnum.Plugin}
        onAdded={onAddedPlugin}
        open={show}
        onCancel={() => setShow(false)}
        addComponents={addComponents}
        hideTop={[
          AgentComponentTypeEnum.Table,
          AgentComponentTypeEnum.Workflow,
          AgentComponentTypeEnum.Knowledge,
        ]}
      />
    </div>
  );
}
