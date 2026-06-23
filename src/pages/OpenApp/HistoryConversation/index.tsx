import SvgIcon from '@/components/base/SvgIcon';
import HistoryConversationList from '@/components/business-component/HistoryConversationList';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { t } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React from 'react';
import { history, useModel, useParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 历史会话页面（用于无菜单layouts的页面，单个智能体推荐使用，类似kimi的history页面）
 */
const HistoryConversation: React.FC = () => {
  const params = useParams();
  const agentId = Number(params.agentId);
  const { isAppSidebarVisible, toggleAppSidebarVisible, isAppSidebarMode } =
    useModel('useOpenApp');

  // 跳转会话聊天页
  const handleLink = (id: number, agentId: number) => {
    history.push(`/app/chat/${agentId}/${id}`);
  };

  return (
    <HistoryConversationList
      agentId={agentId}
      onClickLink={handleLink}
      isAppSidebarMode={true}
      titleLeftSlot={
        <ConditionRender condition={isAppSidebarMode && !isAppSidebarVisible}>
          <TooltipIcon
            className={cx(styles['icon-box'])}
            title={t('PC.Components.ConversationDetails.expandNavigation')}
            icon={
              <SvgIcon
                name="icons-nav-sidebar"
                style={{ fontSize: 16 }}
                onClick={toggleAppSidebarVisible}
              />
            }
          />
        </ConditionRender>
      }
    />
  );
};

export default HistoryConversation;
