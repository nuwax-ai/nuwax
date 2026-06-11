import agentImage from '@/assets/images/agent_image.png';
import { SvgIcon } from '@/components/base';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import { AgentConfigInfo } from '@/types/interfaces/agent';
import { FormOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history, useParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const defaultAgentIcon = agentImage as string;

// 图片错误处理
const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = defaultAgentIcon;
};

export interface ConversationAgentHeaderProps {
  /** 是否隐藏返回箭头 */
  hideBack?: boolean;
  /** 智能体配置信息 */
  agentConfigInfo?: AgentConfigInfo;
  /** 编辑智能体 */
  onEditAgent?: () => void;
  /** 文件树侧边栏是否可见 */
  isFileTreeSidebarVisible?: boolean;
  /** 切换文件树侧边栏显隐 */
  onToggleFileTreeSidebar?: () => void;
}

/**
 * ConversationAgent 页面顶部 Header
 * 只保留返回图标、智能体图标、名称、文件树切换按钮
 */
const ConversationAgentHeader: React.FC<ConversationAgentHeaderProps> = ({
  hideBack = false,
  agentConfigInfo,
  onEditAgent,
  isFileTreeSidebarVisible = false,
  onToggleFileTreeSidebar,
}) => {
  const { spaceId } = useParams();

  const displayName =
    agentConfigInfo?.name || dict('PC.Pages.ConversationAgent.prototypeTitle');

  return (
    <header className={cx('flex', 'items-center', styles.header)}>
      <ConditionRender condition={!hideBack}>
        <SvgIcon
          name="icons-nav-backward"
          className={cx(styles['icon-backward'])}
          onClick={() => {
            history.push(`/space/${spaceId}/develop`);
          }}
        />
      </ConditionRender>

      <img
        className={cx(styles.avatar, { [styles['hide-back']]: hideBack })}
        src={agentConfigInfo?.icon || defaultAgentIcon}
        alt=""
        onError={handleError}
      />

      <div className={cx('flex', 'items-center', styles['header-info'])}>
        <h3 className={cx(styles['h-title'], 'text-ellipsis')}>
          {displayName}
        </h3>
        <ConditionRender condition={!!agentConfigInfo}>
          <Button
            type="text"
            icon={<FormOutlined />}
            className={cx(styles['edit-ico'])}
            onClick={onEditAgent}
          />
        </ConditionRender>
      </div>

      <div className={cx(styles['right-box'], 'flex', 'items-center')}>
        <TooltipIcon
          title={
            isFileTreeSidebarVisible
              ? dict('PC.Components.FilePathHeader.collapseFileTree')
              : dict('PC.Components.FilePathHeader.expandFileTree')
          }
          className={cx(styles['panel-btn'], {
            [styles.active]: isFileTreeSidebarVisible,
          })}
          icon={
            <SvgIcon
              name="icons-common-file_preview"
              style={{ fontSize: 16 }}
            />
          }
          onClick={onToggleFileTreeSidebar}
        />
      </div>
    </header>
  );
};

export default ConversationAgentHeader;
