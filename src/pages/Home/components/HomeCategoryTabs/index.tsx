import { dict } from '@/services/i18nRuntime';
import type { DisplayRecommendInfo } from '@/types/interfaces/displayRecommend';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 首页输入区上方的内容分类 */
export type HomeCategoryKey = 'chat' | 'project' | 'education';

export interface HomeCategoryDef {
  key: HomeCategoryKey;
  /** 分类下展示的推荐 pill 列表 */
  items: DisplayRecommendInfo[];
}

interface HomeCategoryTabsProps {
  categories: HomeCategoryDef[];
  activeKey: HomeCategoryKey;
  onChange: (key: HomeCategoryKey) => void;
}

/** 分类标签文案 */
const CATEGORY_LABELS: Record<HomeCategoryKey, string> = {
  chat: 'PC.Pages.Home.categoryChatTask',
  project: 'PC.Pages.Home.categoryProjectDev',
  education: 'PC.Pages.Home.categoryAiEducation',
};

/**
 * 首页内容分类 tab(对话任务/项目开发/AI教育)。
 *
 * 分类下的 pill 由推荐配置数据驱动:分类自身固定,
 * 某分类暂无推荐配置时 pill 行为空(等后端补齐)。
 */
const HomeCategoryTabs: React.FC<HomeCategoryTabsProps> = ({
  categories,
  activeKey,
  onChange,
}) => {
  return (
    <div className={cx(styles['category-tabs'])}>
      {categories.map((category) => (
        <button
          key={category.key}
          type="button"
          className={cx(styles['category-tab'], {
            [styles.active]: activeKey === category.key,
          })}
          onClick={() => onChange(category.key)}
        >
          {dict(CATEGORY_LABELS[category.key])}
        </button>
      ))}
    </div>
  );
};

export default HomeCategoryTabs;
