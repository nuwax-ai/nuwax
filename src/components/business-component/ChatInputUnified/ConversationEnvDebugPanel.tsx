/**
 * 调试面板「环境信息」菜单页：版本 / 当前页面地址 / 登录信息 / 环境信息。
 * 由 ConversationCacheDebugPanel 顶部的菜单切换显示（2026-09-21 加入），
 * 弹层每次打开时（active 由 Fab 的 open 透传）重新读取快照，防止路由切换后地址过期。
 *
 * TODO(正式上线前移除): 调试面板，正式上线前随两个 debug 悬浮入口一并删除。
 */
import { USER_INFO } from '@/constants/home.constants';
import { APP_GIT_HASH, APP_NAME, APP_VERSION } from '@/constants/version';
import { resolveConversationRendererDetails } from '@/utils/conversationRendererPreference';
import { isConversationRuntimeEnabled } from '@/utils/conversationRuntimeFlag';
import { isDesktopHost, isMac } from '@/utils/hostBridge';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './ConversationCacheDebugPanel.module.less';

const cx = classNames.bind(styles);

/** 与 UserService.getUserInfoFromStorage 同源读取；直读 localStorage，避免把 antd/router 依赖拖进本模块 */
const readStoredUser = (): Record<string, any> | null => {
  try {
    const raw = localStorage.getItem(USER_INFO);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const readOsLabel = (): string => {
  const userAgent = navigator.userAgent;
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad/i.test(userAgent)) return 'iOS';
  if (isMac()) return 'macOS';
  return '-';
};

const RENDERER_SOURCE_LABELS: Record<string, string> = {
  url: 'URL参数',
  session: '本会话覆盖',
  global: '全局偏好',
  default: '构建默认',
};

interface EnvDebugSnapshot {
  href: string;
  path: string;
  referrer: string;
  user: Record<string, any> | null;
  baseUrl: string;
  nodeEnv: string;
  hostLabel: string;
  osLabel: string;
  runtimeLine: string;
  rendererLine: string;
  localTime: string;
}

const readEnvSnapshot = (): EnvDebugSnapshot => {
  const rendererDetails = resolveConversationRendererDetails();
  return {
    href: window.location.href,
    path: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    referrer: document.referrer || '-',
    user: readStoredUser(),
    baseUrl: process.env.BASE_URL || '(同源)',
    nodeEnv: process.env.NODE_ENV || '-',
    hostLabel: isDesktopHost() ? '桌面客户端' : '浏览器',
    osLabel: readOsLabel(),
    runtimeLine: isConversationRuntimeEnabled()
      ? 'V2（runtime 新线）'
      : 'V1（legacy 旧线）',
    rendererLine: `${rendererDetails.renderer.toUpperCase()}（${
      RENDERER_SOURCE_LABELS[rendererDetails.source] ?? rendererDetails.source
    }）`,
    localTime: new Date().toLocaleString(),
  };
};

interface EnvRow {
  label: string;
  value: string;
  /** 值缺省/异常时置灰 */
  muted?: boolean;
}

const buildSections = (
  snapshot: EnvDebugSnapshot,
): Array<{ title: string; rows: EnvRow[] }> => {
  const { user } = snapshot;
  return [
    {
      title: '版本',
      rows: [
        { label: '前端版本', value: APP_VERSION },
        { label: 'Git 提交', value: APP_GIT_HASH || '-' },
        { label: '构建模式', value: snapshot.nodeEnv },
        { label: '应用', value: APP_NAME },
      ],
    },
    {
      title: '页面地址',
      rows: [
        { label: '完整地址', value: snapshot.href },
        { label: '路由', value: snapshot.path },
        {
          label: '来源页',
          value: snapshot.referrer,
          muted: snapshot.referrer === '-',
        },
      ],
    },
    {
      title: '登录',
      rows: [
        { label: '登录状态', value: user ? '已登录' : '未登录', muted: !user },
        { label: '昵称', value: user?.nickName ?? '-' },
        { label: '账号', value: user?.userName ?? '-' },
        { label: '用户 ID', value: user ? String(user.id) : '-' },
        { label: '租户 ID', value: user ? String(user.tenantId) : '-' },
        { label: '角色', value: user?.role ?? '-' },
        { label: '邮箱', value: user?.email ?? '-', muted: !user?.email },
        { label: '上次登录', value: user?.lastLoginTime ?? '-' },
      ],
    },
    {
      title: '环境',
      rows: [
        { label: 'API 地址', value: snapshot.baseUrl },
        { label: '宿主', value: `${snapshot.hostLabel} · ${snapshot.osLabel}` },
        { label: '会话双线', value: snapshot.runtimeLine },
        { label: '渲染器', value: snapshot.rendererLine },
        { label: '本地时间', value: snapshot.localTime },
      ],
    },
  ];
};

interface ConversationEnvDebugPanelProps {
  /** 弹层是否处于打开态；打开沿上重新读取快照 */
  active: boolean;
}

const ConversationEnvDebugPanel: React.FC<ConversationEnvDebugPanelProps> = ({
  active,
}) => {
  const [snapshot, setSnapshot] = useState<EnvDebugSnapshot>(() =>
    readEnvSnapshot(),
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (active) {
      setSnapshot(readEnvSnapshot());
    }
  }, [active]);

  const sections = buildSections(snapshot);

  const handleCopy = () => {
    const text = sections
      .map((section) =>
        [
          `【${section.title}】`,
          ...section.rows.map((row) => `${row.label}: ${row.value}`),
        ].join('\n'),
      )
      .join('\n\n');
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // 剪贴板不可用（非安全上下文等）：忽略
      });
  };

  return (
    <div className={styles.envBody} data-testid="conversation-env-debug">
      <div className={styles.envToolbar}>
        <span className={cx(styles.eyebrow, styles.envToolbarHint)}>
          快照于打开时刷新
        </span>
        <button type="button" className={styles.envCopy} onClick={handleCopy}>
          {copied ? '已复制' : '复制全部'}
        </button>
      </div>
      {sections.map((section) => (
        <section key={section.title} className={styles.envSection}>
          <div className={styles.envSectionHeader}>
            <span className={styles.eyebrow}>{section.title}</span>
          </div>
          {section.rows.map((row) => (
            <div key={row.label} className={styles.envRow}>
              <span className={styles.envLabel}>{row.label}</span>
              <span
                className={cx(
                  styles.envValue,
                  row.muted && styles.envValueMuted,
                )}
              >
                {row.value}
              </span>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
};

export default ConversationEnvDebugPanel;
