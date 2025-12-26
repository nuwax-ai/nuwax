import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { ProcessingEnum } from '@/types/enums/common';
// import { copyTextToClipboard } from '@/utils/clipboard';
import { cloneDeep } from '@/utils/common';
import {
  BorderOutlined,
  CheckOutlined,
  CheckSquareOutlined,
  CloseSquareOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HourglassOutlined,
  MinusOutlined,
  PlusOutlined,
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
interface InputProps {
  method: 'browser_open_page' | 'browser_navigate_page';
  data_type: 'markdown' | 'html';
  uri_type: 'Page' | 'Link';
  uri: string;
  arguments: Record<string, any>;
  request_id: string;
}

function MarkdownCustomProcess(props: MarkdownCustomProcessProps) {
  const {
    getProcessingById,
    processingList,
    pagePreviewData,
    showPagePreview,
    agentPageConfig,
  } = useModel('chat');

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
  // Plan 类型展开/收起状态
  const [isPlanExpanded, setIsPlanExpanded] = useState(true);

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
            {/* 已完成 */}
          </div>
        );
      case ProcessingEnum.EXECUTING:
        return (
          <div className={cx(styles['status-running'])}>
            <div className={cx(styles['loading-spinner'])} />
            {/* 运行中 */}
          </div>
        );
      case ProcessingEnum.FAILED:
        return <div className={cx(styles['status-error'])}>⚠️{/* 错误 */}</div>;
      default:
        return null;
    }
  }, [innerProcessing.status]);

  // const handleCopy = useCallback(async () => {
  //   if (!detailData) {
  //     message.error('暂无数据');
  //     return;
  //   }
  //   // 复制功能 - 可以复制组件的配置或内容
  //   const jsonText = JSON.stringify(detailData, null, 2);
  //   await copyTextToClipboard(jsonText, undefined, true);
  // }, [detailData]);

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

      // 自动展开页面预览逻辑
      // 如果是 Page 类型且配置为自动展开，并且状态为完成，自动触发预览
      // if (
      //   innerProcessing.type === AgentComponentTypeEnum.Page &&
      //   innerProcessing.status === ProcessingEnum.FINISHED &&
      //   agentPageConfig.expandPageArea === ExpandPageAreaEnum.Yes &&
      //   theDetailData
      // ) {
      //   const result = innerProcessing.result;
      //   if (result && typeof result === 'object') {
      //     const input = (
      //       result as {
      //         input?: { uri?: string; arguments?: Record<string, any> };
      //       }
      //     ).input;
      //     if (input?.uri) {
      //       // 自动触发预览
      //       showPagePreview({
      //         name: innerProcessing.name || '页面预览',
      //         uri: input.uri,
      //         params: input.arguments || {},
      //         executeId: innerProcessing.executeId || '',
      //       });
      //     }
      //   }
      // }
    }
  }, [
    innerProcessing.executeId,
    innerProcessing.status,
    innerProcessing.result,
    innerProcessing.type,
    innerProcessing.name,
    agentPageConfig.expandPageArea,
    showPagePreview,
    getDetailData,
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
    console.log('innerProcessing', innerProcessing);
    if (!detailData) {
      message.error('暂无数据');
      return;
    }
    setOpenModal(true);
  }, [detailData]);

  // 判断是否为 Page 类型
  const isPageType = useMemo(() => {
    return innerProcessing.type === AgentComponentTypeEnum.Page;
  }, [innerProcessing.type]);

  // 判断是否为 Plan 类型
  const isPlanType = useMemo(() => {
    return innerProcessing.type === AgentComponentTypeEnum.Plan;
  }, [innerProcessing.type]);

  // 获取 Plan 任务状态图标
  const getPlanStatusIcon = useCallback((status: string) => {
    const iconProps = { className: cx(styles['task-icon']) };
    switch (status) {
      case 'completed':
        return <CheckSquareOutlined {...iconProps} />;
      case 'pending':
        return <BorderOutlined {...iconProps} />;
      case 'failed':
        return <CloseSquareOutlined {...iconProps} />;
      case 'in_progress':
        return <HourglassOutlined {...iconProps} />;
      default:
        return <BorderOutlined {...iconProps} />;
    }
  }, []);

  // 渲染 Plan 任务列表
  const renderPlanDetails = useCallback(() => {
    if (
      !isPlanType ||
      !isPlanExpanded ||
      !detailData?.response ||
      !Array.isArray(detailData.response)
    ) {
      return null;
    }

    return (
      <div className={cx(styles['plan-details'])}>
        <div className={cx(styles['plan-task-list'])}>
          {detailData.response.map((entry: any, index: number) => (
            <div key={index} className={cx(styles['plan-task-item'])}>
              {getPlanStatusIcon(entry.status)}
              <span className={cx(styles['plan-task-text'])}>
                {entry.content}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }, [isPlanType, isPlanExpanded, detailData?.response, getPlanStatusIcon]);

  const [open, setOpen] = useState(false);

  // 打开预览页面
  const openPreviewPage = () => {
    // if (!detailData) {
    //   message.error('暂无数据');
    //   return;
    // }

    const result = innerProcessing.result;
    if (!result || typeof result !== 'object') {
      // message.error('数据格式错误');
      return;
    }

    const input: InputProps = (result as { input: InputProps }).input;
    // 判断页面类型
    if (!input.uri_type || input.uri_type === 'Page') {
      // if (!input?.uri) {
      //   message.error('页面路径不存在');
      //   return;
      // }

      const previewData = {
        uri: input.uri,
        params: input.arguments || {},
        method: '', // input.method,
        request_id: '', //  input.request_id,
        data_type: '', // input.data_type,
      };

      // 显示页面预览
      showPagePreview(previewData);
    }
    // 链接类型
    if (input.uri_type === 'Link') {
      // 拼接 query 参数
      const queryString = new URLSearchParams(input.arguments).toString();
      const pageUrl = `${input.uri}?${queryString}`;
      window.open(pageUrl, '_blank');
    }
  };
  // 处理预览页面
  const handlePreviewPage = useCallback(() => {
    // 点击前先关闭 Tooltip，防止残留
    setOpen(false);
    // 执行你的布局变化逻辑
    // ...

    if (pagePreviewData) {
      showPagePreview(null);
      return;
    }
    // 打开预览页面
    openPreviewPage();
  }, [detailData, innerProcessing, showPagePreview, pagePreviewData]);

  // 自动打开预览页面功能
  // useEffect(() => {
  //   if (innerProcessing.status === ProcessingEnum.EXECUTING) {
  //     console.log('innerProcessing.status',innerProcessing.status)
  //     // 打开预览页面
  //     openPreviewPage();
  //   }
  // }, [innerProcessing]);

  if (
    !innerProcessing.executeId ||
    innerProcessing.type === AgentComponentTypeEnum.Event // 所有事件都不显示
  ) {
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
            <Tooltip title="查看详情">
              <Button
                type="text"
                disabled={disabled}
                icon={<ProfileOutlined />}
                onClick={handleSeeDetail}
              />
            </Tooltip>
            {isPageType ? (
              <Tooltip
                title={pagePreviewData ? '关闭预览' : '预览页面'}
                open={open}
                onOpenChange={setOpen}
              >
                <Button
                  type="text"
                  disabled={disabled}
                  icon={
                    pagePreviewData ? <EyeInvisibleOutlined /> : <EyeOutlined />
                  }
                  onClick={handlePreviewPage}
                  onMouseEnter={() => setOpen(true)}
                  onMouseLeave={() => setOpen(false)}
                />
              </Tooltip>
            ) : null}
            {/* 展开/收起 */}
            {isPlanType && (
              <Tooltip title={isPlanExpanded ? '收起' : '展开'}>
                <Button
                  type="text"
                  icon={isPlanExpanded ? <MinusOutlined /> : <PlusOutlined />}
                  onClick={() => setIsPlanExpanded(!isPlanExpanded)}
                  disabled={
                    !detailData?.response || !Array.isArray(detailData.response)
                  }
                />
              </Tooltip>
            )}

            {/*<Tooltip title="复制">*/}
            {/*  <Button*/}
            {/*    type="text"*/}
            {/*    icon={<CopyOutlined />}*/}
            {/*    disabled={disabled}*/}
            {/*    onClick={handleCopy}*/}
            {/*  />*/}
            {/*</Tooltip>*/}
          </div>
        </div>
      </div>
      {/* Plan 类型展开内容 */}
      {renderPlanDetails()}
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
