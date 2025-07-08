import { ProcessingEnum } from '@/types/enums/common';
import { ProcessingInfo } from '@/types/interfaces/conversationInfo';
import { cloneDeep } from '@/utils/common';
import { CheckOutlined, CopyOutlined, ReadOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import { isEqual } from 'lodash';
import { memo, useCallback, useEffect, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';
import SeeDetailModal from './SeeDetailModal';
const cx = classNames.bind(styles);

function MarkdownCustomProcess(props: ProcessingInfo) {
  const { getProcessingById, processingList } = useModel('chat');
  const [detailData, setDetailData] = useState<{
    params: Record<string, any>;
    response: Record<string, any>;
  } | null>(null);
  const [innerProcessing, setInnerProcessing] = useState({
    ...props,
  });
  // 添加 WebSearchProModal 的状态管理
  const [openModal, setOpenModal] = useState(false);

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
          <span className={cx(styles['status-completed'])}>
            <CheckOutlined />
            已完成
          </span>
        );
      case ProcessingEnum.EXECUTING:
        return (
          <span className={cx(styles['status-running'])}>
            <div className={cx(styles['loading-spinner'])} />
            运行中
          </span>
        );
      case ProcessingEnum.FAILED:
        return <span className={cx(styles['status-error'])}>❌ 错误</span>;
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

  // 准备 详情弹窗 所需的数据
  const getDetailData = useCallback((result: any) => {
    if (!result) {
      return null;
    }
    const _result = cloneDeep(result);
    return {
      // 从结果中提取输入参数，如果没有则提供空对象
      params: _result.input || {},
      // 使用结果的 data 作为响应数据，如果没有则提供空对象
      response: _result.data.result || null,
    };
  }, []);

  useEffect(() => {
    if (
      innerProcessing.executeId &&
      innerProcessing.status === ProcessingEnum.FINISHED
    ) {
      const theDetailData = getDetailData(innerProcessing.result);
      if (isEqual(theDetailData, detailData)) {
        // loose equal
        return;
      }
      setDetailData(theDetailData);
    }
  }, [innerProcessing.executeId, innerProcessing.status]);

  if (!innerProcessing.executeId) {
    return null;
  }

  return (
    <div className={cx(styles['markdown-custom-process'])}>
      <div className={cx(styles['process-header'])}>
        <div className={cx(styles['process-title'])}>
          {innerProcessing.name || '暂无名称'}
        </div>
        <div className={cx(styles['process-controls'])}>
          {genStatusDisplay()}
          <div className={cx(styles['process-controls-actions'])}>
            <Tooltip title={'查看详情'}>
              <Button
                type="text"
                icon={<ReadOutlined />}
                onClick={() => setOpenModal(true)}
              />
            </Tooltip>
            <Tooltip title="复制">
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={handleCopy}
              />
            </Tooltip>
          </div>
        </div>
      </div>
      {/* 使用 SeeDetailModal 组件 */}
      <SeeDetailModal
        key={innerProcessing.executeId}
        title={innerProcessing.name || '暂无名称'}
        visible={openModal}
        onClose={() => setOpenModal(false)}
        data={detailData}
      />
    </div>
  );
}

export default memo(MarkdownCustomProcess, (prevProps, nextProps) => {
  return (
    prevProps.executeId === nextProps.executeId &&
    prevProps.status === nextProps.status
  );
});
