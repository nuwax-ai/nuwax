import Loading from '@/components/custom/Loading';
import { apiOperationLogDetail } from '@/services/agentDev';
import { OperationLogInfo } from '@/types/interfaces/agent';
import { CopyOutlined } from '@ant-design/icons';
import { ProDescriptions } from '@ant-design/pro-components';
import { Drawer, Empty, message } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { memo, useEffect, useMemo, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styles from './index.less';
const cx = classNames.bind(styles);

/**
 * 日志详情抽屉
 * 说明：用于 ProTable 行点击后的侧滑详情展示。
 */
export interface LogDetailDrawerProps {
  open: boolean;
  id: string | undefined;
  onClose: () => void;
}

const LogDetailDrawer: React.FC<LogDetailDrawerProps> = ({
  open,
  id,
  onClose,
}) => {
  const drawerWidth = useMemo(() => {
    // 简单响应式：PC 720，移动端尽量占满
    if (typeof window === 'undefined') {
      return 720;
    }
    const w = window.innerWidth || 720;
    return Math.min(720, Math.max(360, Math.floor(w * 0.92)));
  }, []);

  // 加载中
  const [loading, setLoading] = useState(false);
  // 详情信息
  const [operationLogInfoDetail, setOperationLogInfoDetail] =
    useState<OperationLogInfo>();

  // 获取详情信息
  const getDetailById = async () => {
    if (id) {
      try {
        setLoading(true);
        const { data } = await apiOperationLogDetail({ id });
        setOperationLogInfoDetail(data);
      } finally {
        setLoading(false);
      }
    }
  };
  const handleCopy = () => {
    message.success('复制成功');
  };

  useEffect(() => {
    getDetailById();
  }, [open]);

  return (
    <Drawer
      className={styles.drawer}
      title="日志详情"
      placement="right"
      open={open}
      onClose={onClose}
      width={drawerWidth}
      destroyOnHidden
      rootStyle={{ overflow: 'hidden' }}
      styles={{
        body: { padding: 0 },
      }}
    >
      {loading ? (
        <Loading className="h-full" />
      ) : !!operationLogInfoDetail ? (
        <>
          <ProDescriptions
            title="基本信息"
            column={1}
            dataSource={operationLogInfoDetail}
            style={{ padding: '14px' }}
            columns={[
              {
                title: '类型',
                dataIndex: 'systemName',
                render: (text: any) => text || '-',
              },
              {
                title: '操作方式',
                dataIndex: 'action',
                render: (text: any) => text || '-',
              },
              {
                title: '对象名称',
                dataIndex: 'object',
                render: (text: any) => text || '-',
              },
              {
                title: '对象子类',
                dataIndex: 'operateContent',
                render: (text: any) => text || '-',
              },
              {
                title: '创建人',
                dataIndex: 'creator',
                render: (text: any) => text || '-',
              },
              {
                title: '创建时间',
                dataIndex: 'created',
                render: (text: any) => {
                  if (!text) return '-';
                  return dayjs(text as string).format('YYYY-MM-DD HH:mm:ss');
                },
              },
            ]}
          />

          <div className={cx(styles.wrap, styles['render-container'])}>
            <h5 className={cx(styles.title)}>
              请求参数&nbsp;
              <CopyToClipboard
                text={operationLogInfoDetail?.extraContent || ''}
                onCopy={handleCopy}
              >
                <CopyOutlined />
              </CopyToClipboard>
            </h5>
            <pre>{operationLogInfoDetail?.extraContent}</pre>
          </div>
        </>
      ) : (
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Empty description="暂无数据" />
        </div>
      )}
    </Drawer>
  );
};

export default memo(LogDetailDrawer);
