import Loading from '@/components/custom/Loading';
import ToggleWrap from '@/components/ToggleWrap';
import { LogDetailsProps } from '@/types/interfaces/space';
import { CopyOutlined } from '@ant-design/icons';
import { Empty, message } from 'antd';
import classNames from 'classnames';
import React, { memo } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styles from './index.less';
import { NodeDetails } from './NodeDetails';

const cx = classNames.bind(styles);

/**
 * 日志详情内容组件（不包含外层容器）
 * 说明：为适配不同承载方式（右侧固定栏 / Drawer 抽屉），将内容部分抽出复用。
 */
export const LogDetailsContent: React.FC<
  Pick<LogDetailsProps, 'loading' | 'requestId' | 'executeResult'>
> = ({ loading, requestId, executeResult }) => {
  const handleCopy = () => {
    message.success('复制成功');
  };

  return (
    <>
      {loading ? (
        <Loading className="h-full" />
      ) : !!executeResult ? (
        <>
          <header className={cx(styles.header)}>
            <div className={cx('flex', styles['time-box'])}>
              <div className={cx(styles.num, 'flex', 'items-center')}>
                <span>
                  耗时{' '}
                  {executeResult.requestEndTime -
                    executeResult.requestStartTime}{' '}
                  ms
                </span>
                <span className={cx(styles['vertical-line'])} />
                <span>
                  {(executeResult.inputToken || 0) +
                    (executeResult.outputToken || 0)}{' '}
                  Tokens
                </span>
              </div>
            </div>
            <div className={cx('flex', styles.box)}>
              <span>消息ID:</span>
              <span className={cx(styles.value, 'text-ellipsis')}>
                {requestId}
              </span>
              <CopyToClipboard text={requestId || ''} onCopy={handleCopy}>
                <CopyOutlined />
              </CopyToClipboard>
            </div>
          </header>
          <div className={cx(styles.wrap)}>
            <h5 className={cx(styles.title)}>节点详情</h5>
            <NodeDetails node={executeResult} />
          </div>
          <div className={cx(styles.wrap, styles['render-container'])}>
            <h5 className={cx(styles.title)}>输入</h5>
            <pre>{executeResult.input}</pre>
          </div>
          <div className={cx(styles.wrap, styles['render-container'])}>
            <h5 className={cx(styles.title)}>输出</h5>
            <pre>{executeResult.output}</pre>
          </div>
        </>
      ) : (
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Empty description="暂无数据" />
        </div>
      )}
    </>
  );
};

/**
 * 日志详情组件（右侧固定栏版本，历史页面使用）
 */
const LogDetails: React.FC<LogDetailsProps> = ({
  loading,
  visible,
  requestId,
  executeResult,
  onClose,
}) => {
  return (
    <ToggleWrap title="日志详情" onClose={onClose} visible={visible}>
      <LogDetailsContent
        loading={loading}
        requestId={requestId}
        executeResult={executeResult}
      />
    </ToggleWrap>
  );
};

export default memo(LogDetails);
