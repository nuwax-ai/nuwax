/** 网站应用控制台：终端仍走公共组件，日志来源列表单独渲染，不影响其它页面的 DevLogPanel。 */
import ConversationBottomConsole, {
  type ConsoleExternalContainerStatus,
  type ConsoleLayoutMode,
  type ConversationBottomConsoleDevLogProps,
  type ConversationBottomConsoleProps,
} from '@/components/business-component/ConversationBottomConsole';
import type { UserAppLogSourceItem } from '@/types/interfaces/userProject';
import React from 'react';
import { UserAppDbEnvEnum } from '../../services/appDb';
import LogSourcesPanel from './LogSourcesPanel';

export type { TerminalAppearanceMode } from '@/components/business-component/ConversationBottomConsole/terminalTheme';
export type { ConsoleExternalContainerStatus, ConsoleLayoutMode };
export type AppDevConsoleTab = 'terminal-dev' | 'terminal-prod' | 'logs';
export type AppDevConsoleTabGroup = 'terminal' | 'logs';
export type AppDevBottomConsoleDevLogProps =
  ConversationBottomConsoleDevLogProps;
export interface AppDevBottomConsoleProps
  extends Omit<
    ConversationBottomConsoleProps,
    | 'wsUrl'
    | 'terminalSessions'
    | 'terminalEnvironment'
    | 'onActiveTerminalEnvironmentChange'
    | 'onRetryContainer'
  > {
  env?: UserAppDbEnvEnum;
  devWsUrl?: string;
  prodWsUrl?: string;
  prodExternalContainerStatus?: ConsoleExternalContainerStatus;
  onActiveTerminalEnvChange?: (env: UserAppDbEnvEnum | null) => void;
  onRetryContainer?: (env: UserAppDbEnvEnum) => void;
  /** 当前环境日志来源；传入后日志 Tab 只渲染来源列表 */
  logSources?: UserAppLogSourceItem[];
  logSourcesLoading?: boolean;
}

const AppDevBottomConsole: React.FC<AppDevBottomConsoleProps> = ({
  env = UserAppDbEnvEnum.Dev,
  devWsUrl,
  prodWsUrl,
  externalContainerStatus,
  prodExternalContainerStatus,
  onActiveTerminalEnvChange,
  onRetryContainer,
  logSources,
  logSourcesLoading,
  ...props
}) => (
  <ConversationBottomConsole
    {...props}
    logsPanel={
      logSources ? (
        <LogSourcesPanel sources={logSources} isLoading={logSourcesLoading} />
      ) : (
        props.logsPanel
      )
    }
    preserveTerminalConnections
    terminalEnvironment={env}
    terminalSessions={{
      dev: { wsUrl: devWsUrl, containerStatus: externalContainerStatus },
      prod: { wsUrl: prodWsUrl, containerStatus: prodExternalContainerStatus },
    }}
    onActiveTerminalEnvironmentChange={(value) =>
      onActiveTerminalEnvChange?.(
        value === null
          ? null
          : value === 'prod'
          ? UserAppDbEnvEnum.Prod
          : UserAppDbEnvEnum.Dev,
      )
    }
    onRetryContainer={
      onRetryContainer
        ? (value) =>
            onRetryContainer(
              value === 'prod' ? UserAppDbEnvEnum.Prod : UserAppDbEnvEnum.Dev,
            )
        : undefined
    }
  />
);
export default AppDevBottomConsole;
