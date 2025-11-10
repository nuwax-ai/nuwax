import { useCallback } from 'react';
import type {
  MentionPosition,
  MentionSelectorHandle,
  MentionTriggerResult,
} from '../../MentionSelector/types';

export interface UseMentionSelectorKeyboardParams {
  mentionTrigger: MentionTriggerResult;
  mentionPosition: MentionPosition;
  mentionSelectorRef: React.RefObject<MentionSelectorHandle>;
  onSelectedIndexChange: (index: number) => void;
  onCloseMenu: () => void;
  scrollToSelectedItem: () => void;
}

export interface UseMentionSelectorKeyboardReturn {
  handleKeyDown: (
    e: React.KeyboardEvent<HTMLTextAreaElement | HTMLDivElement>,
  ) => void;
}

/**
 * MentionSelector 键盘导航自定义 Hook
 * 统一管理 mentionSelector 的键盘事件处理逻辑
 */
export const useMentionSelectorKeyboard = ({
  mentionTrigger,
  mentionPosition,
  mentionSelectorRef,
  onSelectedIndexChange,
  onCloseMenu,
  scrollToSelectedItem,
}: UseMentionSelectorKeyboardParams): UseMentionSelectorKeyboardReturn => {
  /**
   * 处理键盘事件（参考 Ant Design Mentions 的键盘交互）
   * 支持 TextArea 和 contentEditable div
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLDivElement>) => {
      // 如果下拉菜单未显示，不处理键盘导航
      if (!mentionTrigger.trigger || !mentionPosition.visible) {
        return;
      }

      const { key, keyCode } = e.nativeEvent;

      // Esc 键：处理返回上一级或关闭下拉菜单
      if (key === 'Escape' || keyCode === 27) {
        e.preventDefault();
        // 如果 MentionSelector 不在主视图，尝试返回上一级
        if (mentionSelectorRef.current) {
          const handled = mentionSelectorRef.current.handleEscapeKey();
          // 如果返回了上一级（返回 true），则不关闭弹层
          // 如果已经在主视图（返回 false），则关闭弹层
          if (!handled) {
            onCloseMenu();
          }
        } else {
          // 如果 ref 不存在，直接关闭弹层
          onCloseMenu();
        }
        return;
      }

      // 左方向键：返回上一级视图
      if (key === 'ArrowLeft' || keyCode === 37) {
        e.preventDefault();
        if (mentionSelectorRef.current) {
          const handled = mentionSelectorRef.current.handleArrowLeftKey();
          // 如果成功处理了左方向键，则触发滚动
          if (handled) {
            setTimeout(() => {
              scrollToSelectedItem();
            }, 0);
          }
        }
        return;
      }

      // 右方向键：进入下一级或确认选择
      if (key === 'ArrowRight' || keyCode === 39) {
        e.preventDefault();
        if (mentionSelectorRef.current) {
          const handled = mentionSelectorRef.current.handleArrowRightKey();
          // 如果成功处理了右方向键，则触发滚动
          if (handled) {
            setTimeout(() => {
              scrollToSelectedItem();
            }, 0);
          }
        }
        return;
      }

      // 上下箭头键：导航选择（参考 Ant Design Mentions）
      if (key === 'ArrowUp' || keyCode === 38) {
        e.preventDefault();
        onSelectedIndexChange((prev) => {
          const newIndex = prev > 0 ? prev - 1 : 0;
          // 延迟滚动，确保 DOM 已更新
          setTimeout(() => {
            scrollToSelectedItem();
          }, 0);
          return newIndex;
        });
        return;
      }

      if (key === 'ArrowDown' || keyCode === 40) {
        e.preventDefault();
        onSelectedIndexChange((prev) => {
          const newIndex = prev + 1;
          // 延迟滚动，确保 DOM 已更新
          setTimeout(() => {
            scrollToSelectedItem();
          }, 0);
          return newIndex;
        });
        return;
      }

      // Enter 键：确认选择（参考 Ant Design Mentions，Enter 键直接确认选择或进入下一步）
      if (key === 'Enter' || keyCode === 13) {
        e.preventDefault();
        // 直接调用 MentionSelector 的方法处理当前选中项的选择
        // 这样可以确保与 onClick 逻辑完全一致
        if (mentionSelectorRef.current) {
          mentionSelectorRef.current.handleSelectCurrentItem();
        }
        return;
      }
    },
    [
      mentionTrigger,
      mentionPosition,
      mentionSelectorRef,
      onSelectedIndexChange,
      onCloseMenu,
      scrollToSelectedItem,
    ],
  );

  return {
    handleKeyDown,
  };
};

export default useMentionSelectorKeyboard;
