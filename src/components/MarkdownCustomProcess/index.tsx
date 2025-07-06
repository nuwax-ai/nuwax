import { ProcessingEnum } from '@/types/enums/common';
import { ProcessingInfo } from '@/types/interfaces/conversationInfo';
import { CheckOutlined, CopyOutlined, ExpandOutlined } from '@ant-design/icons';
import { memo, useCallback, useEffect, useState } from 'react';
import { useModel } from 'umi';
import './index.less';

function MarkdownCustomProcess(props: ProcessingInfo) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { getProcessingById, processingList } = useModel('chat');
  const [innerProcessing, setInnerProcessing] = useState({
    ...props,
  });
  useEffect(() => {
    if (innerProcessing.status !== ProcessingEnum.EXECUTING) {
      // 如果状态不是执行中，则不更新
      return;
    }
    const processing = getProcessingById(innerProcessing.executeId);
    if (processing && processing.status !== innerProcessing.status) {
      setInnerProcessing(processing);
    }
  }, [processingList, innerProcessing.executeId]);

  // 状态显示
  const genStatusDisplay = useCallback(() => {
    switch (innerProcessing.status) {
      case ProcessingEnum.FINISHED:
        return (
          <span className="status-completed">
            <CheckOutlined />
            已完成
          </span>
        );
      case ProcessingEnum.EXECUTING:
        return (
          <span className="status-running">
            <div className="loading-spinner" />
            运行中
          </span>
        );
      case ProcessingEnum.FAILED:
        return <span className="status-error">❌ 错误</span>;
      default:
        return null;
    }
  }, [innerProcessing.status]);

  const handleCopy = () => {
    // 复制功能 - 可以复制组件的配置或内容
    const copyText = JSON.stringify(
      { result: innerProcessing?.result },
      null,
      2,
    );
    navigator.clipboard.writeText(copyText).then(() => {
      console.log('已复制到剪贴板');
    });
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="markdown-custom-process">
      <div className="process-header">
        <div className="process-title">
          {innerProcessing.name || '暂无名称'}
        </div>
        <div className="process-controls">
          {genStatusDisplay()}
          <button
            type="button"
            className="control-btn"
            onClick={handleExpand}
            title={isExpanded ? '收起' : '展开'}
          >
            <ExpandOutlined
              style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
            />
          </button>
          <button
            type="button"
            className="control-btn"
            onClick={handleCopy}
            title="复制"
          >
            <CopyOutlined />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="process-content">
          {innerProcessing.result ? (
            <pre>{JSON.stringify(innerProcessing.result, null, 2)}</pre>
          ) : (
            <div className="default-content">
              <p>组件类型: {innerProcessing.type}</p>
              <p>组件名称: {innerProcessing.name}</p>
              {innerProcessing.executeId && (
                <p>组件ID: {innerProcessing.executeId}</p>
              )}
              {innerProcessing.result && (
                <div>
                  <p>数据:</p>
                  <pre>{JSON.stringify(innerProcessing.result, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(MarkdownCustomProcess, (prevProps, nextProps) => {
  return (
    prevProps.executeId === nextProps.executeId &&
    prevProps.status === nextProps.status
  );
});
