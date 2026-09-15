/**
 * 横向资料行（grid/list 变体共享，仅列数不同）：资料库同款线性文件
 * 图标（RepoFileIcon：pageType/扩展名 → 类型专属图形与配色，与
 * nuwax-repo-web 资料库一致，未识别回落默认文档图标）+ 名称 + 右端
 * 相对时间胶囊（仅 grid·recent 视图，list 紧凑行时间降噪不渲染）。
 * 整行点击即选中；grid 变体另有悬停浮现的「选择」按钮（绝对定位覆盖
 * 时间胶囊区域，stopPropagation 防止冒泡双触发），list 紧凑场景不渲染
 * （整行可点已覆盖）且无边框、悬停灰底（与专家/技能 list 行口径一致）。
 * simple 模式（仅 list）：无背景圆形图标 + 标题，行更紧凑。
 */
import { t } from '@/services/i18nRuntime';
import { formatTimeAgo } from '@/utils/common';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import RepoFileIcon from './RepoFileIcon';
import styles from './index.less';
import type { KnowledgeListItem, KnowledgeListVariant } from './types';

const cx = classNames.bind(styles);

export interface KnowledgeRowProps {
  item: KnowledgeListItem;
  /** 布局变体：list 不渲染悬停「选择」按钮（整行点击即选中），默认 grid */
  variant?: KnowledgeListVariant;
  /** 简单模式（仅 list 生效）：无背景圆形图标 + 标题单行紧凑行 */
  simple?: boolean;
  onSelect: (item: KnowledgeListItem) => void;
}

const KnowledgeRow: React.FC<KnowledgeRowProps> = ({
  item,
  variant = 'grid',
  simple = false,
  onSelect,
}) => {
  const { name } = item;
  return (
    <div
      data-knowledge-key={item.key}
      data-variant={variant}
      className={cx(styles.row, simple && styles['row-simple'])}
      onClick={() => onSelect(item)}
    >
      <RepoFileIcon
        fileType={item.fileType}
        pageType={item.pageType}
        name={name}
        className={cx(styles['file-icon'], simple && styles['icon-simple'])}
      />
      <span className={cx(styles.name)} title={name}>
        {name}
      </span>
      {variant === 'grid' && !!item.usedTime && (
        <span className={cx(styles['time-pill'])} title={item.usedTime}>
          {formatTimeAgo(item.usedTime)}
        </span>
      )}
      {variant === 'grid' && (
        <div className={cx(styles.actions)}>
          {/* 悬停浮现的「选择」按钮（覆盖时间胶囊，不占布局空间；与整行
              点击等价，stopPropagation 防止冒泡双触发） */}
          <Button
            size="small"
            className={cx(styles['select-btn'])}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(item);
            }}
          >
            {t('PC.Components.CapabilityModal.select')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default React.memo(KnowledgeRow);
