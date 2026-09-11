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

import { t } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import CapabilityModal from '../CapabilityModal';
import type {
  CapabilityItem,
  CapabilityTypeEnum,
} from '../CapabilityModal/types';
import MentionPopup from '../MentionPopup';
import type {
  DocMentionItem,
  MentionEditorHandle,
  MentionEditorProps,
  MentionItem,
  MentionPopupHandle,
} from '../MentionPopup/types';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * / 能力弹窗默认开放的能力类型（不含专家）：
 * 产品策略——选择专家仅首页开放，其余入口仅隐藏导航项，
 * 专家选中链路（onExpertSelect → expertComponents 随消息发送）保持可用。
 */
export const DEFAULT_CAPABILITY_RESOURCE_TYPES: CapabilityTypeEnum[] = [
  'skill',
  'connector',
  'knowledge',
];

type CaretPlacement = 'up' | 'down';

interface CaretPosition {
  /** 弹窗左上角位置 */
  top: number;
  left: number;
  /** 实际采用的展开方向（auto 下推导而来） */
  finalPlacement: CaretPlacement;
  /**
   * 弹窗与光标的锚点：
   * - 当 finalPlacement === 'down' 时：anchorY 为弹窗的 top（贴在光标下方 4px）
   * - 当 finalPlacement === 'up' 时：anchorY 为弹窗的 bottom（贴在光标上方 4px）
   * 用于在高度变化时“固定”这一边，避免与光标的间距发生改变
   */
  anchorY: number;
}

/**
 * 获取光标相对于视口的位置，并根据期望方向和弹窗高度计算显示位置
 * 当 placement 为 auto 时，会根据可用空间自动选择向上或向下展开
 *
 * @param placement - 弹窗期望方向：'auto' | 'up' | 'down'
 * @param popupHeight - 预估弹窗高度，用于在 auto 模式下决策向上/向下展开
 * @param fallbackRange - 可选，切换 Tab 等场景下选区可能不在编辑器时，用此 Range 计算位置（如打开弹窗时保存的 @ 位置）
 * @returns 弹窗位置对象 { top, left, finalPlacement, anchorY }，如果无法获取则返回 null
 */
const getCaretPosition = (
  placement: 'auto' | CaretPlacement = 'auto',
  popupHeight?: number,
  fallbackRange?: Range | null,
): CaretPosition | null => {
  const range =
    fallbackRange ??
    (() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      return selection.getRangeAt(0);
    })();
  if (!range) return null;

  let rect = range.getBoundingClientRect();
  // 刚插入节点上的 collapsed 光标可能出现全零矩形：退回光标所在元素矩形兜底，
  // 避免弹窗被定位到视口左上角
  if (rect.top === 0 && rect.left === 0 && !rect.width && !rect.height) {
    const owner =
      range.startContainer.nodeType === Node.TEXT_NODE
        ? range.startContainer.parentElement
        : (range.startContainer as HTMLElement | null);
    const ownerRect = owner?.getBoundingClientRect();
    if (ownerRect && (ownerRect.width || ownerRect.height)) {
      rect = ownerRect;
    }
  }
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight || 0;

  // 参考 MentionPopup 的最大高度（index.less 中为 280px 列表 + 头部区域）
  const POPUP_ESTIMATED_HEIGHT = 320;
  // 预估弹窗高度
  // 如果传入了弹窗高度，则使用传入的弹窗高度，否则使用预估的弹窗高度，避免在输入关键词导致内容高度变化时，弹窗整体纵向位置发生明显跳动。
  const estimatedHeight = popupHeight ?? POPUP_ESTIMATED_HEIGHT;

  let finalPlacement: CaretPlacement =
    placement === 'auto' ? 'down' : (placement as CaretPlacement);
  if (placement === 'auto') {
    const spaceBelow = viewportHeight - rect.bottom;
    finalPlacement = spaceBelow >= estimatedHeight ? 'down' : 'up';
  }

  let top: number;
  let anchorY: number;
  if (finalPlacement === 'down') {
    // 弹窗显示在光标下方，偏移 4px
    top = rect.bottom + 4;
    anchorY = top;

    // 如果弹窗高度过大，可能会超出视口底部，这里向上收缩避免撑出页面滚动条
    const maxTop = viewportHeight - estimatedHeight - 4;
    if (top > maxTop) {
      top = Math.max(4, maxTop);
    }
  } else {
    // 弹窗显示在光标上方，将底边尽量贴近光标上方 4px 位置
    const bottom = rect.top - 4;
    top = bottom - estimatedHeight;
    anchorY = bottom;

    // 防止超出可视区域顶部
    if (top < 4) {
      top = 4;
    }
  }

  return {
    top,
    left: Math.max(
      4,
      Math.min(
        rect.left,
        (window.innerWidth || document.documentElement.clientWidth) - 288,
      ),
    ),
    finalPlacement,
    anchorY,
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

  const fragment = preCaretRange.cloneContents();
  fragment.querySelectorAll('[data-mention-id]').forEach((chip) => {
    chip.textContent = '\uFFFC';
  });
  fragment
    .querySelectorAll('br')
    .forEach((br) => br.replaceWith(document.createTextNode('\n')));
  fragment
    .querySelectorAll('div,p,li')
    .forEach((block) => block.prepend(document.createTextNode('\n')));
  return fragment.textContent || '';
};

/**
 * 块级标签：contenteditable 中回车/粘贴多行时，浏览器通常会拆成这些节点
 * （Chrome 多为 DIV，部分场景为 P）
 */
const BLOCK_ELEMENT_RE =
  /^(DIV|P|LI|H[1-6]|TR|SECTION|ARTICLE|BLOCKQUOTE|PRE)$/i;

/**
 * 序列化编辑器内容
 * 将 mention chip 转成 @名称，同时忽略删除按钮的 × 文本；
 * 保留 BR / 块级节点带来的换行，避免粘贴格式化代码后变成「一坨字符串」
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

  if (node.dataset?.mentionKind === 'file') {
    return `@${node.dataset.mentionPath || ''}`;
  }

  if (node.dataset?.mentionName) {
    return `@${node.dataset.mentionName}`;
  }

  if (node.tagName === 'BR') {
    return '\n';
  }

  let text = Array.from(node.childNodes)
    .map((childNode) => serializeEditorNode(childNode))
    .join('');

  // 块级节点视为一行：内容末尾补换行（若子节点已是 BR 结尾则不再重复）
  if (BLOCK_ELEMENT_RE.test(node.tagName) && !text.endsWith('\n')) {
    text += '\n';
  }

  return text;
};

/**
 * 获取编辑器的序列化纯文本
 *
 * @param element - 编辑器 DOM 元素
 * @returns 去除控制字符后的纯文本（保留换行）
 */
export const getSerializedEditorText = (element: HTMLElement): string => {
  const children = Array.from(element.childNodes);
  const text = children
    .map((node, index) => {
      let part = serializeEditorNode(node);
      // 粘贴/回车多行内容时，Chrome 会把首行留作根级裸文本、后续行包进块级节点。
      // 裸文本自身不会补换行，导致序列化后首行与下一行被拼在一起。
      // 若其下一个兄弟是块级节点（BR 已自带 \n，需排除避免重复），则视为独立一行补 \n。
      const nextNode = children[index + 1];
      if (
        part &&
        !part.endsWith('\n') &&
        nextNode instanceof HTMLElement &&
        BLOCK_ELEMENT_RE.test(nextNode.tagName)
      ) {
        part += '\n';
      }
      return part;
    })
    .join('')
    .replace(/\u200B/g, '')
    // 末尾块级节点会多一个换行，发送前去掉，避免消息尾部多余空行
    .replace(/\n$/, '');
  // 仅空白/换行时仍视为空，与改前空编辑器行为一致（placeholder、发送按钮禁用）
  return text.trim() ? text : '';
};

/**
 * 将光标移动到编辑器内容末尾
 * 用于撤销/重做后保持光标在文本后面，便于继续输入
 */
const placeCaretAtEnd = (element: HTMLElement) => {
  element.focus();
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
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
export const detectMention = (text: string, trigger: '@' | '/' = '@') => {
  const atIndex = text.lastIndexOf(trigger);
  const searchText = text.slice(atIndex + 1);
  // @ 与 / 一致：触发字符须位于行首或空白字符之后，紧跟文字不触发
  const validPrefix = atIndex === 0 || /\s/.test(text[atIndex - 1]);
  const invalid =
    trigger === '@'
      ? /[^a-zA-Z0-9\u4e00-\u9fa5\-_./]/
      : /[^a-zA-Z0-9\u4e00-\u9fa5\-_]/;
  return atIndex >= 0 && validPrefix && !invalid.test(searchText)
    ? { hasMention: true, searchText, atIndex }
    : { hasMention: false, searchText: '', atIndex: -1 };
};

const mentionKey = (item: MentionItem) =>
  item.kind === 'file'
    ? `file:${item.relativePath}`
    : item.kind === 'doc'
    ? `doc:${item.slugId}`
    : String(item.targetId);

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
      inlinePrefixWidth = 0,
      onMentionSelect,
      onFetchMentionFiles,
      onPluginSelect,
      onExpertSelect,
      onDocsChange,
      enableSubscription = false,
      onUnsubscribedSkillSelect,
      onSkillIdsChange,
      // 是否启用技能 chip 能力（编程化插入/回显守卫）；/ 能力弹窗不受此门控
      enableMention = true,
      // / 能力弹窗开放的能力类型（缺省不含专家，产品策略：专家仅首页开放）
      capabilityResourceTypes = DEFAULT_CAPABILITY_RESOURCE_TYPES,
      // @ 弹窗展示方向：auto | up | down
      mentionPlacement = 'auto',
      // 默认需要回显为 mention chip 的技能列表（按顺序渲染）
      defaultMentions,
      minRows = 2,
      maxRows = 6,
      usageScenarios,
      // 能力弹窗关闭回调（连接/断开等弹窗内操作完成后触发，供消费方刷新派生数据）
      onCapabilityModalClose,
    },
    ref,
  ) => {
    const MAX_UNDO_HISTORY = 100;
    const [activeTrigger, setActiveTrigger] = useState<'@' | '/'>('@');

    // ==================== Refs ====================
    /** 编辑器 DOM 引用 */
    const editorRef = useRef<HTMLDivElement>(null);
    /** 编辑器内容快照栈（innerHTML），用于撤销/重做 */
    const undoStackRef = useRef<string[]>(['']);
    /** 当前快照在栈中的位置 */
    const undoIndexRef = useRef(0);
    /** 是否正在应用撤销/重做，避免重复入栈 */
    const isHistoryActionRef = useRef(false);
    /** 最近一次由编辑器主动同步给外部的文本 */
    const lastEmittedValueRef = useRef<string | undefined>(undefined);
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
    /** 是否显示添加能力大弹窗（/ 触发） */
    const [capabilityOpen, setCapabilityOpen] = useState<boolean>(false);
    /** capabilityOpen 的同步镜像：删除触发串会经 commitEditorChange 重入检测，用于防递归 */
    const capabilityOpenRef = useRef<boolean>(false);
    /**
     * 能力弹窗初始页签（编程唤起时指定；'/' 触发沿用上次停留页签）。
     * 配套 resetKey 强制重挂 CapabilityModal——弹窗组件常驻不卸载，
     * useState 初始值只在挂载时生效，不重挂则换不开页签
     */
    const [capabilityDefaultType, setCapabilityDefaultType] =
      useState<CapabilityTypeEnum>('skill');
    const [capabilityResetKey, setCapabilityResetKey] = useState<number>(0);
    /**
     * 打开能力弹窗的句柄（ref 转发：openCapabilityModal 依赖 commitEditorChange，
     * 而 commitEditorChange 依赖本组件更早声明的 runMentionDetection，用 ref 断开环）
     */
    const openCapabilityModalRef = useRef<(searchText: string) => void>(
      () => {},
    );
    /** 弹窗显示位置（向下用 top，向上用 bottom） */
    const [mentionPosition, setMentionPosition] = useState<{
      top?: number;
      left: number;
      bottom?: number;
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
    /** 弹窗与光标的锚点 Y，见 CaretPosition.anchorY 注释 */
    const popupAnchorYRef = useRef<number | null>(null);

    // ==================== 计算属性 ====================
    /** 编辑器最小高度（基于行数） */
    const minHeight = minRows * 32.2;
    /** 编辑器最大高度（基于行数） */
    const maxHeight = maxRows * 32.2;

    // ==================== 暴露给父组件的方法 ====================

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

    /** 重置撤销/重做栈 */
    const resetUndoStack = useCallback((snapshot = '') => {
      undoStackRef.current = [snapshot];
      undoIndexRef.current = 0;
    }, []);

    /** 根据 DOM 同步 mention 选中状态（从 DOM 重建，避免与 setState 竞态） */
    const syncMentionsFromDom = useCallback(
      (pendingMention?: MentionItem) => {
        if (!editorRef.current) return;

        setSelectedMentions((prev) => {
          const prevMap = new Map(
            prev.map((mention) => [mentionKey(mention), mention]),
          );
          if (pendingMention) {
            prevMap.set(mentionKey(pendingMention), pendingMention);
          }

          return Array.from(
            editorRef.current!.querySelectorAll('[data-mention-id]'),
          ).map((chip) => {
            const el = chip as HTMLElement;
            const mentionId = el.dataset.mentionId!;
            return (
              prevMap.get(mentionId) ??
              (el.dataset.mentionKind === 'file'
                ? {
                    kind: 'file' as const,
                    relativePath: el.dataset.mentionPath || '',
                    name: el.dataset.mentionName || '',
                  }
                : el.dataset.mentionKind === 'doc'
                ? {
                    kind: 'doc' as const,
                    slugId: el.dataset.mentionSlugId || '',
                    name: el.dataset.mentionName || '',
                    pageType: el.dataset.mentionPageType || undefined,
                  }
                : {
                    kind: 'skill' as const,
                    targetId: Number(mentionId),
                    name: el.dataset.mentionName || '',
                  })
            );
          });
        });
      },
      [enableMention],
    );

    /** 记录当前 DOM 快照到撤销栈 */
    const recordUndoSnapshot = useCallback(() => {
      if (!editorRef.current || isHistoryActionRef.current) return;

      const snapshot = editorRef.current.innerHTML;
      const stack = undoStackRef.current;
      const index = undoIndexRef.current;
      if (stack[index] === snapshot) return;

      let nextStack = stack.slice(0, index + 1);
      nextStack.push(snapshot);
      if (nextStack.length > MAX_UNDO_HISTORY) {
        nextStack = nextStack.slice(nextStack.length - MAX_UNDO_HISTORY);
      }
      undoStackRef.current = nextStack;
      undoIndexRef.current = nextStack.length - 1;
    }, []);

    /** 将 DOM 文本同步到受控 value */
    const syncEditorStateFromDom = useCallback(
      (pendingMention?: MentionItem) => {
        if (!editorRef.current) return '';

        const text = getSerializedEditorText(editorRef.current);
        lastEmittedValueRef.current = text;
        setIsEditorEmpty(text.trim().length === 0);
        onChange?.(text);
        syncMentionsFromDom(pendingMention);
        return text;
      },
      [onChange, syncMentionsFromDom],
    );

    /** 关闭提及弹窗并重置相关状态 */
    const closeMentionPopup = useCallback(() => {
      setShowMentionPopup(false);
      setMentionSearchText('');
      mentionAtIndexRef.current = -1;
      savedRangeRef.current = null;
      savedTextNodeRef.current = null;
      popupAnchorYRef.current = null;
    }, []);

    /** 检测 @ 并控制弹窗 */
    const runMentionDetection = useCallback(() => {
      if (disabled || !editorRef.current) {
        closeMentionPopup();
        return;
      }

      if (isCaretAfterMentionChip(editorRef.current)) {
        closeMentionPopup();
        return;
      }

      const textBeforeCaret = getTextBeforeCaret(editorRef.current);
      const fileInfo = detectMention(textBeforeCaret);
      const slashInfo = detectMention(textBeforeCaret, '/');
      // @ 文件提及需数据源；/ 能力弹窗随时可唤起（不随 enableMention/智能体配置门控）
      const trigger = onFetchMentionFiles && fileInfo.hasMention ? '@' : '/';
      const mentionInfo = trigger === '@' ? fileInfo : slashInfo;

      // / 命中即打开添加能力大弹窗（不弹光标浮层）
      if (trigger === '/') {
        // 已打开时被删除触发串的 commit 重入，直接跳过
        if (capabilityOpenRef.current) {
          closeMentionPopup();
          return;
        }
        if (mentionInfo.hasMention) {
          openCapabilityModalRef.current(mentionInfo.searchText);
        } else {
          closeMentionPopup();
        }
        return;
      }

      if (mentionInfo.hasMention) {
        const position = getCaretPosition(
          mentionPlacement,
          mentionPopupHeight || undefined,
        );
        if (position) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            savedRangeRef.current = selection.getRangeAt(0).cloneRange();
            savedTextNodeRef.current = selection.getRangeAt(0).startContainer;
          }

          const vh =
            window.innerHeight || document.documentElement.clientHeight || 0;
          if (position.finalPlacement === 'up') {
            setMentionPosition({
              left: position.left,
              bottom: vh - position.anchorY,
              top: undefined,
            });
          } else {
            setMentionPosition({
              left: position.left,
              top: position.anchorY,
              bottom: undefined,
            });
          }
          popupAnchorYRef.current = position.anchorY;
          setActiveTrigger(trigger);
          setMentionSearchText(mentionInfo.searchText);
          setShowMentionPopup(true);
          mentionAtIndexRef.current = mentionInfo.atIndex;
        }
      } else {
        closeMentionPopup();
      }
    }, [
      closeMentionPopup,
      onFetchMentionFiles,
      disabled,
      mentionPlacement,
      mentionPopupHeight,
    ]);

    /** 提交一次编辑变更：入栈 + 同步文本 + mention 检测 */
    const commitEditorChange = useCallback(
      (options?: { pendingMention?: MentionItem }) => {
        if (!editorRef.current || isHistoryActionRef.current) return;

        recordUndoSnapshot();
        syncEditorStateFromDom(options?.pendingMention);
        runMentionDetection();
      },
      [recordUndoSnapshot, runMentionDetection, syncEditorStateFromDom],
    );

    /** 应用历史快照 */
    const applyHistorySnapshot = useCallback(
      (targetIndex: number) => {
        if (!editorRef.current) return;

        const snapshot = undoStackRef.current[targetIndex];
        if (snapshot === undefined) return;

        isHistoryActionRef.current = true;
        editorRef.current.innerHTML = snapshot;
        undoIndexRef.current = targetIndex;
        placeCaretAtEnd(editorRef.current);
        syncEditorStateFromDom();
        // 撤销/重做后不自动唤起 @ 弹窗：此时 DOM 刚恢复，光标坐标未稳定，
        // 且用户意图是回退而非重新选择技能，避免出现错位弹窗
        closeMentionPopup();

        queueMicrotask(() => {
          isHistoryActionRef.current = false;
        });
      },
      [closeMentionPopup, syncEditorStateFromDom],
    );

    const undoEditorHistory = useCallback(() => {
      if (undoIndexRef.current <= 0) return;
      applyHistorySnapshot(undoIndexRef.current - 1);
    }, [applyHistorySnapshot]);

    const redoEditorHistory = useCallback(() => {
      if (undoIndexRef.current >= undoStackRef.current.length - 1) return;
      applyHistorySnapshot(undoIndexRef.current + 1);
    }, [applyHistorySnapshot]);

    /**
     * 将当前已选 mention 推导为父组件需要的 skillIds
     * 统一从 selectedMentions 派生，确保新增、删除、清空都能自动同步
     */
    useEffect(() => {
      // 去重技能ID列表（专家/资料库 chip 不计入技能）
      const nextSkillIds = Array.from(
        new Set(
          selectedMentions
            .filter((item) => (item.kind ?? 'skill') === 'skill')
            .map((item) => item.targetId as number),
        ),
      );
      onSkillIdsChange?.(nextSkillIds);
    }, [onSkillIdsChange, selectedMentions]);

    /**
     * 资料库文档 chip 派生：随消息以 selectedDocs({slugId,title,pageType}) 发送
     * （对齐 chat 接口 SelectedDocDto 契约），与 skillIds 同源（selectedMentions），
     * 删除/清空自动同步
     */
    useEffect(() => {
      const docs = selectedMentions.filter(
        (item): item is DocMentionItem => item.kind === 'doc',
      );
      onDocsChange?.(
        Array.from(
          new Map(docs.map((item) => [item.slugId, item])).values(),
        ).map((item) => ({
          slugId: item.slugId,
          title: item.name,
          pageType: item.pageType,
        })),
      );
    }, [onDocsChange, selectedMentions]);

    // 占位符文本
    const placeholderText = useMemo(() => {
      if (!!defaultPlaceholder) {
        return defaultPlaceholder;
      }
      // / 能力弹窗随时可唤起，统一展示含 / 引导的默认占位文案
      return t('PC.Components.ChatInputCommands.hint');
    }, [defaultPlaceholder]);

    /**
     * 弹窗最大高度：不超过视口内从弹窗 top 到底部的空间，避免弹窗撑出页面滚动条导致左右闪动
     */
    const mentionPopupMaxHeight = useMemo(() => {
      if (!showMentionPopup || !mentionPosition) return undefined;
      const top = mentionPosition.top ?? 0;
      const vh =
        window.innerHeight || document.documentElement.clientHeight || 0;
      const spaceBelow =
        mentionPosition.bottom !== undefined
          ? vh - mentionPosition.bottom - 8
          : vh - top - 24;
      return Math.min(400, Math.max(120, spaceBelow));
    }, [showMentionPopup, mentionPosition]);

    /**
     * 刷新 MentionPopup 的位置，使其尽量跟随当前光标
     * 在键盘导航、页面滚动或窗口变化时调用
     */
    const refreshMentionPosition = useCallback(() => {
      if (!showMentionPopup) return;

      const position = getCaretPosition(
        mentionPlacement,
        mentionPopupHeight ?? undefined,
        savedRangeRef.current ?? undefined,
      );
      if (position) {
        const vh =
          window.innerHeight || document.documentElement.clientHeight || 0;
        if (position.finalPlacement === 'up') {
          setMentionPosition({
            left: position.left,
            bottom: vh - position.anchorY,
            top: undefined,
          });
        } else {
          setMentionPosition({
            left: position.left,
            top: position.anchorY,
            bottom: undefined,
          });
        }
        popupAnchorYRef.current = position.anchorY;
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
    const handlePopupHeightChange = useCallback((height: number) => {
      setMentionPopupHeight(height);
    }, []);

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
     * 清空编辑器内容和已选提及
     */
    const clear = useCallback(() => {
      if (!editorRef.current) return;

      isHistoryActionRef.current = true;
      closeMentionPopup();
      // 能力弹窗随编辑器清空一并关闭（如清空按钮/新会话复位场景）
      capabilityOpenRef.current = false;
      setCapabilityOpen(false);
      editorRef.current.innerHTML = '';
      resetUndoStack('');
      setSelectedMentions([]);
      setIsEditorEmpty(true);
      lastEmittedValueRef.current = '';
      onChange?.('');

      queueMicrotask(() => {
        isHistoryActionRef.current = false;
      });
    }, [onChange, resetUndoStack, closeMentionPopup]);

    // ==================== Mention Chip 操作方法 ====================

    /**
     * 删除指定的 mention chip
     * 通过 data-mention-id 属性查找并删除 DOM 元素
     *
     * @param mentionId - 要删除的提及项 ID
     */
    /**
     * 删除指定的 mention 节点，并尽量保持光标位置稳定
     *
     * @param mentionNode - mention chip 对应的 DOM 节点
     */
    const removeMentionChipNode = useCallback(
      (mentionNode: HTMLElement) => {
        if (!editorRef.current) return;

        const selection = window.getSelection();
        const previousSibling = mentionNode.previousSibling;
        const nextSibling = mentionNode.nextSibling;

        mentionNode.remove();

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

        commitEditorChange();
      },
      [commitEditorChange],
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
        mentionSpan.dataset.mentionId = mentionKey(item);
        mentionSpan.dataset.mentionKind = item.kind ?? 'skill';
        if (item.kind === 'file')
          mentionSpan.dataset.mentionPath = item.relativePath;
        // 资料库文档：slugId/pageType 存 dataset，供 prevMap 失效（撤销/重做）后的重建
        if (item.kind === 'doc') {
          mentionSpan.dataset.mentionSlugId = item.slugId;
          if (item.pageType)
            mentionSpan.dataset.mentionPageType = item.pageType;
        }
        mentionSpan.dataset.mentionName = item.name;

        // 创建内容容器
        const contentSpan = document.createElement('span');
        contentSpan.className = styles['mention-content'];

        // 创建名称显示
        const nameSpan = document.createElement('span');
        nameSpan.className = styles['mention-name'];
        nameSpan.textContent = `@${
          item.kind === 'file' ? item.relativePath : item.name
        }`;

        // 创建删除按钮
        const deleteBtn = document.createElement('span');
        deleteBtn.className = styles['mention-delete'];
        deleteBtn.innerHTML = '×';
        deleteBtn.dataset.mentionDelete = 'true';

        // 组装 DOM 结构
        contentSpan.appendChild(nameSpan);
        contentSpan.appendChild(deleteBtn);
        mentionSpan.appendChild(contentSpan);

        return mentionSpan;
      },
      [],
    );

    /**
     * 选中未订阅的付费技能时，通知父组件打开订阅弹窗
     */
    const notifyUnsubscribedSkillSelect = useCallback(
      (item: MentionItem) => {
        if (
          item.kind !== 'file' &&
          enableSubscription &&
          item.paymentRequired &&
          !item.subscribed
        ) {
          onUnsubscribedSkillSelect?.(item);
        }
      },
      [enableSubscription, onUnsubscribedSkillSelect],
    );

    /**
     * 以编程方式插入提及项（编辑器对外 ref 能力）
     * 将选中的提及追加到编辑器内容末尾，不替换已有内容
     *
     * @param item - 选中的提及项
     */
    const handleAtIconMentionSelect = useCallback(
      (item: MentionItem) => {
        if (!editorRef.current || !enableMention) return;

        const container = editorRef.current;
        const chip = createMentionChip(item);
        const spaceNode = document.createTextNode(' ');
        container.appendChild(chip);
        container.appendChild(spaceNode);

        // 光标移到末尾
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.setStart(spaceNode, 1);
          range.setEnd(spaceNode, 1);
          selection.removeAllRanges();
          selection.addRange(range);
          container.focus();
        }

        notifyUnsubscribedSkillSelect(item);
        commitEditorChange({ pendingMention: item });
      },
      [
        commitEditorChange,
        createMentionChip,
        enableMention,
        notifyUnsubscribedSkillSelect,
      ],
    );

    /**
     * 在光标处插入 @ / 触发字符并唤起对应弹窗（+ 号菜单入口）：
     * 触发字符需位于行首或空白后，光标前是普通文字时自动补一个空格
     */
    const insertTriggerText = useCallback(
      (text: string) => {
        const container = editorRef.current;
        if (!container || disabled) {
          return;
        }
        // 先读 selection 再 focus()：focus 会把无有效光标的 contentEditable
        // 光标重置到容器开头，若先 focus 后读会把字符插到头部而非光标/末尾
        const selection = window.getSelection();
        let range: Range;
        if (
          selection &&
          selection.rangeCount > 0 &&
          container.contains(selection.anchorNode)
        ) {
          range = selection.getRangeAt(0).cloneRange();
          range.collapse(true);
        } else {
          range = document.createRange();
          range.selectNodeContents(container);
          range.collapse(false);
        }
        container.focus();
        const before =
          range.startContainer.textContent?.slice(0, range.startOffset) ?? '';
        const needSpace = before.length > 0 && !/\s$/.test(before);
        const node = document.createTextNode(`${needSpace ? ' ' : ''}${text}`);
        range.insertNode(node);
        const caret = document.createRange();
        caret.setStart(node, node.length);
        caret.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(caret);
        recordUndoSnapshot();
        syncEditorStateFromDom();
        // 刚插入节点上的 collapsed 光标，getBoundingClientRect 会返回全零矩形
        // （selection 未刷新），弹窗会被定位到视口左上角；延后一帧待矩形生效再检测
        requestAnimationFrame(() => runMentionDetection());
      },
      [
        disabled,
        recordUndoSnapshot,
        runMentionDetection,
        syncEditorStateFromDom,
      ],
    );

    /**
     * 编程唤起能力弹窗并定位到指定类型页签（工具栏已连接连接器头像组入口）。
     * 与 '/' 触发不同：无触发串可删、不经 commitEditorChange，直接重挂弹窗
     * 换初始页签后打开；类型不在开放范围时由弹窗自身回落首个可用类型
     */
    const openCapabilityWithType = useCallback(
      (resourceType: CapabilityTypeEnum) => {
        setCapabilityDefaultType(resourceType);
        setCapabilityResetKey((key) => key + 1);
        capabilityOpenRef.current = true;
        setCapabilityOpen(true);
      },
      [],
    );

    // 通过 useImperativeHandle 暴露方法
    useImperativeHandle(ref, () => ({
      clear,
      handleAtIconMentionSelect,
      insertTriggerText,
      focus: () => {
        editorRef.current?.focus();
      },
      openCapabilityWithType,
    }));

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
      lastEmittedValueRef.current = serializedText;
      onChange?.(serializedText);
      resetUndoStack(container.innerHTML);
    }, [
      createMentionChip,
      defaultMentions,
      enableMention,
      onChange,
      resetUndoStack,
    ]);

    // ==================== 能力弹窗（/ 触发）====================

    /**
     * 删除光标前的 "/" 触发串（打开能力弹窗前调用）。
     * 能力弹窗与编辑器文本解耦：触发串不留在编辑器，Esc/选中后无需二次清理，
     * 也避免关闭弹窗后继续输入被残留的 "/" 再次触发。
     * 定位逻辑与 handleMentionSelect 的触发串回溯保持一致。
     */
    const removeSlashTriggerText = useCallback(
      (searchText: string): boolean => {
        const editor = editorRef.current;
        const savedRange = savedRangeRef.current;
        if (
          !editor ||
          !savedRange ||
          !editor.contains(savedRange.startContainer)
        ) {
          return false;
        }
        const range = savedRange.cloneRange();
        let remaining = searchText.length + 1;
        const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
        const textNodes: Text[] = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
        let nodeIndex = textNodes.indexOf(range.startContainer as Text);
        let offset = range.startOffset;
        if (nodeIndex < 0) return false;
        while (nodeIndex >= 0) {
          const node = textNodes[nodeIndex];
          if (node.parentElement?.closest('[data-mention-id]')) return false;
          if (offset >= remaining) {
            range.setStart(node, offset - remaining);
            remaining = 0;
            break;
          }
          remaining -= offset;
          nodeIndex -= 1;
          offset = textNodes[nodeIndex]?.length ?? 0;
        }
        if (remaining || range.toString() !== `/${searchText}`) return false;
        range.deleteContents();
        range.collapse(true);
        // 重存删除点光标：弹窗内选中技能时 chip 插回该位置
        savedRangeRef.current = range.cloneRange();
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        return true;
      },
      [],
    );

    /** 在保存的光标位置（失效则编辑器末尾）插入技能 chip */
    const insertMentionChipAtCaret = useCallback(
      (item: MentionItem) => {
        const container = editorRef.current;
        if (!container) return;
        const chip = createMentionChip(item);
        const spacer = document.createTextNode(' ');
        const savedRange = savedRangeRef.current;
        if (savedRange && container.contains(savedRange.startContainer)) {
          const range = savedRange.cloneRange();
          range.collapse(true);
          range.insertNode(chip);
          chip.after(spacer);
        } else {
          container.appendChild(chip);
          container.appendChild(spacer);
        }
        const selection = window.getSelection();
        if (selection) {
          const range = document.createRange();
          range.setStart(spacer, spacer.length);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }
        container.focus();
        onMentionSelect?.(item);
        notifyUnsubscribedSkillSelect(item);
        commitEditorChange({ pendingMention: item });
      },
      [
        commitEditorChange,
        createMentionChip,
        notifyUnsubscribedSkillSelect,
        onMentionSelect,
      ],
    );

    /** 打开能力弹窗：记录光标 → 删除触发串 → 同步编辑器状态 → 打开 */
    const openCapabilityModal = useCallback(
      (searchText: string) => {
        const editor = editorRef.current;
        if (!editor) return;
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          savedRangeRef.current = selection.getRangeAt(0).cloneRange();
          savedTextNodeRef.current = selection.getRangeAt(0).startContainer;
        }
        setActiveTrigger('/');
        setMentionSearchText('');
        if (removeSlashTriggerText(searchText)) {
          recordUndoSnapshot();
          syncEditorStateFromDom();
        }
        capabilityOpenRef.current = true;
        setCapabilityOpen(true);
      },
      [removeSlashTriggerText, recordUndoSnapshot, syncEditorStateFromDom],
    );
    openCapabilityModalRef.current = openCapabilityModal;

    /** 能力弹窗选中分流：技能/专家/资料库 → 光标处插 chip（随消息发送）；
     * 连接器 → selectedComponents 通道（底部组件栏） */
    const handleCapabilitySelect = useCallback(
      (item: CapabilityItem) => {
        if (item.resourceType === 'skill') {
          insertMentionChipAtCaret({
            kind: 'skill',
            targetId: item.targetId ?? Number(item.rawId),
            name: item.name,
            icon: item.icon,
            description: item.description,
            paymentRequired: item.paymentRequired,
            subscribed: item.subscribed,
          });
          return;
        }
        // 专家：不进输入框（无 chip），单选通知父组件（工具栏 pill 回填，
        // 随消息合并进 selectedComponents；再选其他专家由父组件整体替换）
        if (item.resourceType === 'expert') {
          onExpertSelect?.({
            targetId: item.targetId ?? Number(item.rawId),
            name: item.name,
            icon: item.icon,
            description: item.description,
          });
          return;
        }
        // 资料库=空间文档仓库：chip 化（数据经 onDocsChange 派生为 selectedDocs）
        if (item.resourceType === 'knowledge') {
          insertMentionChipAtCaret({
            kind: 'doc',
            slugId: String(item.slugId ?? ''),
            name: item.name,
            pageType: item.pageType,
          });
          return;
        }
        onPluginSelect?.({
          kind: 'plugin',
          targetId: item.targetId ?? Number(item.rawId),
          componentType: AgentComponentTypeEnum.MCP,
          name: item.name,
          icon: item.icon,
          description: item.description,
        });
      },
      [insertMentionChipAtCaret, onPluginSelect, onExpertSelect],
    );

    /** 能力弹窗关闭：复位状态并把焦点/光标交还编辑器；通知消费方刷新派生数据 */
    const handleCapabilityClose = useCallback(() => {
      capabilityOpenRef.current = false;
      setCapabilityOpen(false);
      const container = editorRef.current;
      const savedRange = savedRangeRef.current;
      if (
        container &&
        savedRange &&
        container.contains(savedRange.startContainer)
      ) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(savedRange.cloneRange());
      }
      container?.focus();
      onCapabilityModalClose?.();
    }, [onCapabilityModalClose]);

    // ==================== 核心事件处理 ====================

    /**
     * 处理从弹窗中选择提及项
     * 将选中的提及插入到编辑器中，替换 @ 和搜索文本
     *
     * @param item - 选中的提及项
     */
    const handleMentionSelect = useCallback(
      (item: MentionItem) => {
        const editor = editorRef.current;
        const savedRange = savedRangeRef.current;
        if (
          !editor ||
          !savedRange ||
          !editor.contains(savedRange.startContainer)
        )
          return;
        // 从保存的光标向前定位触发串，支持浏览器把文本拆成多个节点。
        const range = savedRange.cloneRange();
        let remaining = mentionSearchText.length + 1;
        const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
        const textNodes: Text[] = [];
        while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
        let nodeIndex = textNodes.indexOf(range.startContainer as Text);
        let offset = range.startOffset;
        if (nodeIndex < 0) return;
        while (nodeIndex >= 0) {
          const node = textNodes[nodeIndex];
          if (node.parentElement?.closest('[data-mention-id]')) return;
          if (offset >= remaining) {
            range.setStart(node, offset - remaining);
            remaining = 0;
            break;
          }
          remaining -= offset;
          nodeIndex -= 1;
          offset = textNodes[nodeIndex]?.length ?? 0;
        }
        if (remaining || range.toString() !== activeTrigger + mentionSearchText)
          return;
        range.deleteContents();
        const fragment = document.createDocumentFragment();
        fragment.appendChild(createMentionChip(item));
        const spacer = document.createTextNode(' ');
        fragment.appendChild(spacer);
        range.insertNode(fragment);
        range.setStart(spacer, spacer.length);
        range.collapse(true);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        editor.focus();
        closeMentionPopup();
        onMentionSelect?.(item);
        notifyUnsubscribedSkillSelect(item);
        commitEditorChange({ pendingMention: item });
      },
      [
        activeTrigger,
        mentionSearchText,
        closeMentionPopup,
        commitEditorChange,
        onMentionSelect,
        createMentionChip,
        notifyUnsubscribedSkillSelect,
      ],
    );

    /**
     * 处理输入事件：每次 DOM 变更后入撤销栈并同步受控 value
     */
    const handleInput = useCallback(() => {
      if (
        !editorRef.current ||
        isComposingRef.current ||
        isHistoryActionRef.current
      ) {
        return;
      }
      commitEditorChange();
    }, [commitEditorChange]);

    /**
     * 处理键盘按下事件
     * - 弹窗显示时：处理上下左右箭头、回车、ESC
     * - 弹窗隐藏时：处理回车发送
     */
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        // 中文输入时跳过
        if (isComposingRef.current) return;

        // 撤销/重做：使用组件内快照栈，覆盖输入与粘贴
        if (e.ctrlKey || e.metaKey) {
          const key = e.key.toLowerCase();
          const isUndo = key === 'z' && !e.shiftKey;
          const isRedo =
            (key === 'z' && e.shiftKey) ||
            (key === 'y' && e.ctrlKey && !e.metaKey);

          if (isUndo || isRedo) {
            e.preventDefault();
            e.stopPropagation();
            if (isUndo) {
              undoEditorHistory();
            } else {
              redoEditorHistory();
            }
            return;
          }
        }

        // 弹窗显示时的键盘处理（仅在启用 @ 功能时生效）
        if (showMentionPopup) {
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
        undoEditorHistory,
        redoEditorHistory,
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
     * - 如果剪贴板中包含文件：交给外部 onPaste（用于上传附件），不处理文本
     * - 如果只有文本/DOM：阻止默认粘贴行为，只按纯文本插入，去掉所有原始 DOM 属性/样式
     */
    const handlePasteEvent = useCallback(
      (e: React.ClipboardEvent<HTMLDivElement>) => {
        const clipboardData = e.clipboardData;

        // 1. 先检查是否包含文件，如果有文件则交给外部 onPaste 处理上传
        if (clipboardData?.items) {
          let hasFile = false;
          for (let i = 0; i < clipboardData.items.length; i += 1) {
            if (clipboardData.items[i].kind === 'file') {
              hasFile = true;
              break;
            }
          }

          if (hasFile) {
            onPaste(e);
            // 不要在这里 preventDefault，让外层 onPaste 自行决定是否阻止默认行为
            return;
          }
        }

        // 2. 没有文件时，按纯文本方式粘贴，去掉所有样式/属性
        e.preventDefault();

        const text = clipboardData?.getData('text/plain') ?? '';
        if (!text) return;

        if (!editorRef.current) return;

        editorRef.current.focus();
        const inserted = document.execCommand('insertText', false, text);
        if (!inserted) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(document.createTextNode(text));
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            editorRef.current.appendChild(document.createTextNode(text));
          }
          commitEditorChange();
        }
      },
      [commitEditorChange, onPaste],
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
    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        if (!editorRef.current || disabled) return;
        const target = event.target as HTMLElement;
        const chip = target.closest('[data-mention-id]') as HTMLElement | null;
        if (target.closest('[data-mention-delete]') && chip) {
          event.preventDefault();
          removeMentionChipNode(chip);
          closeMentionPopup();
          return;
        }
        runMentionDetection();
      },
      [disabled, removeMentionChipNode, closeMentionPopup, runMentionDetection],
    );

    useEffect(() => {
      closeMentionPopup();
    }, [onFetchMentionFiles, enableMention, disabled, closeMentionPopup]);

    // ==================== Effects ====================

    /**
     * 同步外部 value 到编辑器
     * 当外部 value 改变且编辑器未聚焦时，更新编辑器内容
     */
    useEffect(() => {
      if (value === undefined || !editorRef.current) return;
      if (document.activeElement?.isSameNode(editorRef.current)) return;

      const currentText = getSerializedEditorText(editorRef.current);
      if (currentText !== value) {
        editorRef.current.textContent = value;
        resetUndoStack(editorRef.current.innerHTML);
        syncMentionsFromDom();
      }
      setIsEditorEmpty(!(value || '').trim());
      lastEmittedValueRef.current = value;
    }, [resetUndoStack, syncMentionsFromDom, value]);

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
      if (!autoFocus) {
        return;
      }

      const frameId = window.requestAnimationFrame(() => {
        editorRef.current?.focus();
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }, [autoFocus]);

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
          onBlur={handleBlur}
          // 点击事件
          onClick={handleClick}
          // 输入法组合开始事件
          onCompositionStart={handleCompositionStart}
          /** 输入法组合结束事件 */
          onCompositionEnd={handleCompositionEnd}
          style={
            {
              minHeight: `${minHeight}px`,
              maxHeight: `${maxHeight}px`,
              '--mention-inline-prefix-offset': `${inlinePrefixWidth}px`,
            } as React.CSSProperties
          }
          data-placeholder={placeholderText}
          suppressContentEditableWarning
        />

        {/* @提及文件选择弹窗（/ 触发走下方能力大弹窗） */}
        <div className={styles['mention-popup-wrapper']}>
          {activeTrigger === '@' && (
            <MentionPopup
              onFetchMentionFiles={onFetchMentionFiles}
              ref={mentionPopupRef}
              visible={showMentionPopup}
              position={mentionPosition}
              onSelect={handleMentionSelect}
              enableSubscription={enableSubscription}
              onClose={closeMentionPopup}
              searchText={mentionSearchText}
              maxHeight={mentionPopupMaxHeight}
              onHeightChange={handlePopupHeightChange}
              usageScenarios={usageScenarios}
            />
          )}
        </div>

        {/* 添加能力大弹窗（portal 渲染，与光标浮层互斥）；
            resetKey 强制重挂以应用编程唤起指定的初始页签（'/' 触发沿用上次页签） */}
        <CapabilityModal
          key={capabilityResetKey}
          open={capabilityOpen}
          onClose={handleCapabilityClose}
          onSelect={handleCapabilitySelect}
          resourceTypes={capabilityResourceTypes}
          defaultResourceType={capabilityDefaultType}
        />
      </div>
    );
  },
);

export default MentionEditor;
