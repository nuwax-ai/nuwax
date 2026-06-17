import databaseImage from '@/assets/images/database_image.png';
import knowledgeImage from '@/assets/images/knowledge_image.png';
import mcpImage from '@/assets/images/mcp_image.png';
import modelImage from '@/assets/images/model_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import variableImage from '@/assets/images/variable_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import Loading from '@/components/custom/Loading';
import ToggleWrap from '@/components/ToggleWrap';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type {
  ConversationFinalResult,
  ExecuteResultInfo,
} from '@/types/interfaces/conversationInfo';
import { LogDetailsProps } from '@/types/interfaces/space';
import {
  parseConversationFinalResultJson,
  safeElapsedMsForDict,
  stringifyExecutePayloadForPre,
} from '@/utils/conversationFinalResult';
import { CopyOutlined } from '@ant-design/icons';
import { Empty, message } from 'antd';
import classNames from 'classnames';
import React, { memo, useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styles from './index.less';
import { NodeDetails } from './NodeDetails';

const cx = classNames.bind(styles);

/**
 * 日志详情组件
 */
const LogDetails: React.FC<LogDetailsProps> = ({
  loading,
  visible,
  requestId,
  executeResult,
  onClose,
}) => {
  // 当前执行结果
  const [executeInfo, setExecuteInfo] = useState<ExecuteResultInfo | null>();
  const [finalResult, setFinalResult] =
    useState<ConversationFinalResult | null>(null);
  // 当前执行结果索引，默认为0
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // 输入参数
  const [inputData, setInputData] = useState<string>('');
  // 输出参数
  const [outputData, setOutputData] = useState<string>('');

  useEffect(() => {
    const _finalResult = parseConversationFinalResultJson(executeResult);
    setFinalResult(_finalResult);

    if (!_finalResult) {
      setExecuteInfo(undefined);
      setInputData('');
      setOutputData('');
      return;
    }

    const result = _finalResult.componentExecuteResults || [];
    if (result.length > 0) {
      const _executeInfo = result[currentIndex];
      setExecuteInfo(_executeInfo);
      if (_executeInfo) {
        setInputData(stringifyExecutePayloadForPre(_executeInfo.input));
        setOutputData(stringifyExecutePayloadForPre(_executeInfo.data));
      } else {
        setInputData('');
        setOutputData('');
      }
    } else {
      setExecuteInfo(undefined);
      setInputData('');
      setOutputData('');
    }
  }, [executeResult, currentIndex]);

  useEffect(() => {
    setCurrentIndex(0);

    return () => {
      setFinalResult(null);
      setInputData('');
      setOutputData('');
    };
  }, [executeResult]);

  const handleCopy = () => {
    message.success(dict('PC.Toast.Global.copiedSuccessfully'));
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

  return (
    <ToggleWrap
      title={dict('PC.Pages.SpaceLog.LogDetails.title')}
      onClose={onClose}
      visible={visible}
    >
      {loading ? (
        <Loading className="h-full" />
      ) : !!finalResult ? (
        <>
          <header className={cx(styles.header)}>
            <div className={cx('flex', styles['time-box'])}>
              <div className={cx(styles.num, 'flex', 'items-center')}>
                <span>
                  {dict(
                    'PC.Pages.SpaceLog.LogDetails.elapsedTime',
                    safeElapsedMsForDict(finalResult),
                  )}
                </span>
                <span className={cx(styles['vertical-line'])} />
                <span>{finalResult.totalTokens ?? '--'} Tokens</span>
              </div>
            </div>
            <div className={cx('flex', styles.box)}>
              <span>{dict('PC.Pages.SpaceLog.LogDetails.messageIdLabel')}</span>
              <span className={cx(styles.value, 'text-ellipsis')}>
                {requestId}
              </span>
              <CopyToClipboard text={requestId || ''} onCopy={handleCopy}>
                <CopyOutlined />
              </CopyToClipboard>
            </div>
          </header>
          <div className={cx(styles.wrap)}>
            <h5 className={cx(styles.title)}>
              {dict('PC.Pages.SpaceLog.LogDetails.calledComponents')}
            </h5>
            {finalResult?.componentExecuteResults?.map(
              (info: ExecuteResultInfo, index: number) => (
                // 模型可能不存在id，所以使用index作为key
                <div
                  key={info?.id || index}
                  className={cx(styles['execute-box'], 'flex', 'items-center')}
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
                    onClick={() => setCurrentIndex(index)}
                  >
                    {info.name}
                  </span>
                </div>
              ),
            )}
          </div>
          <div className={cx(styles.wrap)}>
            <h5 className={cx(styles.title)}>
              {dict('PC.Pages.SpaceLog.LogDetails.nodeDetails')}
            </h5>
            <NodeDetails node={executeInfo} />
          </div>
          <div className={cx(styles.wrap, styles['render-container'])}>
            <h5 className={cx(styles.title)}>
              {dict('PC.Pages.SpaceLog.LogDetails.input')}
            </h5>
            <pre>{inputData}</pre>
          </div>
          <div className={cx(styles.wrap, styles['render-container'])}>
            <h5 className={cx(styles.title)}>
              {dict('PC.Pages.SpaceLog.LogDetails.output')}
            </h5>
            <pre>{outputData}</pre>
            {/* <pre
              dangerouslySetInnerHTML={{
                __html: md.render(outputData),
              }}
            /> */}
          </div>
        </>
      ) : (
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Empty description={dict('PC.Common.Global.emptyData')} />
        </div>
      )}
    </ToggleWrap>
  );
};

export default memo(LogDetails);
