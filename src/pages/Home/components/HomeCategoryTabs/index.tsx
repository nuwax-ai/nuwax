import type { DisplayRecommendInfo } from '@/types/interfaces/displayRecommend';
import { Segmented } from 'antd';
import React from 'react';

/** 首页输入区上方的内容分类(对话任务/项目开发/AI教育等),分类由接口数据动态渲染 */
export interface HomeCategoryDef {
  key: string;
  /** 分类名称,由接口下发 */
  label: string;
  /** 分类下展示的推荐 pill 列表 */
  items: DisplayRecommendInfo[];
}

interface HomeCategoryTabsProps {
  categories: HomeCategoryDef[];
  activeKey: string;
  onChange: (key: string) => void;
}

/**
 * 首页内容分类切换(Segmented)。
 *
 * 分类与 pill 全部数据驱动:接口返回什么分类就渲染什么;
 * 分类暂无推荐内容时 pill 行为空。
 */
const HomeCategoryTabs: React.FC<HomeCategoryTabsProps> = ({
  categories,
  activeKey,
  onChange,
}) => {
  if (categories.length === 0) {
    return null;
  }

  return (
    <Segmented
      block
      value={activeKey}
      onChange={(value) => onChange(String(value))}
      options={categories.map((category) => ({
        value: category.key,
        label: category.label,
      }))}
    />
  );
};

export default HomeCategoryTabs;
