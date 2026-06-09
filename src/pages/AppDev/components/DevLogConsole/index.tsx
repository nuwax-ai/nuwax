/**
 * 开发日志控制台组件
 * 在预览页面下方展示开发服务器日志（独立头部模式，保留兼容）
 */

import SvgIcon from '@/components/base/SvgIcon';
import DevLogPanel from '@/components/business-component/ConversationBottomConsole/DevLogPanel';
import { t } from '@/services/i18nRuntime';
import type { DevLogEntry } from '@/types/interfaces/appDev';
import {
  BugOutlined,
  ClearOutlined,
  CloseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Badge, Button, Tooltip } from 'antd';
import React, { useCallback } from 'react';
import './index.less';

interface DevLogConsoleProps {
  visible: boolean;
  logs: DevLogEntry[];
  hasErrorInLatestBlock: boolean;
  isLoading?: boolean;
  lastLine?: number;
  onClear?: () => void;
  onRefresh?: () => void;
  onClose?: () => void;
  onAddToChat?: (content: string, isAuto?: boolean) => void;
  isChatLoading?: boolean;
  onResetAutoRetry?: () => void;
  latestErrorLogs?: string;
}

const DevLogConsole: React.FC<DevLogConsoleProps> = ({
  logs,
  hasErrorInLatestBlock,
  latestErrorLogs,
  isLoading = false,
  lastLine = 0,
  onClear,
  onRefresh,
  onClose,
  onAddToChat,
  isChatLoading = false,
  onResetAutoRetry,
  visible = false,
}) => {
  const handleFindLatestErrorLogs = useCallback(() => {
    if (!onAddToChat || isChatLoading || !onResetAutoRetry) return;
    onResetAutoRetry?.();
    if (latestErrorLogs) {
      onAddToChat?.(latestErrorLogs, true);
    }
  }, [onAddToChat, onResetAutoRetry, latestErrorLogs, isChatLoading]);

  if (!visible) return null;

  return (
    <div className="dev-log-console">
      {/* 工具栏 */}
      <div className="dev-log-console-header">
        <div className="header-left">
          <BugOutlined className="header-icon" />
          <span className="header-title">
            {t('PC.Pages.AppDevDevLogConsole.headerTitle')}
          </span>
          {hasErrorInLatestBlock && (
            <>
              <Tooltip
                title={t(
                  'PC.Pages.AppDevDevLogConsole.latestLogsContainErrors',
                )}
              >
                <Badge status="error" className="error-badge" />
              </Tooltip>
              {onAddToChat && (
                <Button
                  size="small"
                  danger
                  disabled={!onAddToChat || isChatLoading}
                  icon={
                    <SvgIcon
                      name="icons-common-stars"
                      style={{ fontSize: '12px' }}
                    />
                  }
                  onClick={handleFindLatestErrorLogs}
                >
                  {t('PC.Pages.AppDevDevLogConsole.quickIssueFix')}
                </Button>
              )}
            </>
          )}
        </div>
        <div className="header-right">
          <Tooltip title={t('PC.Pages.AppDevDevLogConsole.refreshLogs')}>
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={onRefresh}
            />
          </Tooltip>
          <Tooltip title={t('PC.Pages.AppDevDevLogConsole.clearLogs')}>
            <Button
              type="text"
              size="small"
              icon={<ClearOutlined />}
              onClick={onClear}
            />
          </Tooltip>
          <Tooltip title={t('PC.Pages.AppDevDevLogConsole.closeLogConsole')}>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </Tooltip>
        </div>
      </div>

      <DevLogPanel
        className="dev-log-console-body"
        logs={logs}
        isLoading={isLoading}
        lastLine={lastLine}
        onAddToChat={onAddToChat}
        isChatLoading={isChatLoading}
        latestErrorLogs={latestErrorLogs}
      />
    </div>
  );
};

export default DevLogConsole;
