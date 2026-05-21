import { dict } from '@/services/i18nRuntime';
import { Segmented } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import SubscribedAgents from './components/SubscribedAgents';
import SubscribedCredits from './components/SubscribedCredits';
import SubscribedSkills from './components/SubscribedSkills';
import styles from './index.less';

const cx = classNames.bind(styles);

const TAB_KEYS = {
  agents: 'agents',
  skills: 'skills',
  credits: 'credits',
} as const;

const SubscribedContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(TAB_KEYS.agents);

  return (
    <div className={cx(styles['subscribed-section'])}>
      <div className={cx(styles['subscribed-title'])}>
        {dict('PC.Pages.MorePage.MySubscriptions.subscribedContent')}
      </div>

      <div className={cx(styles['tabs-container'])}>
        <Segmented
          value={activeTab}
          onChange={(val) => setActiveTab(val as string)}
          options={[
            {
              value: TAB_KEYS.agents,
              label: dict('PC.Pages.MorePage.MySubscriptions.tabAgents'),
            },
            {
              value: TAB_KEYS.skills,
              label: dict('PC.Pages.MorePage.MySubscriptions.tabSkills'),
            },
            {
              value: TAB_KEYS.credits,
              label: dict('PC.Pages.MorePage.MySubscriptions.tabCredits'),
            },
          ]}
        />
      </div>

      <div className={cx(styles['content-area'])}>
        {activeTab === TAB_KEYS.agents && <SubscribedAgents />}
        {activeTab === TAB_KEYS.skills && <SubscribedSkills />}
        {activeTab === TAB_KEYS.credits && <SubscribedCredits />}
      </div>
    </div>
  );
};

export default SubscribedContent;
