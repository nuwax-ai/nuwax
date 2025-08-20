import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { ProcessingEnum } from '@/types/enums/common';
import { copyTextToClipboard } from '@/utils/clipboard';
import { cloneDeep } from '@/utils/common';
import {
  CheckOutlined,
  CopyOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { Button, message, Tooltip } from 'antd';
import classNames from 'classnames';
import { isEqual } from 'lodash';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';
import SeeDetailModal from './SeeDetailModal';
const cx = classNames.bind(styles);
interface MarkdownCustomProcessProps {
  executeId: string;
  name: string;
  status: ProcessingEnum;
  type: AgentComponentTypeEnum;
  dataKey: string;
}
function MarkdownCustomProcess(props: MarkdownCustomProcessProps) {
  const { getProcessingById, processingList } = useModel('chat');

  const [detailData, setDetailData] = useState<{
    params: Record<string, any>;
    response: Record<string, any>;
  } | null>(null);

  const [innerProcessing, setInnerProcessing] = useState({
    ...props,
    result: '',
  });

  // 添加 WebSearchProModal 的状态管理
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    // if (innerProcessing.status !== ProcessingEnum.EXECUTING) {
    //   // 如果状态不是执行中，则不更新
    //   return;
    // }
    const processing = getProcessingById(innerProcessing.executeId);
    if (
      processing &&
      (processing?.status !== innerProcessing.status ||
        !isEqual(processing.result, innerProcessing.result))
    ) {
      setInnerProcessing(processing);
    }
  }, [processingList, innerProcessing.executeId]);

  // 状态显示
  const genStatusDisplay = useCallback(() => {
    switch (innerProcessing.status) {
      case ProcessingEnum.FINISHED:
        return (
          <div className={cx(styles['status-completed'])}>
            <CheckOutlined />
            已完成
          </div>
        );
      case ProcessingEnum.EXECUTING:
        return (
          <div className={cx(styles['status-running'])}>
            <div className={cx(styles['loading-spinner'])} />
            运行中
          </div>
        );
      case ProcessingEnum.FAILED:
        return <div className={cx(styles['status-error'])}>❌ 错误</div>;
      default:
        return null;
    }
  }, [innerProcessing.status]);

  const handleCopy = useCallback(async () => {
    if (!detailData) {
      message.error('暂无数据');
      return;
    }
    // 复制功能 - 可以复制组件的配置或内容
    const jsonText = JSON.stringify(detailData, null, 2);
    await copyTextToClipboard(jsonText, undefined, true);
  }, [detailData]);

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
      response: _result.data || null,
    };
  }, []);

  useEffect(() => {
    if (
      innerProcessing.executeId &&
      (innerProcessing.status === ProcessingEnum.FINISHED ||
        innerProcessing.status === ProcessingEnum.FAILED)
    ) {
      const theDetailData = getDetailData(innerProcessing.result);
      if (detailData && isEqual(theDetailData, detailData)) {
        // loose equal
        return;
      }
      setDetailData(theDetailData);
    }
  }, [
    innerProcessing.executeId,
    innerProcessing.status,
    innerProcessing.result,
  ]);

  const disabled = useMemo(() => {
    return (
      !(
        detailData &&
        (innerProcessing.status === ProcessingEnum.FINISHED ||
          innerProcessing.status === ProcessingEnum.FAILED)
      ) || false
    );
  }, [innerProcessing.status, detailData]);

  const handleSeeDetail = useCallback(() => {
    if (!detailData) {
      message.error('暂无数据');
      return;
    }
    setOpenModal(true);
  }, [detailData]);

  if (!innerProcessing.executeId) {
    return null;
  }

  return (
    <div
      className={cx(styles['markdown-custom-process'])}
      key={props.dataKey}
      data-key={props.dataKey}
    >
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
                disabled={disabled}
                icon={<ProfileOutlined />}
                onClick={handleSeeDetail}
              />
            </Tooltip>
            <Tooltip title="复制">
              <Button
                type="text"
                icon={<CopyOutlined />}
                disabled={disabled}
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
