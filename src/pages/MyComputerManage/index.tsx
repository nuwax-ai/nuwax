import WorkspaceLayout from '@/components/WorkspaceLayout';
import {
  DeleteOutlined,
  DesktopOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Modal,
  Radio,
  Row,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

const { confirm } = Modal;
const cx = classNames.bind(styles);

interface ComputerInfo {
  id: string;
  name: string;
  ip: string;
  isOnline: boolean;
  cover?: string;
}

const MOCK_DATA: ComputerInfo[] = [
  {
    id: '1',
    name: 'Windows Workstation',
    ip: '192.168.1.101',
    isOnline: true,
    cover:
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=400&h=200&auto=format&fit=crop',
  },
  {
    id: '2',
    name: 'Office PC',
    ip: '192.168.1.102',
    isOnline: false,
    cover:
      'https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=400&h=200&auto=format&fit=crop',
  },
  {
    id: '3',
    name: 'Dev Machine',
    ip: '192.168.1.103',
    isOnline: true,
    cover:
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=400&h=200&auto=format&fit=crop',
  },
  {
    id: '4',
    name: 'Linux Server',
    ip: '192.168.1.104',
    isOnline: false,
    cover:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=400&h=200&auto=format&fit=crop',
  },
  {
    id: '5',
    name: 'Test Environment',
    ip: '192.168.1.105',
    isOnline: true,
    cover:
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=400&h=200&auto=format&fit=crop',
  },
  {
    id: '6',
    name: 'Data Storage',
    ip: '192.168.1.106',
    isOnline: false,
    cover:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=400&h=200&auto=format&fit=crop',
  },
];

/**
 * 我的电脑管理页面
 */
const MyComputerManage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [list, setList] = useState<ComputerInfo[]>(MOCK_DATA);

  // 后续接口请求位置
  // const { data, run, loading } = useRequest(fetchComputerList);

  const filteredData = useMemo(() => {
    if (filter === 'online') return list.filter((item) => item.isOnline);
    if (filter === 'offline') return list.filter((item) => !item.isOnline);
    return list;
  }, [filter, list]);

  // 切换在线/离线状态
  const [toggleLoadingId, setToggleLoadingId] = useState<string | null>(null);

  const handleToggleStatus = async (id: string, checked: boolean) => {
    setToggleLoadingId(id);
    try {
      // 模拟接口调用
      await new Promise((resolve) => {
        setTimeout(resolve, 800);
      });
      // 此处应为实际 API 调用，例如:
      // await apiUpdateComputerStatus(id, { isOnline: checked });

      // 更新组件状态以触发重绘
      setList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isOnline: checked } : item,
        ),
      );

      message.success(`${checked ? '已上线' : '已下线'}`);
    } catch (error) {
      message.error('操作失败');
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: '确认删除该电脑？',
      icon: <ExclamationCircleOutlined />,
      content: '删除后将无法恢复，请谨慎操作。',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        // 调用删除接口位置
        // apiDeleteComputer(id).then(() => {
        message.success('删除成功');
        console.log('Deleted computer id:', id);
        //   run();
        // });
      },
    });
  };

  return (
    <WorkspaceLayout
      title="我的电脑管理"
      rightSlot={
        <Radio.Group
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="all">全部</Radio.Button>
          <Radio.Button value="online">在线</Radio.Button>
          <Radio.Button value="offline">离线</Radio.Button>
        </Radio.Group>
      }
    >
      <Row gutter={[24, 24]}>
        {filteredData.map((item) => (
          <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={6} key={item.id}>
            <Card
              className={styles['computer-card']}
              cover={
                <div className={styles['cover-wrapper']}>
                  {item.isOnline && item.cover ? (
                    <img alt={item.name} src={item.cover} />
                  ) : (
                    <div className={styles['placeholder-cover']}>
                      <DesktopOutlined />
                    </div>
                  )}
                </div>
              }
            >
              <div className={styles['card-body']}>
                <div className={styles['card-info']}>
                  <div className={styles['card-title-line']}>
                    <Typography.Text strong className={styles['card-name']}>
                      {item.name}
                    </Typography.Text>
                    <Tag color={item.isOnline ? 'success' : 'default'}>
                      {item.isOnline ? '在线' : '离线'}
                    </Tag>
                  </div>
                  <Typography.Text
                    type="secondary"
                    className={styles['card-ip']}
                  >
                    {item.ip}
                  </Typography.Text>
                </div>

                <div className={styles['card-actions']}>
                  <Button
                    type="primary"
                    icon={<DesktopOutlined />}
                    className={cx(styles['remote-btn'], {
                      [styles['offline-btn']]: !item.isOnline,
                    })}
                  >
                    远程桌面
                  </Button>
                  <Space size={8}>
                    <Button icon={<MessageOutlined />} />
                    <Switch
                      loading={toggleLoadingId === item.id}
                      checked={item.isOnline}
                      size="small"
                      onChange={(checked) =>
                        handleToggleStatus(item.id, checked)
                      }
                    />
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(item.id)}
                    />
                  </Space>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </WorkspaceLayout>
  );
};

export default MyComputerManage;
