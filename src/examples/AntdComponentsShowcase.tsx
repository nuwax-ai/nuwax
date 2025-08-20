import useGlobalSettings from '@/hooks/useGlobalSettings';
import {
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
  DashboardOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExperimentOutlined,
  EyeOutlined,
  HomeOutlined,
  RocketOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  AutoComplete,
  Avatar,
  BackTop,
  Badge,
  Breadcrumb,
  Button,
  Card,
  Cascader,
  Checkbox,
  Col,
  Collapse,
  DatePicker,
  Drawer,
  Empty,
  Input,
  InputNumber,
  message,
  Modal,
  Pagination,
  Progress,
  Radio,
  Rate,
  Row,
  Select,
  Skeleton,
  Slider,
  Space,
  Spin,
  Statistic,
  Steps,
  Switch,
  Table,
  Tabs,
  Tag,
  theme,
  TimePicker,
  TreeSelect,
  Typography,
} from 'antd';
import React, { useState } from 'react';
import './AntdComponentsShowcase.less';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { useToken } = theme;

/**
 * Ant Design 组件样式展示页面
 * 展示各种组件在不同主题和语言下的效果
 */
const AntdComponentsShowcase: React.FC = () => {
  const { isChineseLanguage } = useGlobalSettings();
  const { token } = useToken();

  // 组件状态
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // 表格数据
  const tableData = [
    {
      key: '1',
      name: isChineseLanguage ? '张三' : 'John Doe',
      age: 28,
      email: 'john@example.com',
      status: 'active',
      role: isChineseLanguage ? '管理员' : 'Admin',
    },
    {
      key: '2',
      name: isChineseLanguage ? '李四' : 'Jane Smith',
      age: 32,
      email: 'jane@example.com',
      status: 'inactive',
      role: isChineseLanguage ? '用户' : 'User',
    },
    {
      key: '3',
      name: isChineseLanguage ? '王五' : 'Mike Johnson',
      age: 25,
      email: 'mike@example.com',
      status: 'active',
      role: isChineseLanguage ? '编辑' : 'Editor',
    },
  ];

  const tableColumns = [
    {
      title: isChineseLanguage ? '姓名' : 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: isChineseLanguage ? '年龄' : 'Age',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: isChineseLanguage ? '邮箱' : 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: isChineseLanguage ? '状态' : 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'volcano'}>
          {status === 'active'
            ? isChineseLanguage
              ? '活跃'
              : 'Active'
            : isChineseLanguage
            ? '非活跃'
            : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: isChineseLanguage ? '角色' : 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: isChineseLanguage ? '操作' : 'Actions',
      key: 'actions',
      render: () => (
        <Space>
          <Button type="primary" size="small" icon={<EyeOutlined />}>
            {isChineseLanguage ? '查看' : 'View'}
          </Button>
          <Button size="small" icon={<EditOutlined />}>
            {isChineseLanguage ? '编辑' : 'Edit'}
          </Button>
          <Button danger size="small" icon={<DeleteOutlined />}>
            {isChineseLanguage ? '删除' : 'Delete'}
          </Button>
        </Space>
      ),
    },
  ];

  // 树形数据
  const treeData = [
    {
      title: isChineseLanguage ? '根节点' : 'Root Node',
      key: '0-0',
      children: [
        {
          title: isChineseLanguage ? '子节点 1' : 'Child Node 1',
          key: '0-0-0',
          children: [
            {
              title: isChineseLanguage ? '叶子节点 1' : 'Leaf Node 1',
              key: '0-0-0-0',
            },
            {
              title: isChineseLanguage ? '叶子节点 2' : 'Leaf Node 2',
              key: '0-0-0-1',
            },
          ],
        },
        {
          title: isChineseLanguage ? '子节点 2' : 'Child Node 2',
          key: '0-0-1',
        },
      ],
    },
  ];

  // 级联选择数据
  const cascaderOptions = [
    {
      value: 'china',
      label: isChineseLanguage ? '中国' : 'China',
      children: [
        {
          value: 'beijing',
          label: isChineseLanguage ? '北京' : 'Beijing',
        },
        {
          value: 'shanghai',
          label: isChineseLanguage ? '上海' : 'Shanghai',
        },
      ],
    },
    {
      value: 'usa',
      label: isChineseLanguage ? '美国' : 'USA',
      children: [
        {
          value: 'newyork',
          label: isChineseLanguage ? '纽约' : 'New York',
        },
        {
          value: 'california',
          label: isChineseLanguage ? '加利福尼亚' : 'California',
        },
      ],
    },
  ];

  // 显示消息
  const showMessage = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: isChineseLanguage ? '操作成功！' : 'Operation successful!',
      error: isChineseLanguage ? '操作失败！' : 'Operation failed!',
      warning: isChineseLanguage ? '注意警告信息！' : 'Warning message!',
      info: isChineseLanguage ? '这是一条信息！' : 'This is an info message!',
    };
    message[type](messages[type]);
  };

  // 显示通知
  const showNotification = () => {
    message.info(
      isChineseLanguage
        ? '您有一条新的消息需要查看。'
        : 'You have a new message to view.',
    );
  };

  // 模拟加载
  const handleLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="antd-showcase">
      {/* 页面标题 */}
      <div className="showcase-header">
        <Title level={1}>
          <AppstoreOutlined
            style={{ marginRight: 16, color: token.colorPrimary }}
          />
          {isChineseLanguage
            ? 'Ant Design 组件展示'
            : 'Ant Design Components Showcase'}
        </Title>
        <Paragraph type="secondary">
          {isChineseLanguage
            ? '展示 Ant Design 所有组件在不同主题和语言下的样式效果。'
            : 'Showcase all Ant Design components with different themes and languages.'}
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* 基础组件 */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <RocketOutlined />
                {isChineseLanguage ? '基础组件' : 'Basic Components'}
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '按钮组件' : 'Button Components'}
                </Title>
                <Space wrap>
                  <Button type="primary">
                    {isChineseLanguage ? '主要按钮' : 'Primary'}
                  </Button>
                  <Button>{isChineseLanguage ? '默认按钮' : 'Default'}</Button>
                  <Button type="dashed">
                    {isChineseLanguage ? '虚线按钮' : 'Dashed'}
                  </Button>
                  <Button type="text">
                    {isChineseLanguage ? '文本按钮' : 'Text'}
                  </Button>
                  <Button type="link">
                    {isChineseLanguage ? '链接按钮' : 'Link'}
                  </Button>
                  <Button danger>
                    {isChineseLanguage ? '危险按钮' : 'Danger'}
                  </Button>
                  <Button type="primary" loading>
                    {isChineseLanguage ? '加载中' : 'Loading'}
                  </Button>
                  <Button type="primary" icon={<DownloadOutlined />}>
                    {isChineseLanguage ? '下载' : 'Download'}
                  </Button>
                </Space>
              </Col>

              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '输入组件' : 'Input Components'}
                </Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Input
                        placeholder={
                          isChineseLanguage
                            ? '请输入内容'
                            : 'Please enter content'
                        }
                        prefix={<UserOutlined />}
                      />
                    </Col>
                    <Col span={8}>
                      <Input.Password
                        placeholder={
                          isChineseLanguage
                            ? '请输入密码'
                            : 'Please enter password'
                        }
                      />
                    </Col>
                    <Col span={8}>
                      <Input.Search
                        placeholder={
                          isChineseLanguage ? '搜索内容' : 'Search content'
                        }
                        onSearch={() => showMessage('info')}
                      />
                    </Col>
                  </Row>
                  <TextArea
                    rows={3}
                    placeholder={
                      isChineseLanguage
                        ? '请输入多行文本'
                        : 'Please enter multi-line text'
                    }
                  />
                </Space>
              </Col>

              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '选择组件' : 'Selection Components'}
                </Title>
                <Row gutter={16}>
                  <Col span={6}>
                    <Select
                      defaultValue="option1"
                      style={{ width: '100%' }}
                      placeholder={
                        isChineseLanguage ? '请选择' : 'Please select'
                      }
                    >
                      <Option value="option1">
                        {isChineseLanguage ? '选项一' : 'Option 1'}
                      </Option>
                      <Option value="option2">
                        {isChineseLanguage ? '选项二' : 'Option 2'}
                      </Option>
                      <Option value="option3">
                        {isChineseLanguage ? '选项三' : 'Option 3'}
                      </Option>
                    </Select>
                  </Col>
                  <Col span={6}>
                    <DatePicker
                      style={{ width: '100%' }}
                      placeholder={
                        isChineseLanguage ? '选择日期' : 'Select date'
                      }
                    />
                  </Col>
                  <Col span={6}>
                    <TimePicker
                      style={{ width: '100%' }}
                      placeholder={
                        isChineseLanguage ? '选择时间' : 'Select time'
                      }
                    />
                  </Col>
                  <Col span={6}>
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder={
                        isChineseLanguage ? '输入数字' : 'Enter number'
                      }
                      min={0}
                      max={100}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 数据展示组件 */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <BarChartOutlined />
                {isChineseLanguage ? '数据展示组件' : 'Data Display Components'}
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '表格组件' : 'Table Component'}
                </Title>
                <Table
                  dataSource={tableData}
                  columns={tableColumns}
                  pagination={{ pageSize: 5 }}
                  size="middle"
                />
              </Col>

              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '标签与徽章' : 'Tags & Badges'}
                </Title>
                <Space wrap>
                  <Tag color="blue">
                    {isChineseLanguage ? '蓝色标签' : 'Blue Tag'}
                  </Tag>
                  <Tag color="green">
                    {isChineseLanguage ? '绿色标签' : 'Green Tag'}
                  </Tag>
                  <Tag color="red">
                    {isChineseLanguage ? '红色标签' : 'Red Tag'}
                  </Tag>
                  <Tag color="orange">
                    {isChineseLanguage ? '橙色标签' : 'Orange Tag'}
                  </Tag>
                  <Badge count={5}>
                    <Avatar shape="square" icon={<UserOutlined />} />
                  </Badge>
                  <Badge dot>
                    <BellOutlined style={{ fontSize: 16 }} />
                  </Badge>
                  <Badge
                    status="processing"
                    text={isChineseLanguage ? '处理中' : 'Processing'}
                  />
                  <Badge
                    status="success"
                    text={isChineseLanguage ? '成功' : 'Success'}
                  />
                </Space>
              </Col>

              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '统计数值' : 'Statistic'}
                </Title>
                <Row gutter={16}>
                  <Col span={6}>
                    <Statistic
                      title={isChineseLanguage ? '总用户数' : 'Total Users'}
                      value={11280}
                      prefix={<TeamOutlined />}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title={isChineseLanguage ? '月活跃' : 'Monthly Active'}
                      value={8520}
                      suffix="+"
                      valueStyle={{ color: token.colorSuccess }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title={isChineseLanguage ? '转化率' : 'Conversion Rate'}
                      value={68.5}
                      precision={1}
                      suffix="%"
                      valueStyle={{ color: token.colorPrimary }}
                    />
                  </Col>
                  <Col span={6}>
                    <Statistic
                      title={isChineseLanguage ? '收入' : 'Revenue'}
                      value={125860}
                      prefix="$"
                      valueStyle={{ color: token.colorWarning }}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 交互组件 */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined />
                {isChineseLanguage ? '交互组件' : 'Interactive Components'}
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '进度与评分' : 'Progress & Rating'}
                </Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Text>
                        {isChineseLanguage ? '进度条' : 'Progress Bar'}
                      </Text>
                      <Progress percent={75} />
                    </Col>
                    <Col span={8}>
                      <Text>
                        {isChineseLanguage ? '圆形进度' : 'Circle Progress'}
                      </Text>
                      <Progress type="circle" percent={60} />
                    </Col>
                    <Col span={8}>
                      <Text>
                        {isChineseLanguage ? '评分组件' : 'Rate Component'}
                      </Text>
                      <br />
                      <Rate defaultValue={4} />
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text>
                        {isChineseLanguage ? '滑块组件' : 'Slider Component'}
                      </Text>
                      <Slider defaultValue={30} />
                    </Col>
                    <Col span={12}>
                      <Space>
                        <Text>
                          {isChineseLanguage ? '开关组件' : 'Switch Component'}
                        </Text>
                        <Switch defaultChecked />
                        <Switch size="small" />
                      </Space>
                    </Col>
                  </Row>
                </Space>
              </Col>

              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '单选与多选' : 'Radio & Checkbox'}
                </Title>
                <Row gutter={16}>
                  <Col span={12}>
                    <Text>
                      {isChineseLanguage ? '单选按钮' : 'Radio Buttons'}
                    </Text>
                    <br />
                    <Radio.Group defaultValue="a">
                      <Radio value="a">
                        {isChineseLanguage ? '选项 A' : 'Option A'}
                      </Radio>
                      <Radio value="b">
                        {isChineseLanguage ? '选项 B' : 'Option B'}
                      </Radio>
                      <Radio value="c">
                        {isChineseLanguage ? '选项 C' : 'Option C'}
                      </Radio>
                    </Radio.Group>
                  </Col>
                  <Col span={12}>
                    <Text>{isChineseLanguage ? '复选框' : 'Checkboxes'}</Text>
                    <br />
                    <Checkbox.Group
                      options={[
                        {
                          label: isChineseLanguage ? '苹果' : 'Apple',
                          value: 'apple',
                        },
                        {
                          label: isChineseLanguage ? '香蕉' : 'Banana',
                          value: 'banana',
                        },
                        {
                          label: isChineseLanguage ? '橙子' : 'Orange',
                          value: 'orange',
                        },
                      ]}
                      defaultValue={['apple']}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 反馈组件 */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <BellOutlined />
                {isChineseLanguage ? '反馈组件' : 'Feedback Components'}
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '警告提示' : 'Alert Messages'}
                </Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert
                    message={isChineseLanguage ? '成功提示' : 'Success Message'}
                    description={
                      isChineseLanguage
                        ? '这是一条成功的提示信息。'
                        : 'This is a success alert message.'
                    }
                    type="success"
                    showIcon
                    closable
                  />
                  <Alert
                    message={isChineseLanguage ? '信息提示' : 'Info Message'}
                    description={
                      isChineseLanguage
                        ? '这是一条普通的信息提示。'
                        : 'This is an info alert message.'
                    }
                    type="info"
                    showIcon
                  />
                  <Alert
                    message={isChineseLanguage ? '警告提示' : 'Warning Message'}
                    description={
                      isChineseLanguage
                        ? '这是一条警告提示信息。'
                        : 'This is a warning alert message.'
                    }
                    type="warning"
                    showIcon
                  />
                  <Alert
                    message={isChineseLanguage ? '错误提示' : 'Error Message'}
                    description={
                      isChineseLanguage
                        ? '这是一条错误提示信息。'
                        : 'This is an error alert message.'
                    }
                    type="error"
                    showIcon
                  />
                </Space>
              </Col>

              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage
                    ? '消息与通知'
                    : 'Messages & Notifications'}
                </Title>
                <Space wrap>
                  <Button onClick={() => showMessage('success')}>
                    {isChineseLanguage ? '成功消息' : 'Success Message'}
                  </Button>
                  <Button onClick={() => showMessage('info')}>
                    {isChineseLanguage ? '信息消息' : 'Info Message'}
                  </Button>
                  <Button onClick={() => showMessage('warning')}>
                    {isChineseLanguage ? '警告消息' : 'Warning Message'}
                  </Button>
                  <Button onClick={() => showMessage('error')}>
                    {isChineseLanguage ? '错误消息' : 'Error Message'}
                  </Button>
                  <Button onClick={showNotification}>
                    {isChineseLanguage ? '显示通知' : 'Show Notification'}
                  </Button>
                  <Button onClick={() => setModalVisible(true)}>
                    {isChineseLanguage ? '打开对话框' : 'Open Modal'}
                  </Button>
                  <Button onClick={() => setDrawerVisible(true)}>
                    {isChineseLanguage ? '打开抽屉' : 'Open Drawer'}
                  </Button>
                </Space>
              </Col>

              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '加载状态' : 'Loading States'}
                </Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Button onClick={handleLoading} loading={loading}>
                        {loading
                          ? isChineseLanguage
                            ? '加载中...'
                            : 'Loading...'
                          : isChineseLanguage
                          ? '开始加载'
                          : 'Start Loading'}
                      </Button>
                    </Col>
                    <Col span={8}>
                      <Spin spinning={loading}>
                        <div
                          style={{
                            padding: 20,
                            background: token.colorFillAlter,
                          }}
                        >
                          {isChineseLanguage ? '内容区域' : 'Content Area'}
                        </div>
                      </Spin>
                    </Col>
                    <Col span={8}>
                      <Skeleton
                        active
                        loading={loading}
                        paragraph={{ rows: 3 }}
                      >
                        <div>
                          <Title level={5}>
                            {isChineseLanguage
                              ? '已加载内容'
                              : 'Loaded Content'}
                          </Title>
                          <Paragraph>
                            {isChineseLanguage
                              ? '这里是已经加载完成的内容。'
                              : 'This is the loaded content.'}
                          </Paragraph>
                        </div>
                      </Skeleton>
                    </Col>
                  </Row>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 导航组件 */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <DashboardOutlined />
                {isChineseLanguage ? '导航组件' : 'Navigation Components'}
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '面包屑导航' : 'Breadcrumb Navigation'}
                </Title>
                <Breadcrumb>
                  <Breadcrumb.Item href="">
                    <HomeOutlined />
                  </Breadcrumb.Item>
                  <Breadcrumb.Item href="">
                    {isChineseLanguage ? '首页' : 'Home'}
                  </Breadcrumb.Item>
                  <Breadcrumb.Item href="">
                    {isChineseLanguage ? '组件' : 'Components'}
                  </Breadcrumb.Item>
                  <Breadcrumb.Item>
                    {isChineseLanguage ? '展示' : 'Showcase'}
                  </Breadcrumb.Item>
                </Breadcrumb>
              </Col>

              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '步骤条' : 'Steps'}
                </Title>
                <Steps current={1}>
                  <Step
                    title={isChineseLanguage ? '第一步' : 'Step 1'}
                    description={isChineseLanguage ? '完成' : 'Finished'}
                  />
                  <Step
                    title={isChineseLanguage ? '第二步' : 'Step 2'}
                    description={isChineseLanguage ? '进行中' : 'In Progress'}
                  />
                  <Step
                    title={isChineseLanguage ? '第三步' : 'Step 3'}
                    description={isChineseLanguage ? '等待' : 'Waiting'}
                  />
                </Steps>
              </Col>

              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '分页组件' : 'Pagination'}
                </Title>
                <Pagination
                  current={2}
                  total={500}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total, range) =>
                    isChineseLanguage
                      ? `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`
                      : `${range[0]}-${range[1]} of ${total} items`
                  }
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 其他组件 */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <ExperimentOutlined />
                {isChineseLanguage ? '其他组件' : 'Other Components'}
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Title level={4}>{isChineseLanguage ? '标签页' : 'Tabs'}</Title>
                <Tabs defaultActiveKey="1">
                  <TabPane
                    tab={
                      <span>
                        <UserOutlined />
                        {isChineseLanguage ? '用户信息' : 'User Info'}
                      </span>
                    }
                    key="1"
                  >
                    <Paragraph>
                      {isChineseLanguage
                        ? '这里是用户信息的内容。'
                        : 'This is the content of user information.'}
                    </Paragraph>
                  </TabPane>
                  <TabPane
                    tab={
                      <span>
                        <SettingOutlined />
                        {isChineseLanguage ? '设置' : 'Settings'}
                      </span>
                    }
                    key="2"
                  >
                    <Paragraph>
                      {isChineseLanguage
                        ? '这里是设置页面的内容。'
                        : 'This is the content of settings page.'}
                    </Paragraph>
                  </TabPane>
                </Tabs>
              </Col>

              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '折叠面板' : 'Collapse Panel'}
                </Title>
                <Collapse defaultActiveKey={['1']}>
                  <Panel
                    header={isChineseLanguage ? '面板标题 1' : 'Panel Header 1'}
                    key="1"
                  >
                    <Paragraph>
                      {isChineseLanguage
                        ? '这是第一个折叠面板的内容。'
                        : 'This is the content of the first collapse panel.'}
                    </Paragraph>
                  </Panel>
                  <Panel
                    header={isChineseLanguage ? '面板标题 2' : 'Panel Header 2'}
                    key="2"
                  >
                    <Paragraph>
                      {isChineseLanguage
                        ? '这是第二个折叠面板的内容。'
                        : 'This is the content of the second collapse panel.'}
                    </Paragraph>
                  </Panel>
                </Collapse>
              </Col>

              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '树形选择' : 'Tree Select'}
                </Title>
                <Row gutter={16}>
                  <Col span={8}>
                    <TreeSelect
                      style={{ width: '100%' }}
                      value={undefined}
                      dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                      treeData={treeData}
                      placeholder={
                        isChineseLanguage ? '请选择' : 'Please select'
                      }
                      treeDefaultExpandAll
                    />
                  </Col>
                  <Col span={8}>
                    <Cascader
                      options={cascaderOptions}
                      placeholder={
                        isChineseLanguage ? '级联选择' : 'Cascader select'
                      }
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={8}>
                    <AutoComplete
                      style={{ width: '100%' }}
                      options={[
                        {
                          value: 'option1',
                          label: isChineseLanguage ? '选项 1' : 'Option 1',
                        },
                        {
                          value: 'option2',
                          label: isChineseLanguage ? '选项 2' : 'Option 2',
                        },
                        {
                          value: 'option3',
                          label: isChineseLanguage ? '选项 3' : 'Option 3',
                        },
                      ]}
                      placeholder={
                        isChineseLanguage ? '自动完成' : 'Auto complete'
                      }
                    />
                  </Col>
                </Row>
              </Col>

              <Col span={24}>
                <Title level={4}>
                  {isChineseLanguage ? '空状态' : 'Empty State'}
                </Title>
                <Empty
                  description={isChineseLanguage ? '暂无数据' : 'No Data'}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="primary">
                    {isChineseLanguage ? '立即创建' : 'Create Now'}
                  </Button>
                </Empty>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 模态对话框 */}
      <Modal
        title={isChineseLanguage ? '示例对话框' : 'Example Modal'}
        open={modalVisible}
        onOk={() => setModalVisible(false)}
        onCancel={() => setModalVisible(false)}
        okText={isChineseLanguage ? '确认' : 'OK'}
        cancelText={isChineseLanguage ? '取消' : 'Cancel'}
      >
        <Paragraph>
          {isChineseLanguage
            ? '这是一个示例对话框，展示模态窗口的效果。'
            : 'This is an example modal dialog showing the modal window effect.'}
        </Paragraph>
      </Modal>

      {/* 抽屉 */}
      <Drawer
        title={isChineseLanguage ? '示例抽屉' : 'Example Drawer'}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={400}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            {isChineseLanguage
              ? '这是一个示例抽屉，从右侧滑入。'
              : 'This is an example drawer sliding in from the right.'}
          </Paragraph>
          <Button type="primary" block>
            {isChineseLanguage ? '确认' : 'Confirm'}
          </Button>
          <Button block onClick={() => setDrawerVisible(false)}>
            {isChineseLanguage ? '关闭' : 'Close'}
          </Button>
        </Space>
      </Drawer>

      {/* 返回顶部 */}
      <BackTop />
    </div>
  );
};

export default AntdComponentsShowcase;
