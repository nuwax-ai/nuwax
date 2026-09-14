/**
 * 横向资料行（grid/list 变体共享，仅列数不同）：资料库同款线性文件
 * 图标（RepoFileIcon：pageType/扩展名 → 类型专属图形与配色，与
 * nuwax-repo-web 资料库一致，未识别回落默认文档图标）+ 名称 + 右端
 * 相对时间胶囊（仅 recent 视图）+ 悬停浮现的「选择」按钮（绝对定位
 * 覆盖时间胶囊区域，唯一选中入口，卡片主体点击不触发选中）。
 */
import { t } from '@/services/i18nRuntime';
import { formatTimeAgo } from '@/utils/common';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import RepoFileIcon from './RepoFileIcon';
import styles from './index.less';
import type { KnowledgeListItem } from './types';

const cx = classNames.bind(styles);

export interface KnowledgeRowProps {
  item: KnowledgeListItem;
  onSelect: (item: KnowledgeListItem) => void;
}

const KnowledgeRow: React.FC<KnowledgeRowProps> = ({ item, onSelect }) => {
  const { name } = item;
  return (
    <div data-knowledge-key={item.key} className={cx(styles.row)}>
      <RepoFileIcon
        fileType={item.fileType}
        pageType={item.pageType}
        name={name}
        className={cx(styles['file-icon'])}
      />
      <span className={cx(styles.name)} title={name}>
        {name}
      </span>
      {!!item.usedTime && (
        <span className={cx(styles['time-pill'])} title={item.usedTime}>
          {formatTimeAgo(item.usedTime)}
        </span>
      )}
      <div className={cx(styles.actions)}>
        {/* 悬停浮现的「选择」按钮（覆盖时间胶囊，不占布局空间） */}
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
    </div>
  );
};

export default React.memo(KnowledgeRow);
