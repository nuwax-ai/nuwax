import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiCreateSandboxUserConfig,
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
  KeyOutlined,
  MessageOutlined,
  PlusOutlined,
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
  Tooltip,
  Typography,
  message,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'umi';
import styles from './index.less';

const { confirm } = Modal;
const cx = classNames.bind(styles);

import EditComputerModal from './components/EditComputerModal';

/**
 * 我的电脑管理页面
 */
const MyComputerManage: React.FC = () => {
  const [filter, setFilter] = useState<
    'all' | 'online' | 'offline' | 'deactivated'
  >('all');
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
    if (filter === 'online')
      return list.filter((item) => item.online && item.isActive);
    if (filter === 'offline')
      return list.filter((item) => !item.online && item.isActive);
    if (filter === 'deactivated') return list.filter((item) => !item.isActive);
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
    try {
      if (currentEditItem) {
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
      } else {
        const res = await apiCreateSandboxUserConfig({
          name: values.name,
          description: values.description,
        });
        if (res.code === SUCCESS_CODE) {
          message.success('新增成功');
          setEditModalOpen(false);
          fetchList();
        }
      }
    } catch (error) {
      console.error(error);
      message.error(currentEditItem ? '修改失败' : '新增失败');
    }
  };

  return (
    <WorkspaceLayout
      title="我的电脑管理"
      leftSlot={
        <Radio.Group
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="all">全部</Radio.Button>
          <Radio.Button value="online">在线</Radio.Button>
          <Radio.Button value="offline">离线</Radio.Button>
          <Radio.Button value="deactivated">已停用</Radio.Button>
        </Radio.Group>
      }
      rightSlot={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setCurrentEditItem(null);
            setEditModalOpen(true);
          }}
        >
          新增电脑
        </Button>
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
                    <Tag
                      className={cx(styles['status-tag'], {
                        [styles['deactivated-tag']]: !item.isActive,
                        [styles['online-tag']]: item.isActive && item.online,
                        [styles['offline-tag']]: item.isActive && !item.online,
                      })}
                    >
                      {!item.isActive
                        ? '已停用'
                        : item.online
                        ? '在线'
                        : '离线'}
                    </Tag>
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
                      </Space>
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
                    <Space size={8}>
                      <Tooltip
                        title={
                          item.isActive
                            ? '停用后将无法再通过智能体操控该电脑'
                            : ''
                        }
                      >
                        <Switch
                          loading={toggleLoadingId === item.id}
                          checked={item.isActive}
                          size="small"
                          onChange={(checked) =>
                            handleToggleStatus(item.id, checked)
                          }
                        />
                      </Tooltip>
                    </Space>
                    <Space size={8}>
                      <Tooltip title="会话">
                        <Button
                          icon={<MessageOutlined />}
                          disabled={!item.agentId}
                          onClick={() => {
                            if (item.agentId) {
                              window.location.href = `/api/sandbox/config/redirect/${item.id}`;
                            }
                          }}
                          className={styles['action-btn']}
                        />
                      </Tooltip>
                      {item.configKey && (
                        <Tooltip title="连接密钥，用于独立客户端容器部署，点击可复制">
                          <Button
                            icon={<KeyOutlined />}
                            onClick={() => {
                              navigator.clipboard.writeText(
                                item.configKey || '',
                              );
                              message.success('客户端连接密钥已复制');
                            }}
                            className={classNames(
                              styles['action-btn'],
                              styles['link-key-btn'],
                            )}
                          />
                        </Tooltip>
                      )}
                      <Tooltip title="编辑">
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => handleEdit(item)}
                          className={classNames(
                            styles['action-btn'],
                            styles['edit-btn'],
                          )}
                        />
                      </Tooltip>
                      <Tooltip title="删除">
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(item.id)}
                          className={classNames(
                            styles['action-btn'],
                            styles['delete-btn'],
                          )}
                        />
                      </Tooltip>
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
