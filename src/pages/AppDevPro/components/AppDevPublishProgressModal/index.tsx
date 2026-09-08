import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
} from '@ant-design/icons';
import { Button, Collapse, Modal, Progress, Steps, Tag } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { UserAppPublishPhase, UserAppTaskServiceProgress } from '../../type';
import { DEFAULT_TASK_SERVICE_ID } from '../../utils/userAppTaskLog';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AppDevPublishProgressModalProps {
  /** 是否显示 */
  open: boolean;
  /** 当前阶段 */
  phase: UserAppPublishPhase;
  /** 按 serviceId 分组的进度 */
  services: UserAppTaskServiceProgress[];
  /** 整体进度 0-100 */
  overallProgress: number;
  /** 失败信息 */
  errorMessage?: string;
  /** 取消接口 loading */
  cancelLoading?: boolean;
  /** 取消构建任务 */
  onCancelTask?: () => void;
  /** 关闭弹窗 */
  onClose: () => void;
  /** 弹窗标题 */
  title?: string;
  /** 是否展示「构建 / 申请」步骤 */
  showSteps?: boolean;
  /** 创建任务中文案 */
  startingText?: string;
  /** 进行中文案 */
  runningText?: string;
  /** 成功文案 */
  successText?: string;
  /** 失败文案 */
  failedText?: string;
  /** 取消文案 */
  cancelledText?: string;
  /** 取消确认标题 */
  cancelTitle?: string;
  /** 取消确认内容 */
  cancelContent?: string;
}

const getStepIndex = (phase: UserAppPublishPhase): number => {
  if (phase === 'applying' || phase === 'success') {
    return 1;
  }
  if (phase === 'idle') {
    return -1;
  }
  return 0;
};

const getStepsStatus = (
  phase: UserAppPublishPhase,
): 'wait' | 'process' | 'finish' | 'error' => {
  if (phase === 'failed') {
    return 'error';
  }
  if (phase === 'success') {
    return 'finish';
  }
  if (phase === 'cancelled') {
    return 'error';
  }
  return 'process';
};

const getServiceTagColor = (status: string): string => {
  const value = status.toLowerCase();
  if (['succeeded', 'success', 'completed', 'complete', 'done'].includes(value)) {
    return 'success';
  }
  if (['failed', 'fail', 'error'].includes(value)) {
    return 'error';
  }
  if (['cancelled', 'canceled'].includes(value)) {
    return 'default';
  }
  return 'processing';
};

/**
 * 单个服务的日志列表，新增行时滚到底部。
 *
 * @param props.logs 日志行
 * @returns 日志块
 */
const ServiceLogBlock: React.FC<{ logs: string[] }> = ({ logs }) => {
  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <pre ref={logRef} className={cx(styles.log)}>
      {logs.length
        ? logs.join('\n')
        : dict('PC.Pages.AppDevPro.waitingLogs')}
    </pre>
  );
};

/**
 * 发布进度弹窗：展示构建各 serviceId 的日志与进度，支持取消任务。
 *
 * @param props 弹窗属性
 * @returns 发布进度弹窗
 */
const AppDevPublishProgressModal: React.FC<AppDevPublishProgressModalProps> = ({
  open,
  phase,
  services,
  overallProgress,
  errorMessage,
  cancelLoading = false,
  onCancelTask,
  onClose,
  title,
  showSteps = true,
  startingText,
  runningText,
  successText,
  failedText,
  cancelledText,
  cancelTitle,
  cancelContent,
}) => {
  const running =
    phase === 'starting' || phase === 'building' || phase === 'applying';
  const canCancelTask = phase === 'starting' || phase === 'building';
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  useEffect(() => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      services.forEach((item) => next.add(item.serviceId));
      return Array.from(next);
    });
  }, [services]);

  const collapseItems = useMemo(
    () =>
      services.map((item) => ({
        key: item.serviceId,
        label: (
          <div className={cx(styles.serviceHead)}>
            <span className={cx(styles.serviceName)}>
              {item.serviceId === DEFAULT_TASK_SERVICE_ID
                ? dict('PC.Pages.AppDevPro.defaultService')
                : item.serviceId}
            </span>
            <Tag color={getServiceTagColor(item.status)} className={cx(styles.serviceTag)}>
              {item.status || dict('PC.Pages.AppDevPro.publishBuilding')}
            </Tag>
            <Progress
              percent={item.progress}
              size="small"
              className={cx(styles.serviceProgress)}
              status={
                getServiceTagColor(item.status) === 'error'
                  ? 'exception'
                  : item.progress >= 100
                  ? 'success'
                  : 'active'
              }
            />
          </div>
        ),
        children: <ServiceLogBlock logs={item.logs} />,
      })),
    [services],
  );

  const handleRequestCancel = () => {
    modalConfirm(
      cancelTitle || dict('PC.Pages.AppDevPro.cancelPublishTitle'),
      cancelContent || dict('PC.Pages.AppDevPro.cancelPublishContent'),
      () => {
        onCancelTask?.();
      },
    );
  };

  const handleCancelModal = () => {
    if (canCancelTask) {
      handleRequestCancel();
      return;
    }
    if (running) {
      return;
    }
    onClose();
  };

  return (
    <Modal
      title={title || dict('PC.Pages.AppDevPro.publishTitle')}
      open={open}
      onCancel={handleCancelModal}
      maskClosable={!running}
      destroyOnHidden
      width={640}
      footer={[
        canCancelTask ? (
          <Button
            key="cancel-task"
            danger
            loading={cancelLoading}
            onClick={handleRequestCancel}
          >
            {dict('PC.Pages.AppDevPro.cancelTask')}
          </Button>
        ) : (
          <Button key="close" type="primary" onClick={onClose} disabled={running}>
            {dict('PC.Pages.AppDevPro.close')}
          </Button>
        ),
      ]}
    >
      <div className={cx(styles.modalBody)}>
        {showSteps && (
          <Steps
            size="small"
            current={Math.max(getStepIndex(phase), 0)}
            status={getStepsStatus(phase)}
            items={[
              { title: dict('PC.Pages.AppDevPro.publishBuildStep') },
              { title: dict('PC.Pages.AppDevPro.publishApplyStep') },
            ]}
          />
        )}

        <div className={cx(styles.overall)}>
          <Progress
            percent={overallProgress}
            status={
              phase === 'failed' || phase === 'cancelled'
                ? 'exception'
                : phase === 'success'
                ? 'success'
                : 'active'
            }
          />
          <div className={cx(styles.phaseText)}>
            {phase === 'starting' && (
              <>
                <LoadingOutlined />{' '}
                {startingText || dict('PC.Pages.AppDevPro.publishStarting')}
              </>
            )}
            {phase === 'building' && (
              <>
                <LoadingOutlined />{' '}
                {runningText || dict('PC.Pages.AppDevPro.publishBuilding')}
              </>
            )}
            {phase === 'applying' && (
              <>
                <LoadingOutlined /> {dict('PC.Pages.AppDevPro.publishApplying')}
              </>
            )}
            {phase === 'success' && (
              <>
                <CheckCircleFilled className={cx(styles.successIcon)} />
                {successText || dict('PC.Pages.AppDevPro.publishSuccess')}
              </>
            )}
            {phase === 'failed' && (
              <>
                <CloseCircleFilled className={cx(styles.errorIcon)} />
                {errorMessage ||
                  failedText ||
                  dict('PC.Pages.AppDevPro.publishFailed')}
              </>
            )}
            {phase === 'cancelled' &&
              (cancelledText || dict('PC.Pages.AppDevPro.publishCancelled'))}
          </div>
        </div>

        {collapseItems.length > 0 ? (
          <Collapse
            bordered={false}
            activeKey={activeKeys}
            onChange={(keys) =>
              setActiveKeys(Array.isArray(keys) ? keys : [keys])
            }
            items={collapseItems}
            className={cx(styles.serviceList)}
          />
        ) : (
          running && (
            <div className={cx(styles.emptyLogs)}>
              {dict('PC.Pages.AppDevPro.waitingLogs')}
            </div>
          )
        )}
      </div>
    </Modal>
  );
};

export default AppDevPublishProgressModal;
