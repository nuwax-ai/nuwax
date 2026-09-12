import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { copyTextToClipboard } from '@/utils/clipboard';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CopyOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Button, Collapse, Modal, Steps, Tag } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  /** 当前阶段：构建 / 检测可部署 / 部署服务 / 发布到市场 */
  phase: UserAppPublishPhase;
  /** 构建步骤的服务进度与日志 */
  services: UserAppTaskServiceProgress[];
  /** 部署服务步骤的进度与日志；无日志时不展示占位文案 */
  startServices?: UserAppTaskServiceProgress[];
  /** 部署成功后异步拿到的线上 Prod 访问地址 */
  prodAccessUrl?: string;
  /** 失败信息，优先于默认失败文案 */
  errorMessage?: string;
  /** 失败落在哪一步，避免后续步骤失败被画到前面的步骤上 */
  failedStage?: UserAppDeployFailedStage | null;
  /** 取消接口 loading */
  cancelLoading?: boolean;
  /** 取消当前进行中的任务（构建 / 检测 / 部署） */
  onCancelTask?: () => void;
  /** 关闭弹窗 */
  onClose: () => void;
  /**
   * 重新打开发布到市场弹窗。
   * 仅在发布申请未提交、且发布弹窗已关闭时传入。
   */
  onReopenPublish?: () => void;
  /** 是否展示「继续发布到市场」；已发布或发布弹窗已打开时为 false */
  showReopenPublish?: boolean;
  /** 弹窗标题 */
  title?: string;
  /** 是否展示顶部四步进度条 */
  showSteps?: boolean;
  /** 创建构建任务中的文案 */
  startingText?: string;
  /** 构建进行中文案 */
  runningText?: string;
  /** 部署服务成功文案 */
  successText?: string;
  /** 失败文案（未传 errorMessage 时的兜底） */
  failedText?: string;
  /** 取消文案 */
  cancelledText?: string;
  /** 取消确认标题 */
  cancelTitle?: string;
  /** 取消确认内容 */
  cancelContent?: string;
}

/**
 * 顶部 Steps 的当前下标。
 * 0 构建打包 → 1 检测可部署 → 2 部署服务 → 3 发布到市场。
 *
 * @param phase 当前阶段
 * @param failedStage 失败落点，失败时停在对应步骤
 * @returns 步骤下标；idle 为 -1
 */
const getStepIndex = (
  phase: UserAppPublishPhase,
  failedStage?: UserAppDeployFailedStage | null,
): number => {
  if (phase === 'applying' || phase === 'success') {
    return 3;
  }
  if (phase === 'failed' && failedStage === 'apply') {
    return 3;
  }
  if (
    phase === 'deploying' ||
    (phase === 'failed' && failedStage === 'deploy')
  ) {
    return 2;
  }
  if (
    phase === 'checkingDeployable' ||
    (phase === 'failed' && failedStage === 'check')
  ) {
    return 1;
  }
  if (phase === 'idle') {
    return -1;
  }
  return 0;
};

/**
 * 顶部 Steps 的整体状态。
 *
 * @param phase 当前阶段
 * @returns Ant Design Steps 的 status
 */
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

/**
 * 服务 Tag 颜色：成功绿、失败红、其余进行中蓝。
 *
 * @param status SSE 服务状态
 * @returns antd Tag color
 */
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
 * 步骤下方的检测状态：进行中 / 成功 / 失败。
 *
 * @param props.kind 状态
 * @param props.text 文案
 * @returns 状态行
 */
const StepStatusLine: React.FC<{
  kind: 'process' | 'finish' | 'error';
  text: string;
}> = ({ kind, text }) => (
  <div className={cx(styles.phaseText)}>
    {kind === 'process' ? <LoadingOutlined /> : null}
    {kind === 'finish' ? (
      <CheckCircleFilled className={cx(styles.successIcon)} />
    ) : null}
    {kind === 'error' ? (
      <CloseCircleFilled className={cx(styles.errorIcon)} />
    ) : null}
    {text}
  </div>
);

/**
 * 部署成功后的线上访问地址：当前域名 + 生产代理路径，可复制。
 *
 * @param props.url 完整访问地址
 * @returns 带背景的地址块
 */
const DeployAccessLink: React.FC<{ url: string }> = ({ url }) => {
  const handleCopy = useCallback(() => {
    copyTextToClipboard(url, undefined, true);
  }, [url]);

  return (
    <div className={cx(styles.accessBox)}>
      <div className={cx(styles.accessHint)}>
        {dict('PC.Pages.AppDevPro.deploySuccessAccessHint')}
      </div>
      <div className={cx(styles.accessRow)}>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={cx(styles.accessUrl)}
        >
          {url}
        </a>
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          className={cx(styles.accessCopy)}
          onClick={handleCopy}
        >
          {dict('PC.Common.Global.copy')}
        </Button>
      </div>
    </div>
  );
};

/**
 * 单个服务的日志列表，新增行时滚到底部。
 *
 * @param props.logs 日志行
 * @param props.emptyText 无日志时的占位；不传则不渲染（部署步骤不展示等待文案）
 * @returns 日志块；无内容时返回 null
 */
const ServiceLogBlock: React.FC<{
  logs: string[];
  emptyText?: string;
}> = ({ logs, emptyText }) => {
  const logRef = useRef<HTMLPreElement>(null);
  const text = logs.length ? logs.join('\n') : emptyText;

  useEffect(() => {
    const el = logRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  if (!text) {
    return null;
  }

  return (
    <pre ref={logRef} className={cx(styles.log)}>
      {text}
    </pre>
  );
};

/**
 * 部署进度弹窗。
 * 顶部四步只表示进度；各步骤的检测状态与结果（成功 / 失败 / 日志）放在对应步骤下方，
 * 不再在步骤条下单独挂一条总状态。
 *
 * @param props 弹窗属性
 * @returns 发布进度弹窗
 */
const AppDevPublishProgressModal: React.FC<AppDevPublishProgressModalProps> = ({
  open,
  phase,
  services,
  startServices = [],
  prodAccessUrl = '',
  errorMessage,
  failedStage = null,
  cancelLoading = false,
  onCancelTask,
  onClose,
  onReopenPublish,
  showReopenPublish = false,
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
  /** 任务仍在跑：禁止点遮罩关闭，页脚只给取消 */
  const running =
    phase === 'starting' ||
    phase === 'building' ||
    phase === 'checkingDeployable' ||
    phase === 'deploying';
  /** 与 running 同期可取消任务 */
  const canCancelTask =
    phase === 'starting' ||
    phase === 'building' ||
    phase === 'checkingDeployable' ||
    phase === 'deploying';
  /** 构建服务折叠面板展开项，新服务到来时自动展开 */
  const [buildActiveKeys, setBuildActiveKeys] = useState<string[]>([]);
  /** 部署服务折叠面板展开项 */
  const [startActiveKeys, setStartActiveKeys] = useState<string[]>([]);

  /** 构建步骤：每个服务一块日志 */
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
        children: (
          <ServiceLogBlock
            logs={item.logs}
            emptyText={dict('PC.Pages.AppDevPro.waitingLogs')}
          />
        ),
      })),
    [services],
  );

  /** 部署步骤：有实际日志才渲染折叠项，无日志不写占位 */
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

  /** 检测可部署：进入该步及之后都保留，方便回看结果 */
  const showCheckSection =
    phase === 'checkingDeployable' ||
    phase === 'deploying' ||
    (phase === 'failed' &&
      (failedStage === 'check' || failedStage === 'deploy')) ||
    phase === 'applying' ||
    phase === 'success';
  /** 部署服务：进入 start 或已有日志时展示 */
  const showStartSection =
    startServices.length > 0 ||
    phase === 'deploying' ||
    (phase === 'failed' && failedStage === 'deploy') ||
    phase === 'applying' ||
    phase === 'success';
  /** 构建打包：有日志、正在构建，或后续步骤已出现时都保留 */
  const showBuildSection =
    services.length > 0 ||
    phase === 'starting' ||
    phase === 'building' ||
    (phase === 'failed' && failedStage === 'build') ||
    phase === 'cancelled' ||
    showCheckSection;
  /** 发布到市场：进入申请或该步失败时展示 */
  const showMarketSection =
    phase === 'applying' ||
    phase === 'success' ||
    (phase === 'failed' && failedStage === 'apply');

  /** 按失败落点选默认文案，接口错误优先 */
  const failText =
    errorMessage ||
    failedText ||
    (failedStage === 'apply'
      ? dict('PC.Pages.AppDevPro.publishFailed')
      : failedStage === 'deploy'
      ? dict('PC.Pages.AppDevPro.startFailed')
      : failedStage === 'check'
      ? dict('PC.Pages.AppDevPro.checkDeployableFailed')
      : dict('PC.Pages.AppDevPro.buildStatusFailed'));
  const cancelText =
    cancelledText || dict('PC.Pages.AppDevPro.publishCancelled');

  /** 各步骤自己的状态行，挂在对应步骤标题下，不放步骤条下方总览 */
  const buildStatus: { kind: 'process' | 'finish' | 'error'; text: string } =
    phase === 'starting'
      ? {
          kind: 'process',
          text: startingText || dict('PC.Pages.AppDevPro.publishStarting'),
        }
      : phase === 'building'
      ? {
          kind: 'process',
          text: runningText || dict('PC.Pages.AppDevPro.publishBuilding'),
        }
      : phase === 'failed' && failedStage === 'build'
      ? { kind: 'error', text: failText }
      : phase === 'cancelled' && !showCheckSection
      ? { kind: 'error', text: cancelText }
      : { kind: 'finish', text: dict('PC.Pages.AppDevPro.buildStatusOk') };

  /**
   * 检测可部署：轮询中 / 本步失败 / 本步取消。
   * 已进入部署或发布则视为检测通过。
   */
  const checkStatus: { kind: 'process' | 'finish' | 'error'; text: string } =
    phase === 'checkingDeployable'
      ? { kind: 'process', text: dict('PC.Pages.AppDevPro.checkingDeployable') }
      : phase === 'failed' && failedStage === 'check'
      ? { kind: 'error', text: failText }
      : phase === 'cancelled' && showCheckSection && !showStartSection
      ? { kind: 'error', text: cancelText }
      : { kind: 'finish', text: dict('PC.Pages.AppDevPro.checkDeployableOk') };

  /**
   * 部署服务：prod/start 进行中 / 本步失败 / 本步取消。
   * 进入发布到市场后视为部署成功。
   */
  const startStatus: { kind: 'process' | 'finish' | 'error'; text: string } =
    phase === 'deploying'
      ? { kind: 'process', text: dict('PC.Pages.AppDevPro.deploying') }
      : phase === 'failed' && failedStage === 'deploy'
      ? { kind: 'error', text: failText }
      : phase === 'cancelled' && showStartSection && !showMarketSection
      ? { kind: 'error', text: cancelText }
      : {
          kind: 'finish',
          text: successText || dict('PC.Pages.AppDevPro.deploySuccess'),
        };

  /** 部署成功且已异步拿到 Prod 域名时展示访问地址 */
  const displayAccessUrl =
    startStatus.kind === 'finish' ? prodAccessUrl : '';

  /** 发布到市场：申请弹窗打开中 / 本步失败 / 已提交 */
  const marketStatus: { kind: 'process' | 'finish' | 'error'; text: string } =
    phase === 'applying'
      ? {
          kind: 'process',
          text: dict('PC.Pages.AppDevPro.publishToMarketHint'),
        }
      : phase === 'failed' && failedStage === 'apply'
      ? { kind: 'error', text: failText }
      : { kind: 'finish', text: dict('PC.Pages.AppDevPro.publishSuccess') };

  /** 新构建服务出现时展开对应面板，不收起用户已展开的项 */
  useEffect(() => {
    setBuildActiveKeys((prev) => {
      const next = new Set(prev);
      services.forEach((item) => next.add(`build:${item.serviceId}`));
      return Array.from(next);
    });
  }, [services]);

  /** 新部署服务出现时展开对应面板 */
  useEffect(() => {
    setStartActiveKeys((prev) => {
      const next = new Set(prev);
      startServices.forEach((item) => next.add(`start:${item.serviceId}`));
      return Array.from(next);
    });
  }, [startServices]);

  /** 二次确认后取消进行中的任务 */
  const handleRequestCancel = () => {
    modalConfirm(
      cancelTitle || dict('PC.Pages.AppDevPro.cancelPublishTitle'),
      cancelContent || dict('PC.Pages.AppDevPro.cancelPublishContent'),
      () => {
        onCancelTask?.();
      },
    );
  };

  /** 进行中点关闭等于取消任务；否则直接关弹窗 */
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
        {/* 顶部只表示走到哪一步，不展示总状态文案 */}
        {showSteps && (
          <Steps
            size="small"
            current={Math.max(getStepIndex(phase, failedStage), 0)}
            status={getStepsStatus(phase)}
            items={[
              { title: dict('PC.Pages.AppDevPro.publishBuildStep') },
              { title: dict('PC.Pages.AppDevPro.checkDeployableStep') },
              { title: dict('PC.Pages.AppDevPro.deployStep') },
              { title: dict('PC.Pages.AppDevPro.publishToMarketStep') },
            ]}
          />
        )}

        {/* 构建打包：状态行 + 各服务日志 */}
        {showBuildSection && (
          <div className={cx(styles.stepLogs)}>
            <div className={cx(styles.stepLogsTitle)}>
              {dict('PC.Pages.AppDevPro.publishBuildStep')}
            </div>
            <StepStatusLine kind={buildStatus.kind} text={buildStatus.text} />
            {buildCollapseItems.length > 0 ? (
              <Collapse
                bordered={false}
                activeKey={buildActiveKeys}
                onChange={(keys) =>
                  setBuildActiveKeys(Array.isArray(keys) ? keys : [keys])
                }
                items={buildCollapseItems}
                className={cx(styles.serviceList)}
              />
            ) : null}
          </div>
        )}

        {/* 检测可部署：只展示检测状态，无日志 */}
        {showCheckSection && (
          <div className={cx(styles.stepLogs)}>
            <div className={cx(styles.stepLogsTitle)}>
              {dict('PC.Pages.AppDevPro.checkDeployableStep')}
            </div>
            <StepStatusLine kind={checkStatus.kind} text={checkStatus.text} />
          </div>
        )}

        {/* 部署服务：状态行；有 start 日志才展开列表 */}
        {showStartSection && (
          <div className={cx(styles.stepLogs)}>
            <div className={cx(styles.stepLogsTitle)}>
              {dict('PC.Pages.AppDevPro.deployStep')}
            </div>
            <StepStatusLine kind={startStatus.kind} text={startStatus.text} />
            {displayAccessUrl ? (
              <DeployAccessLink url={displayAccessUrl} />
            ) : null}
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
            ) : null}
          </div>
        )}

        {/* 发布到市场：申请中 / 已提交 / 失败 */}
        {showMarketSection && (
          <div className={cx(styles.stepLogs)}>
            <div className={cx(styles.stepLogsTitle)}>
              {dict('PC.Pages.AppDevPro.publishToMarketStep')}
            </div>
            <StepStatusLine kind={marketStatus.kind} text={marketStatus.text} />
            {showReopenPublish && onReopenPublish ? (
              <Button
                type="primary"
                size="small"
                className={cx(styles.reopenPublish)}
                onClick={onReopenPublish}
              >
                {dict('PC.Pages.AppDevPro.reopenPublishToMarket')}
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AppDevPublishProgressModal;
