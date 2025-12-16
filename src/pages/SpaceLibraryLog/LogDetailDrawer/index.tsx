import Loading from '@/components/custom/Loading';
import { apiSpaceLogDetail } from '@/services/agentDev';
import { SpaceLogInfoDetail } from '@/types/interfaces/agent';
import { CopyOutlined } from '@ant-design/icons';
import { Drawer, Empty, message } from 'antd';
import classNames from 'classnames';
import React, { memo, useEffect, useMemo, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { NodeDetails } from '../NodeDetails';
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
  const [spaceLogInfoDetail, setSpaceLogInfoDetail] =
    useState<SpaceLogInfoDetail>();

  // 获取详情信息
  const getDetailById = async () => {
    if (id) {
      try {
        setLoading(true);
        const { data } = await apiSpaceLogDetail({ id });
        setSpaceLogInfoDetail(data);
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
      destroyOnClose
      rootStyle={{ overflow: 'hidden' }}
      styles={{
        body: { padding: 0 },
      }}
    >
      {loading ? (
        <Loading className="h-full" />
      ) : !!spaceLogInfoDetail ? (
        <>
          <header className={cx(styles.header)}>
            <div className={cx('flex', styles['time-box'])}>
              <div className={cx(styles.num, 'flex', 'items-center')}>
                <span>
                  耗时{' '}
                  {spaceLogInfoDetail.requestEndTime -
                    spaceLogInfoDetail.requestStartTime}{' '}
                  ms
                </span>
                <span className={cx(styles['vertical-line'])} />
                <span>
                  {(spaceLogInfoDetail.inputToken || 0) +
                    (spaceLogInfoDetail.outputToken || 0)}{' '}
                  Tokens
                </span>
              </div>
            </div>
            <div className={cx('flex', styles.box)}>
              <span>消息ID:</span>
              <span className={cx(styles.value, 'text-ellipsis')}>
                {spaceLogInfoDetail.requestId}
              </span>
              <CopyToClipboard
                text={spaceLogInfoDetail.requestId || ''}
                onCopy={handleCopy}
              >
                <CopyOutlined />
              </CopyToClipboard>
            </div>
          </header>
          <div className={cx(styles.wrap)}>
            <h5 className={cx(styles.title)}>节点详情</h5>
            <NodeDetails node={spaceLogInfoDetail} />
          </div>
          <div className={cx(styles.wrap, styles['render-container'])}>
            <h5 className={cx(styles.title)}>
              输入&nbsp;
              <CopyToClipboard
                text={spaceLogInfoDetail.input || ''}
                onCopy={handleCopy}
              >
                <CopyOutlined />
              </CopyToClipboard>
            </h5>
            <pre>{spaceLogInfoDetail.input}</pre>
          </div>
          <div className={cx(styles.wrap, styles['render-container'])}>
            <h5 className={cx(styles.title)}>
              输出&nbsp;
              <CopyToClipboard
                text={spaceLogInfoDetail.output || ''}
                onCopy={handleCopy}
              >
                <CopyOutlined />
              </CopyToClipboard>
            </h5>
            <pre>{spaceLogInfoDetail.output}</pre>
          </div>
          <div className={cx(styles.wrap, styles['render-container'])}>
            <h5 className={cx(styles.title)}>
              执行过程&nbsp;
              <CopyToClipboard
                text={spaceLogInfoDetail.processData || ''}
                onCopy={handleCopy}
              >
                <CopyOutlined />
              </CopyToClipboard>
            </h5>
            <pre>{spaceLogInfoDetail.processData}</pre>
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
