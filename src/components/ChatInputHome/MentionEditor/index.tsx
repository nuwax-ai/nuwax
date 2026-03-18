/**
 * MentionEditor 组件
 *
 * @description
 * 使用 contenteditable div 实现的富文本输入框组件
 * 支持 @ 提及功能，当用户输入 @ 符号时弹出选择器
 *
 * @features
 * - 支持 @ 符号触发提及弹窗
 * - 支持键盘导航（上下箭头、回车、ESC）
 * - 支持点击选择和搜索过滤
 * - 支持删除已选中的提及项
 * - 支持中文输入法（IME）
 * - 支持粘贴事件处理
 *
 * @example
 * ```tsx
 * <MentionEditor
 *   value={inputValue}
 *   onChange={setInputValue}
 *   onMentionSelect={(item) => console.log('Selected:', item)}
 * />
 * ```
 */

import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import MentionPopup from '../MentionPopup';
import type {
  MentionEditorHandle,
  MentionEditorProps,
  MentionItem,
  MentionPopupHandle,
} from '../MentionPopup/types';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 获取光标相对于视口的位置，并根据期望方向和弹窗高度计算显示位置
 * 当 placement 为 auto 时，会根据可用空间自动选择向上或向下展开
 *
 * @param placement - 弹窗期望方向：'auto' | 'up' | 'down'
 * @param popupHeight - 弹窗实际高度（用于向上展开时将底边贴近光标）
 * @param fallbackRange - 可选，切换 Tab 等场景下选区可能不在编辑器时，用此 Range 计算位置（如打开弹窗时保存的 @ 位置）
 * @returns 弹窗位置对象 { top, left }，如果无法获取则返回 null
 */
const getCaretPosition = (
  placement: 'auto' | 'up' | 'down' = 'auto',
  popupHeight?: number,
  fallbackRange?: Range | null,
): { top: number; left: number } | null => {
  const range =
    fallbackRange ??
    (() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      return selection.getRangeAt(0);
    })();
  if (!range) return null;

  const rect = range.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight || 0;

  // 参考 MentionPopup 的最大高度（index.less 中为 280px 列表 + 头部区域）
  const POPUP_ESTIMATED_HEIGHT = 320;
  // 预估弹窗高度
  // 如果传入了弹窗高度，则使用传入的弹窗高度，否则使用预估的弹窗高度，避免在输入关键词导致内容高度变化时，弹窗整体纵向位置发生明显跳动。
  const estimatedHeight = popupHeight ?? POPUP_ESTIMATED_HEIGHT;

  let finalPlacement = placement;
  if (placement === 'auto') {
    const spaceBelow = viewportHeight - rect.bottom;
    finalPlacement = spaceBelow >= estimatedHeight ? 'down' : 'up';
  }

  let top: number;
  if (finalPlacement === 'down') {
    // 弹窗显示在光标下方，偏移 4px
    top = rect.bottom + 4;

    // 如果弹窗高度过大，可能会超出视口底部，这里向上收缩避免撑出页面滚动条
    const maxTop = viewportHeight - estimatedHeight - 4;
    if (top > maxTop) {
      top = Math.max(4, maxTop);
    }
  } else {
    // 弹窗显示在光标上方，将底边尽量贴近光标上方 4px 位置
    top = rect.top - 4 - estimatedHeight;

    // 防止超出可视区域顶部
    if (top < 4) {
      top = 4;
    }
  }

  return {
    top,
    left: rect.left,
  };
};

/**
 * 获取光标前的所有文本内容
 * 用于检测 @ 符号的位置
 *
 * @param element - 编辑器 DOM 元素
 * @returns 光标前的文本字符串
 */
const getTextBeforeCaret = (element: HTMLElement): string => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return '';
  }

  // 创建一个从编辑器开始到光标位置的范围
  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.startContainer, range.startOffset);

  return preCaretRange.toString();
};

/**
 * 序列化编辑器内容
 * 将 mention chip 转成 @名称，同时忽略删除按钮的 × 文本
 *
 * @param node - 需要序列化的节点
 * @returns 纯文本结果
 */
const serializeEditorNode = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || '';
  }

  if (!(node instanceof HTMLElement)) {
    return '';
  }

  if (node.dataset?.mentionName) {
    return `@${node.dataset.mentionName}`;
  }

  return Array.from(node.childNodes)
    .map((childNode) => serializeEditorNode(childNode))
    .join('');
};

/**
 * 获取编辑器的序列化纯文本
 *
 * @param element - 编辑器 DOM 元素
 * @returns 去除控制字符后的纯文本
 */
const getSerializedEditorText = (element: HTMLElement): string => {
  return Array.from(element.childNodes)
    .map((node) => serializeEditorNode(node))
    .join('')
    .replace(/\u200B/g, '');
};

/**
 * 获取光标前一个节点
 * 用于判断光标是否紧贴在已插入的 mention chip 后面
 *
 * @param element - 编辑器 DOM 元素
 * @returns 光标前一个节点，获取失败时返回 null
 */
const getPreviousNodeBeforeCaret = (element: HTMLElement): Node | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const { startContainer, startOffset } = range;

  if (startContainer.nodeType === Node.TEXT_NODE) {
    const previousSibling = startContainer.previousSibling;
    if (startOffset === 0 && previousSibling) {
      return previousSibling;
    }
    return null;
  }

  if (startContainer === element) {
    const childNode = element.childNodes[startOffset - 1];
    return childNode ?? null;
  }

  const parentElement = startContainer as HTMLElement;
  const childNode = parentElement.childNodes[startOffset - 1];
  if (childNode) {
    return childNode;
  }

  return startContainer.previousSibling;
};

/**
 * 获取光标后一个节点
 * 用于支持 Delete 删除紧贴在光标后的 mention chip
 *
 * @param element - 编辑器 DOM 元素
 * @returns 光标后一个节点，获取失败时返回 null
 */
const getNextNodeAfterCaret = (element: HTMLElement): Node | null => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const { startContainer, startOffset } = range;

  if (startContainer.nodeType === Node.TEXT_NODE) {
    const textContent = startContainer.textContent || '';
    if (startOffset === textContent.length) {
      return startContainer.nextSibling;
    }
    return null;
  }

  if (startContainer === element) {
    return element.childNodes[startOffset] ?? null;
  }

  const parentElement = startContainer as HTMLElement;
  const childNode = parentElement.childNodes[startOffset];
  if (childNode) {
    return childNode;
  }

  return startContainer.nextSibling;
};

/**
 * 判断光标是否紧贴在 mention chip 后面
 * 如果是，则不应该再次触发 MentionPopup
 *
 * @param element - 编辑器 DOM 元素
 * @returns 是否位于 mention chip 后
 */
const isCaretAfterMentionChip = (element: HTMLElement): boolean => {
  const previousNode = getPreviousNodeBeforeCaret(element);
  return (
    previousNode instanceof HTMLElement &&
    previousNode.dataset?.mentionId !== undefined
  );
};

/**
 * 检测文本中的 @ 符号并判断是否应该触发提及
 *
 * @param text - 要检测的文本
 * @returns 检测结果对象
 *   - hasMention: 是否存在有效的 @ 提及
 *   - searchText: @ 后面的搜索文本
 *   - atIndex: @ 符号在文本中的位置
 */
const detectMention = (
  text: string,
): { hasMention: boolean; searchText: string; atIndex: number } => {
  const lastAtIndex = text.lastIndexOf('@');

  // 没有 @ 符号
  if (lastAtIndex === -1) {
    return { hasMention: false, searchText: '', atIndex: -1 };
  }

  // 获取 @ 后面的文本
  const textAfterAt = text.substring(lastAtIndex + 1);

  // 如果 @ 后面有空格，说明提及已经结束
  const hasSpaceAfterAt = /\s/.test(textAfterAt);
  if (hasSpaceAfterAt) {
    return { hasMention: false, searchText: '', atIndex: -1 };
  }

  return {
    hasMention: true,
    searchText: textAfterAt,
    atIndex: lastAtIndex,
  };
};

/**
 * MentionEditor 主组件
 * 使用 forwardRef 暴露组件方法给父组件
 */
const MentionEditor = React.forwardRef<MentionEditorHandle, MentionEditorProps>(
  (
    {
      value,
      onChange,
      onPressEnter,
      onPaste,
      placeholder: defaultPlaceholder,
      autoFocus = true,
      disabled = false,
      className,
      onMentionSelect,
      onSkillIdsChange,
      // 是否启用 @ 提及功能，默认启用
      enableMention = true,
      // @ 弹窗展示方向：auto | up | down
      mentionPlacement = 'auto',
      // 默认需要回显为 mention chip 的技能列表（按顺序渲染）
      defaultMentions,
      minRows = 2,
      maxRows = 6,
    },
    ref,
  ) => {
    // ==================== Refs ====================
    /** 编辑器 DOM 引用 */
    const editorRef = useRef<HTMLDivElement>(null);
    /** MentionPopup 组件引用，用于调用其方法 */
    const mentionPopupRef = useRef<MentionPopupHandle>(null);
    /** 是否正在进行中文输入（IME 输入法） */
    const isComposingRef = useRef<boolean>(false);
    /** 当前 @ 符号在文本中的位置索引 */
    const mentionAtIndexRef = useRef<number>(-1);
    /** 保存的光标 Range，用于在选择提及时恢复位置 */
    const savedRangeRef = useRef<Range | null>(null);
    /** 保存的文本节点，用于在选择提及时操作 DOM */
    const savedTextNodeRef = useRef<Node | null>(null);

    // ==================== State ====================
    /** 是否显示提及弹窗 */
    const [showMentionPopup, setShowMentionPopup] = useState<boolean>(false);
    /** 弹窗显示位置 */
    const [mentionPosition, setMentionPosition] = useState<{
      top: number;
      left: number;
    }>({ top: 0, left: 0 });
    /** 提及搜索文本（@ 后面输入的内容） */
    const [mentionSearchText, setMentionSearchText] = useState<string>('');
    /** 已选中的提及项列表 */
    const [selectedMentions, setSelectedMentions] = useState<MentionItem[]>([]);
    /** 编辑器是否为空，用于稳定控制 placeholder 显示 */
    const [isEditorEmpty, setIsEditorEmpty] = useState<boolean>(true);
    /** 当前 MentionPopup 实际高度（用于向上展开时将弹窗底边贴近光标） */
    const [mentionPopupHeight, setMentionPopupHeight] = useState<number | null>(
      null,
    );

    // ==================== 计算属性 ====================
    /** 编辑器最小高度（基于行数） */
    const minHeight = minRows * 22;
    /** 编辑器最大高度（基于行数） */
    const maxHeight = maxRows * 22;

    // ==================== 暴露给父组件的方法 ====================

    /**
     * 获取编辑器的纯文本内容
     */
    const getTextContent = useCallback((): string => {
      if (!editorRef.current) return '';
      return getSerializedEditorText(editorRef.current);
    }, []);

    /**
     * 同步编辑器空状态
     * 使用序列化后的真实文本，而不是依赖 :empty 伪类
     */
    const syncEditorEmptyState = useCallback(() => {
      if (!editorRef.current) {
        setIsEditorEmpty(true);
        return;
      }

      const serializedText = getSerializedEditorText(editorRef.current);
      setIsEditorEmpty(serializedText.trim().length === 0);
    }, []);

    /**
     * 获取所有已选中的提及项
     */
    const getMentions = useCallback((): MentionItem[] => {
      return selectedMentions;
    }, [selectedMentions]);

    /**
     * 将当前已选 mention 推导为父组件需要的 skillIds
     * 统一从 selectedMentions 派生，确保新增、删除、清空都能自动同步
     */
    useEffect(() => {
      // 去重技能ID列表
      const nextSkillIds = Array.from(
        new Set(selectedMentions?.map((item) => item.id as number)),
      );
      onSkillIdsChange?.(nextSkillIds);
    }, [onSkillIdsChange, selectedMentions]);

    // 占位符文本
    const placeholderText = useMemo(() => {
      if (!!defaultPlaceholder) {
        return defaultPlaceholder;
      }
      // 如果启用 @ 提及功能，则显示默认占位符文本
      if (enableMention) {
        return '直接输入指令, 可通过Shift+Enter换行, 通过回车发送消息；支持输入@唤起技能；支持粘贴图片';
      }
      return '直接输入指令, 可通过Shift+Enter换行, 通过回车发送消息；支持粘贴图片';
    }, [enableMention, defaultPlaceholder]);

    /**
     * 弹窗最大高度：不超过视口内从弹窗 top 到底部的空间，避免弹窗撑出页面滚动条导致左右闪动
     */
    const mentionPopupMaxHeight = useMemo(() => {
      if (!showMentionPopup || !mentionPosition) return undefined;
      const vh =
        window.innerHeight || document.documentElement.clientHeight || 0;
      const spaceBelow = vh - mentionPosition.top - 24;
      return Math.min(400, Math.max(120, spaceBelow));
    }, [showMentionPopup, mentionPosition]);

    /**
     * 刷新 MentionPopup 的位置，使其尽量跟随当前光标
     * 在键盘导航、页面滚动或窗口变化时调用
     */
    const refreshMentionPosition = useCallback(() => {
      if (!enableMention || !showMentionPopup) return;

      const position = getCaretPosition(
        mentionPlacement,
        mentionPopupHeight ?? undefined,
        savedRangeRef.current ?? undefined,
      );
      if (position) {
        setMentionPosition(position);
      }
    }, [enableMention, mentionPlacement, mentionPopupHeight, showMentionPopup]);

    /**
     * 处理弹窗高度变化
     * 使用 useCallback 保证传入 MentionPopup 的回调引用稳定，避免无限循环
     *
     * 修复点：
     * - 当弹窗向上展开时（placement === 'up'），在输入搜索关键字导致列表高度变化时，
     *   不再重新根据新高度完全重算 top，避免弹窗整体离编辑器越来越远。
     * - 向下展开时仍使用最新高度重新计算，保持现有行为。
     */
    const handlePopupHeightChange = useCallback(
      (height: number) => {
        setMentionPopupHeight(height);
        // 使用打开弹窗时保存的 Range 计算位置，避免切换 Tab 后焦点在弹窗内导致 getSelection() 不在编辑器而定位错
        const position = getCaretPosition(
          mentionPlacement,
          height,
          savedRangeRef.current ?? undefined,
        );
        if (position) {
          setMentionPosition(position);
        }
      },
      [mentionPlacement],
    );

    /**
     * 弹窗打开期间，监听滚动和窗口尺寸变化，实时刷新弹窗位置
     * 解决输入框位于页面底部时，内容变化或滚动导致弹窗与光标脱节的问题
     */
    useEffect(() => {
      if (!showMentionPopup) return;

      const handleReposition = () => {
        // 先刷新弹窗位置，使其贴合当前光标
        refreshMentionPosition();
      };

      window.addEventListener('scroll', handleReposition, true);
      window.addEventListener('resize', handleReposition);

      // 初次打开时也立即对齐一次
      handleReposition();

      return () => {
        window.removeEventListener('scroll', handleReposition, true);
        window.removeEventListener('resize', handleReposition);
      };
    }, [refreshMentionPosition, showMentionPopup]);

    /**
     * 聚焦编辑器
     */
    const focus = useCallback(() => {
      editorRef.current?.focus();
    }, []);

    /**
     * 移除编辑器焦点
     */
    const blur = useCallback(() => {
      editorRef.current?.blur();
    }, []);

    /**
     * 清空编辑器内容和已选提及
     */
    const clear = useCallback(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        setSelectedMentions([]);
        setIsEditorEmpty(true);
        onChange?.('');
      }
    }, [onChange]);

    // 通过 useImperativeHandle 暴露方法
    useImperativeHandle(ref, () => ({
      focus,
      blur,
      clear,
      getTextContent,
      getMentions,
    }));

    // ==================== 弹窗控制方法 ====================

    /**
     * 关闭提及弹窗并重置相关状态
     */
    const closeMentionPopup = useCallback(() => {
      setShowMentionPopup(false);
      setMentionSearchText('');
      mentionAtIndexRef.current = -1;
      savedRangeRef.current = null;
      savedTextNodeRef.current = null;
    }, []);

    // ==================== Mention Chip 操作方法 ====================

    /**
     * 删除指定的 mention chip
     * 通过 data-mention-id 属性查找并删除 DOM 元素
     *
     * @param mentionId - 要删除的提及项 ID
     */
    const removeMentionChip = useCallback(
      (mentionId: string) => {
        if (!editorRef.current) return;

        // 通过 data 属性查找对应的 chip 元素
        const mentionChip = editorRef.current.querySelector(
          `[data-mention-id="${mentionId}"]`,
        );

        if (mentionChip) {
          // 从 DOM 中移除
          mentionChip.remove();
          // 从状态中移除
          setSelectedMentions((prev) =>
            prev.filter((item) => String(item.id) !== mentionId),
          );
          // 触发 onChange
          const newText = getSerializedEditorText(editorRef.current);
          setIsEditorEmpty(newText.trim().length === 0);
          onChange?.(newText);
          // 重新聚焦编辑器
          editorRef.current.focus();
        }
      },
      [onChange],
    );

    /**
     * 删除指定的 mention 节点，并尽量保持光标位置稳定
     *
     * @param mentionNode - mention chip 对应的 DOM 节点
     */
    const removeMentionChipNode = useCallback(
      (mentionNode: HTMLElement) => {
        if (!editorRef.current) return;

        const selection = window.getSelection();
        const mentionId = mentionNode.dataset.mentionId;
        const previousSibling = mentionNode.previousSibling;
        const nextSibling = mentionNode.nextSibling;

        mentionNode.remove();

        if (mentionId) {
          setSelectedMentions((prev) =>
            prev.filter((item) => String(item.id) !== mentionId),
          );
        }

        if (selection) {
          const newRange = document.createRange();

          if (previousSibling?.nodeType === Node.TEXT_NODE) {
            const previousText = previousSibling.textContent || '';
            newRange.setStart(previousSibling, previousText.length);
            newRange.setEnd(previousSibling, previousText.length);
          } else if (nextSibling?.nodeType === Node.TEXT_NODE) {
            newRange.setStart(nextSibling, 0);
            newRange.setEnd(nextSibling, 0);
          } else {
            const spacerNode = document.createTextNode('');
            editorRef.current.appendChild(spacerNode);
            newRange.setStart(spacerNode, 0);
            newRange.setEnd(spacerNode, 0);
          }

          selection.removeAllRanges();
          selection.addRange(newRange);
        }

        const serializedText = getSerializedEditorText(editorRef.current);
        setIsEditorEmpty(serializedText.trim().length === 0);
        onChange?.(serializedText);
      },
      [onChange],
    );

    /**
     * 创建 mention chip DOM 元素
     * 包含名称显示和删除按钮
     *
     * @param item - 提及项数据
     * @returns 创建的 span 元素
     */
    const createMentionChip = useCallback(
      (item: MentionItem): HTMLSpanElement => {
        // 创建外层容器
        const mentionSpan = document.createElement('span');
        mentionSpan.className = styles['mention-chip'];
        mentionSpan.contentEditable = 'false'; // 不可编辑
        mentionSpan.dataset.mentionId = String(item.id);
        mentionSpan.dataset.mentionName = item.name;

        // 创建内容容器
        const contentSpan = document.createElement('span');
        contentSpan.className = styles['mention-content'];

        // 创建名称显示
        const nameSpan = document.createElement('span');
        nameSpan.className = styles['mention-name'];
        nameSpan.textContent = `@${item.name}`;

        // 创建删除按钮
        const deleteBtn = document.createElement('span');
        deleteBtn.className = styles['mention-delete'];
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          removeMentionChip(String(item.id));
        };

        // 组装 DOM 结构
        contentSpan.appendChild(nameSpan);
        contentSpan.appendChild(deleteBtn);
        mentionSpan.appendChild(contentSpan);

        return mentionSpan;
      },
      [removeMentionChip],
    );

    /**
     * 按传入技能顺序回显 mention chip，忽略 value 文本内容
     * 光标默认落在最后一个 chip 之后，便于继续输入
     */
    useEffect(() => {
      if (!editorRef.current) return;
      if (!enableMention) return;
      if (!defaultMentions || defaultMentions.length === 0) return;
      // 如果已经有内容（用户手动输入或之前回显过），不重复回显
      if (editorRef.current.innerText.trim()) return;

      const container = editorRef.current;
      container.innerHTML = '';

      defaultMentions.forEach((mention) => {
        const chip = createMentionChip(mention);
        container.appendChild(chip);
        // 每个 chip 后插入一个空格文本节点，保证 chip 与后续输入有间隔
        const spaceNode = document.createTextNode(' ');
        container.appendChild(spaceNode);
      });

      // 将光标移动到内容末尾（最后一个空格节点之后）
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        const lastChild = container.lastChild;

        if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
          const text = lastChild.textContent || '';
          range.setStart(lastChild, text.length);
          range.setEnd(lastChild, text.length);
        } else {
          const spacer = document.createTextNode('');
          container.appendChild(spacer);
          range.setStart(spacer, 0);
          range.setEnd(spacer, 0);
        }

        selection.removeAllRanges();
        selection.addRange(range);
        container.focus();
      }

      // 同步内部状态和 onChange
      setSelectedMentions(defaultMentions);
      const serializedText = getSerializedEditorText(container);
      setIsEditorEmpty(serializedText.trim().length === 0);
      onChange?.(serializedText);
    }, [createMentionChip, defaultMentions, enableMention, onChange]);

    // ==================== 核心事件处理 ====================

    /**
     * 处理从弹窗中选择提及项
     * 将选中的提及插入到编辑器中，替换 @ 和搜索文本
     *
     * @param item - 选中的提及项
     */
    const handleMentionSelect = useCallback(
      (item: MentionItem) => {
        if (!editorRef.current) return;

        const selection = window.getSelection();
        if (!selection) return;

        // 使用保存的 range 和 textNode，因为点击 popup 时焦点可能已经改变
        const savedRange = savedRangeRef.current;
        const savedTextNode = savedTextNodeRef.current;

        if (
          savedRange &&
          savedTextNode &&
          savedTextNode.nodeType === Node.TEXT_NODE
        ) {
          // 有保存的位置信息，精确替换
          const text = savedTextNode.textContent || '';
          const cursorPos = savedRange.startOffset;

          // 找到 @ 在当前文本节点中的位置
          const textBeforeCursor = text.substring(0, cursorPos);
          const localAtIndex = textBeforeCursor.lastIndexOf('@');

          if (localAtIndex !== -1) {
            // 分割文本：@ 前的文本 + mention chip + @ 后光标后的文本
            const textBeforeAt = text.substring(0, localAtIndex);
            const textAfterCursor = text.substring(cursorPos);

            // 创建 mention chip 和文本节点
            const mentionSpan = createMentionChip(item);
            const beforeTextNode = document.createTextNode(textBeforeAt);
            const afterTextNode = document.createTextNode(
              ' ' + textAfterCursor,
            );

            // 替换原来的文本节点
            const parent = savedTextNode.parentNode;
            if (parent) {
              parent.insertBefore(beforeTextNode, savedTextNode);
              parent.insertBefore(mentionSpan, savedTextNode);
              parent.insertBefore(afterTextNode, savedTextNode);
              parent.removeChild(savedTextNode);

              // 将光标移动到 mention 后面
              const newRange = document.createRange();
              newRange.setStart(afterTextNode, 1);
              newRange.setEnd(afterTextNode, 1);
              selection.removeAllRanges();
              selection.addRange(newRange);

              editorRef.current.focus();
            }
          }
        } else {
          // 没有保存的范围信息，使用回退方案：在编辑器末尾插入
          const mentionSpan = createMentionChip(item);
          const spaceNode = document.createTextNode(' ');

          // 尝试删除最后输入的 @ 和搜索文本
          const currentText = editorRef.current.innerText || '';
          const lastAtIndex = currentText.lastIndexOf('@');
          if (lastAtIndex !== -1) {
            // 重建编辑器内容
            const textBeforeAt = currentText.substring(0, lastAtIndex);
            editorRef.current.innerHTML = '';
            if (textBeforeAt) {
              editorRef.current.appendChild(
                document.createTextNode(textBeforeAt),
              );
            }
          }

          // 添加 mention chip 和空格
          editorRef.current.appendChild(mentionSpan);
          editorRef.current.appendChild(spaceNode);

          // 将光标移动到末尾
          const newRange = document.createRange();
          newRange.setStartAfter(spaceNode);
          newRange.setEndAfter(spaceNode);
          selection.removeAllRanges();
          selection.addRange(newRange);

          editorRef.current.focus();
        }

        // 更新状态
        setSelectedMentions((prev) => [...prev, item]);
        onMentionSelect?.(item);
        closeMentionPopup();

        // 触发 onChange
        const newText = getSerializedEditorText(editorRef.current);
        setIsEditorEmpty(newText.trim().length === 0);
        onChange?.(newText);
      },
      [closeMentionPopup, onChange, onMentionSelect, createMentionChip],
    );

    /**
     * 处理输入事件
     * 检测 @ 符号并控制弹窗显示
     */
    const handleInput = useCallback(() => {
      // 关闭 @ 提及功能时，仅作为普通输入框同步内容，不做 @ 检测和弹窗处理
      if (!enableMention) {
        if (!editorRef.current) return;
        const text = getTextContent();
        setIsEditorEmpty(text.trim().length === 0);
        onChange?.(text);
        return;
      }

      // 如果正在输入中文，跳过处理
      if (!editorRef.current || isComposingRef.current) return;

      // 获取当前文本并触发 onChange
      const text = getTextContent();
      setIsEditorEmpty(text.trim().length === 0);
      onChange?.(text);

      // 光标紧贴 mention chip 时，删除后面的空格不应再次触发弹窗
      if (isCaretAfterMentionChip(editorRef.current)) {
        closeMentionPopup();
        return;
      }

      // 检测光标前的文本是否包含 @
      const textBeforeCaret = getTextBeforeCaret(editorRef.current);
      const mentionInfo = detectMention(textBeforeCaret);

      // 是否存在有效的 @ 提及，如果有，则显示弹窗
      if (mentionInfo.hasMention) {
        // 检测到有效的 @ 提及
        const position = getCaretPosition(
          mentionPlacement,
          mentionPopupHeight || undefined,
        );
        if (position) {
          // 保存当前的 range 和 textNode，用于后续插入 mention
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            savedRangeRef.current = selection.getRangeAt(0).cloneRange();
            savedTextNodeRef.current = selection.getRangeAt(0).startContainer;
          }

          // 显示弹窗
          setMentionPosition(position);
          setMentionSearchText(mentionInfo.searchText);
          setShowMentionPopup(true);
          mentionAtIndexRef.current = mentionInfo.atIndex;
        }
      } else {
        // 没有有效的 @ 提及，关闭弹窗
        closeMentionPopup();
      }
    }, [
      enableMention,
      mentionPlacement,
      getTextContent,
      onChange,
      closeMentionPopup,
      mentionPopupHeight,
    ]);

    /**
     * 处理键盘按下事件
     * - 弹窗显示时：处理上下左右箭头、回车、ESC
     * - 弹窗隐藏时：处理回车发送
     */
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        // 中文输入时跳过
        if (isComposingRef.current) return;

        // 弹窗显示时的键盘处理（仅在启用 @ 功能时生效）
        if (enableMention && showMentionPopup) {
          switch (e.key) {
            case 'ArrowUp':
              e.preventDefault();
              mentionPopupRef.current?.handleArrowUp();
              return;
            case 'ArrowDown':
              e.preventDefault();
              mentionPopupRef.current?.handleArrowDown();
              return;
            case 'ArrowLeft':
              // 左箭头：在 Tab 栏时切换 Tab
              e.preventDefault();
              mentionPopupRef.current?.handleArrowLeft();
              return;
            case 'ArrowRight':
              // 右箭头：在 Tab 栏时切换 Tab
              e.preventDefault();
              mentionPopupRef.current?.handleArrowRight();
              return;
            case 'Enter':
              e.preventDefault();
              mentionPopupRef.current?.handleSelectCurrentItem();
              return;
            case 'Escape':
              e.preventDefault();
              closeMentionPopup();
              return;
          }
        }

        // 删除紧贴在光标前后的 mention chip
        if (e.key === 'Backspace' && editorRef.current) {
          const previousNode = getPreviousNodeBeforeCaret(editorRef.current);
          if (
            previousNode instanceof HTMLElement &&
            previousNode.dataset?.mentionId !== undefined
          ) {
            e.preventDefault();
            removeMentionChipNode(previousNode);
            closeMentionPopup();
            return;
          }
        }

        if (e.key === 'Delete' && editorRef.current) {
          const nextNode = getNextNodeAfterCaret(editorRef.current);
          if (
            nextNode instanceof HTMLElement &&
            nextNode.dataset?.mentionId !== undefined
          ) {
            e.preventDefault();
            removeMentionChipNode(nextNode);
            closeMentionPopup();
            return;
          }
        }

        // 普通回车发送消息（Shift+Enter 和 Ctrl+Enter 换行）
        if (e.key === 'Enter') {
          if (e.shiftKey || e.ctrlKey) {
            return;
          }
          e.preventDefault();
          onPressEnter?.(e);
        }
      },
      [
        enableMention,
        showMentionPopup,
        closeMentionPopup,
        onPressEnter,
        removeMentionChipNode,
      ],
    );

    /**
     * 处理中文输入开始（IME 开始）
     */
    const handleCompositionStart = useCallback(() => {
      isComposingRef.current = true;
      // 输入法候选阶段虽然还未正式上屏，但此时不应继续显示 placeholder
      setIsEditorEmpty(false);
    }, []);

    /**
     * 处理中文输入结束（IME 结束）
     */
    const handleCompositionEnd = useCallback(() => {
      isComposingRef.current = false;
      // 输入完成后触发检测
      handleInput();
    }, [handleInput]);

    /**
     * 处理粘贴事件
     * - 如果剪贴板中包含图片：交给外部 onPaste（用于上传图片），不处理文本
     * - 如果只有文本/DOM：阻止默认粘贴行为，只按纯文本插入，去掉所有原始 DOM 属性/样式
     */
    const handlePasteEvent = useCallback(
      (e: React.ClipboardEvent<HTMLDivElement>) => {
        const clipboardData = e.clipboardData;

        // 1. 先检查是否包含图片，如果有图片则交给外部 onPaste 处理上传
        if (clipboardData && clipboardData.items) {
          let hasImage = false;
          for (let i = 0; i < clipboardData.items.length; i += 1) {
            const item = clipboardData.items[i];
            if (item.type.indexOf('image') !== -1) {
              hasImage = true;
              break;
            }
          }

          if (hasImage) {
            onPaste(e);
            // 不要在这里 preventDefault，让外层 onPaste 自行决定是否阻止默认行为
            return;
          }
        }

        // 2. 没有图片时，按纯文本方式粘贴，去掉所有样式/属性
        e.preventDefault();

        const text = clipboardData?.getData('text/plain') ?? '';
        if (!text) return;

        if (!editorRef.current) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          // 如果没有选区，直接追加到末尾
          editorRef.current.appendChild(document.createTextNode(text));
        } else {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        const serializedText = getSerializedEditorText(editorRef.current);
        setIsEditorEmpty(serializedText.trim().length === 0);
        onChange?.(serializedText);
      },
      [onChange, onPaste],
    );

    /**
     * 处理失焦事件
     * 延迟关闭弹窗，避免点击弹窗时立即关闭
     */
    const handleBlur = useCallback(() => {
      setTimeout(() => {
        // 检查当前焦点是否在弹窗内
        if (
          !document.activeElement?.closest(
            `.${styles['mention-popup-wrapper']}`,
          )
        ) {
          closeMentionPopup();
        }
      }, 200);
    }, [closeMentionPopup]);

    /**
     * 处理点击事件
     * 当点击时检查光标前是否有 @ 符号，如果有则显示 MentionPopup
     * 用于支持点击已输入的 @ 重新打开弹窗
     */
    const handleClick = useCallback(() => {
      if (!editorRef.current || disabled) return;

      // 关闭 @ 提及功能时，点击只负责光标定位，不触发弹窗
      if (!enableMention) {
        closeMentionPopup();
        return;
      }

      // 延迟执行以确保光标位置已更新
      setTimeout(() => {
        if (!editorRef.current) return;

        // 点击到 mention chip 后方时，不重新打开弹窗
        if (isCaretAfterMentionChip(editorRef.current)) {
          closeMentionPopup();
          return;
        }

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const textNode = range.startContainer;

        if (textNode.nodeType === Node.TEXT_NODE) {
          const text = textNode.textContent || '';
          const cursorPos = range.startOffset;
          const textBeforeCursor = text.substring(0, cursorPos);
          const lastAtIndex = textBeforeCursor.lastIndexOf('@');

          if (lastAtIndex !== -1) {
            // 检查 @ 和光标之间是否有空格
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            const hasSpaceAfterAt = /\s/.test(textAfterAt);

            if (!hasSpaceAfterAt) {
              // 保存当前的 range 和 textNode
              savedRangeRef.current = range.cloneRange();
              savedTextNodeRef.current = textNode;

              // 光标在 @ 后面，没有空格间隔，显示弹窗
              const position = getCaretPosition(
                mentionPlacement,
                mentionPopupHeight ?? undefined,
              );
              if (position) {
                setMentionPosition(position);
                setMentionSearchText(textAfterAt);
                setShowMentionPopup(true);
                mentionAtIndexRef.current = lastAtIndex;
              }
            } else {
              closeMentionPopup();
            }
          } else {
            closeMentionPopup();
          }
        } else {
          // 如果光标不在文本节点中，尝试从整个编辑器获取光标前的文本
          const textBeforeCaret = getTextBeforeCaret(editorRef.current!);
          const mentionInfo = detectMention(textBeforeCaret);

          if (mentionInfo.hasMention) {
            // 保存当前的 range
            savedRangeRef.current = range.cloneRange();
            savedTextNodeRef.current = range.startContainer;

            const position = getCaretPosition();
            if (position) {
              setMentionPosition(position);
              setMentionSearchText(mentionInfo.searchText);
              setShowMentionPopup(true);
              mentionAtIndexRef.current = mentionInfo.atIndex;
            }
          } else {
            closeMentionPopup();
          }
        }
      }, 0);
    }, [
      disabled,
      enableMention,
      mentionPlacement,
      closeMentionPopup,
      mentionPopupHeight,
    ]);

    // ==================== Effects ====================

    /**
     * 同步外部 value 到编辑器
     * 当外部 value 改变且编辑器未聚焦时，更新编辑器内容
     */
    useEffect(() => {
      if (value !== undefined && editorRef.current) {
        const currentText = getSerializedEditorText(editorRef.current);
        if (
          currentText !== value &&
          !document.activeElement?.isSameNode(editorRef.current)
        ) {
          editorRef.current.textContent = value;
        }
        setIsEditorEmpty((value || '').trim().length === 0);
      }
    }, [value]);

    /**
     * 初始化和 DOM 结构变化后的空状态同步
     */
    useEffect(() => {
      syncEditorEmptyState();
    }, [syncEditorEmptyState]);

    /**
     * 根据外部属性控制是否在渲染后自动聚焦
     */
    useEffect(() => {
      if (!autoFocus || disabled) {
        return;
      }

      const frameId = window.requestAnimationFrame(() => {
        editorRef.current?.focus();
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }, [autoFocus, disabled]);

    /**
     * 点击外部区域关闭弹窗
     */
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          showMentionPopup &&
          !editorRef.current?.contains(e.target as Node) &&
          !(e.target as HTMLElement)?.closest(
            `.${styles['mention-popup-wrapper']}`,
          )
        ) {
          closeMentionPopup();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showMentionPopup, closeMentionPopup]);

    // ==================== Render ====================

    return (
      <div className={styles['mention-editor-wrapper']}>
        {/* 可编辑区域 */}
        <div
          ref={editorRef}
          className={cx(styles['mention-editor'], className, {
            [styles.empty]: isEditorEmpty,
            [styles.disabled]: disabled,
          })}
          contentEditable={!disabled}
          // 输入事件
          onInput={handleInput}
          // 键盘事件
          onKeyDown={handleKeyDown}
          // 粘贴事件
          onPaste={handlePasteEvent}
          // 失焦事件
          onBlur={handleBlur}
          // 点击事件
          onClick={handleClick}
          // 输入法组合开始事件
          onCompositionStart={handleCompositionStart}
          /** 输入法组合结束事件 */
          onCompositionEnd={handleCompositionEnd}
          style={{
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
          }}
          data-placeholder={placeholderText}
          suppressContentEditableWarning
        />

        {/* @提及技能选择弹窗 */}
        <div className={styles['mention-popup-wrapper']}>
          <MentionPopup
            ref={mentionPopupRef}
            visible={showMentionPopup}
            position={mentionPosition}
            onSelect={handleMentionSelect}
            onClose={closeMentionPopup}
            searchText={mentionSearchText}
            maxHeight={mentionPopupMaxHeight}
            onHeightChange={handlePopupHeightChange}
          />
        </div>
      </div>
    );
  },
);

export default MentionEditor;
