import CreditRecordsOriginal from '@/pages/MorePage/CreditRecords';
import React from 'react';
import { history, useParams } from 'umi';

const CreditRecords: React.FC = () => {
  const { agentId } = useParams();
  return (
    <CreditRecordsOriginal
      onClickBack={() => {
        history.push(`/app/${agentId}/my-subscriptions`);
      }}
    />
  );
};

export default CreditRecords;
