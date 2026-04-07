import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { t } from '@/services/i18nRuntime';
import MentionPopup from '../MentionPopup';
import type { MentionItem } from '../MentionPopup/types';
import styles from '../index.less';

const cx = classNames.bind(styles);

export type MentionPlacement = 'auto' | 'up' | 'down';

export interface AtMentionIconProps {
  /** 是否启用 @ 提及功能 */
  enableMention: boolean;
  /** @ 弹窗展示方向 */
  mentionPlacement: MentionPlacement;
  /** 将选中的提及项插入到输入编辑器 */
  onSelectMention: (item: MentionItem) => void;
}

/**
 * 底部 @ 图标触发的提及弹窗（与 MentionEditor 内部 @ 弹窗保持一致的定位规则）
 *
 * - 向下使用 `top`；向上使用 `bottom`
 * - 监听 `window.resize`，弹窗位置随视口变化同步更新
 * - 点击弹窗外部关闭
 */
const AtMentionIcon: React.FC<AtMentionIconProps> = ({
  enableMention,
  mentionPlacement,
  onSelectMention,
}) => {
  // 是否显示提及弹窗
  const [atIconShowMentionPopup, setAtIconShowMentionPopup] =
    useState<boolean>(false);
  // 弹窗位置（向下用 top，向上用 bottom）
  const [atIconMentionPosition, setAtIconMentionPosition] = useState<{
    top?: number;
    left: number;
    bottom?: number;
  }>({ top: 0, left: 0 });

  // 控制底部 @ 图标 Tooltip 显隐（避免弹窗关闭时 tooltip 又冒出来）
  const [mentionTooltipOpen, setMentionTooltipOpen] = useState<boolean>(false);
  // 标记用户是否已经使用过底部 @ 图标，使用过后不再展示引导 Tooltip
  const [hasUsedMentionIcon, setHasUsedMentionIcon] = useState<boolean>(false);

  // 底部 @ 图标引用（用于定位弹窗）
  const mentionIconRef = useRef<HTMLSpanElement | null>(null);

  const POPUP_ESTIMATED_HEIGHT = 320;
  const POPUP_WIDTH = 280;
  const margin = 8;

  const calcAndSetAtIconMentionPosition = useCallback(
    (rect: DOMRect) => {
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight || 0;
      const viewportWidth =
        window.innerWidth || document.documentElement.clientWidth || 0;

      let finalPlacement: 'up' | 'down' = 'down';
      if (mentionPlacement === 'auto') {
        const spaceBelow = viewportHeight - rect.bottom;
        finalPlacement = spaceBelow >= POPUP_ESTIMATED_HEIGHT ? 'down' : 'up';
      } else {
        finalPlacement = mentionPlacement;
      }

      const left = Math.min(
        Math.max(4, rect.left),
        viewportWidth - POPUP_WIDTH - margin,
      );

      if (finalPlacement === 'down') {
        let top = rect.bottom + 4;
        const maxTop = viewportHeight - POPUP_ESTIMATED_HEIGHT - 4;
        if (top > maxTop) top = Math.max(4, maxTop);
        setAtIconMentionPosition({ left, top });
      } else {
        // up：固定弹窗底边贴近图标上方 4px，并进行 clamp
        const bottomCss = viewportHeight - (rect.top - 4);
        setAtIconMentionPosition({ left, bottom: bottomCss });
      }
    },
    [mentionPlacement],
  );

  /**
   * 关闭提及弹窗
   */
  const closeAtIconMentionPopup = useCallback(() => {
    setAtIconShowMentionPopup(false);
    // 同步关闭底部 @ 图标的 Tooltip，避免弹窗关闭时 Tooltip 重新出现
    setMentionTooltipOpen(false);
    setHasUsedMentionIcon(false);
  }, []);

  /**
   * 选择提及项：关弹窗 + 写入编辑器
   */
  const handleAtIconMentionSelect = useCallback(
    (item: MentionItem) => {
      setAtIconShowMentionPopup(false);
      setHasUsedMentionIcon(false);
      onSelectMention(item);
    },
    [onSelectMention],
  );

  /**
   * 点击底部 @ 图标：打开 MentionPopup 并将弹窗锚定到图标附近
   */
  const handleMentionIconClick = useCallback(
    (e: React.MouseEvent<HTMLSpanElement>) => {
      // 若禁用则不做任何事
      if (!enableMention) {
        closeAtIconMentionPopup();
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // 点击后立刻关闭 Tooltip
      setMentionTooltipOpen(false);
      // 用户已经主动点击使用过一次，之后不再展示引导 Tooltip
      setHasUsedMentionIcon(true);

      const iconEl = mentionIconRef.current;
      if (iconEl) {
        const rect = iconEl.getBoundingClientRect();
        calcAndSetAtIconMentionPosition(rect);
      }

      setAtIconShowMentionPopup(true);
    },
    [enableMention, closeAtIconMentionPopup, calcAndSetAtIconMentionPosition],
  );

  /**
   * 点击外部区域关闭弹窗
   */
  useEffect(() => {
    // 若禁用或弹窗未显示，则不执行
    if (!enableMention || !atIconShowMentionPopup) {
      return;
    }

    // 点击外部区域关闭弹窗
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 点击在弹窗本体内部（含 Tab、列表、空白）不关闭
      if (target?.closest?.('[data-mention-popup]')) {
        return;
      }
      // 点击在弹窗外部，关闭弹窗
      closeAtIconMentionPopup();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [enableMention, atIconShowMentionPopup, closeAtIconMentionPopup]);

  /**
   * 窗口大小变化时，同步更新底部 @ 弹窗位置
   */
  useEffect(() => {
    if (!atIconShowMentionPopup) return;

    const handleReposition = () => {
      const iconEl = mentionIconRef.current;
      if (!iconEl) return;
      const rect = iconEl.getBoundingClientRect();
      calcAndSetAtIconMentionPosition(rect);
    };

    window.addEventListener('resize', handleReposition);

    return () => {
      window.removeEventListener('resize', handleReposition);
    };
  }, [atIconShowMentionPopup, calcAndSetAtIconMentionPosition]);

  const tooltipTitle = useMemo(
    () =>
      hasUsedMentionIcon
        ? ''
        : t('PC.Components.ChatInputHomeAtMentionIcon.tryMentionSkill'),
    [hasUsedMentionIcon],
  );

  if (!enableMention) return null;

  return (
    <>
      <Tooltip
        title={tooltipTitle}
        open={mentionTooltipOpen && !atIconShowMentionPopup}
        onOpenChange={setMentionTooltipOpen}
      >
        {/* 底部 @ 图标 */}
        <span
          ref={mentionIconRef}
          className={cx(
            'flex',
            'items-center',
            'content-center',
            'cursor-pointer',
            styles.clear,
            styles.box,
            styles['plus-box'],
          )}
          onClick={handleMentionIconClick}
        >
          @
        </span>
      </Tooltip>

      {/* @提及技能选择弹窗 */}
      <MentionPopup
        visible={atIconShowMentionPopup}
        position={atIconMentionPosition}
        onSelect={handleAtIconMentionSelect}
        onClose={closeAtIconMentionPopup}
        showSearchInput={true}
      />
    </>
  );
};

export default AtMentionIcon;
