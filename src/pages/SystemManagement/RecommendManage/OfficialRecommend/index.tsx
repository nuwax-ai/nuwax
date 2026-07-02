import React from 'react';
import RecommendListPage from '../components/RecommendListPage';
import { OFFICIAL_RECOMMEND_CONFIG } from '../constants';

/**
 * 官方推荐（智能体、应用、技能、插件、工作流，类型 Official）
 */
const OfficialRecommend: React.FC = () => {
  return (
    <RecommendListPage
      titleKey="PC.Routes.officialRecommend"
      config={OFFICIAL_RECOMMEND_CONFIG}
    />
  );
};

export default OfficialRecommend;
