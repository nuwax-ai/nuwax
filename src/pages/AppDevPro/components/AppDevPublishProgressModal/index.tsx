import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  LoadingOutlined,
} from '@ant-design/icons';
import { Button, Collapse, Modal, Steps, Tag } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  UserAppDeployFailedStage,
  UserAppPublishPhase,
  UserAppTaskServiceProgress,
} from '../../type';
import { DEFAULT_TASK_SERVICE_ID } from '../../utils/userAppTaskLog';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AppDevPublishProgressModalProps {
  /** 是否显示 */
  open: boolean;
  /** 当前阶段 */
  phase: UserAppPublishPhase;
  /** 构建步骤的服务进度与日志 */
  services: UserAppTaskServiceProgress[];
  /** 部署服务步骤的进度与日志 */
  startServices?: UserAppTaskServiceProgress[];
  /** 失败信息 */
  errorMessage?: string;
  /** 失败发生在构建还是部署，避免部署失败被显示成构建失败 */
  failedStage?: UserAppDeployFailedStage | null;
  /** 取消接口 loading */
  cancelLoading?: boolean;
  /** 取消构建任务 */
  onCancelTask?: () => void;
  /** 关闭弹窗 */
  onClose: () => void;
  /** 弹窗标题 */
  title?: string;
  /** 是否展示「构建 / 启动 / 发布」步骤 */
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

const getStepIndex = (
  phase: UserAppPublishPhase,
  failedStage?: UserAppDeployFailedStage | null,
): number => {
  if (phase === 'applying' || phase === 'success') {
    return 2;
  }
  if (phase === 'failed' && failedStage === 'apply') {
    return 2;
  }
  if (
    phase === 'deploying' ||
    (phase === 'failed' && failedStage === 'deploy')
  ) {
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
  if (status === 'build_ok' || status === 'service_start_ok') {
    return 'success';
  }
  if (status === 'build_fail') {
    return 'error';
  }
  return 'processing';
};

/**
 * 将服务状态映射为展示文案。
 * 构建：building / build_ok / build_fail；
 * 开发环境启动：service_starting / service_start_ok（线上不会出现）。
 * 启动步骤若仍收到 build_* 事件，文案改为启动中 / 成功 / 失败。
 *
 * @param status 服务状态
 * @param kind 构建或启动步骤
 * @returns 展示文案
 */
const getServiceStatusLabel = (
  status: string,
  kind: 'build' | 'start',
): string => {
  if (status === 'service_start_ok') {
    return dict('PC.Pages.AppDevPro.startSuccess');
  }
  if (status === 'service_starting') {
    return dict('PC.Pages.AppDevPro.deploying');
  }
  if (status === 'build_ok') {
    return kind === 'start'
      ? dict('PC.Pages.AppDevPro.startSuccess')
      : dict('PC.Pages.AppDevPro.buildStatusOk');
  }
  if (status === 'build_fail') {
    return kind === 'start'
      ? dict('PC.Pages.AppDevPro.startFailed')
      : dict('PC.Pages.AppDevPro.buildStatusFailed');
  }
  return kind === 'start'
    ? dict('PC.Pages.AppDevPro.deploying')
    : dict('PC.Pages.AppDevPro.publishBuilding');
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
      {logs.length ? logs.join('\n') : dict('PC.Pages.AppDevPro.waitingLogs')}
    </pre>
  );
};

/**
 * 部署进度弹窗：按 SSE 展示构建日志，再展示生产部署结果。
 *
 * @param props 弹窗属性
 * @returns 发布进度弹窗
 */
const AppDevPublishProgressModal: React.FC<AppDevPublishProgressModalProps> = ({
  open,
  phase,
  services,
  startServices = [],
  errorMessage,
  failedStage = null,
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
    phase === 'starting' || phase === 'building' || phase === 'deploying';
  const canCancelTask =
    phase === 'starting' || phase === 'building' || phase === 'deploying';
  const [buildActiveKeys, setBuildActiveKeys] = useState<string[]>([]);
  const [startActiveKeys, setStartActiveKeys] = useState<string[]>([]);

  const buildCollapseItems = useMemo(
    () =>
      services.map((item) => ({
        key: `build:${item.serviceId}`,
        label: (
          <div className={cx(styles.serviceHead)}>
            <span className={cx(styles.serviceName)}>
              {item.serviceId === DEFAULT_TASK_SERVICE_ID
                ? dict('PC.Pages.AppDevPro.defaultService')
                : item.serviceId}
            </span>
            <Tag
              color={getServiceTagColor(item.status)}
              className={cx(styles.serviceTag)}
            >
              {getServiceStatusLabel(item.status, 'build')}
            </Tag>
          </div>
        ),
        children: <ServiceLogBlock logs={item.logs} />,
      })),
    [services],
  );

  const startCollapseItems = useMemo(
    () =>
      startServices.map((item) => ({
        key: `start:${item.serviceId}`,
        label: (
          <div className={cx(styles.serviceHead)}>
            <span className={cx(styles.serviceName)}>
              {item.serviceId === DEFAULT_TASK_SERVICE_ID
                ? dict('PC.Pages.AppDevPro.defaultService')
                : item.serviceId}
            </span>
            <Tag
              color={getServiceTagColor(item.status)}
              className={cx(styles.serviceTag)}
            >
              {getServiceStatusLabel(item.status, 'start')}
            </Tag>
          </div>
        ),
        children: <ServiceLogBlock logs={item.logs} />,
      })),
    [startServices],
  );

  const showStartSection =
    startServices.length > 0 ||
    phase === 'deploying' ||
    (phase === 'failed' && failedStage === 'deploy') ||
    phase === 'applying' ||
    phase === 'success';

  useEffect(() => {
    setBuildActiveKeys((prev) => {
      const next = new Set(prev);
      services.forEach((item) => next.add(`build:${item.serviceId}`));
      return Array.from(next);
    });
  }, [services]);

  useEffect(() => {
    setStartActiveKeys((prev) => {
      const next = new Set(prev);
      startServices.forEach((item) => next.add(`start:${item.serviceId}`));
      return Array.from(next);
    });
  }, [startServices]);

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
      title={title || dict('PC.Pages.AppDevPro.deployTitle')}
      open={open}
      onCancel={handleCancelModal}
      maskClosable={!running}
      destroyOnHidden
      width={720}
      footer={
        canCancelTask
          ? [
              <Button
                key="cancel-task"
                danger
                loading={cancelLoading}
                onClick={handleRequestCancel}
              >
                {dict('PC.Pages.AppDevPro.cancelTask')}
              </Button>,
            ]
          : [
              <Button
                key="close"
                type="primary"
                onClick={onClose}
                disabled={running}
              >
                {dict('PC.Pages.AppDevPro.close')}
              </Button>,
            ]
      }
    >
      <div className={cx(styles.modalBody)}>
        {showSteps && (
          <Steps
            size="small"
            current={Math.max(getStepIndex(phase, failedStage), 0)}
            status={getStepsStatus(phase)}
            items={[
              { title: dict('PC.Pages.AppDevPro.publishBuildStep') },
              { title: dict('PC.Pages.AppDevPro.deployStep') },
              { title: dict('PC.Pages.AppDevPro.publishToMarketStep') },
            ]}
          />
        )}

        <div className={cx(styles.overall)}>
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
            {phase === 'deploying' && (
              <>
                <LoadingOutlined /> {dict('PC.Pages.AppDevPro.deploying')}
              </>
            )}
            {phase === 'applying' && (
              <>
                <LoadingOutlined />{' '}
                {dict('PC.Pages.AppDevPro.publishToMarketHint')}
              </>
            )}
            {phase === 'success' && (
              <>
                <CheckCircleFilled className={cx(styles.successIcon)} />
                {successText || dict('PC.Pages.AppDevPro.deploySuccess')}
              </>
            )}
            {phase === 'failed' && (
              <>
                <CloseCircleFilled className={cx(styles.errorIcon)} />
                {errorMessage ||
                  failedText ||
                  (failedStage === 'apply'
                    ? dict('PC.Pages.AppDevPro.publishFailed')
                    : failedStage === 'deploy'
                    ? dict('PC.Pages.AppDevPro.startFailed')
                    : dict('PC.Pages.AppDevPro.buildStatusFailed'))}
              </>
            )}
            {phase === 'cancelled' &&
              (cancelledText || dict('PC.Pages.AppDevPro.publishCancelled'))}
          </div>
        </div>

        {services.length > 0 && (
          <div className={cx(styles.stepLogs)}>
            <div className={cx(styles.stepLogsTitle)}>
              {dict('PC.Pages.AppDevPro.publishBuildStep')}
            </div>
            <Collapse
              bordered={false}
              activeKey={buildActiveKeys}
              onChange={(keys) =>
                setBuildActiveKeys(Array.isArray(keys) ? keys : [keys])
              }
              items={buildCollapseItems}
              className={cx(styles.serviceList)}
            />
          </div>
        )}

        {showStartSection && (
          <div className={cx(styles.stepLogs)}>
            <div className={cx(styles.stepLogsTitle)}>
              {dict('PC.Pages.AppDevPro.deployStep')}
            </div>
            {startCollapseItems.length > 0 ? (
              <Collapse
                bordered={false}
                activeKey={startActiveKeys}
                onChange={(keys) =>
                  setStartActiveKeys(Array.isArray(keys) ? keys : [keys])
                }
                items={startCollapseItems}
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
        )}

        {services.length === 0 && !showStartSection && running && (
          <div className={cx(styles.emptyLogs)}>
            {dict('PC.Pages.AppDevPro.waitingLogs')}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AppDevPublishProgressModal;
