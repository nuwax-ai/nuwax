import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiDeleteSandboxUserConfig,
  apiGetSandboxUserConfigList,
  apiToggleSandboxConfig,
  apiUpdateSandboxUserConfig,
} from '@/services/systemManage';
import { SandboxConfigItem as SandboxItem } from '@/types/interfaces/systemManage';
import {
  DeleteOutlined,
  DesktopOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  Modal,
  Radio,
  Row,
  Skeleton,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { history, useLocation } from 'umi';
import styles from './index.less';

const { confirm } = Modal;
const cx = classNames.bind(styles);

import EditComputerModal from './components/EditComputerModal';

/**
 * 我的电脑管理页面
 */
const MyComputerManage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [list, setList] = useState<SandboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await apiGetSandboxUserConfigList();
      if (res.code === SUCCESS_CODE) {
        setList(res.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [location]);

  const filteredData = useMemo(() => {
    if (filter === 'online') return list.filter((item) => item.online);
    if (filter === 'offline') return list.filter((item) => !item.online);
    return list;
  }, [filter, list]);

  // 切换在线/离线状态
  const [toggleLoadingId, setToggleLoadingId] = useState<number | null>(null);

  const handleToggleStatus = async (id: number, checked: boolean) => {
    setToggleLoadingId(id);
    try {
      const res = await apiToggleSandboxConfig(id);
      if (res.code === SUCCESS_CODE) {
        message.success(`${checked ? '已启用' : '已禁用'}`);
        fetchList();
      }
    } catch (error) {
      message.error('操作失败');
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleDelete = (id: number) => {
    confirm({
      title: '确认删除该电脑？',
      icon: <ExclamationCircleOutlined />,
      content: '删除后将无法恢复，请谨慎操作。',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        const res = await apiDeleteSandboxUserConfig(id);
        if (res.code === SUCCESS_CODE) {
          message.success('删除成功');
          fetchList();
        }
      },
    });
  };

  // 处理重命名
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<SandboxItem | null>(
    null,
  );

  const handleEdit = (item: SandboxItem) => {
    setCurrentEditItem(item);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (values: {
    name: string;
    description: string;
  }) => {
    if (!currentEditItem) return;
    try {
      const res = await apiUpdateSandboxUserConfig({
        id: currentEditItem.id,
        name: values.name,
        description: values.description,
      });
      if (res.code === SUCCESS_CODE) {
        message.success('修改成功');
        setEditModalOpen(false);
        fetchList();
      }
    } catch (error) {
      console.error(error);
      message.error('修改失败');
    }
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
      {loading ? (
        <Row gutter={[24, 24]}>
          {[1, 2, 3, 4].map((item) => (
            <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={6} key={item}>
              <Card className={styles['computer-card']}>
                <div
                  className={styles['cover-wrapper']}
                  style={{ backgroundColor: '#fff' }}
                >
                  <Skeleton.Image
                    active
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                <div className={styles['card-body']} style={{ marginTop: 24 }}>
                  <div className={styles['card-info']}>
                    <Skeleton
                      active
                      paragraph={{ rows: 1 }}
                      title={{ width: '60%' }}
                    />
                  </div>
                  <div className={styles['card-actions']}>
                    <Skeleton.Button
                      active
                      block
                      style={{ height: 32, marginBottom: 0 }}
                    />
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ) : filteredData.length > 0 ? (
        <Row gutter={[24, 24]}>
          {filteredData.map((item) => (
            <Col xs={24} sm={12} md={8} lg={8} xl={8} xxl={6} key={item.id}>
              <Card
                className={styles['computer-card']}
                cover={
                  <div className={styles['cover-wrapper']}>
                    {item.online ? (
                      <div className={styles['placeholder-cover']}>
                        <DesktopOutlined />
                      </div>
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
                      <Space className={styles['name-space']}>
                        <Typography.Text
                          strong
                          className={styles['card-name']}
                          ellipsis={{ tooltip: item.name }}
                        >
                          {item.name}
                        </Typography.Text>
                        <EditOutlined
                          className={styles['edit-icon']}
                          onClick={() => handleEdit(item)}
                        />
                      </Space>
                      <Tag
                        color={item.online ? 'success' : 'default'}
                        className={styles['status-tag']}
                      >
                        {item.online ? '在线' : '离线'}
                      </Tag>
                    </div>
                    <Typography.Text
                      type="secondary"
                      className={styles['card-desc']}
                      ellipsis={{ tooltip: item.description }}
                    >
                      {item.description}
                    </Typography.Text>
                  </div>

                  <div className={styles['card-actions']}>
                    <Button
                      type="primary"
                      icon={<DesktopOutlined />}
                      disabled={!(item.online && item.isActive) || true}
                      className={cx(styles['remote-btn'], {
                        [styles['offline-btn']]: !item.online,
                      })}
                    >
                      远程桌面
                    </Button>
                    <Space size={8}>
                      <Button
                        icon={<MessageOutlined />}
                        disabled={!item.agentId}
                        onClick={() => {
                          if (item.agentId) {
                            history.push(`/agent/${item.agentId}`);
                          }
                        }}
                      />
                      <Switch
                        loading={toggleLoadingId === item.id}
                        checked={item.isActive}
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
      ) : (
        !loading && (
          <div style={{ padding: '300px 0' }}>
            <Empty description="暂无电脑配置" />
          </div>
        )
      )}
      <EditComputerModal
        open={editModalOpen}
        initialData={currentEditItem}
        onOpenChange={setEditModalOpen}
        onFinish={handleEditSubmit}
      />
    </WorkspaceLayout>
  );
};

export default MyComputerManage;
