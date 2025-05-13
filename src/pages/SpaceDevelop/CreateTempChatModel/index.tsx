import copyImage from '@/assets/images/copy.png';
import { EllipsisTooltip } from '@/components/EllipsisTooltip';
import {
  apiTempChatCreate,
  apiTempChatDel,
  apiTempChatList,
  apiTempChatUpdate,
} from '@/services/tempChat';
import type { CreateTempChatModelProps } from '@/types/interfaces/space';
import { AgentTempChatDto } from '@/types/interfaces/tempChat';
import {
  DeleteOutlined,
  ExclamationCircleFilled,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  ConfigProvider,
  DatePicker,
  Empty,
  message,
  Modal,
  Table,
  TableColumnsType,
} from 'antd';
import locale from 'antd/locale/zh_CN';
import classNames from 'classnames';
import dayjs from 'dayjs';
import moment, { Moment } from 'moment';
import React, { useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

const cx = classNames.bind(styles);

// 创建临时会话弹窗
const CreateTempChatModel: React.FC<CreateTempChatModelProps> = ({
  agentId,
  name,
  open,
  onCancel,
}) => {
  // 临时会话链接列表
  const [dataSource, setDataSource] = useState<AgentTempChatDto[]>([]);

  // 新增智能体临时会话链接接口
  const { run: runTempChatCreate, loading } = useRequest(apiTempChatCreate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentTempChatDto) => {
      setDataSource([...dataSource, { ...result, key: uuidv4() }]);
    },
  });

  // 查询智能体临时会话链接接口
  const { run: runList, loading: loadingList } = useRequest(apiTempChatList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentTempChatDto[]) => {
      setDataSource(result?.map((item) => ({ ...item, key: uuidv4() })) || []);
    },
  });

  // 修改智能体临时会话链接接口
  const { run: runUpdate } = useRequest(apiTempChatUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('修改成功');
    },
  });

  // 删除智能体临时会话链接接口
  const { run: runDel } = useRequest(apiTempChatDel, {
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

  const handleUpdate = (id: number, attr: string, value: string | boolean) => {
    const _dataSource = dataSource?.map((item: AgentTempChatDto) => {
      let _item = item;
      if (_item.id === id) {
        _item = {
          ..._item,
          [attr]: value,
        };
      }
      return _item;
    });

    setDataSource(_dataSource || []);
    let _value: string | boolean | number | Moment = value;
    // 链接过期时间
    if (attr === 'expire') {
      _value = value ? moment(value.toString()) : '';
    }
    // 是否需要登录
    if (attr === 'requireLogin') {
      _value = value ? 1 : 0;
    }

    runUpdate({ id, agentId, [attr]: _value });
  };

  // 删除会话链接
  const handleDel = (id: number, agentId: number) => {
    const _dataSource = dataSource?.filter(
      (item: AgentTempChatDto) => item.id !== id,
    );
    setDataSource(_dataSource || []);

    runDel(id, agentId);
  };

  // 删除确认
  const handleDelConfirm = (id: number, agentId: number, chatUrl: string) => {
    Modal.confirm({
      title: '您确定要删除该链接吗?',
      icon: <ExclamationCircleFilled />,
      content: chatUrl,
      okText: '确定',
      maskClosable: true,
      cancelText: '取消',
      onOk: () => handleDel(id, agentId),
    });
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<AgentTempChatDto> = [
    {
      title: '链接地址',
      dataIndex: 'chatUrl',
      key: 'chatUrl',
      className: 'flex',
      render: (value: string) => (
        <div className={cx('flex', 'items-center', 'overflow-hide')}>
          <EllipsisTooltip text={value} className={cx(styles['chat-url'])} />
          <CopyToClipboard text={value || ''} onCopy={handleCopy}>
            <img
              className={cx('cursor-pointer', styles.img)}
              src={copyImage}
              alt=""
            />
          </CopyToClipboard>
        </div>
      ),
    },
    {
      title: '登录可用',
      dataIndex: 'requireLogin',
      key: 'requireLogin',
      width: 85,
      align: 'center',
      render: (_: boolean, record: AgentTempChatDto) => (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <Checkbox
            checked={!!record.requireLogin}
            onChange={(e) =>
              handleUpdate(record.id, 'requireLogin', e.target.checked)
            }
          />
        </div>
      ),
    },
    {
      title: '有效期',
      key: 'expire',
      width: 210,
      render: (_, record) => (
        <ConfigProvider locale={locale}>
          <DatePicker
            minDate={dayjs()}
            value={record.expire ? dayjs(record.expire) : null}
            allowClear={false}
            showTime
            format={'YYYY-MM-DD HH:mm:ss'}
            onChange={(_, dateString) =>
              handleUpdate(record.id, 'expire', dateString.toString())
            }
          />
        </ConfigProvider>
      ),
    },
    {
      title: '操作',
      width: 80,
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <DeleteOutlined
            onClick={() =>
              handleDelConfirm(record.id, record.agentId, record.chatUrl)
            }
          />
        </div>
      ),
    },
  ];

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
          {name}-临时会话链接管理
        </div>
      }
      open={open}
      width={710}
      destroyOnClose
      footer={null}
      onCancel={handleCancel}
    >
      <Table<AgentTempChatDto>
        className={cx(styles['table-wrap'])}
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
            onClick={() => runTempChatCreate(agentId)}
            loading={loading}
            icon={<PlusOutlined />}
          >
            新增链接
          </Button>
        )}
      />
    </Modal>
  );
};

export default CreateTempChatModel;
