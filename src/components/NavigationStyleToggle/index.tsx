import { useBackgroundStyle } from '@/utils/backgroundStyle';
import {
  AppstoreOutlined,
  HomeOutlined,
  MenuOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Divider,
  Row,
  Space,
  Switch,
  Typography,
} from 'antd';
import React from 'react';
import './index.less';

const { Text, Title } = Typography;

/**
 * 导航风格切换组件
 * 展示两种导航风格的切换效果和Token使用方法
 */
const NavigationStyleToggle: React.FC = () => {
  const {
    navigationStyle,
    setNavigationStyle,
    toggleNavigationStyle,
    layoutStyle,
    toggleLayoutStyle,
  } = useBackgroundStyle();

  const handleNavigationModeChange = (checked: boolean) => {
    const newMode = checked ? 'style2' : 'style1';
    setNavigationStyle(newMode);
  };

  const handleColorStyleToggle = () => {
    toggleLayoutStyle();
  };

  return (
    <div className="navigation-style-toggle">
      <Card title="导航风格Token控制面板" className="control-panel">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 导航布局风格控制 */}
          <div className="control-section">
            <Title level={5}>导航布局风格</Title>
            <Space>
              <Text>风格1（紧凑）</Text>
              <Switch
                checked={navigationStyle === 'style2'}
                onChange={handleNavigationModeChange}
                size="small"
              />
              <Text>风格2（展开）</Text>
            </Space>
            <div className="style-description">
              <Text type="secondary">
                {navigationStyle === 'style1'
                  ? '紧凑模式：无文字导航，60px宽度，页面容器有外边距和圆角'
                  : '展开模式：有文字导航，88px宽度，页面容器无外边距和圆角，二级导航有背景色'}
              </Text>
            </div>
          </div>

          <Divider />

          {/* 布局颜色风格控制（独立于Ant Design主题） */}
          <div className="control-section">
            <Title level={5}>布局颜色风格</Title>
            <Space>
              <Text>浅色风格</Text>
              <Switch
                checked={layoutStyle === 'dark'}
                onChange={handleColorStyleToggle}
                size="small"
              />
              <Text>深色风格</Text>
            </Space>
            <div className="style-description">
              <Text type="secondary">
                {layoutStyle === 'light'
                  ? '浅色模式：黑色文字，白色背景（独立于Ant Design主题）'
                  : '深色模式：白色文字，深色背景（独立于Ant Design主题）'}
              </Text>
            </div>
          </div>

          <Divider />

          {/* 快速切换按钮 */}
          <div className="control-section">
            <Title level={5}>快速操作</Title>
            <Space wrap>
              <Button onClick={toggleNavigationStyle} icon={<MenuOutlined />}>
                切换导航风格
              </Button>
              <Button
                onClick={handleColorStyleToggle}
                icon={<SettingOutlined />}
              >
                切换布局风格
              </Button>
            </Space>
          </div>
        </Space>
      </Card>

      {/* 导航示例展示 */}
      <Card title="导航效果预览" className="preview-panel">
        <Row gutter={[16, 16]}>
          {/* 一级导航示例 */}
          <Col span={24}>
            <Title level={5}>一级导航效果</Title>
            <div className="navigation-preview">
              <div className="first-menu">
                <div className="menu-item">
                  <HomeOutlined className="menu-icon" />
                  {navigationStyle === 'style2' && (
                    <span className="menu-text">主页</span>
                  )}
                </div>
                <div className="menu-item active">
                  <AppstoreOutlined className="menu-icon" />
                  {navigationStyle === 'style2' && (
                    <span className="menu-text">应用</span>
                  )}
                </div>
                <div className="menu-item">
                  <UserOutlined className="menu-icon" />
                  {navigationStyle === 'style2' && (
                    <span className="menu-text">用户</span>
                  )}
                </div>
                <div className="menu-item">
                  <SettingOutlined className="menu-icon" />
                  {navigationStyle === 'style2' && (
                    <span className="menu-text">设置</span>
                  )}
                </div>
              </div>
            </div>
          </Col>

          {/* 二级导航示例 */}
          <Col span={24}>
            <Title level={5}>二级导航效果</Title>
            <div className="second-menu">
              <div className="second-menu-item">
                <Text className="primary-text">主要功能</Text>
              </div>
              <div className="second-menu-item">
                <Text className="secondary-text">次要功能</Text>
              </div>
              <div className="second-menu-item">
                <Text className="tertiary-text">辅助功能</Text>
              </div>
            </div>
          </Col>

          {/* 页面容器示例 */}
          <Col span={24}>
            <Title level={5}>页面容器效果</Title>
            <div className="page-container-preview">
              <div className="mock-content">
                <Text>这是页面内容区域</Text>
                <div className="content-box">
                  <Text type="secondary">
                    容器样式根据导航风格自动调整：
                    {navigationStyle === 'style1'
                      ? '有外边距和圆角'
                      : '无外边距和圆角，与二级导航背景统一'}
                  </Text>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Token使用说明 */}
      <Card title="Token使用说明" className="usage-panel">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Title level={5}>CSS变量使用</Title>
            <pre className="code-block">
              {`/* 使用 Ant Design CSS 变量 */
.first-menu {
  width: var(--xagi-nav-first-menu-width${
    navigationStyle === 'style2' ? ', 88px' : ', 60px'
  });
  background: var(--xagi-color-bg-container);
  color: var(--xagi-color-text);
}

/* 页面容器 */
.page-container {
  margin: var(--xagi-page-container-margin${
    navigationStyle === 'style2' ? ', 0px' : ', 16px'
  });
  border-radius: var(--xagi-page-container-border-radius${
    navigationStyle === 'style2' ? ', 0px' : ', 12px'
  });
  background: var(--xagi-color-bg-layout);
}`}
            </pre>
          </div>

          <div>
            <Title level={5}>Less变量使用</Title>
            <pre className="code-block">
              {`/* 使用 Less 变量 */
.navigation {
  width: @navFirstMenuWidth${navigationStyle === 'style2' ? 'Style2' : ''};
  background: @navFirstMenuBg;
  color: @navFirstMenuText;
  
  .nav-item {
    &:hover { background: @navItemHoverBg; }
    &.active { background: @navItemActiveBg; }
  }
}

.page-container {
  margin: @pageContainerMargin;
  border-radius: @pageContainerBorderRadius;
  background: @pageContainerBg;
}`}
            </pre>
          </div>

          <div>
            <Title level={5}>React Hook使用（独立的布局风格系统）</Title>
            <pre className="code-block">
              {`import { useBackgroundStyle } from '@/utils/backgroundStyle';

const MyComponent = () => {
  const { 
    navigationStyle, 
    setNavigationStyle,
    toggleNavigationStyle,
    layoutStyle, // 布局风格（非Ant Design主题）
    toggleLayoutStyle
  } = useBackgroundStyle();
  
  return (
    <div className={\`nav-container nav-\${navigationStyle} xagi-layout-\${layoutStyle}\`}>
      {/* 组件内容 */}
    </div>
  );
};`}
            </pre>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default NavigationStyleToggle;
