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

export interface ConversationAgentHeaderProps {
  /** 是否隐藏返回箭头 */
  hideBack?: boolean;
  /** 智能体配置信息 */
  agentConfigInfo?: AgentConfigInfo;
  /** 编辑智能体 */
  onEditAgent?: () => void;
  /** 是否显示文件预览图标 */
  showFilePanel?: boolean;
  /** 文件树侧边栏是否可见 */
  isFileTreeSidebarVisible?: boolean;
  /** 切换文件树侧边栏显隐 */
  onToggleFileTreeSidebar?: () => void;
  /** 当前是否已打开文件预览（全局状态） */
  isFileTreeVisible?: boolean;
  /** 当前文件视图模式 */
  viewMode?: 'preview' | 'desktop';
  /** 展开或收起文件树 */
  onOpenPreviewPanel?: () => void;
}

/**
 * ConversationAgent 页面顶部 Header
 * 只保留返回图标、智能体图标、名称、文件树切换按钮
 */
const ConversationAgentHeader: React.FC<ConversationAgentHeaderProps> = ({
  hideBack = false,
  agentConfigInfo,
  onEditAgent,
  showFilePanel,
  isFileTreeSidebarVisible = false,
  onToggleFileTreeSidebar,
  onOpenPreviewPanel,
}) => {
  const { spaceId } = useParams();

  const displayName =
    agentConfigInfo?.name || dict('PC.Pages.ConversationAgent.prototypeTitle');

  const handleToggleFileTree = () => {
    if (onToggleFileTreeSidebar) {
      onToggleFileTreeSidebar();
      return;
    }
    onOpenPreviewPanel?.();
  };

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
        src={agentConfigInfo?.icon || (agentImage as string)}
        alt=""
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
        <ConditionRender condition={!!showFilePanel}>
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
            onClick={handleToggleFileTree}
          />
        </ConditionRender>
      </div>
    </header>
  );
};

export default ConversationAgentHeader;
