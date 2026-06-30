import SkillDetailView from '@/components/SkillDetailView';
import React from 'react';
import { useParams } from 'umi';

/**
 * 已发布技能详情页面
 * - 委托 SkillDetailView 组件，以 mode="published" 调用 apiPublishedSkillDetail
 */
const PublishedSkillDetails: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const skillId = Number(params.skillId);

  return (
    <SkillDetailView spaceId={spaceId} skillId={skillId} mode="published" />
  );
};

export default PublishedSkillDetails;
