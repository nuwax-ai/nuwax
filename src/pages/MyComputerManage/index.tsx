import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiCreateSandboxUserConfig,
  apiDeleteSandboxUserConfig,
  apiGetSandboxUserConfigList,
  apiToggleSandboxConfig,
  apiUpdateSandboxUserConfig,
} from '@/services/systemManage';
import { SandboxConfigItem as SandboxItem } from '@/types/interfaces/systemManage';
import { copyTextToClipboard } from '@/utils/clipboard';
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
        message.success(
          dict(
            checked
              ? 'PC.Toast.MyComputerManage.enabled'
              : 'PC.Toast.MyComputerManage.disabled',
          ),
        );
        fetchList();
      }
    } catch (error) {
      message.error(dict('PC.Toast.MyComputerManage.operationFailed'));
    } finally {
      setToggleLoadingId(null);
    }
  };

  const handleDelete = (id: number) => {
    confirm({
      title: dict('PC.Pages.MyComputerManage.deleteConfirmTitle'),
      icon: <ExclamationCircleOutlined />,
      content: dict('PC.Pages.MyComputerManage.deleteConfirmContent'),
      okText: dict('PC.Common.Global.confirm'),
      okType: 'danger',
      cancelText: dict('PC.Common.Global.cancel'),
      onOk: async () => {
        const res = await apiDeleteSandboxUserConfig(id);
        if (res.code === SUCCESS_CODE) {
          message.success(dict('PC.Toast.Global.deletedSuccessfully'));
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
    maxAgentCount?: number;
  }) => {
    try {
      if (currentEditItem) {
        const res = await apiUpdateSandboxUserConfig({
          id: currentEditItem.id,
          name: values.name,
          description: values.description,
          maxAgentCount: values.maxAgentCount,
        });
        if (res.code === SUCCESS_CODE) {
          message.success(
            dict('PC.Toast.MyComputerManage.modifiedSuccessfully'),
          );
          setEditModalOpen(false);
          fetchList();
        }
      } else {
        const res = await apiCreateSandboxUserConfig({
          name: values.name,
          description: values.description,
          maxAgentCount: values.maxAgentCount,
        });
        if (res.code === SUCCESS_CODE) {
          message.success(
            dict('PC.Toast.MyComputerManage.createdSuccessfully'),
          );
          setEditModalOpen(false);
          fetchList();
        }
      }
    } catch (error) {
      console.error(error);
      message.error(
        dict(
          currentEditItem
            ? 'PC.Toast.MyComputerManage.modifyFailed'
            : 'PC.Toast.MyComputerManage.createFailed',
        ),
      );
    }
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.MyComputerManage.pageTitle')}
      leftSlot={
        <Radio.Group
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="all">
            {dict('PC.Pages.MyComputerManage.filterAll')}
          </Radio.Button>
          <Radio.Button value="online">
            {dict('PC.Pages.MyComputerManage.filterOnline')}
          </Radio.Button>
          <Radio.Button value="offline">
            {dict('PC.Pages.MyComputerManage.filterOffline')}
          </Radio.Button>
          <Radio.Button value="deactivated">
            {dict('PC.Pages.MyComputerManage.filterDeactivated')}
          </Radio.Button>
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
          {dict('PC.Pages.MyComputerManage.addComputer')}
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
                        ? dict('PC.Pages.MyComputerManage.statusDeactivated')
                        : item.online
                        ? dict('PC.Pages.MyComputerManage.statusOnline')
                        : dict('PC.Pages.MyComputerManage.statusOffline')}
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
                            ? dict(
                                'PC.Pages.MyComputerManage.deactivateTooltip',
                              )
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
                      <Tooltip
                        title={dict('PC.Pages.MyComputerManage.sessionTooltip')}
                      >
                        <Button
                          icon={<MessageOutlined />}
                          disabled={!item.agentId}
                          onClick={() => {
                            if (item.agentId) {
                              window.location.href = `/api/sandbox/config/redirect/${item.id}`;
                            }
                          }}
                          className="action-btn"
                        />
                      </Tooltip>
                      {item.configKey && (
                        <Tooltip
                          title={dict(
                            'PC.Pages.MyComputerManage.connectionKeyTooltip',
                          )}
                        >
                          <Button
                            icon={<KeyOutlined />}
                            onClick={() => {
                              copyTextToClipboard(item.configKey || '', () => {
                                message.success(
                                  dict(
                                    'PC.Toast.MyComputerManage.connectionKeyCopied',
                                  ),
                                );
                              });
                            }}
                            className={classNames(
                              'action-btn',
                              styles['link-key-btn'],
                            )}
                          />
                        </Tooltip>
                      )}
                      <Tooltip
                        title={dict('PC.Pages.MyComputerManage.editTooltip')}
                      >
                        <Button
                          className="action-btn edit-btn"
                          icon={<EditOutlined />}
                          onClick={() => handleEdit(item)}
                        />
                      </Tooltip>
                      <Tooltip title={dict('PC.Common.Global.delete')}>
                        <Button
                          className="action-btn delete-btn"
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(item.id)}
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
            <Empty
              description={dict(
                'PC.Pages.MyComputerManage.emptyComputerConfig',
              )}
            />
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
