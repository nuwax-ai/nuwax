import React from 'react';
import RecommendListPage from '../components/RecommendListPage';
import { HOME_RECOMMEND_CONFIG } from '../constants';

/**
 * 首页推荐（智能体，类型 Home）
 */
const HomeRecommend: React.FC = () => {
  return (
    <RecommendListPage
      titleKey="PC.Routes.homeRecommend"
      config={HOME_RECOMMEND_CONFIG}
    />
  );
};

export default HomeRecommend;
