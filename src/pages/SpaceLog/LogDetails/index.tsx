import databaseImage from '@/assets/images/database_image.png';
import knowledgeImage from '@/assets/images/knowledge_image.png';
import modelImage from '@/assets/images/model_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import variableImage from '@/assets/images/variable_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import Loading from '@/components/Loading';
import ToggleWrap from '@/components/ToggleWrap';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type {
  ConversationFinalResult,
  ExecuteResultInfo,
} from '@/types/interfaces/conversationInfo';
import { LogDetailsProps } from '@/types/interfaces/space';
import { CopyOutlined } from '@ant-design/icons';
import { Empty, message } from 'antd';
import classNames from 'classnames';
import markdownIt from 'markdown-it';
// 方程式支持
import { encodeHTML } from '@/utils/common';
import markdownItKatexGpt from 'markdown-it-katex-gpt';
import markdownItMultimdTable from 'markdown-it-multimd-table';
import React, { memo, useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import styles from './index.less';
import { NodeDetails } from './NodeDetails';

const cx = classNames.bind(styles);

const md = markdownIt({
  html: true, // 启用原始HTML解析
  xhtmlOut: true, // 使用 XHTML 兼容语法
  breaks: true, // 换行转换为 <br>
  linkify: true, // 自动识别链接
  typographer: true, // 优化排版
  quotes: '""\'\'', // 双引号和单引号都不替换
});

// 添加 KaTeX 支持
md.use(markdownItKatexGpt, {
  delimiters: [
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false },
    { left: '$$', right: '$$', display: false },
  ],
});

// 添加表格支持
md.use(markdownItMultimdTable, {
  multiline: true,
  rowspan: true,
  headerless: false,
  multibody: true,
  aotolabel: true,
});

// html自定义转义
md.renderer.rules.html_block = (tokens, idx) => {
  return encodeHTML(tokens[idx].content);
};

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
    if (!executeResult) {
      return;
    }
    const _finalResult = JSON.parse(executeResult);
    setFinalResult(_finalResult);
    // 执行结果列表
    const result = _finalResult?.componentExecuteResults || [];
    if (result?.length > 0) {
      // 当前执行结果
      const _executeInfo = result[currentIndex];
      setExecuteInfo(_executeInfo);
      // 当前执行结果不为空
      if (!!_executeInfo) {
        // 输入参数
        let _inputData;
        if (typeof _executeInfo.input === 'string') {
          _inputData = _executeInfo.input;
        } else {
          _inputData = JSON.stringify(_executeInfo.input, null, 2);
        }
        setInputData(_inputData);
        // 输出参数
        const _outputData = _executeInfo.data;
        setOutputData(_outputData);
      }
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
    message.success('复制成功');
  };

  // 获取图标，如果不存在则使用默认图
  const getIcon = (info: ExecuteResultInfo) => {
    if (info?.icon) {
      return info.icon;
    }
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
      default:
        return pluginImage;
    }
  };

  return (
    <ToggleWrap title="日志详情" onClose={onClose} visible={visible}>
      {loading ? (
        <Loading className="h-full" />
      ) : !!finalResult ? (
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
            {finalResult?.componentExecuteResults?.map(
              (info: ExecuteResultInfo, index: number) => (
                // 模型可能不存在id，所以使用index作为key
                <div
                  key={info?.id || index}
                  className={cx(styles['execute-box'], 'flex', 'items-center')}
                >
                  <img
                    className={cx(styles['component-img'])}
                    src={getIcon(info)}
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
            <h5 className={cx(styles.title)}>节点详情</h5>
            <NodeDetails node={executeInfo} />
          </div>
          <div className={cx(styles.wrap)}>
            <h5 className={cx(styles.title)}>输入</h5>
            <pre>{inputData}</pre>
          </div>
          <div className={cx(styles.wrap)}>
            <h5 className={cx(styles.title)}>输出</h5>
            <pre
              dangerouslySetInnerHTML={{
                __html: md.render(outputData),
              }}
            />
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

export default memo(LogDetails);
