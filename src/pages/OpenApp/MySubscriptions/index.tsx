import MySubscriptionsOriginal from '@/pages/MorePage/MySubscriptions';
import React from 'react';
import { history, useParams } from 'umi';

/**
 * 独立会话页面我的订阅
 */
const MySubscriptions: React.FC = () => {
  const { agentId } = useParams();
  return (
    <MySubscriptionsOriginal
      app={true}
      onViewCreditRecords={() => {
        history.push(`/app/${agentId}/credit-records`);
      }}
    />
  );
};

export default MySubscriptions;
