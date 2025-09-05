import useTexts from '@/hooks/useTexts';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
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
    data,
    updateAntdTheme,
    updateLanguage,
    updateBackground,
    backgroundConfigs,
  } = useUnifiedTheme();

  const isDarkMode = data.antdTheme === 'dark';
  const isChineseLanguage = data.language === 'zh-CN';

  const toggleTheme = async () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    await updateAntdTheme(newTheme);
  };

  const toggleLanguage = async () => {
    const newLanguage = isChineseLanguage ? 'en-US' : 'zh-CN';
    await updateLanguage(newLanguage);
  };

  const setBackgroundImage = async (backgroundId: string) => {
    await updateBackground(backgroundId);
  };

  const getCurrentBackgroundImage = () => {
    return backgroundConfigs.find((bg) => bg.id === data.backgroundId);
  };

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
        value={data.backgroundId}
        onChange={(e) => setBackgroundImage(e.target.value)}
      >
        <Space direction="vertical" size="small">
          {backgroundConfigs.map((bg) => (
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
      </Tabs>
    </div>
  );
};

export default ThemeDemo;
