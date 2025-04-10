import knowledgeImage from '@/assets/images/knowledge_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import variableImage from '@/assets/images/variable_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import ToggleWrap from '@/components/ToggleWrap';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { DebugDetailsProps } from '@/types/interfaces/agentConfig';
import type { ExecuteResultInfo } from '@/types/interfaces/conversationInfo';
import { CopyOutlined } from '@ant-design/icons';
import { Empty, message } from 'antd';
import classNames from 'classnames';
import React, { memo, useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useModel } from 'umi';
import styles from './index.less';
import { NodeDetails } from './NodeDetails';

const cx = classNames.bind(styles);

/**
 * 调试详情组件
 */
const DebugDetails: React.FC<DebugDetailsProps> = ({ visible, onClose }) => {
  const { requestId, finalResult } = useModel('conversationInfo');
  // 当前执行结果
  const [executeInfo, setExecuteInfo] = useState<ExecuteResultInfo>();
  // 当前执行结果索引，默认为0
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // 输入参数
  const [inputData, setInputData] = useState<string>();
  // 输出参数
  const [outputData, setOutputData] = useState<string>();

  useEffect(() => {
    // 执行结果列表
    const result = finalResult?.componentExecuteResults || [];
    if (result?.length > 0) {
      // 当前执行结果
      const _executeInfo = result[currentIndex];
      setExecuteInfo(_executeInfo);
      // 当前执行结果不为空
      if (!!_executeInfo) {
        // 输入参数
        const _inputData = JSON.stringify(_executeInfo.input, null, 2);
        setInputData(_inputData);
        // 输出参数
        const _outputData = JSON.stringify(_executeInfo.data, null, 2);
        setOutputData(_outputData);
      }
    }
  }, [finalResult, currentIndex]);

  const handleCopy = () => {
    message.success('复制成功');
  };

  // 获取图标，如果不存在则使用默认图
  const getIcon = (info: ExecuteResultInfo) => {
    if (info?.icon) {
      return info.icon;
    }
    switch (info.type) {
      case AgentComponentTypeEnum.Plugin:
        return pluginImage as string;
      case AgentComponentTypeEnum.Workflow:
        return workflowImage as string;
      case AgentComponentTypeEnum.Knowledge:
        return knowledgeImage as string;
      case AgentComponentTypeEnum.Variable:
        return variableImage as string;
    }
  };

  return (
    <ToggleWrap title="调试详情" onClose={onClose} visible={visible}>
      {!!finalResult ? (
        <>
          <header className={cx(styles.header)}>
            <div className={cx('flex', styles['time-box'])}>
              <div className={cx(styles.num, 'flex', 'items-center')}>
                <span>
                  耗时{finalResult.endTime - finalResult.startTime} ms
                </span>
                <span className={cx(styles['vertical-line'])} />
                <span>{finalResult.totalTokens} Tokens</span>
              </div>
            </div>
            <div className={cx('flex', styles.box)}>
              <span>requestId:</span>
              <span className={cx(styles.value, 'text-ellipsis')}>
                {requestId}
              </span>
              <CopyToClipboard text={requestId || ''} onCopy={handleCopy}>
                <CopyOutlined />
              </CopyToClipboard>
            </div>
          </header>
          <div className={cx(styles.wrap)}>
            <h5 className={cx(styles.title)}>调用组件</h5>
            {finalResult?.componentExecuteResults?.map((info, index) => (
              <div
                key={info.id}
                className={cx(styles['execute-box'], 'flex', 'items-center')}
              >
                <img src={getIcon(info)} alt="" />
                <span
                  className={cx(styles.name, 'cursor-pointer', {
                    [styles.active]: currentIndex === index,
                  })}
                  onClick={() => setCurrentIndex(index)}
                >
                  {info.name}
                </span>
              </div>
            ))}
          </div>
          <div className={cx(styles.wrap)}>
            <h5 className={cx(styles.title)}>节点详情</h5>
            <NodeDetails node={executeInfo} />
          </div>
          <div className={cx(styles.wrap)}>
            <h5 className={cx(styles.title)}>输入</h5>
            <pre>{inputData}</pre>
          </div>
          <div className={cx(styles.wrap)}>
            <h5 className={cx(styles.title)}>输出</h5>
            <pre>{outputData}</pre>
          </div>
        </>
      ) : (
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Empty description="暂无数据" />
        </div>
      )}
    </ToggleWrap>
  );
};

export default memo(DebugDetails);
