import SvgIcon from '@/components/base/SvgIcon';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import MySubscriptionsOriginal from '@/pages/MorePage/MySubscriptions';
import { t } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React from 'react';
import { history, useModel, useParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 独立会话页面我的订阅
 */
const MySubscriptions: React.FC = () => {
  const { agentId } = useParams();
  const { isAppSidebarVisible, toggleAppSidebarVisible, isAppSidebarMode } =
    useModel('useOpenApp');

  return (
    <MySubscriptionsOriginal
      app={true}
      onViewCreditRecords={() => {
        history.push(`/app/${agentId}/credit-records`);
      }}
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

export default MySubscriptions;
