import SvgIcon from '@/components/base/SvgIcon';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import {
  AppstoreOutlined,
  CodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  EyeOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import React, { useMemo, useState } from 'react';
import './SvgIconShowcase.less';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

/**
 * SvgIcon 图标展示页面
 * 展示项目中所有可用的 SVG 图标，支持搜索、分类查看和复制代码
 */
const SvgIconShowcase: React.FC = () => {
  const { data } = useUnifiedTheme();
  const isChineseLanguage = data.language === 'zh-CN';
  const [searchText, setSearchText] = useState('');

  // 所有可用的图标数据
  const iconCategories = [
    {
      name: isChineseLanguage ? '导航图标' : 'Navigation Icons',
      key: 'nav',
      prefix: 'icons-nav-',
      icons: [
        'icons-nav-home',
        'icons-nav-workspace',
        'icons-nav-ecosystem',
        'icons-nav-square',
        'icons-nav-doc',
        'icons-nav-layout',
        'icons-nav-settings',
        'icons-nav-stars',
        'icons-nav-plugins',
        'icons-nav-template',
        'icons-nav-workflow',
        'icons-nav-new_chat',
        'icons-nav-notification',
        'icons-nav-mcp',
        'icons-nav-components',
        'icons-nav-space_square',
        'icons-nav-user',
        'icons-nav-publish_audit',
        'icons-nav-backward',
        'icons-nav-palette',
        'icons-nav-sidebar',
      ],
      color: '#1890ff',
    },
    {
      name: isChineseLanguage ? '聊天图标' : 'Chat Icons',
      key: 'chat',
      prefix: 'icons-chat-',
      icons: [
        'icons-chat-send',
        'icons-chat-network',
        'icons-chat-copy',
        'icons-chat-stop',
        'icons-chat-add',
        'icons-chat-clear',
        'icons-chat-deep_thinking',
        'icons-chat-clock',
        'icons-chat-collect',
        'icons-chat-collected',
        'icons-chat-history',
        'icons-chat-info',
        'icons-chat-share',
        'icons-chat-close-fill',
        'icons-chat-close',
        'icons-chat-user',
        'icons-chat-chat',
        'icons-chat-close_regular',
      ],
      color: '#52c41a',
    },
    {
      name: isChineseLanguage ? '工作区图标' : 'Workspace Icons',
      key: 'workspace',
      prefix: 'icons-workspace-',
      icons: [
        'icons-workspace-agent',
        'icons-workspace-caret_down',
        'icons-workspace-knowlege',
        'icons-workspace-llm',
        'icons-workspace-mcp',
        'icons-workspace-plugin',
        'icons-workspace-table',
        'icons-workspace-workflow',
      ],
      color: '#722ed1',
    },
    {
      name: isChineseLanguage ? '通用图标' : 'Common Icons',
      key: 'common',
      prefix: 'icons-common-',
      icons: [
        'icons-common-caret_down',
        'icons-common-caret_up',
        'icons-common-caret_right',
        'icons-common-caret_left',
        'icons-common-more',
        'icons-common-stars',
        'icons-common-debug',
        'icons-common-plus',
        'icons-common-straw',
        'icons-common-delete',
        'icons-common-edit',
      ],
      color: '#fa8c16',
    },
  ];

  // 过滤后的图标数据
  const filteredCategories = useMemo(() => {
    if (!searchText.trim()) {
      return iconCategories;
    }

    return iconCategories
      .map((category) => ({
        ...category,
        icons: category.icons.filter((iconName) =>
          iconName.toLowerCase().includes(searchText.toLowerCase()),
        ),
      }))
      .filter((category) => category.icons.length > 0);
  }, [searchText, iconCategories]);

  // 复制图标代码到剪贴板
  const copyIconCode = (iconName: string) => {
    const code = `<SvgIcon name="${iconName}" />`;
    navigator.clipboard.writeText(code).then(() => {
      message.success(
        isChineseLanguage ? '代码已复制到剪贴板' : 'Code copied to clipboard',
      );
    });
  };

  // 复制所有图标代码
  const copyAllIconsCode = () => {
    const allIcons = iconCategories.flatMap((category) => category.icons);
    const code = allIcons
      .map((iconName) => `<SvgIcon name="${iconName}" />`)
      .join('\n');
    navigator.clipboard.writeText(code).then(() => {
      message.success(
        isChineseLanguage
          ? '所有图标代码已复制到剪贴板'
          : 'All icons code copied to clipboard',
      );
    });
  };

  // 渲染单个图标
  const renderIcon = (iconName: string, categoryColor: string) => (
    <Card
      key={iconName}
      hoverable
      className="icon-card"
      size="small"
      actions={[
        <Button
          key="copy"
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={() => copyIconCode(iconName)}
        >
          {isChineseLanguage ? '复制' : 'Copy'}
        </Button>,
      ]}
    >
      <div className="icon-preview">
        <SvgIcon
          name={iconName}
          style={{
            fontSize: 32,
            color: categoryColor,
            display: 'block',
            margin: '0 auto 8px',
          }}
        />
        <Text
          code
          style={{
            fontSize: 12,
            wordBreak: 'break-all',
            textAlign: 'center',
            display: 'block',
          }}
        >
          {iconName}
        </Text>
      </div>
    </Card>
  );

  return (
    <div className="svg-icon-showcase">
      {/* 页面标题 */}
      <div className="showcase-header">
        <Title level={1}>
          <AppstoreOutlined
            style={{ marginRight: 16, color: 'var(--xagi-color-primary)' }}
          />
          {isChineseLanguage ? 'SvgIcon 图标展示' : 'SvgIcon Showcase'}
        </Title>
        <Paragraph type="secondary">
          {isChineseLanguage
            ? '展示项目中所有可用的 SVG 图标，支持搜索、分类查看和代码复制功能。'
            : 'Showcase all available SVG icons in the project with search, category viewing, and code copying functionality.'}
        </Paragraph>
      </div>

      {/* 搜索和操作区域 */}
      <Card className="search-section">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder={
                isChineseLanguage ? '搜索图标名称...' : 'Search icon names...'
              }
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Button
                icon={<CopyOutlined />}
                onClick={copyAllIconsCode}
                type="primary"
              >
                {isChineseLanguage ? '复制所有代码' : 'Copy All Code'}
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => {
                  const allIcons = iconCategories.flatMap(
                    (category) => category.icons,
                  );
                  const data = JSON.stringify(allIcons, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'svg-icons-list.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                {isChineseLanguage ? '导出列表' : 'Export List'}
              </Button>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <div className="stats">
              <Text type="secondary">
                {isChineseLanguage
                  ? `共 ${iconCategories.reduce(
                      (total, cat) => total + cat.icons.length,
                      0,
                    )} 个图标`
                  : `Total ${iconCategories.reduce(
                      (total, cat) => total + cat.icons.length,
                      0,
                    )} icons`}
                {searchText && (
                  <span style={{ marginLeft: 8 }}>
                    {isChineseLanguage
                      ? `，找到 ${filteredCategories.reduce(
                          (total, cat) => total + cat.icons.length,
                          0,
                        )} 个匹配结果`
                      : `，found ${filteredCategories.reduce(
                          (total, cat) => total + cat.icons.length,
                          0,
                        )} matches`}
                  </span>
                )}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 图标分类展示 */}
      {filteredCategories.length > 0 ? (
        <Row gutter={[24, 24]}>
          {filteredCategories.map((category) => (
            <Col span={24} key={category.key}>
              <Card
                title={
                  <Space>
                    <div
                      className="category-indicator"
                      style={{ backgroundColor: category.color }}
                    />
                    <Title level={4} style={{ margin: 0 }}>
                      {category.name}
                    </Title>
                    <Tag color={category.color}>
                      {category.icons.length}{' '}
                      {isChineseLanguage ? '个图标' : 'icons'}
                    </Tag>
                  </Space>
                }
                className="category-card"
              >
                <Row gutter={[16, 16]}>
                  {category.icons.map((iconName) => (
                    <Col xs={12} sm={8} md={6} lg={4} xl={3} key={iconName}>
                      {renderIcon(iconName, category.color)}
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card>
          <Empty
            description={
              isChineseLanguage
                ? '没有找到匹配的图标'
                : 'No matching icons found'
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}

      {/* 颜色调试区域 */}
      <Card
        title={
          <Space>
            <SvgIcon
              name="icons-nav-palette"
              style={{ fontSize: 20, color: 'var(--xagi-color-primary)' }}
            />
            {isChineseLanguage
              ? 'Layout 图标颜色调试'
              : 'Layout Icon Color Debug'}
          </Space>
        }
        className="color-debug-section"
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <div className="debug-item">
              <Title level={5}>
                {isChineseLanguage ? '不同颜色测试' : 'Different Color Tests'}
              </Title>
              <Paragraph>
                {isChineseLanguage
                  ? '测试 layout.svg 图标在不同颜色设置下的显示效果：'
                  : 'Test the display effect of layout.svg icon under different color settings:'}
              </Paragraph>
              <div className="color-test-grid">
                <div className="color-test-item">
                  <SvgIcon
                    name="icons-nav-layout"
                    viewBox="0 0 34 34"
                    style={{
                      fontSize: 34,
                      borderRadius: 16,
                      color: 'var(--xagi-color-primary)',
                      boxShadow:
                        '0 3px 24px color-mix(in srgb, var(--xagi-color-primary)  0%, var(--xagi-color-primary)  30%)',
                    }}
                  />
                  <Text code>#1890ff (Primary)</Text>
                </div>
                <div className="color-test-item">
                  <SvgIcon
                    name="icons-nav-layout"
                    viewBox="0 0 34 34"
                    style={{ fontSize: 68, color: '#52c41a' }}
                  />
                  <Text code>#52c41a (Success)</Text>
                </div>
                <div className="color-test-item">
                  <SvgIcon
                    name="icons-nav-layout"
                    viewBox="0 0 34 34"
                    style={{ fontSize: 68, color: '#fa8c16' }}
                  />
                  <Text code>#fa8c16 (Warning)</Text>
                </div>
                <div className="color-test-item">
                  <SvgIcon
                    name="icons-nav-layout"
                    viewBox="0 0 34 34"
                    style={{ fontSize: 68, color: '#f5222d' }}
                  />
                  <Text code>#f5222d (Error)</Text>
                </div>
                <div className="color-test-item">
                  <SvgIcon
                    name="icons-nav-layout"
                    viewBox="0 0 34 34"
                    style={{ fontSize: 68, color: '#722ed1' }}
                  />
                  <Text code>#722ed1 (Purple)</Text>
                </div>
                <div className="color-test-item">
                  <SvgIcon
                    name="icons-nav-layout"
                    viewBox="0 0 34 34"
                    style={{ fontSize: 68, color: '#13c2c2' }}
                  />
                  <Text code>#13c2c2 (Cyan)</Text>
                </div>
                <div className="color-test-item">
                  <SvgIcon
                    name="icons-nav-layout"
                    viewBox="0 0 34 34"
                    style={{ fontSize: 68, color: '#eb2f96' }}
                  />
                  <Text code>#eb2f96 (Magenta)</Text>
                </div>
                <div className="color-test-item">
                  <SvgIcon
                    name="icons-nav-layout"
                    viewBox="0 0 34 34"
                    style={{
                      fontSize: 68,
                      color: '#fa541c',
                      borderRadius: 16,
                      overflow: 'hidden',
                      boxShadow: 'var(--xagi-box-shadow)',
                    }}
                  />
                  <Text code>#fa541c (Orange)</Text>
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="debug-item">
              <Title level={5}>
                {isChineseLanguage ? '不同尺寸测试' : 'Different Size Tests'}
              </Title>
              <Paragraph>
                {isChineseLanguage
                  ? '测试 layout.svg 图标在不同尺寸下的显示效果：'
                  : 'Test the display effect of layout.svg icon at different sizes:'}
              </Paragraph>
              <div className="size-test-grid">
                <div className="size-test-item">
                  <SvgIcon
                    name="icons-nav-layout"
                    viewBox="0 0 34 34"
                    style={{ fontSize: 16, color: 'var(--xagi-color-primary)' }}
                  />
                  <Text code>16px</Text>
                </div>
                <div className="size-test-item">
                  <SvgIcon
                    name="icons-nav-layout"
                    viewBox="0 0 34 34"
                    style={{ fontSize: 24, color: 'var(--xagi-color-primary)' }}
                  />
                  <Text code>24px</Text>
                </div>
                <div className="size-test-item">
                  <SvgIcon
                    name="icons-nav-layout"
                    viewBox="0 0 34 34"
                    style={{ fontSize: 32, color: 'var(--xagi-color-primary)' }}
                  />
                  <Text code>32px</Text>
                </div>
                <div className="size-test-item">
                  <SvgIcon
                    name="icons-nav-layout"
                    viewBox="0 0 34 34"
                    style={{ fontSize: 48, color: 'var(--xagi-color-primary)' }}
                  />
                  <Text code>48px</Text>
                </div>
                <div className="size-test-item">
                  <SvgIcon
                    name="icons-nav-layout"
                    viewBox="0 0 34 34"
                    style={{ fontSize: 64, color: 'var(--xagi-color-primary)' }}
                  />
                  <Text code>64px</Text>
                </div>
                <div className="size-test-item">
                  <SvgIcon
                    name="icons-nav-layout"
                    viewBox="0 0 34 34"
                    style={{ fontSize: 96, color: 'var(--xagi-color-primary)' }}
                  />
                  <Text code>96px</Text>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 使用说明 */}
      <Card
        title={
          <Space>
            <CodeOutlined />
            {isChineseLanguage ? '使用说明' : 'Usage Instructions'}
          </Space>
        }
        className="usage-section"
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <div className="usage-item">
              <SettingOutlined
                style={{
                  fontSize: 20,
                  color: 'var(--xagi-color-primary)',
                  marginBottom: 8,
                }}
              />
              <Title level={5}>
                {isChineseLanguage ? '基本用法' : 'Basic Usage'}
              </Title>
              <Paragraph>
                {isChineseLanguage
                  ? '使用 SvgIcon 组件，通过 name 属性指定图标名称：'
                  : 'Use the SvgIcon component with the name prop to specify the icon:'}
              </Paragraph>
              <pre className="code-block">
                <code>{`<SvgIcon name="icons-nav-home" />`}</code>
              </pre>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="usage-item">
              <EyeOutlined
                style={{
                  fontSize: 20,
                  color: 'var(--xagi-color-success)',
                  marginBottom: 8,
                }}
              />
              <Title level={5}>
                {isChineseLanguage ? '自定义样式' : 'Custom Styling'}
              </Title>
              <Paragraph>
                {isChineseLanguage
                  ? '可以通过 style 属性自定义图标的大小和颜色：'
                  : 'Customize icon size and color through the style prop:'}
              </Paragraph>
              <pre className="code-block">
                <code>{`<SvgIcon 
  name="icons-nav-home" 
  style={{ 
    fontSize: 24, 
    color: '#1890ff' 
  }} 
/>`}</code>
              </pre>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default SvgIconShowcase;
