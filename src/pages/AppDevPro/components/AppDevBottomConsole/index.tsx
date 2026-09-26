/** 全栈应用控制台只适配环境数据；终端/日志 UI 统一由会话公共组件维护。 */
import ConversationBottomConsole, {
  type ConsoleExternalContainerStatus,
  type ConsoleLayoutMode,
  type ConversationBottomConsoleDevLogProps,
  type ConversationBottomConsoleProps,
} from '@/components/business-component/ConversationBottomConsole';
import React from 'react';
import { UserAppDbEnvEnum } from '../../services/appDb';

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
}

const AppDevBottomConsole: React.FC<AppDevBottomConsoleProps> = ({
  env = UserAppDbEnvEnum.Dev,
  devWsUrl,
  prodWsUrl,
  externalContainerStatus,
  prodExternalContainerStatus,
  onActiveTerminalEnvChange,
  onRetryContainer,
  ...props
}) => (
  <ConversationBottomConsole
    {...props}
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
