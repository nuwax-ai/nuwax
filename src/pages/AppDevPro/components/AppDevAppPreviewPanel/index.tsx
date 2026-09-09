import { dict } from '@/services/i18nRuntime';
import { LoadingOutlined } from '@ant-design/icons';
import { Button, Empty, Progress, Tooltip } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  UserAppPublishPhase,
  UserAppTaskServiceProgress,
} from '../../type';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AppDevAppPreviewPanelProps {
  /** 当前环境对应的应用预览地址 */
  previewUrl?: string;
  /** 刷新计数，变化时强制重新加载 iframe */
  refreshKey?: number;
  /** 当前环境服务是否已在运行 */
  running?: boolean;
  /** 启动 / 重启任务进行中 */
  busy?: boolean;
  /** 启动任务阶段 */
  phase?: UserAppPublishPhase;
  /** 启动任务各服务进度（含 SSE 日志） */
  services?: UserAppTaskServiceProgress[];
  /** 整体进度 0-100 */
  overallProgress?: number;
  /** 取消任务 loading */
  cancelLoading?: boolean;
  /** 容器是否已就绪 */
  podReady?: boolean;
  /** 会话是否仍在生成项目文件 */
  isGeneratingFiles?: boolean;
  /** 取消当前启动任务 */
  onCancelTask?: () => void;
  /** 启动失败后重新启动（dev/restart 或 prod/restart） */
  onRetryStart?: () => void;
  /** 停止后重新启动预览（dev/start 或 prod/start） */
  onStart?: () => void;
  /** 开发环境进行中任务锁定启动 / 重启 */
  devActionLocked?: boolean;
}

/**
 * 把各 service 的日志摊平成可展示行。
 *
 * @param services 任务服务进度
 * @returns 日志行
 */
const flattenTaskLogs = (services?: UserAppTaskServiceProgress[]): string[] => {
  if (!services?.length) {
    return [];
  }
  return services.flatMap((item) => item.logs).filter((line) => line.trim());
};

/**
 * 启动日志区域：自动滚到最新一行。
 *
 * @param props.logs 日志行
 * @param props.waitingText 尚无日志时的占位
 * @returns 日志块
 */
const PreviewStartLogBoard: React.FC<{
  logs: string[];
  waitingText: string;
}> = ({ logs, waitingText }) => {
  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <pre ref={logRef} className={cx(styles.logBody)}>
      {logs.length ? (
        logs.map((line, index) => (
          <span key={index} className={cx(styles.logLine)}>
            {line}
          </span>
        ))
      ) : (
        <span className={cx(styles.logEmpty)}>{waitingText}</span>
      )}
    </pre>
  );
};

/**
 * iframe 加载中的粉色角色插画（浮动 + 速度线）。
 *
 * @returns 加载插画
 */
const PreviewLoadingMascot: React.FC = () => (
  <svg
    className={cx(styles.mascot)}
    viewBox="0 0 140 128"
    width="112"
    height="102"
    aria-hidden
  >
    <defs>
      <linearGradient
        id="previewMascotGrad"
        x1="50%"
        y1="0%"
        x2="50%"
        y2="100%"
      >
        <stop offset="0%" stopColor="#FF8FA3" />
        <stop offset="100%" stopColor="#FFC2CE" />
      </linearGradient>
    </defs>
    <g
      className={cx(styles.mascotMotion)}
      stroke="#D4D4D4"
      strokeLinecap="round"
    >
      <line x1="96" y1="36" x2="124" y2="36" strokeWidth="3" />
      <line x1="102" y1="50" x2="132" y2="50" strokeWidth="2.5" />
      <line x1="98" y1="64" x2="122" y2="64" strokeWidth="2.5" />
    </g>
    <g className={cx(styles.mascotBody)}>
      <path
        fill="url(#previewMascotGrad)"
        d="M24.5 54c0-22 14.5-36 33.5-36s33.5 14 33.5 36c0 20.5-13 34-33.5 36.5C38 88 24.5 74.5 24.5 54Z"
      />
      <rect x="44" y="40" width="8" height="20" rx="2.5" fill="#1F1F1F" />
      <rect x="62" y="42" width="7.5" height="17" rx="2.5" fill="#1F1F1F" />
    </g>
    <ellipse
      className={cx(styles.mascotShadow)}
      cx="58"
      cy="116"
      rx="26"
      ry="6"
      fill="#E8E8E8"
    />
  </svg>
);

/**
 * iframe 加载遮罩：插画 + 标题 + 说明。
 *
 * @returns 加载遮罩内容
 */
const PreviewIframeLoading: React.FC = () => (
  <div className={cx(styles.iframeLoading)}>
    <PreviewLoadingMascot />
    <p className={cx(styles.iframeLoadingTitle)}>
      {dict('PC.Pages.AppDevPro.previewAppLoading')}
    </p>
    <p className={cx(styles.iframeLoadingHint)}>
      {dict('PC.Pages.AppDevPro.previewAppLoadingHint')}
    </p>
  </div>
);

/**
 * 居中提示（准备中 / 启动预览）。
 *
 * @param props.title 标题
 * @param props.hint 说明
 * @param props.action 可选操作按钮
 * @param props.spinning 是否显示加载图标
 * @returns 居中内容
 */
const PreviewHero: React.FC<{
  title?: string;
  hint?: string;
  spinning?: boolean;
  action?: React.ReactNode;
}> = ({ title, hint, spinning = false, action }) => (
  <div className={cx(styles.hero)}>
    {spinning ? (
      <LoadingOutlined style={{ fontSize: 22 }} />
    ) : (
      <div className={cx(styles.mark)} aria-hidden />
    )}
    {title ? <p className={cx(styles.title)}>{title}</p> : null}
    {hint ? <p className={cx(styles.hint)}>{hint}</p> : null}
    {action}
  </div>
);

/**
 * AppDevPro 应用预览页签。
 * 容器未就绪显示准备中；停止后显示启动预览；启动过程展示任务日志；
 * 启动成功后先显示应用加载中，iframe 加载完成再露出页面。
 *
 * @param props 预览面板属性
 * @returns 应用预览面板
 */
const AppDevAppPreviewPanel: React.FC<AppDevAppPreviewPanelProps> = ({
  previewUrl,
  refreshKey = 0,
  running = false,
  busy = false,
  phase = 'idle',
  services,
  overallProgress = 0,
  cancelLoading = false,
  podReady = false,
  isGeneratingFiles = false,
  onCancelTask,
  onRetryStart,
  onStart,
  devActionLocked = false,
}) => {
  const logs = useMemo(() => flattenTaskLogs(services), [services]);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const showStartProgress =
    busy || phase === 'starting' || phase === 'building';
  const showStartFailed = phase === 'failed' || phase === 'cancelled';

  useEffect(() => {
    setIframeLoaded(false);
  }, [previewUrl, refreshKey, running]);

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
  }, []);

  if (showStartProgress || showStartFailed) {
    const headText = showStartFailed
      ? phase === 'cancelled'
        ? dict('PC.Pages.AppDevPro.startCancelled')
        : dict('PC.Pages.AppDevPro.startFailed')
      : dict('PC.Pages.AppDevPro.startingService');

    return (
      <div className={cx(styles.container, styles.stage)}>
        <div className={cx(styles.logBoard)}>
          <div className={cx(styles.logHead)}>
            {!showStartFailed ? <LoadingOutlined /> : null}
            <span className={cx(styles.logHeadText)}>{headText}</span>
            {showStartProgress && onCancelTask ? (
              <Button
                size="small"
                loading={cancelLoading}
                onClick={onCancelTask}
              >
                {dict('PC.Pages.AppDevPro.cancelTask')}
              </Button>
            ) : null}
            {showStartFailed && onRetryStart ? (
              <Tooltip
                title={
                  devActionLocked
                    ? dict('PC.Pages.AppDevPro.devActionBusyHint')
                    : !podReady
                    ? dict('PC.Pages.AppDevPro.previewPreparing')
                    : undefined
                }
              >
                <span>
                  <Button
                    size="small"
                    type="primary"
                    disabled={devActionLocked || !podReady}
                    onClick={onRetryStart}
                  >
                    {dict('PC.Pages.AppDevPro.previewStartRetry')}
                  </Button>
                </span>
              </Tooltip>
            ) : null}
          </div>
          {!showStartFailed ? (
            <Progress
              className={cx(styles.logProgress)}
              percent={overallProgress}
              size="small"
              showInfo={false}
              status="active"
            />
          ) : null}
          <PreviewStartLogBoard
            logs={logs}
            waitingText={dict('PC.Pages.AppDevPro.waitingLogs')}
          />
        </div>
      </div>
    );
  }

  if (running && previewUrl) {
    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.iframeWrap)}>
          <iframe
            key={`${previewUrl}-${refreshKey}`}
            className={cx(styles.iframe)}
            src={previewUrl}
            title={dict('PC.Pages.AppDevPro.appPreview')}
            allow="clipboard-read; clipboard-write; fullscreen"
            onLoad={handleIframeLoad}
          />
          {!iframeLoaded ? (
            <div className={cx(styles.loadingOverlay)}>
              <PreviewIframeLoading />
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (running && !previewUrl) {
    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.hero)}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={dict('PC.Pages.AppDevPro.appPreviewEmpty')}
          />
        </div>
      </div>
    );
  }

  if (!podReady) {
    return (
      <div className={cx(styles.container, styles.stage)}>
        <PreviewHero
          spinning
          title={dict('PC.Pages.AppDevPro.previewPreparing')}
          hint={
            isGeneratingFiles
              ? dict('PC.Pages.AppDevPro.previewGeneratingHint')
              : dict('PC.Pages.AppDevPro.previewPreparingHint')
          }
        />
      </div>
    );
  }

  return (
    <div className={cx(styles.container, styles.stage)}>
      <PreviewHero
        hint={dict('PC.Pages.AppDevPro.previewStartHint')}
        action={
          onStart ? (
            <Tooltip
              title={
                devActionLocked
                  ? dict('PC.Pages.AppDevPro.devActionBusyHint')
                  : undefined
              }
            >
              <span>
                <Button
                  type="primary"
                  disabled={devActionLocked}
                  onClick={onStart}
                >
                  {dict('PC.Pages.AppDevPro.previewStartTitle')}
                </Button>
              </span>
            </Tooltip>
          ) : null
        }
      />
    </div>
  );
};

export default AppDevAppPreviewPanel;
