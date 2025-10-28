import copyImage from '@/assets/images/copy.png';
import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
import {
  apiAgentAkCreate,
  apiAgentAkDelete,
  apiAgentAkList,
  apiAgentAkUpdate,
} from '@/services/agentDev';
import { DevModeEnum } from '@/types/enums/agent';
import { UserApiKeyInfo } from '@/types/interfaces/agent';
import type { CreateTempChatModalProps } from '@/types/interfaces/space';
import { modalConfirm } from '@/utils/ant-custom';
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Empty,
  message,
  Modal,
  Table,
  TableColumnsType,
  Tooltip,
} from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 创建ApiKey弹窗
const CreateTempChatModal: React.FC<CreateTempChatModalProps> = ({
  agentId,
  name,
  open,
  onCancel,
}) => {
  // ApiKey列表
  const [dataSource, setDataSource] = useState<UserApiKeyInfo[]>([]);

  // 新增智能体APIKEY
  const { run: runApiKeyCreate, loading } = useRequest(apiAgentAkCreate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: UserApiKeyInfo) => {
      setDataSource([...dataSource, result]);
    },
  });

  // 查询智能体APIKEY列表
  const { run: runList, loading: loadingList } = useRequest(apiAgentAkList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: UserApiKeyInfo[]) => {
      setDataSource(result || []);
    },
  });

  // 更新智能体APIKEY是否为开发模式
  const { run: runUpdate } = useRequest(apiAgentAkUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('修改成功');
    },
  });

  // 删除智能体APIKEY
  const { run: runDel } = useRequest(apiAgentAkDelete, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('删除成功');
    },
  });

  const handleCopy = () => {
    message.success('复制成功');
  };

  useEffect(() => {
    if (!open || !agentId) {
      return;
    }
    runList(agentId);
  }, [agentId, open]);

  // 更新ApiKey是否为开发模式
  const handleUpdate = (id: number, accessKey: string, value: boolean) => {
    // 开发模式，1 是，0 否
    const isDevMode = value ? DevModeEnum.Yes : DevModeEnum.No;
    const _dataSource = dataSource?.map((item: UserApiKeyInfo) => {
      if (item.id === id) {
        item.config.isDevMode = isDevMode;
      }
      return item;
    });

    setDataSource(_dataSource || []);

    const params = {
      agentId,
      accessKey,
      devMode: isDevMode,
    };
    runUpdate(params);
  };

  // 删除ApiKey
  const handleDel = (id: number, accessKey: string) => {
    const _dataSource = dataSource?.filter(
      (item: UserApiKeyInfo) => item.id !== id,
    );
    setDataSource(_dataSource || []);

    const params = {
      agentId,
      accessKey,
    };
    runDel(params);
  };

  // 删除确认
  const handleDelConfirm = (id: number, accessKey: string) => {
    modalConfirm('您确定要删除此API Key吗?', accessKey, () => {
      handleDel(id, accessKey);
      return new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    });
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<UserApiKeyInfo> = [
    {
      title: 'API Key',
      dataIndex: 'accessKey',
      key: 'accessKey',
      width: 200,
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          <EllipsisTooltip text={record.accessKey} />
        </div>
      ),
    },
    {
      title: '创建人',
      dataIndex: 'userName',
      key: 'userName',
      width: 100,
      render: (_: boolean, record: UserApiKeyInfo) => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          <span className={cx('text-ellipsis')}>
            {record?.creator?.userName}
          </span>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created',
      key: 'created',
      width: 160,
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          {record.created
            ? dayjs(record.created).format('YYYY-MM-DD HH:mm:ss')
            : '--'}
        </div>
      ),
    },
    {
      title: (
        <div className={cx('h-full', 'flex', 'items-center', 'gap-6')}>
          <span>开发模式</span>
          <Tooltip title="开启开发模式后，未发布的变更也将实时体现。">
            <ExclamationCircleOutlined />
          </Tooltip>
        </div>
      ),
      dataIndex: 'mode',
      key: 'mode',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <Checkbox
            checked={!!record.config?.isDevMode}
            onChange={(e) =>
              handleUpdate(record.id, record.accessKey, e.target.checked)
            }
          />
        </div>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          <CopyToClipboard text={record.accessKey || ''} onCopy={handleCopy}>
            <Tooltip title="复制">
              <Button
                type="text"
                rootClassName={cx('h-full', 'flex', 'items-center')}
                icon={
                  <img
                    className={cx('cursor-pointer', styles.img)}
                    src={copyImage}
                    alt=""
                  />
                }
              />
            </Tooltip>
          </CopyToClipboard>
          <Button
            type="text"
            icon={<DeleteOutlined className={cx(styles['icon-del'])} />}
            onClick={() => handleDelConfirm(record.id, record.accessKey)}
          />
        </div>
      ),
    },
  ];

  // 关闭弹窗
  const handleCancel = () => {
    setDataSource([]);
    onCancel();
  };

  return (
    <Modal
      classNames={{
        content: cx(styles.container),
        header: cx(styles.container),
        body: cx(styles.container),
      }}
      title={
        <div className={cx('text-ellipsis')} style={{ width: '400px' }}>
          {name}-API Key
        </div>
      }
      open={open}
      width={710}
      destroyOnHidden
      footer={null}
      onCancel={handleCancel}
    >
      <Table<UserApiKeyInfo>
        className={cx(styles['table-wrap'])}
        rowClassName={cx(styles['table-row'])}
        rowKey="id"
        columns={inputColumns}
        dataSource={dataSource}
        pagination={false}
        loading={loadingList}
        virtual
        scroll={{
          y: 450,
        }}
        locale={{
          emptyText: <Empty description="暂无数据" />,
        }}
        footer={() => (
          <Button
            onClick={() => runApiKeyCreate(agentId)}
            loading={loading}
            icon={<PlusOutlined />}
          >
            新增API Key
          </Button>
        )}
      />
    </Modal>
  );
};

export default CreateTempChatModal;
