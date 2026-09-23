import classNames from 'classnames';
import { useModel } from 'umi';

import {
  emitDesktopShellPreviewHostCommand,
  getDesktopShellPreviewPlatform,
} from '@/utils/desktopShellPreview';

import styles from './DesktopShellPreviewChrome.less';

const PLATFORM_LABELS = {
  macos: 'macOS',
  windows: 'Windows',
  linux: 'Linux',
} as const;

/**
 * 浏览器桌面壳预览的原生标题栏示意。
 *
 * 窗口三键仅展示；侧栏按钮会发出与真实宿主一致的折叠命令。真正的避让仍由
 * hostBridge 平台判断和现有 page-container/二级菜单规则完成，而非预览层伪造。
 */
export default function DesktopShellPreviewChrome() {
  const platform = getDesktopShellPreviewPlatform();
  const { isSecondMenuCollapsed, setIsSecondMenuCollapsed } =
    useModel('layout');

  if (!platform) return null;

  const isMacPreview = platform === 'macos';
  const renderSidebarToggle = (extraClassName?: string) => (
    <button
      aria-label={isSecondMenuCollapsed ? '展开左侧导航' : '收起左侧导航'}
      className={classNames(styles['sidebar-toggle'], extraClassName)}
      onClick={() => {
        // style3 的收起范围是整条左导航，主页没有二级列时也应能预览收起状态。
        const collapsed = !isSecondMenuCollapsed;
        // 预览标题栏与页面处于同一个 Umi model provider：直接驱动真实布局，
        // 同时广播宿主命令，覆盖 initHostBridgeEvents 的真实客户端协议路径。
        setIsSecondMenuCollapsed(collapsed);
        emitDesktopShellPreviewHostCommand({
          type: 'toggle-second-menu',
          collapsed,
        });
      }}
      type="button"
    >
      ☰
    </button>
  );

  return (
    <div
      className={classNames(styles.chrome, styles[platform])}
      data-desktop-shell-preview={platform}
    >
      {isMacPreview ? (
        <>
          <div aria-hidden="true" className={styles['traffic-lights']}>
            <span className={styles.close} />
            <span className={styles.minimize} />
            <span className={styles.maximize} />
          </div>
          <div className={styles['mac-toolbar']}>
            {renderSidebarToggle()}
            <span aria-hidden="true" className={styles['history-button']}>
              ‹
            </span>
            <span aria-hidden="true" className={styles['history-button']}>
              ›
            </span>
          </div>
        </>
      ) : (
        <div className={styles.menus}>
          {renderSidebarToggle()}
          <span aria-hidden="true">关于</span>
          <span aria-hidden="true">文件</span>
          <span aria-hidden="true">编辑</span>
          <span aria-hidden="true">窗口</span>
          <span aria-hidden="true">帮助</span>
        </div>
      )}
      <span aria-hidden="true" className={styles.badge}>
        浏览器壳预览 · {PLATFORM_LABELS[platform]}
      </span>
      {!isMacPreview && (
        <div aria-hidden="true" className={styles.controls}>
          <span>—</span>
          <span>□</span>
          <span>×</span>
        </div>
      )}
    </div>
  );
}
