import type { PluginCardProps } from '@/components/PluginCard';
import PluginCard from '@/components/PluginCard';
import PluginDetailDrawer from '@/components/PluginDetailDrawer';
import PluginShareModal from '@/components/PluginShareModal';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Input, Row, Tabs } from 'antd';
import { useState } from 'react';
import styles from './index.less';

const { TabPane } = Tabs;
const { Search } = Input;

/**
 * 生态市场插件页面
 * 展示插件列表，包括全部、已启用和我的分享三个标签页
 */
export default function EcosystemPlugin() {
  // 搜索关键词
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  // 当前激活的标签页
  const [activeTab, setActiveTab] = useState<string>('all');
  // 插件详情抽屉是否可见
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  // 当前选中的插件
  const [selectedPlugin, setSelectedPlugin] = useState<
    | (PluginCardProps & {
        isEnabled?: boolean;
      })
    | null
  >(null);
  // 已启用的插件ID集合
  const [enabledPluginIds, setEnabledPluginIds] = useState<Set<string>>(
    new Set(),
  );
  // 分享弹窗是否可见
  const [shareModalVisible, setShareModalVisible] = useState<boolean>(false);
  // 是否是编辑模式
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  // 当前编辑的插件
  const [editingPlugin, setEditingPlugin] = useState<PluginCardProps | null>(
    null,
  );

  // 模拟插件数据
  const allPlugins: PluginCardProps[] = [
    {
      icon: 'https://agent-1251073634.cos.ap-chengdu.myqcloud.com/store/b5fdb62e8b994a418d0fdfae723ee827.png',
      title: '联网搜索',
      description:
        '本日交新官方，在互联网上搜相关信息，响应今日新闻、天气情况、国际形势、技术科普等；在互联网上搜索相关信息，响应今日新闻、天气情况',
      tag: '官方推荐',
      tagColor: '#1890ff',
      isEnabled: true,
    },
    {
      icon: 'https://agent-1251073634.cos.ap-chengdu.myqcloud.com/store/b5fdb62e8b994a418d0fdfae723ee827.png',
      title: '联网搜索',
      description:
        '本日交新官方，在互联网上搜相关信息，响应今日新闻、天气情况、国际形势、技术科普等；在互联网上搜索相关信息，响应今日新闻、天气情况',
      isEnabled: true,
    },
    {
      icon: 'https://agent-1251073634.cos.ap-chengdu.myqcloud.com/store/b5fdb62e8b994a418d0fdfae723ee827.png',
      title: '联网搜索',
      description:
        '本日交新官方，在互联网上搜相关信息，响应今日新闻、天气情况、国际形势、技术科普等；在互联网上搜索相关信息，响应今日新闻、天气情况',
      tag: '有新版本',
      tagColor: '#ff4d4f',
      isEnabled: true,
    },
    {
      icon: 'https://agent-1251073634.cos.ap-chengdu.myqcloud.com/store/b5fdb62e8b994a418d0fdfae723ee827.png',
      title: '联网搜索',
      description:
        '本日交新官方，在互联网上搜相关信息，响应今日新闻、天气情况、国际形势、技术科普等；在互联网上搜索相关信息，响应今日新闻、天气情况',
      isEnabled: true,
    },
  ];

  // 已启用插件数据
  const enabledPlugins: PluginCardProps[] = allPlugins.filter((plugin) =>
    enabledPluginIds.has(plugin.title),
  );

  // 我的分享插件数据
  const mySharedPlugins: PluginCardProps[] = allPlugins.slice(0, 1);

  // 根据搜索关键词过滤插件
  const filterPlugins = (plugins: PluginCardProps[]) => {
    if (!searchKeyword) return plugins;
    return plugins.filter(
      (plugin) =>
        plugin.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchKeyword.toLowerCase()),
    );
  };

  // 处理插件卡片点击事件
  const handlePluginClick = (plugin: PluginCardProps) => {
    // 如果是我的分享标签页，则进入编辑模式
    if (activeTab === 'shared') {
      setEditingPlugin(plugin);
      setIsEditMode(true);
      setShareModalVisible(true);
    } else {
      setSelectedPlugin({
        ...plugin,
        isEnabled: enabledPluginIds.has(plugin.title),
      });
      setDrawerVisible(true);
    }
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchKeyword(value);
  };

  // 处理插件详情抽屉关闭
  const handleDetailClose = () => {
    setSelectedPlugin(null);
    setDrawerVisible(false);
  };

  // 处理插件安装/卸载
  const handleToggleEnable = () => {
    if (!selectedPlugin) return;

    const newEnabledPluginIds = new Set(enabledPluginIds);

    if (newEnabledPluginIds.has(selectedPlugin.title)) {
      newEnabledPluginIds.delete(selectedPlugin.title);
    } else {
      newEnabledPluginIds.add(selectedPlugin.title);
    }

    setEnabledPluginIds(newEnabledPluginIds);

    // 更新当前选中插件的启用状态
    setSelectedPlugin({
      ...selectedPlugin,
      isEnabled: !selectedPlugin.isEnabled,
    });
  };

  // 更新配置处理函数
  const handleUpdate = () => {
    console.log('更新配置', selectedPlugin?.title);
    // 这里可以添加更新配置的逻辑
  };

  // 停用插件处理函数
  const handleDisable = () => {
    if (!selectedPlugin) return;

    const newEnabledPluginIds = new Set(enabledPluginIds);
    if (newEnabledPluginIds.has(selectedPlugin.title)) {
      newEnabledPluginIds.delete(selectedPlugin.title);
    }

    setEnabledPluginIds(newEnabledPluginIds);
    setDrawerVisible(false); // 关闭抽屉
  };

  // 创建分享
  const handleCreateShare = () => {
    setIsEditMode(false);
    setEditingPlugin(null);
    setShareModalVisible(true);
  };

  // 关闭分享弹窗
  const handleCloseShareModal = () => {
    setShareModalVisible(false);
    setEditingPlugin(null);
  };

  // 保存分享
  const handleSaveShare = (values: any) => {
    console.log('保存分享', values);
    // 这里可以添加保存分享的逻辑，例如发送API请求
    setShareModalVisible(false);
  };

  // 获取当前标签页显示的插件列表
  const getCurrentPlugins = () => {
    switch (activeTab) {
      case 'all':
        return filterPlugins(allPlugins);
      case 'enabled':
        return filterPlugins(enabledPlugins);
      case 'shared':
        return filterPlugins(mySharedPlugins);
      default:
        return [];
    }
  };

  // 渲染右侧操作区域
  const renderExtraContent = () => {
    if (activeTab === 'shared') {
      return (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateShare}
          className={styles.createShareButton}
        >
          创建分享
        </Button>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <Card className={styles.contentCard} bordered={false}>
        <div className={styles.header}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className={styles.tabs}
          >
            <TabPane tab="全部" key="all" />
            <TabPane tab="已启用" key="enabled" />
            <TabPane tab="我的分享" key="shared" />
          </Tabs>

          <div className={styles.headerRight}>
            {renderExtraContent()}
            <Search
              className={styles.searchInput}
              placeholder="搜索插件"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={handleSearch}
              allowClear
            />
          </div>
        </div>

        <div className={styles.pluginList}>
          <Row gutter={[16, 16]}>
            {getCurrentPlugins().map((plugin, index) => (
              <Col span={6} key={index} className={styles.pluginCol}>
                <PluginCard
                  {...plugin}
                  onClick={() => handlePluginClick(plugin)}
                />
              </Col>
            ))}
          </Row>
        </div>
      </Card>

      {/* 插件详情抽屉 */}
      <PluginDetailDrawer
        visible={drawerVisible}
        plugin={selectedPlugin || undefined}
        onClose={handleDetailClose}
        onToggleEnable={handleToggleEnable}
        onUpdate={handleUpdate}
        onDisable={handleDisable}
      />

      {/* 插件分享弹窗 */}
      <PluginShareModal
        visible={shareModalVisible}
        plugin={editingPlugin || undefined}
        isEdit={isEditMode}
        onClose={handleCloseShareModal}
        onSave={handleSaveShare}
      />
    </div>
  );
}
