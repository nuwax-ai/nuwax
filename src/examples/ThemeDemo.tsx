import BackgroundQuickSwitch from '@/components/BackgroundQuickSwitch';
import GlobalBackgroundManager from '@/components/GlobalBackgroundManager';
import useGlobalSettings from '@/hooks/useGlobalSettings';
import useTexts from '@/hooks/useTexts';
import {
  BulbOutlined,
  HeartOutlined,
  MoonOutlined,
  PictureOutlined,
  SunOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  message,
  Notification,
  Popover,
  Radio,
  Row,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import React from 'react';
import './ThemeDemo.less';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

/**
 * 主题和多语言功能演示组件
 * 展示如何使用全局主题切换、多语言功能和背景图片切换功能
 */
const ThemeDemo: React.FC = () => {
  const {
    theme,
    language,
    isDarkMode,
    isChineseLanguage,
    toggleTheme,
    toggleLanguage,
    backgroundImageId,
    setBackgroundImage,
    backgroundImages,
    getCurrentBackgroundImage,
  } = useGlobalSettings();

  const texts = useTexts();

  // 显示消息提示
  const showMessage = () => {
    message.success(texts.saveSuccess);
  };

  // 显示通知
  const showNotification = () => {
    Notification.info({
      message: texts.globalSettings,
      description: `${texts.theme}: ${
        isDarkMode ? texts.darkTheme : texts.lightTheme
      }`,
      icon: <BulbOutlined style={{ color: '#1890ff' }} />,
    });
  };

  // 背景图片选择器组件
  const BackgroundImageSelector = () => (
    <div style={{ minWidth: '280px' }}>
      <div style={{ marginBottom: '12px', fontWeight: 500 }}>
        {isChineseLanguage ? '选择背景图片' : 'Select Background Image'}
      </div>
      <Radio.Group
        value={backgroundImageId}
        onChange={(e) => setBackgroundImage(e.target.value)}
      >
        <Space direction="vertical" size="small">
          {backgroundImages.map((bg) => (
            <Radio key={bg.id} value={bg.id}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '24px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid #d9d9d9',
                  }}
                >
                  <img
                    src={bg.preview}
                    alt={bg.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                <span>{bg.name}</span>
              </div>
            </Radio>
          ))}
        </Space>
      </Radio.Group>
    </div>
  );

  return (
    <div className="theme-demo">
      <Tabs defaultActiveKey="basic" size="large">
        <TabPane tab="基础功能" key="basic">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 标题区域 */}
            <Card>
              <Title level={2}>
                <HeartOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                {isChineseLanguage
                  ? '主题与多语言演示'
                  : 'Theme & Multi-language Demo'}
              </Title>
              <Paragraph type="secondary">
                {isChineseLanguage
                  ? '这是一个展示全局主题切换、多语言功能和背景图片切换的演示组件。您可以通过右下角的设置按钮进行配置。'
                  : 'This is a demo component showing global theme switching, multi-language functionality and background image switching. You can configure through the settings button in the bottom right corner.'}
              </Paragraph>
            </Card>

            {/* 当前设置显示 */}
            <Card title={texts.globalSettings}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{texts.theme}</Text>
                    <Tag
                      color={isDarkMode ? 'purple' : 'orange'}
                      icon={isDarkMode ? <MoonOutlined /> : <SunOutlined />}
                    >
                      {isDarkMode ? texts.darkTheme : texts.lightTheme}
                    </Tag>
                  </Space>
                </Col>
                <Col span={8}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>{texts.language}</Text>
                    <Tag color="blue" icon={<TranslationOutlined />}>
                      {isChineseLanguage ? texts.chinese : texts.english}
                    </Tag>
                  </Space>
                </Col>
                <Col span={8}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong>
                      {isChineseLanguage ? '背景图片' : 'Background'}
                    </Text>
                    <Tag color="green" icon={<PictureOutlined />}>
                      {getCurrentBackgroundImage?.name || '默认'}
                    </Tag>
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* 快速切换区域 */}
            <Card title={isChineseLanguage ? '快速切换' : 'Quick Switch'}>
              <Space size="large" wrap>
                <Space direction="vertical" align="center">
                  <Text>{texts.toggleTheme}</Text>
                  <Switch
                    checked={isDarkMode}
                    onChange={toggleTheme}
                    checkedChildren={<MoonOutlined />}
                    unCheckedChildren={<SunOutlined />}
                    size="default"
                  />
                </Space>

                <Space direction="vertical" align="center">
                  <Text>{texts.toggleLanguage}</Text>
                  <Switch
                    checked={!isChineseLanguage}
                    onChange={toggleLanguage}
                    checkedChildren="EN"
                    unCheckedChildren="中"
                    size="default"
                  />
                </Space>

                <Space direction="vertical" align="center">
                  <Text>
                    {isChineseLanguage ? '背景切换' : 'Background Switch'}
                  </Text>
                  <Popover
                    content={<BackgroundImageSelector />}
                    title={
                      isChineseLanguage ? '选择背景图片' : 'Select Background'
                    }
                    trigger="click"
                    placement="bottom"
                  >
                    <Button icon={<PictureOutlined />} size="small">
                      {isChineseLanguage ? '选择' : 'Select'}
                    </Button>
                  </Popover>
                </Space>
              </Space>
            </Card>

            {/* 背景图片预览区域 */}
            <Card
              title={
                isChineseLanguage
                  ? '当前背景预览'
                  : 'Current Background Preview'
              }
            >
              <div
                style={{
                  height: '200px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #d9d9d9',
                  position: 'relative',
                }}
              >
                <img
                  src={getCurrentBackgroundImage?.preview}
                  alt={getCurrentBackgroundImage?.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '8px 12px',
                    fontSize: '14px',
                  }}
                >
                  {getCurrentBackgroundImage?.name || '默认背景'}
                </div>
              </div>
            </Card>

            {/* 组件展示区域 */}
            <Card title={isChineseLanguage ? '组件展示' : 'Component Showcase'}>
              <Space
                direction="vertical"
                size="middle"
                style={{ width: '100%' }}
              >
                <Space wrap>
                  <Button type="primary">{texts.confirm}</Button>
                  <Button>{texts.cancel}</Button>
                  <Button type="dashed">{texts.save}</Button>
                  <Button danger>{texts.delete}</Button>
                </Space>

                <Alert
                  message={texts.success}
                  description={texts.saveSuccess}
                  type="success"
                  showIcon
                  closable
                />

                <Space wrap>
                  <Button onClick={showMessage}>
                    {isChineseLanguage ? '显示消息' : 'Show Message'}
                  </Button>
                  <Button onClick={showNotification}>
                    {isChineseLanguage ? '显示通知' : 'Show Notification'}
                  </Button>
                </Space>
              </Space>
            </Card>

            {/* 设置信息 */}
            <Card
              title={isChineseLanguage ? '当前配置' : 'Current Configuration'}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text code>Theme: {theme}</Text>
                <Text code>Language: {language}</Text>
                <Text code>Background: {backgroundImageId}</Text>
                <Text code>isDarkMode: {isDarkMode.toString()}</Text>
                <Text code>
                  isChineseLanguage: {isChineseLanguage.toString()}
                </Text>
              </Space>
            </Card>
          </Space>
        </TabPane>

        <TabPane tab="背景管理" key="background">
          <GlobalBackgroundManager />
        </TabPane>

        <TabPane tab="快速切换" key="quick-switch">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="背景快速切换组件演示">
              <Space
                direction="vertical"
                size="large"
                style={{ width: '100%' }}
              >
                <div>
                  <Text strong>默认样式：</Text>
                  <BackgroundQuickSwitch />
                </div>

                <div>
                  <Text strong>主要样式：</Text>
                  <BackgroundQuickSwitch type="primary" />
                </div>

                <div>
                  <Text strong>虚线样式：</Text>
                  <BackgroundQuickSwitch type="dashed" />
                </div>

                <div>
                  <Text strong>小尺寸：</Text>
                  <BackgroundQuickSwitch size="small" />
                </div>

                <div>
                  <Text strong>大尺寸：</Text>
                  <BackgroundQuickSwitch size="large" />
                </div>

                <div>
                  <Text strong>隐藏随机按钮：</Text>
                  <BackgroundQuickSwitch showRandom={false} />
                </div>

                <div>
                  <Text strong>隐藏设置按钮：</Text>
                  <BackgroundQuickSwitch showSettings={false} />
                </div>

                <div>
                  <Text strong>只显示背景选择：</Text>
                  <BackgroundQuickSwitch
                    showRandom={false}
                    showSettings={false}
                  />
                </div>
              </Space>
            </Card>

            <Card title="使用说明">
              <Paragraph>
                <Text strong>BackgroundQuickSwitch 组件特点：</Text>
              </Paragraph>
              <ul>
                <li>轻量级：只包含必要的背景切换功能</li>
                <li>可配置：支持显示/隐藏随机切换和设置按钮</li>
                <li>多样式：支持不同的按钮类型和尺寸</li>
                <li>响应式：自动适配不同屏幕尺寸</li>
                <li>易集成：可以在任何页面或组件中使用</li>
              </ul>

              <Paragraph>
                <Text strong>使用方式：</Text>
              </Paragraph>
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '4px',
                }}
              >
                {`import BackgroundQuickSwitch from '@/components/BackgroundQuickSwitch';

// 基础使用
<BackgroundQuickSwitch />

// 自定义配置
<BackgroundQuickSwitch 
  type="primary"
  size="large"
  showRandom={false}
  showSettings={true}
/>`}
              </pre>
            </Card>
          </Space>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ThemeDemo;
