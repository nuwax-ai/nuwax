import copyImage from '@/assets/images/copy.png';
import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
import {
  apiTempChatCreate,
  apiTempChatDel,
  apiTempChatList,
  apiTempChatUpdate,
} from '@/services/tempChat';
import type { CreateTempChatModalProps } from '@/types/interfaces/space';
import { AgentTempChatDto } from '@/types/interfaces/tempChat';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  DatePicker,
  Empty,
  message,
  Modal,
  QRCode,
  Table,
  TableColumnsType,
  Tooltip,
} from 'antd';
import classNames from 'classnames';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { useRequest } from 'umi';
import styles from './index.less';

import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
// import CopyChatWidgetCode from './CopyChatWidgetCode';

const cx = classNames.bind(styles);

// 创建临时会话弹窗
const CreateTempChatModal: React.FC<CreateTempChatModalProps> = ({
  agentId,
  name,
  open,
  onCancel,
}) => {
  // 临时会话链接列表
  const [dataSource, setDataSource] = useState<AgentTempChatDto[]>([]);
  // 二维码链接
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  // 二维码弹窗是否显示
  const [qrCodeVisible, setQrCodeVisible] = useState<boolean>(false);

  // 新增智能体临时会话链接接口
  const { run: runTempChatCreate, loading } = useRequest(apiTempChatCreate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentTempChatDto) => {
      setDataSource([...dataSource, result]);
    },
  });

  // 查询智能体临时会话链接接口
  const { run: runList, loading: loadingList } = useRequest(apiTempChatList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentTempChatDto[]) => {
      setDataSource(result || []);
    },
  });

  // 修改智能体临时会话链接接口
  const { run: runUpdate } = useRequest(apiTempChatUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success(dict('PC.Toast.Global.modifiedSuccessfully'));
    },
  });

  // 删除智能体临时会话链接接口
  const { run: runDel } = useRequest(apiTempChatDel, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: [number, number]) => {
      message.success(dict('PC.Toast.Global.deletedSuccessfully'));
      // 删除成功后，从数据源中过滤掉该项
      const [id] = params;
      const _dataSource = dataSource?.filter(
        (item: AgentTempChatDto) => item.id !== id,
      );
      setDataSource(_dataSource || []);
    },
  });

  const handleCopy = () => {
    message.success(dict('PC.Toast.Global.copiedSuccessfully'));
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
    let _value: string | boolean | number | Dayjs = value;
    // 链接过期时间
    if (attr === 'expire') {
      _value = value ? dayjs(value.toString()) : '';
    }
    // 是否需要登录
    if (attr === 'requireLogin') {
      _value = value ? 1 : 0;
    }

    runUpdate({ id, agentId, [attr]: _value });
  };

  // 删除会话链接
  const handleDel = (id: number, agentId: number) => {
    runDel(id, agentId);
  };

  // 删除确认
  const handleDelConfirm = (id: number, agentId: number, chatUrl: string) => {
    modalConfirm(
      dict('PC.Pages.SpaceDevelop.CreateTempChatModal.deleteConfirmText'),
      chatUrl,
      () => {
        handleDel(id, agentId);
        return new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      },
    );
  };

  // 显示二维码弹窗
  const handleQrCodeVisible = (url: string) => {
    setQrCodeVisible(true);
    setQrCodeUrl(url);
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<AgentTempChatDto> = [
    {
      title: dict('PC.Pages.SpaceDevelop.CreateTempChatModal.linkAddress'),
      dataIndex: 'chatUrl',
      key: 'chatUrl',
      className: 'flex',
      render: (value: string, record) => (
        <div
          className={cx(
            'flex',
            'items-center',
            'overflow-hide',
            styles['url-box'],
          )}
        >
          <EllipsisTooltip
            text={value}
            className={cx(styles['chat-url'], 'flex-1')}
          />
          <CopyToClipboard text={value || ''} onCopy={handleCopy}>
            <Tooltip title={dict('PC.Common.Global.copy')}>
              <span
                className={cx(
                  styles['img-box'],
                  styles['copy-img-box'],
                  'flex',
                  'content-center',
                  'items-center',
                  'cursor-pointer',
                )}
              >
                <img
                  className={cx('cursor-pointer', styles.img)}
                  src={copyImage}
                  alt=""
                />
              </span>
            </Tooltip>
          </CopyToClipboard>
          <Tooltip
            title={dict('PC.Pages.SpaceDevelop.CreateTempChatModal.qrCode')}
          >
            <span
              className={cx(
                styles['img-box'],
                'flex',
                'content-center',
                'items-center',
                'cursor-pointer',
              )}
              onClick={() => handleQrCodeVisible(record.chatUrl)}
            >
              <img
                className={cx('cursor-pointer', styles.img)}
                src={record.qrCodeUrl}
                alt=""
              />
            </span>
          </Tooltip>
          {/* <CopyChatWidgetCode chatUrl={record.chatUrl} size={24} /> */}
        </div>
      ),
    },
    {
      title: dict('PC.Pages.SpaceDevelop.CreateTempChatModal.loginRequired'),
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
      title: dict('PC.Pages.SpaceDevelop.CreateTempChatModal.validity'),
      key: 'expire',
      width: 210,
      render: (_, record) => (
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
      ),
    },
    {
      title: dict('PC.Common.Global.operation'),
      width: 80,
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() =>
              handleDelConfirm(record.id, record.agentId, record.chatUrl)
            }
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
    <>
      <Modal
        classNames={{
          content: cx(styles.container),
          header: cx(styles.container),
          body: cx(styles.container),
        }}
        title={
          <div className={cx('text-ellipsis')} style={{ width: '400px' }}>
            {dict('PC.Pages.SpaceDevelop.CreateTempChatModal.modalTitle', name)}
          </div>
        }
        open={open}
        width={710}
        destroyOnHidden
        footer={null}
        onCancel={handleCancel}
      >
        <Table<AgentTempChatDto>
          className={cx(styles['table-wrap'])}
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
            emptyText: (
              <Empty description={dict('PC.Common.Global.emptyData')} />
            ),
          }}
          footer={() => (
            <Button
              onClick={() => runTempChatCreate(agentId)}
              loading={loading}
              icon={<PlusOutlined />}
            >
              {dict('PC.Pages.SpaceDevelop.CreateTempChatModal.addLink')}
            </Button>
          )}
        />
      </Modal>
      <Modal
        open={qrCodeVisible}
        destroyOnHidden
        footer={null}
        className={styles['qr-code-modal']}
        onCancel={() => setQrCodeVisible(false)}
        modalRender={() => <QRCode size={500} value={qrCodeUrl || '-'} />}
      />
    </>
  );
};

export default CreateTempChatModal;
