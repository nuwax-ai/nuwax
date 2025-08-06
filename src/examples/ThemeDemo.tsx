import useGlobalSettings from '@/hooks/useGlobalSettings';
import useTexts from '@/hooks/useTexts';
import {
  BulbOutlined,
  HeartOutlined,
  MoonOutlined,
  SunOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Notification,
  Row,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import React from 'react';
import './ThemeDemo.less';

const { Title, Text, Paragraph } = Typography;

/**
 * 主题和多语言功能演示组件
 * 展示如何使用全局设置功能
 */
const ThemeDemo: React.FC = () => {
  const {
    theme,
    language,
    isDarkMode,
    isChineseLanguage,
    toggleTheme,
    toggleLanguage,
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

  return (
    <div className="theme-demo">
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
              ? '这是一个展示全局主题切换和多语言功能的演示组件。您可以通过右下角的设置按钮进行配置。'
              : 'This is a demo component showing global theme switching and multi-language functionality. You can configure through the settings button in the bottom right corner.'}
          </Paragraph>
        </Card>

        {/* 当前设置显示 */}
        <Card title={texts.globalSettings}>
          <Row gutter={[16, 16]}>
            <Col span={12}>
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
            <Col span={12}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>{texts.language}</Text>
                <Tag color="blue" icon={<TranslationOutlined />}>
                  {isChineseLanguage ? texts.chinese : texts.english}
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
          </Space>
        </Card>

        {/* 组件展示区域 */}
        <Card title={isChineseLanguage ? '组件展示' : 'Component Showcase'}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
        <Card title={isChineseLanguage ? '当前配置' : 'Current Configuration'}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text code>Theme: {theme}</Text>
            <Text code>Language: {language}</Text>
            <Text code>isDarkMode: {isDarkMode.toString()}</Text>
            <Text code>isChineseLanguage: {isChineseLanguage.toString()}</Text>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default ThemeDemo;
