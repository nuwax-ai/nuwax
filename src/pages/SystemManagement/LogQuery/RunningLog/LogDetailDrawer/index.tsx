import databaseImage from '@/assets/images/database_image.png';
import knowledgeImage from '@/assets/images/knowledge_image.png';
import mcpImage from '@/assets/images/mcp_image.png';
import modelImage from '@/assets/images/model_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import variableImage from '@/assets/images/variable_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import Loading from '@/components/custom/Loading';
import { apiRunningLogDetail } from '@/services/agentDev';
import { t } from '@/services/i18nRuntime';
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
 * Running log detail drawer.
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
    // Basic responsive width: 720 on desktop, near full on mobile.
    if (typeof window === 'undefined') {
      return 720;
    }
    const w = window.innerWidth || 720;
    return Math.min(720, Math.max(360, Math.floor(w * 0.92)));
  }, []);

  // Loading state.
  const [loading, setLoading] = useState(false);
  // Detail payload.
  const [spaceLogInfoDetail, setSpaceLogInfoDetail] =
    useState<SpaceLogInfoDetail>();

  // Final result block.
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);

  const [componentExecuteResults, setComponentExecuteResults] = useState<
    ExecuteResultInfo[]
  >([]);
  // Current execution result index.
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
      input:
        typeof info?.input === 'string'
          ? info?.input
          : JSON.stringify(info?.input),

      output:
        typeof info?.data === 'string'
          ? info?.data
          : JSON.stringify(info?.data),
    });
  };

  // Fetch detail by ID.
  const getDetailById = async () => {
    if (id) {
      try {
        setLoading(true);
        const { data } = await apiRunningLogDetail({ id });
        setSpaceLogInfoDetail(data);
        // Agent mode.
        if (data.targetType === AgentComponentTypeEnum.Agent) {
          const _processData = JSON.parse(data.processData || '{}');

          setComponentExecuteResults(
            _processData?.componentExecuteResults || [],
          );

          const _componentExecuteResults =
            _processData?.componentExecuteResults || [];
          if (_componentExecuteResults?.length > 0) {
            handleClickExecuteResult(0, _componentExecuteResults);
          } else {
            // Other target types.
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
        } else {
          // Other target types.
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
    message.success(t('PC.Toast.Global.copiedSuccessfully'));
  };

  // Resolve icon, fallback to default icon by component type.
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
      title={t('PC.Pages.SystemRunningLogDetailDrawer.title')}
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
      ) : !!spaceLogInfoDetail ? (
        <>
          <header className={cx(styles.header)}>
            <div className={cx('flex', styles['time-box'])}>
              <div className={cx(styles.num, 'flex', 'items-center')}>
                <span>
                  {t('PC.Pages.SystemRunningLogDetailDrawer.duration')}{' '}
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
              <span>
                {t('PC.Pages.SystemRunningLogDetailDrawer.messageId')}
              </span>
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
          {spaceLogInfoDetail.targetType === AgentComponentTypeEnum.Agent &&
            !!componentExecuteResults?.length && (
              <div className={cx(styles.wrap)}>
                <h5 className={cx(styles.title)}>
                  {t('PC.Pages.SystemRunningLogDetailDrawer.calledComponents')}
                </h5>
                {componentExecuteResults?.map(
                  (info: ExecuteResultInfo, index: number) => (
                    // Models may not have stable IDs, fallback to index.
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
            <h5 className={cx(styles.title)}>
              {t('PC.Pages.SystemRunningLogDetailDrawer.nodeDetails')}
            </h5>
            <NodeDetails node={finalResult} />
          </div>
          <div className={cx(styles.wrap, styles['render-container'])}>
            <h5 className={cx(styles.title)}>
              {t('PC.Pages.SystemRunningLogDetailDrawer.input')}&nbsp;
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
              {t('PC.Pages.SystemRunningLogDetailDrawer.output')}&nbsp;
              <CopyToClipboard
                text={finalResult?.output || ''}
                onCopy={handleCopy}
              >
                <CopyOutlined />
              </CopyToClipboard>
            </h5>
            <pre>{finalResult?.output}</pre>
          </div>
          {spaceLogInfoDetail?.targetType !== AgentComponentTypeEnum.Agent && (
            <div className={cx(styles.wrap, styles['render-container'])}>
              <h5 className={cx(styles.title)}>
                {t('PC.Pages.SystemRunningLogDetailDrawer.executionProcess')}
                &nbsp;
                <CopyToClipboard
                  text={spaceLogInfoDetail.processData || ''}
                  onCopy={handleCopy}
                >
                  <CopyOutlined />
                </CopyToClipboard>
              </h5>
              <pre>{spaceLogInfoDetail.processData}</pre>
            </div>
          )}
        </>
      ) : (
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Empty
            description={t('PC.Pages.SystemRunningLogDetailDrawer.empty')}
          />
        </div>
      )}
    </Drawer>
  );
};

export default memo(LogDetailDrawer);
