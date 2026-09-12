/**
 * 能力弹窗卡片（技能维度已接入 SkillListView，此处为其余三类；
 * 选中一律走「选择/聘请」按钮，卡片主体点击不触发选中）：
 * - 专家·简化样式：圆角方图标 + 名称/单行描述 + 右上相对时间（最近召唤）+
 *   悬停浮现的「聘请」按钮；
 * - 连接器：分类/连接状态 + 悬停浮现的「选择」按钮 + 连接开关；
 * - 资料库：横向资料卡（类型专属文件图标 + 名称 + 右端相对时间/格式 Tag +
 *   悬停浮现的「选择」按钮）。
 * 付费/已订阅标识统一走 antd Badge.Ribbon 左上角小号角标（专家）。
 */
import FileTypeIcon from '@/components/base/FileTypeIcon';
import SvgIcon from '@/components/base/SvgIcon';
import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import { t } from '@/services/i18nRuntime';
import { formatTimeAgo } from '@/utils/common';
import { FileOutlined } from '@ant-design/icons';
import { Badge, Button, Card, Switch, Tag } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import type { CapabilityItem } from './types';

const cx = classNames.bind(styles);
/**
 * 图标底色板：按 antd 预设色相的半透明 tint，浅色下呈粉彩、深色下呈微光，
 * 两种主题均可读（色相与 themeTokens 的 blue/green/purple/orange/cyan/magenta 一致）。
 */
const ICON_BACKGROUNDS = [
  'rgba(24, 144, 255, 12%)',
  'rgba(82, 196, 26, 12%)',
  'rgba(114, 46, 209, 12%)',
  'rgba(250, 140, 22, 12%)',
  'rgba(19, 194, 194, 12%)',
  'rgba(235, 47, 150, 12%)',
];

/**
 * 资料卡文件格式 → 图标色板：底色为色相半透明 tint、前景为对应预设色，
 * 与 ICON_BACKGROUNDS 同一色阶口径（亮/暗主题均可读），未识别格式回落蓝色。
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
  /** 连接器「连接」发起（共享 useConnectorConnect 分流：oauth2 授权 / 凭据弹窗） */
  onConnectorConnect?: (item: CapabilityItem) => void;
  /** 连接器「断开」 */
  onConnectorDisconnect?: (item: CapabilityItem) => void;
  /** 连接/断开请求中的条目 key（按钮 loading 防重复） */
  connectorBusyKeys?: string[];
}

const CapabilityCard: React.FC<CapabilityCardProps> = ({
  item,
  index,
  focused,
  onSelect,
  onHover,
  onConnectorConnect,
  onConnectorDisconnect,
  connectorBusyKeys,
}) => {
  const { name, description, icon, category, resourceType } = item;
  const isExpert = resourceType === 'expert';
  const isKnowledge = resourceType === 'knowledge';
  const isConnector = resourceType === 'connector';
  const fileType =
    item.fileType ||
    name.match(/\.(pdf|xlsx?|docx?|md|csv|txt|pptx?)$/i)?.[1]?.toUpperCase();
  // 图标地址加载失败（连接器 logo 常见 404/防盗链）时回退为名称首字
  const [iconFailed, setIconFailed] = React.useState(false);
  // 连接器 icon 常为 /api/f/ 受保护地址，直接 img 会被 ORB 拦截，走 Bearer 解析
  const { displaySrc: protectedIconSrc } = useAuthProtectedImageSrc(icon);
  const effectiveIcon = iconFailed ? undefined : protectedIconSrc;
  const iconContent = !effectiveIcon ? (
    name.charAt(0)
  ) : /^(?:https?:\/\/|\/|blob:|data:)/.test(effectiveIcon) ? (
    <img src={effectiveIcon} alt="" onError={() => setIconFailed(true)} />
  ) : /^icons?-/.test(effectiveIcon) ? (
    <SvgIcon name={effectiveIcon} style={{ fontSize: 22 }} />
  ) : (
    effectiveIcon
  );
  const selectLabel = t(
    isExpert
      ? 'PC.Components.CapabilityModal.hire'
      : 'PC.Components.CapabilityModal.select',
  );
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
  // 选择/聘请按钮：三类卡片统一的选中入口（方形圆角 tint 底轻量按钮，悬停/
  // 键盘聚焦时浮现，复用 .card-hire 显隐）——卡片主体点击不触发选中
  const selectButton = (
    <Button
      size="small"
      className={cx(styles['card-hire'], styles['card-select'])}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(item);
      }}
    >
      {selectLabel}
    </Button>
  );
  const card = (
    <Card
      id={`capability-option-${index}`}
      data-capability-key={item.key}
      role="option"
      aria-selected={focused}
      className={cx(styles.card, styles[`card-${resourceType}`], {
        [styles['card-focused']]: focused,
      })}
      onMouseMove={() => onHover(index)}
      onMouseLeave={() => onHover(-1)}
    >
      {isKnowledge ? (
        // 资料卡·横向布局：类型专属文件图标（未识别回落 tinted 盒默认图标）
        // + 名称 + 右端相对时间/格式 Tag + 悬停浮现的「选择」按钮
        <>
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
          <div className={styles['card-head-actions']}>{selectButton}</div>
        </>
      ) : isConnector ? (
        <>
          <div className={styles['card-head']}>
            <span
              className={styles['card-icon']}
              style={{
                backgroundColor:
                  ICON_BACKGROUNDS[index % ICON_BACKGROUNDS.length],
              }}
            >
              {iconContent}
            </span>
            <div className={styles['card-heading']}>
              <span className={styles['card-name']} title={name}>
                {name}
              </span>
              <div className={styles['card-meta']}>
                {category && (
                  <span className={styles['card-category']}>{category}</span>
                )}
                {item.connected !== undefined && (
                  <span
                    className={cx(styles['connection-status'], {
                      [styles.connected]:
                        item.authType === 'no_auth' || item.connected,
                    })}
                  >
                    {t(
                      item.authType === 'no_auth' || item.connected
                        ? 'PC.Components.CapabilityModal.connected'
                        : 'PC.Components.CapabilityModal.disconnected',
                    )}
                  </span>
                )}
              </div>
            </div>
            {/* 操作簇：「选择」悬停浮现（唯一选中入口）+ 连接/断开开关。
                开关选中态绑真实 connected，切换走共享 useConnectorConnect
                分流（oauth2 授权 / 凭据型 / 断开寻址），成功后上层就地更新
                connected 驱动开关回弹；免鉴权不渲染开关 */}
            <div className={styles['card-head-actions']}>
              {selectButton}
              {item.authType !== 'no_auth' && (
                <Switch
                  className={styles['card-switch']}
                  size="small"
                  checked={item.connected === true}
                  loading={connectorBusyKeys?.includes(item.key)}
                  aria-label={name}
                  onClick={(_, event) => {
                    event.stopPropagation();
                    if (item.connected) {
                      onConnectorDisconnect?.(item);
                    } else {
                      onConnectorConnect?.(item);
                    }
                  }}
                />
              )}
            </div>
          </div>
          {!!description && (
            <div className={styles['card-desc']} title={description}>
              {description}
            </div>
          )}
        </>
      ) : (
        // 专家卡·简化样式：圆角方图标 + 名称/单行描述 + 右上相对时间
        // （「最近召唤」页签条目）+ 悬停浮现的「聘请」按钮
        <>
          <div className={styles['card-head']}>
            <span
              className={styles['card-icon']}
              style={{
                backgroundColor:
                  ICON_BACKGROUNDS[index % ICON_BACKGROUNDS.length],
              }}
            >
              {iconContent}
            </span>
            <div className={styles['card-heading']}>
              <span className={styles['card-name']} title={name}>
                {name}
              </span>
              <div className={styles['card-desc-inline']} title={description}>
                {description}
              </div>
            </div>
            <div className={styles['card-head-actions']}>
              {/* 最近召唤时间：卡片右上角相对时间（「最近召唤」页签条目才有） */}
              {isExpert && item.usedTime && (
                <span
                  className={styles['card-used-time']}
                  title={item.usedTime}
                >
                  {formatTimeAgo(item.usedTime)}
                </span>
              )}
              {selectButton}
            </div>
          </div>
        </>
      )}
    </Card>
  );
  // 付费标识走 antd Badge.Ribbon（antd 官方的卡片角标形态，placement=start
  // 即左上角）；无付费标识的卡不包 wrapper，直接返回
  if (isExpert && item.paymentRequired) {
    return (
      <Badge.Ribbon
        placement="start"
        className={styles['card-paid-ribbon']}
        text={t(
          item.subscribed
            ? 'PC.Pages.Square.SingleAgent.subscribed'
            : 'PC.Pages.Square.SingleAgent.paid',
        )}
      >
        {card}
      </Badge.Ribbon>
    );
  }
  return card;
};
export default React.memo(CapabilityCard);
