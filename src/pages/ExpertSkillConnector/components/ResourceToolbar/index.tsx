/**
 * 资源聚合页顶部工具栏
 * @description 主 tab（系统广场/团队空间，连接器页另有"已连接的"）+
 *   二级分类 tab + 搜索 + "更多"入口
 */

import { dict } from '@/services/i18nRuntime';
import { SearchOutlined } from '@ant-design/icons';
import { Input, Segmented } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history } from 'umi';
import { RESOURCE_MORE_SQUARE_PATH } from '../../constants';
import type {
  ResourceCategoryInfo,
  ResourceSourceEnum,
  ResourceTypeEnum,
} from '../../types';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ResourceToolbarProps {
  /** 资源类型（"更多"跳转需要） */
  resourceType: ResourceTypeEnum;
  /** 当前数据源 */
  source: ResourceSourceEnum;
  /** 数据源切换回调 */
  onSourceChange: (source: ResourceSourceEnum) => void;
  /** 二级分类列表（首位为"全部"） */
  categories: ResourceCategoryInfo[];
  /** 当前分类 key，空串表示全部 */
  activeCategory: string;
  /** 分类切换回调 */
  onCategoryChange: (key: string) => void;
  /** 搜索关键字（输入框受控值） */
  keyword: string;
  /** 搜索输入回调（防抖由上层处理） */
  onKeywordChange: (keyword: string) => void;
  /** 是否显示"更多"入口（连接器页为 false） */
  showMore?: boolean;
}

const ResourceToolbar: React.FC<ResourceToolbarProps> = ({
  resourceType,
  source,
  onSourceChange,
  categories,
  activeCategory,
  onCategoryChange,
  keyword,
  onKeywordChange,
  showMore = true,
}) => {
  const sourceOptions = [
    {
      label: dict('PC.Pages.ExpertSkillConnector.mainTabSystem'),
      value: 'system',
    },
    {
      label: dict('PC.Pages.ExpertSkillConnector.mainTabTeam'),
      value: 'team',
    },
    // "我启用的"仅技能页展示（当前用户启用的技能维度），位于团队空间右侧
    ...(resourceType === 'skill'
      ? [
          {
            label: dict('PC.Pages.ExpertSkillConnector.mainTabEnabled'),
            value: 'enabled',
          },
        ]
      : []),
    // "已连接的"仅连接器页展示（当前用户已连接的连接器维度）
    ...(resourceType === 'connector'
      ? [
          {
            label: dict('PC.Pages.ExpertSkillConnector.mainTabConnected'),
            value: 'connected',
          },
        ]
      : []),
  ];

  // "更多"跳转：专家/技能跳对应广场分类页（连接器页不展示"更多"入口）
  const handleMoreClick = () => {
    const squarePath = RESOURCE_MORE_SQUARE_PATH[resourceType];
    if (squarePath) {
      history.push(squarePath);
    }
  };

  return (
    <div className={cx(styles.toolbar)}>
      <div className={cx('flex', 'items-center', styles['toolbar-main'])}>
        <Segmented
          options={sourceOptions}
          value={source}
          onChange={(value) => onSourceChange(value as ResourceSourceEnum)}
        />
        <div className={cx('flex', 'items-center', styles['toolbar-right'])}>
          {/* "更多"仅系统广场维度可见；用 visibility 隐藏保留占位，避免切换主tab时右侧容器宽度跳动 */}
          {showMore && (
            <a
              className={cx(styles['more-btn'], {
                [styles['more-btn-hidden']]: source !== 'system',
              })}
              onClick={handleMoreClick}
            >
              {dict('PC.Pages.ExpertSkillConnector.more')}
            </a>
          )}
          <Input
            className={cx(styles['search-input'])}
            allowClear
            prefix={<SearchOutlined />}
            placeholder={dict(
              'PC.Pages.ExpertSkillConnector.searchPlaceholder',
            )}
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className={cx('flex', 'items-center', styles['category-tabs'])}>
          {categories.map((item) => (
            <div
              key={item.key}
              className={cx(styles['category-tab'], {
                [styles['category-tab-active']]: item.key === activeCategory,
              })}
              onClick={() => onCategoryChange(item.key)}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(ResourceToolbar);
