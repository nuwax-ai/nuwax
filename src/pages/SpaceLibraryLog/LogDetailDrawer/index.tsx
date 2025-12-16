import databaseImage from '@/assets/images/database_image.png';
import knowledgeImage from '@/assets/images/knowledge_image.png';
import mcpImage from '@/assets/images/mcp_image.png';
import modelImage from '@/assets/images/model_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import variableImage from '@/assets/images/variable_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import Loading from '@/components/custom/Loading';
import { apiSpaceLogDetail } from '@/services/agentDev';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { SpaceLogInfoDetail } from '@/types/interfaces/agent';
import { ExecuteResultInfo } from '@/types/interfaces/conversationInfo';
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

export interface FinalResult {
  targetType: string;
  success: boolean;
  targetName: string;
  requestStartTime: number;
  requestEndTime: number;
  input: string;
  output: string;
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

  // 最终详情
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);

  const [componentExecuteResults, setComponentExecuteResults] = useState<
    ExecuteResultInfo[]
  >([]);
  // 当前执行结果索引，默认为0
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const handleClickExecuteResult = (
    index: number,
    componentExecuteResults: any,
  ) => {
    setCurrentIndex(index);
    const info: ExecuteResultInfo = componentExecuteResults?.[index];

    setFinalResult({
      targetType: info?.type,
      success: info?.success,
      targetName: info?.name,
      requestStartTime: info?.startTime,
      requestEndTime: info?.endTime,
      input: info?.input ? JSON.stringify(info?.input) : '',
      output: info?.data ? JSON.stringify(info?.data) : '',
    });
  };

  // 获取详情信息
  const getDetailById = async () => {
    if (id) {
      try {
        setLoading(true);
        const { data } = await apiSpaceLogDetail({ id });
        setSpaceLogInfoDetail(data);
        // 智能体
        if (data.targetType === AgentComponentTypeEnum.Agent) {
          const _processData = JSON.parse(data.processData || '{}');

          setComponentExecuteResults(
            _processData?.componentExecuteResults || [],
          );

          const _componentExecuteResults =
            _processData?.componentExecuteResults || [];
          if (_componentExecuteResults?.length > 0) {
            handleClickExecuteResult(0, _componentExecuteResults);
          }
        } else {
          // 其它
          setComponentExecuteResults([]);
          setCurrentIndex(0);
          setFinalResult({
            targetType: data.targetType,
            success: true,
            targetName: data.targetName,
            requestStartTime: data.requestStartTime,
            requestEndTime: data.requestEndTime,
            input: data.input,
            output: data.output,
          });
        }
      } finally {
        setLoading(false);
      }
    }
  };
  const handleCopy = () => {
    message.success('复制成功');
  };

  // 获取图标，如果不存在则使用默认图
  const getDefaultIcon = (info: ExecuteResultInfo) => {
    switch (info.type) {
      case AgentComponentTypeEnum.Plugin:
        return pluginImage;
      case AgentComponentTypeEnum.Workflow:
        return workflowImage;
      case AgentComponentTypeEnum.Knowledge:
        return knowledgeImage;
      case AgentComponentTypeEnum.Variable:
        return variableImage;
      case AgentComponentTypeEnum.Table:
        return databaseImage;
      case AgentComponentTypeEnum.Model:
        return modelImage;
      case AgentComponentTypeEnum.MCP:
        return mcpImage;
      default:
        return pluginImage;
    }
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
          {spaceLogInfoDetail.targetType === AgentComponentTypeEnum.Agent && (
            <div className={cx(styles.wrap)}>
              <h5 className={cx(styles.title)}>调用组件</h5>
              {componentExecuteResults?.map(
                (info: ExecuteResultInfo, index: number) => (
                  // 模型可能不存在id，所以使用index作为key
                  <div
                    key={info?.id || index}
                    className={cx(
                      styles['execute-box'],
                      'flex',
                      'items-center',
                    )}
                  >
                    <img
                      className={cx(styles['component-img'])}
                      src={info?.icon || getDefaultIcon(info)}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getDefaultIcon(info);
                      }}
                      alt=""
                    />
                    <span
                      className={cx(styles.name, 'cursor-pointer', {
                        [styles.active]: currentIndex === index,
                      })}
                      onClick={() => {
                        handleClickExecuteResult(
                          index,
                          componentExecuteResults,
                        );
                      }}
                    >
                      {info.name}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}

          <div className={cx(styles.wrap)}>
            <h5 className={cx(styles.title)}>节点详情</h5>
            <NodeDetails node={finalResult} />
          </div>
          <div className={cx(styles.wrap, styles['render-container'])}>
            <h5 className={cx(styles.title)}>
              输入&nbsp;
              <CopyToClipboard
                text={finalResult?.input || ''}
                onCopy={handleCopy}
              >
                <CopyOutlined />
              </CopyToClipboard>
            </h5>
            <pre>{finalResult?.input}</pre>
          </div>
          <div className={cx(styles.wrap, styles['render-container'])}>
            <h5 className={cx(styles.title)}>
              输出&nbsp;
              <CopyToClipboard
                text={finalResult?.output || ''}
                onCopy={handleCopy}
              >
                <CopyOutlined />
              </CopyToClipboard>
            </h5>
            <pre>{finalResult?.output}</pre>
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
