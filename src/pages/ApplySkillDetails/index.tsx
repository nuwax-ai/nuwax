import SkillDetailView from '@/components/SkillDetailView';
import React from 'react';
import { useParams } from 'umi';

/**
 * 待审核技能详情页面
 * - 委托 SkillDetailView 组件，以 mode="apply" 调用 apiPublishSkillDetail
 */
const ApplySkillDetails: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const skillId = Number(params.skillId);

  return <SkillDetailView spaceId={spaceId} skillId={skillId} mode="apply" />;
};

export default ApplySkillDetails;
