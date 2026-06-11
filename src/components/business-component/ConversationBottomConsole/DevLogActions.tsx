import { SvgIcon } from '@/components/base';
import { dict } from '@/services/i18nRuntime';
import { ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import { Badge, Button, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface DevLogActionsProps {
  /** 最新日志块中是否包含错误（控制错误徽标与一键修复按钮） */
  hasErrorInLatestBlock?: boolean;
  /** 最新错误日志内容（一键修复时发送） */
  latestErrorLogs?: string;
  /** 对话是否进行中（禁用一键修复） */
  isChatLoading?: boolean;
  /** 将日志内容加入对话 */
  onAddToChat?: (content: string, isAuto?: boolean) => void;
  /** 一键修复前重置自动重试状态 */
  onResetAutoRetry?: () => void;
  /** 刷新日志 */
  onRefresh?: () => void;
  /** 清空日志 */
  onClear?: () => void;
}

/**
 * 开发服务器日志操作按钮组（一键修复 / 刷新 / 清空）
 * 作为 ConversationBottomConsole 的 extra 内容嵌入头部
 */
const DevLogActions: React.FC<DevLogActionsProps> = ({
  hasErrorInLatestBlock = false,
  latestErrorLogs,
  isChatLoading = false,
  onAddToChat,
  onResetAutoRetry,
  onRefresh,
  onClear,
}) => {
  const handleFindLatestErrorLogs = useCallback(() => {
    if (!onAddToChat || isChatLoading || !onResetAutoRetry) {
      return;
    }
    onResetAutoRetry();
    if (latestErrorLogs) {
      onAddToChat(latestErrorLogs, true);
    }
  }, [onAddToChat, isChatLoading, onResetAutoRetry, latestErrorLogs]);

  return (
    <div className={cx(styles['console-log-actions'])}>
      {hasErrorInLatestBlock && onAddToChat && (
        <>
          <Tooltip
            title={dict('PC.Pages.AppDevDevLogConsole.latestLogsContainErrors')}
          >
            <Badge status="error" />
          </Tooltip>
          <Button
            size="small"
            danger
            className={cx(styles['console-quick-fix-btn'])}
            disabled={isChatLoading}
            icon={
              <SvgIcon name="icons-common-stars" style={{ fontSize: 12 }} />
            }
            onClick={handleFindLatestErrorLogs}
          >
            {dict('PC.Pages.AppDevDevLogConsole.quickIssueFix')}
          </Button>
        </>
      )}
      <Tooltip title={dict('PC.Pages.AppDevDevLogConsole.refreshLogs')}>
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
        />
      </Tooltip>
      <Tooltip title={dict('PC.Pages.AppDevDevLogConsole.clearLogs')}>
        <Button
          type="text"
          size="small"
          icon={<ClearOutlined />}
          onClick={onClear}
        />
      </Tooltip>
    </div>
  );
};

export default DevLogActions;
