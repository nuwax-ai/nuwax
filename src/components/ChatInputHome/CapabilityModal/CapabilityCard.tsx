/**
 * 能力弹窗资料卡（技能/专家/连接器维度已分别接入 SkillListView /
 * ExpertListView / ConnectorListView，此处仅资料库维度）：
 * 横向资料卡（类型专属文件图标 + 名称 + 右端相对时间/格式 Tag +
 * 悬停浮现的「选择」按钮，卡片主体点击不触发选中）。
 */
import FileTypeIcon from '@/components/base/FileTypeIcon';
import { t } from '@/services/i18nRuntime';
import { formatTimeAgo } from '@/utils/common';
import { FileOutlined } from '@ant-design/icons';
import { Button, Card, Tag } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import type { CapabilityItem } from './types';

const cx = classNames.bind(styles);

/**
 * 资料卡文件格式 → 图标色板：底色为色相半透明 tint、前景为对应预设色，
 * 未识别格式回落蓝色（亮/暗主题均可读）。
 */
const KNOWLEDGE_FILE_THEMES: Record<string, { bg: string; color: string }> = {
  PDF: { bg: 'rgba(245, 34, 45, 12%)', color: '#f5222d' },
  DOC: { bg: 'rgba(24, 144, 255, 12%)', color: '#1890ff' },
  DOCX: { bg: 'rgba(24, 144, 255, 12%)', color: '#1890ff' },
  XLS: { bg: 'rgba(82, 196, 26, 12%)', color: '#52c41a' },
  XLSX: { bg: 'rgba(82, 196, 26, 12%)', color: '#52c41a' },
  CSV: { bg: 'rgba(82, 196, 26, 12%)', color: '#52c41a' },
  PPT: { bg: 'rgba(250, 140, 22, 12%)', color: '#fa8c16' },
  PPTX: { bg: 'rgba(250, 140, 22, 12%)', color: '#fa8c16' },
  HTML: { bg: 'rgba(250, 84, 28, 12%)', color: '#fa541c' },
  MD: { bg: 'rgba(114, 46, 209, 12%)', color: '#722ed1' },
  TXT: { bg: 'rgba(19, 194, 194, 12%)', color: '#13c2c2' },
};
const KNOWLEDGE_FILE_THEME_DEFAULT = {
  bg: 'rgba(24, 144, 255, 12%)',
  color: '#1890ff',
};

/**
 * 可识别为专属文件图标的扩展名（与基础组件 FileTypeIcon 的映射面对齐：
 * 文档/表格/演示/文本/压缩/媒体），命中则渲染类型专属图标，
 * 未命中回落默认 tinted 盒 + FileOutlined。
 */
const TYPED_FILE_EXT_REGEX =
  /\.(pdf|docx?|xlsx?|csv|pptx?|md|markdown|txt|log|json|xml|zip|rar|7z|tar|gz|mp4|avi|mov|mp3|wav|flac)$/i;

export interface CapabilityCardProps {
  item: CapabilityItem;
  index: number;
  focused: boolean;
  onSelect: (item: CapabilityItem) => void;
  onHover: (index: number) => void;
}

const CapabilityCard: React.FC<CapabilityCardProps> = ({
  item,
  index,
  focused,
  onSelect,
  onHover,
}) => {
  const { name } = item;
  const fileType =
    item.fileType ||
    name.match(/\.(pdf|xlsx?|docx?|md|csv|txt|pptx?)$/i)?.[1]?.toUpperCase();
  // 资料卡文件格式色板（tinted 底 + 同色相描边图标，未识别格式回落蓝色）
  const knowledgeFileTheme =
    KNOWLEDGE_FILE_THEMES[fileType ?? ''] ?? KNOWLEDGE_FILE_THEME_DEFAULT;
  // 资料卡类型图标：页面标题常不带扩展名，用「名称.格式」伪文件名让
  // FileTypeIcon 按扩展匹配专属图标（doc/表格/演示/pdf/媒体/文本/压缩）；
  // 未命中扩展回落默认 tinted 盒 + FileOutlined
  const knowledgeFileName =
    fileType && !name.includes('.')
      ? `${name}.${fileType.toLowerCase()}`
      : name;
  const knowledgeTypedIcon = TYPED_FILE_EXT_REGEX.test(knowledgeFileName) ? (
    <FileTypeIcon
      fileName={knowledgeFileName}
      size={18}
      className={styles['card-file-icon']}
    />
  ) : null;
  return (
    <Card
      id={`capability-option-${index}`}
      data-capability-key={item.key}
      role="option"
      aria-selected={focused}
      className={cx(styles.card, styles['card-knowledge'], {
        [styles['card-focused']]: focused,
      })}
      onMouseMove={() => onHover(index)}
      onMouseLeave={() => onHover(-1)}
    >
      {/* 资料卡·横向布局：类型专属文件图标（未识别回落 tinted 盒默认图标）
          + 名称 + 右端相对时间/格式 Tag + 悬停浮现的「选择」按钮 */}
      {knowledgeTypedIcon ? (
        knowledgeTypedIcon
      ) : (
        <span className={styles['card-icon']} style={knowledgeFileTheme}>
          <FileOutlined />
        </span>
      )}
      <span className={styles['card-name']} title={name}>
        {name}
      </span>
      <div className={styles['card-knowledge-tags']}>
        {!!item.usedTime && (
          <span className={styles['card-time-pill']} title={item.usedTime}>
            {formatTimeAgo(item.usedTime)}
          </span>
        )}
        {fileType && <Tag className={styles['file-type']}>{fileType}</Tag>}
      </div>
      <div className={styles['card-head-actions']}>
        <Button
          size="small"
          className={cx(styles['card-hire'], styles['card-select'])}
          onClick={(event) => {
            event.stopPropagation();
            onSelect(item);
          }}
        >
          {t('PC.Components.CapabilityModal.select')}
        </Button>
      </div>
    </Card>
  );
};
export default React.memo(CapabilityCard);
