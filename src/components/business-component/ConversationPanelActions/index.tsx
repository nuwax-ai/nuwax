import SvgIcon from '@/components/base/SvgIcon';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { t } from '@/services/i18nRuntime';
import {
  CodeOutlined,
  LoadingOutlined,
  OrderedListOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';

export interface ConversationPanelAction {
  open?: boolean;
  onClick: () => void;
  /** 覆盖默认提示文案。Chat 文件入口用「打开产物 / 关闭产物」。 */
  title?: string;
}
export interface ConversationPanelActionsProps {
  progress?: ConversationPanelAction & { running?: boolean };
  detail?: ConversationPanelAction;
  files?: ConversationPanelAction;
  terminal?: ConversationPanelAction;
  desktop?: ConversationPanelAction;
  iconClassName?: string;
  activeClassName?: string;
}

/** home/chat 与全栈工作区的五种面板入口；数据、权限和互斥由页面受控。 */
const ConversationPanelActions: React.FC<ConversationPanelActionsProps> = ({
  progress,
  detail,
  files,
  terminal,
  desktop,
  iconClassName,
  activeClassName,
}) => {
  const action = (
    id: string,
    value: ConversationPanelAction | undefined,
    title: string,
    icon: React.ReactNode,
  ) =>
    value ? (
      <TooltipIcon
        key={id}
        title={title}
        ariaLabel={title}
        className={classNames(iconClassName, value.open && activeClassName)}
        icon={icon}
        onClick={value.onClick}
      />
    ) : null;
  return (
    <>
      {progress && (
        <span data-capsule-panel-trigger>
          {action(
            'progress',
            progress,
            t('PC.Pages.Chat.conversationProgress'),
            progress.running ? (
              <LoadingOutlined spin style={{ fontSize: 16 }} />
            ) : (
              <OrderedListOutlined style={{ fontSize: 16 }} />
            ),
          )}
        </span>
      )}
      {action(
        'detail',
        detail,
        t('PC.Pages.Chat.viewAgentDetails'),
        <SvgIcon name="icons-common-book" style={{ fontSize: 16 }} />,
      )}
      {action(
        'files',
        files,
        files?.title ||
          t(
            files?.open
              ? 'PC.Pages.Chat.closeFilePreview'
              : 'PC.Pages.Chat.openFilePreview',
          ),
        <SvgIcon name="icons-common-file_preview" style={{ fontSize: 16 }} />,
      )}
      {action(
        'terminal',
        terminal,
        t('PC.Components.ConversationBottomConsole.tabTerminal'),
        <CodeOutlined style={{ fontSize: 16 }} />,
      )}
      {action(
        'desktop',
        desktop,
        t(
          desktop?.open
            ? 'PC.Pages.Chat.closeAgentDesktop'
            : 'PC.Pages.Chat.openAgentDesktop',
        ),
        <SvgIcon name="icons-nav-computer-star" style={{ fontSize: 16 }} />,
      )}
    </>
  );
};
export default ConversationPanelActions;
