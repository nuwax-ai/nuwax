import SvgIcon from '@/components/base/SvgIcon';
import ChatUploadFile from '@/components/ChatUploadFile';
import ConditionRender from '@/components/ConditionRender';
import SelectList from '@/components/custom/SelectList';
import useClickOutside from '@/components/SmartVariableInput/hooks/useClickOutside';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  MAX_IMAGE_COUNT,
  UPLOAD_FILE_ACTION,
} from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { UploadFileStatus } from '@/types/enums/common';
import type { FileNode } from '@/types/interfaces/appDev';
import { ModelConfig } from '@/types/interfaces/appDev';
import type { UploadFileInfo } from '@/types/interfaces/common';
import { DataResource } from '@/types/interfaces/dataResource';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { handleUploadFileList } from '@/utils/upload';
import { DownOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, message, Popover, Tooltip, Upload } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useMentionSelectorKeyboard } from '../../hooks/useMentionSelectorKeyboard';
import { usePlaceholderCarousel } from '../../hooks/usePlaceholderCarousel';
import MentionSelector from '../MentionSelector';
import type {
  MentionPosition,
  MentionSelectorHandle,
  MentionTriggerResult,
} from '../MentionSelector/types';
import { calculateMentionPosition } from '../MentionSelector/utils';
import styles from './index.less';
import { getFileName, getPlainText, renderMentionHTML } from './utils';

const cx = classNames.bind(styles);

// 聊天输入框组件
// @ 提及的项类型
export type MentionItem =
  | { type: 'file'; data: FileNode }
  | { type: 'folder'; data: FileNode }
  | { type: 'datasource'; data: DataResource };

export interface ChatInputProps {
  // 聊天信息
  chat: any;
  // 大模型选择器
  modelSelector: any;
  // 文件内容状态
  // fileContentState: any;
  // 设置选中的文件
  // onSetSelectedFile: (fileId: string) => void;
  // 是否正在停止任务
  isStoppingTask: boolean;
  // 是否正在发送消息
  isSendingMessage: boolean;
  // 取消任务
  handleCancelAgentTask: () => void;
  className?: React.CSSProperties;
  // 发送消息回调 - 传递上传的附件、原型图片 和 @ 提及的文件/目录/数据资源
  onEnter: (
    attachmentFiles?: UploadFileInfo[],
    prototypeImages?: UploadFileInfo[],
    selectedMentions?: MentionItem[],
    requestId?: string,
  ) => void;
  // 数据源列表
  dataSourceList?: DataResource[];
  onToggleSelectDataSource?: (dataSource: DataResource) => void;
  // 文件树数据
  files?: FileNode[];
}

/**
 * 手机端聊天输入组件
 */
const ChatInputHome: React.FC<ChatInputProps> = ({
  chat,
  modelSelector,
  // fileContentState,
  // onSetSelectedFile,
  isStoppingTask,
  isSendingMessage,
  handleCancelAgentTask,
  className,
  onEnter,
  dataSourceList,
  onToggleSelectDataSource,
  files = [],
}) => {
  // 附件文件列表
  const [attachmentFiles, setAttachmentFiles] = useState<UploadFileInfo[]>([]);
  // 原型图片附件列表
  const [attachmentPrototypeImages, setAttachmentPrototypeImages] = useState<
    UploadFileInfo[]
  >([]);
  const [open, setOpen] = useState(false);
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
  // contentEditable div ref，用于处理输入和粘贴事件
  const editorRef = useRef<HTMLDivElement>(null);
  // 是否正在更新内容（防止循环更新）
  const isUpdatingContentRef = useRef(false);
  // 上一次的 chat.chatInput 值（用于检测外部变化）
  const prevChatInputRef = useRef<string>('');

  // @ 提及相关状态
  const [mentionTrigger, setMentionTrigger] = useState<MentionTriggerResult>({
    trigger: false,
  });
  const [mentionPosition, setMentionPosition] = useState<MentionPosition>({
    left: 0,
    top: 0,
    visible: false,
  });
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const mentionContainerRef = useRef<HTMLDivElement>(null);
  const mentionSelectorRef = useRef<MentionSelectorHandle>(null);

  // 已选择的提及项（文件、目录和数据源）
  // 使用导出的 MentionItem 类型，确保包含所有类型（file、folder、datasource）
  const [selectedMentions, setSelectedMentions] = useState<MentionItem[]>([]);

  // 占位符消息轮播
  const placeholderMessages = [
    '一句话做网站、应用、提效工具等，可选择工作流、插件等数据资源拓展多种能力',
    '可以通过 @ 提及文件、目录、数据资源，以增强提示词的准确性',
  ];

  // 使用占位符轮播 Hook
  const { isPlaceholderVisible, currentPlaceholder } = usePlaceholderCarousel(
    chat.chatInput,
    placeholderMessages,
    10000,
    300,
  );

  // 同步 dataSourceList 中已选的数据源到 selectedMentions
  useEffect(() => {
    if (!dataSourceList) return;

    const selectedDataSources = dataSourceList.filter((ds) => ds.isSelected);
    setSelectedMentions((prev) => {
      // 保留非数据源类型的提及项（文件等）
      const nonDataSourceMentions = prev.filter(
        (mention) => mention.type !== 'datasource',
      );

      // 处理数据源类型的提及项
      const dataSourceMentions = prev.filter(
        (mention) => mention.type === 'datasource',
      );

      // 获取当前数据源 ID 集合
      const selectedDataSourceIds = new Set(
        selectedDataSources.map((ds) => ds.id),
      );

      // 保留在 dataSourceList 中已选的数据源，以及通过 @ 选择但不在 dataSourceList 中的数据源
      const keptDataSources = dataSourceMentions.filter((mention) => {
        const dsId = mention.data.id;
        // 如果数据源在 dataSourceList 中，只有 isSelected=true 时才保留
        const inList = dataSourceList.some((ds) => ds.id === dsId);
        if (inList) {
          return selectedDataSourceIds.has(dsId);
        }
        // 如果数据源不在 dataSourceList 中（通过 @ 选择的），保留它
        return true;
      });

      // 添加新的已选数据源（在 dataSourceList 中但不在当前 selectedMentions 中）
      const newDataSources = selectedDataSources
        .filter(
          (ds) => !keptDataSources.some((mention) => mention.data.id === ds.id),
        )
        .map((ds) => ({ type: 'datasource' as const, data: ds }));

      return [...nonDataSourceMentions, ...keptDataSources, ...newDataSources];
    });
  }, [dataSourceList]);

  // 使用工具函数中的 getFileName

  /**
   * 检测 @ 字符触发（参考 react-mentions-ts 的 trigger 检测）
   * 使用 window.getSelection() 获取当前光标位置和文本内容
   */
  const checkMentionTrigger = useCallback((): MentionTriggerResult => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return { trigger: false };
    }

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    const textBeforeCursor =
      textNode.textContent?.slice(0, range.startOffset) || '';

    // 参考 react-mentions-ts: 使用 RegExp，包含两个捕获组
    // 第一个捕获组：触发字符（@）
    // 第二个捕获组：查询文本（支持中文、英文、数字、下划线等）
    // \w 匹配 ASCII 字符（字母、数字、下划线）
    // \u4e00-\u9fa5 匹配中文字符（常用汉字范围，覆盖大部分中文）
    // \u3400-\u4dbf 匹配扩展汉字A区
    // \uf900-\ufaff 匹配兼容汉字
    // 使用 u 标志支持 Unicode 属性类，匹配所有 Unicode 字母（包括中文、日文、韩文等）
    const TRIGGER_REGEX =
      /(@)([\w\u4e00-\u9fa5\u3400-\u4dbf\uf900-\ufaff\p{L}]*)$/u;
    const match = textBeforeCursor.match(TRIGGER_REGEX);
    if (match) {
      return {
        trigger: true,
        triggerChar: match[1], // '@'
        searchText: match[2] || '', // 查询文本（支持中文）
        startIndex: match.index || 0, // @ 字符位置
      };
    }
    return { trigger: false };
  }, []);

  /**
   * 插入提及文本（适配 contentEditable）
   */
  const insertMention = useCallback(
    (mentionText: string, appendSpace = true) => {
      if (!editorRef.current) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      // 优先使用 chat.chatInput，因为它包含完整的 @路径信息
      // 如果 chat.chatInput 不可用，则从 HTML 提取纯文本
      const currentPlainText =
        chat.chatInput || getPlainText(editorRef.current.innerHTML);
      const range = selection.getRangeAt(0);

      // 计算光标在 HTML 纯文本中的位置（用于查找 @ 符号）
      const htmlPlainText = getPlainText(editorRef.current.innerHTML);
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null,
      );
      let node;
      let offset = 0;
      let cursorOffsetInHtml = 0;
      let found = false;

      while ((node = walker.nextNode())) {
        if (node === range.startContainer) {
          cursorOffsetInHtml = offset + range.startOffset;
          found = true;
          break;
        }
        offset += node.textContent?.length || 0;
      }

      if (!found) {
        cursorOffsetInHtml = htmlPlainText.length;
      }

      // 在 HTML 纯文本中查找光标位置最近的 @ 符号
      const textBeforeCursorInHtml = htmlPlainText.slice(0, cursorOffsetInHtml);
      const atIndexInHtml = textBeforeCursorInHtml.lastIndexOf('@');
      if (atIndexInHtml === -1) return;

      // 在 currentPlainText 中查找对应的 @ 符号位置
      // 策略：用户刚刚输入了新的 @，所以应该是在 currentPlainText 的最后一个 @ 符号
      // 但是，我们需要确保这是用户刚刚输入的那个 @，而不是之前的 @
      // 简化处理：查找 currentPlainText 中最后一个 @ 符号，如果它对应的位置与 htmlPlainText 中的 @ 符号位置匹配，就使用它
      // 更简单的方法：直接使用 currentPlainText 中最后一个 @ 符号，因为用户刚刚输入了新的 @
      const lastAtIndex = currentPlainText.lastIndexOf('@');
      if (lastAtIndex === -1) return;

      // 获取 @ 符号之前的文本（保留之前的完整 @路径）
      const beforeText = currentPlainText.slice(0, lastAtIndex);

      // 获取光标位置之后的文本
      // 注意：光标位置在 HTML 纯文本中，我们需要在 currentPlainText 中找到对应的位置
      // 简化处理：使用 HTML 纯文本中光标位置之后的文本，在 currentPlainText 中查找
      const textAfterCursorInHtml = htmlPlainText.slice(cursorOffsetInHtml);
      let textAfterCursor = '';

      if (textAfterCursorInHtml === '') {
        // 光标在文本末尾
        textAfterCursor = '';
      } else {
        // 在 currentPlainText 中查找 textAfterCursorInHtml 对应的位置
        // 注意：textAfterCursorInHtml 可能包含显示名称，而 currentPlainText 包含完整 @路径
        // 所以我们需要在 currentPlainText 的 @ 符号之后查找
        const afterAtInCurrent = currentPlainText.slice(lastAtIndex + 1);
        // 如果 afterAtInCurrent 包含 textAfterCursorInHtml，说明结构一致
        if (afterAtInCurrent.includes(textAfterCursorInHtml)) {
          const indexInAfterAt = afterAtInCurrent.indexOf(
            textAfterCursorInHtml,
          );
          textAfterCursor = afterAtInCurrent.slice(indexInAfterAt);
        } else {
          // 如果找不到，说明结构不一致，使用空字符串
          textAfterCursor = '';
        }
      }

      const space = appendSpace ? ' ' : '';
      const newPlainText =
        beforeText + `@${mentionText}${space}` + textAfterCursor;

      // 更新纯文本值
      chat.setChatInput(newPlainText);

      // 关闭下拉菜单
      setMentionTrigger({ trigger: false });
      setMentionPosition({ left: 0, top: 0, visible: false });
      setMentionSelectedIndex(0);
    },
    [chat],
  );

  /**
   * 处理文件选择
   */
  const handleSelectFile = useCallback(
    (file: FileNode) => {
      // 检查是否已经选择过该文件
      const isDuplicate = selectedMentions.some(
        (mention) => mention.type === 'file' && mention.data.id === file.id,
      );
      if (!isDuplicate) {
        // 添加到已选择列表
        setSelectedMentions((prev) => [...prev, { type: 'file', data: file }]);
      }
      // 在输入框中插入提及文本
      insertMention(file.path);
    },
    [insertMention, selectedMentions],
  );

  /**
   * 处理数据源选择
   */
  const handleSelectDataSource = useCallback(
    (dataSource: DataResource) => {
      // 检查是否已经选择过该数据源
      const isDuplicate = selectedMentions.some(
        (mention) =>
          mention.type === 'datasource' && mention.data.id === dataSource.id,
      );
      if (!isDuplicate) {
        // 添加到已选择列表
        setSelectedMentions((prev) => [
          ...prev,
          { type: 'datasource', data: dataSource },
        ]);
      }
      // 在输入框中插入提及文本
      insertMention(dataSource.name);
    },
    [insertMention, selectedMentions],
  );

  /**
   * 处理输入变化，检测 @ 字符和提及删除（适配 contentEditable）
   */
  const handleInputChange = useCallback(() => {
    if (!editorRef.current || isUpdatingContentRef.current) return;

    // 从 contentEditable 中提取纯文本
    // 注意：这里提取的纯文本可能不包含完整的 @路径（因为 HTML 中已经渲染为缩短名称）
    // 所以我们需要从 chat.chatInput 中获取完整的文本
    const plainText = getPlainText(editorRef.current.innerHTML);

    // 保存之前的 chat.chatInput，用于检查已删除的提及项
    // 因为 chat.chatInput 包含完整的 @路径，而 plainText 不包含
    const previousText = chat.chatInput || '';

    // 检测已删除的提及项
    // 注意：使用 previousText 而不是 plainText，因为 previousText 包含完整的 @路径
    // 而 plainText 是从 HTML 中提取的，可能不包含完整的 @路径
    const mentionsToRemove: number[] = [];
    selectedMentions.forEach((mention, index) => {
      const mentionText =
        mention.type === 'file' || mention.type === 'folder'
          ? `@${mention.data.path}`
          : `@${mention.data.name}`;
      // 如果之前的文本中包含该提及，但新的纯文本中不包含，标记为删除
      // 注意：这里需要检查完整的 @路径，而不是缩短的显示名称
      // 但是，由于 plainText 不包含完整的 @路径，我们需要通过其他方式检查
      // 实际上，如果用户删除了提及项，plainText 中应该不包含对应的显示名称
      // 所以我们可以通过检查显示名称来判断
      const displayName =
        mention.type === 'file' || mention.type === 'folder'
          ? getFileName(mention.data.path)
          : mention.data.name;

      // 检查之前的文本中是否包含完整的 @路径
      const hadMention = previousText.includes(mentionText);
      // 检查新的纯文本中是否包含显示名称（因为 HTML 中已经渲染为缩短名称）
      const hasDisplayName = plainText.includes(displayName);

      // 如果之前的文本中包含该提及，但新的纯文本中不包含显示名称，标记为删除
      if (hadMention && !hasDisplayName) {
        mentionsToRemove.push(index);
      }
    });

    // 只有当纯文本发生变化时才更新 chat.chatInput
    // 避免循环更新
    if (plainText !== chat.chatInput) {
      // 我们需要保持 chat.chatInput 包含完整的 @路径
      // 所以我们需要从 previousText 中提取完整的 @路径，然后替换为新的纯文本
      // 策略：尝试从 previousText 中恢复完整的 @路径信息
      let newChatInput = plainText;

      // 如果 previousText 包含完整的 @路径，尝试恢复它们
      if (previousText) {
        // 遍历所有已选择的提及项，尝试在 previousText 中找到完整的 @路径
        selectedMentions.forEach((mention) => {
          const mentionText =
            mention.type === 'file' || mention.type === 'folder'
              ? `@${mention.data.path}`
              : `@${mention.data.name}`;
          const displayName =
            mention.type === 'file' || mention.type === 'folder'
              ? getFileName(mention.data.path)
              : mention.data.name;

          // 如果 previousText 包含完整的 @路径，且 plainText 包含显示名称
          // 尝试在 newChatInput 中将显示名称替换为完整的 @路径
          if (
            previousText.includes(mentionText) &&
            plainText.includes(displayName)
          ) {
            // 使用正则表达式替换显示名称为完整的 @路径
            // 注意：只替换前面有 @ 或空格或行首的显示名称
            const displayNameRegex = new RegExp(
              `(?:^|\\s|@)${displayName.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&',
              )}(?:\\s|$|[^\\w/.-])`,
              'g',
            );
            newChatInput = newChatInput.replace(displayNameRegex, (match) => {
              // 如果匹配的文本以 @ 开头，替换为完整的 @路径
              if (match.startsWith('@')) {
                return `${mentionText} `;
              } else if (match.startsWith(' ')) {
                // 如果匹配的文本以空格开头，替换为 空格+完整@路径
                return ` ${mentionText} `;
              } else {
                // 如果匹配的文本在行首，替换为完整的 @路径
                return `${mentionText} `;
              }
            });
          }
        });
      }

      chat.setChatInput(newChatInput);
      // 更新 prevChatInputRef，避免触发 updateEditorContent
      prevChatInputRef.current = newChatInput;
    }

    // 移除已删除的提及项
    if (mentionsToRemove.length > 0) {
      setSelectedMentions((prev) =>
        prev.filter((_, index) => !mentionsToRemove.includes(index)),
      );
    }

    // 检测 @ 触发
    const triggerResult = checkMentionTrigger();
    setMentionTrigger(triggerResult);

    if (triggerResult.trigger) {
      // 延迟计算位置，确保 DOM 已更新
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const position = calculateMentionPosition(editorRef);
          setMentionPosition(position);
          setMentionSelectedIndex(0);
        });
      });
    } else {
      setMentionPosition({ left: 0, top: 0, visible: false });
    }
  }, [chat, checkMentionTrigger, selectedMentions]);

  /**
   * 滚动到选中的项（参考 Ant Design Mentions 的自动滚动）
   */
  const scrollToSelectedItem = useCallback(() => {
    const mentionSelector = mentionContainerRef.current;
    if (!mentionSelector) return;

    const selectedElement = mentionSelector.querySelector(
      '[class*="mention-item"][class*="selected"]',
    ) as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, []);

  /**
   * 更新 contentEditable 的内容（将纯文本转换为带 HTML 的渲染内容）
   * 注意：只在 selectedMentions 变化或 chat.chatInput 从外部变化时调用
   */
  const updateEditorContent = useCallback(() => {
    if (!editorRef.current || isUpdatingContentRef.current) return;

    const plainText = chat.chatInput || '';
    const html = renderMentionHTML(plainText, selectedMentions);

    // 调试日志：查看生成的 HTML
    console.log('[updateEditorContent] Plain text:', plainText);
    console.log('[updateEditorContent] Generated HTML:', html);
    console.log('[updateEditorContent] Selected mentions:', selectedMentions);

    // 保存当前光标位置（基于文本偏移量）
    const selection = window.getSelection();
    let savedOffset = 0;
    let isFocused = false;

    if (selection && selection.rangeCount > 0 && editorRef.current) {
      // 检查编辑器是否获得焦点
      isFocused = document.activeElement === editorRef.current;

      if (isFocused) {
        const range = selection.getRangeAt(0);
        // 检查 range 是否在 editorRef.current 内
        if (editorRef.current.contains(range.startContainer)) {
          // 计算光标在纯文本中的偏移量（遍历所有文本节点）
          const walker = document.createTreeWalker(
            editorRef.current,
            NodeFilter.SHOW_TEXT,
            null,
          );
          let node;
          let offset = 0;
          let found = false;
          while ((node = walker.nextNode())) {
            if (node === range.startContainer) {
              offset += range.startOffset;
              found = true;
              break;
            }
            offset += node.textContent?.length || 0;
          }
          if (found) {
            savedOffset = offset;
          } else {
            // 如果找不到，将偏移量设为文本末尾
            savedOffset = plainText.length;
          }
        } else {
          // 如果光标不在编辑器内，将偏移量设为文本末尾
          savedOffset = plainText.length;
        }
      } else {
        // 如果编辑器未获得焦点，将偏移量设为文本末尾
        savedOffset = plainText.length;
      }
    } else {
      // 如果没有选择，将偏移量设为文本末尾
      savedOffset = plainText.length;
    }

    // 更新内容
    isUpdatingContentRef.current = true;
    editorRef.current.innerHTML = html;

    // 恢复光标位置（基于文本偏移量）
    if (selection && editorRef.current) {
      // 使用 setTimeout 确保 DOM 已更新
      setTimeout(() => {
        try {
          if (!editorRef.current) return;

          // 根据文本偏移量重新定位光标
          const walker = document.createTreeWalker(
            editorRef.current,
            NodeFilter.SHOW_TEXT,
            null,
          );
          let node;
          let offset = 0;
          let targetNode: Node | null = null;
          let targetOffset = 0;

          while ((node = walker.nextNode())) {
            const nodeLength = node.textContent?.length || 0;
            if (offset + nodeLength >= savedOffset) {
              targetNode = node;
              targetOffset = savedOffset - offset;
              break;
            }
            offset += nodeLength;
          }

          if (targetNode && targetNode.textContent) {
            const range = document.createRange();
            const maxOffset = targetNode.textContent.length;
            const finalOffset = Math.min(Math.max(0, targetOffset), maxOffset);
            range.setStart(targetNode, finalOffset);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            // 如果编辑器之前有焦点，确保恢复焦点
            if (isFocused) {
              editorRef.current.focus();
            }
          } else {
            // 如果找不到目标节点，将光标移到末尾
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
            if (isFocused) {
              editorRef.current.focus();
            }
          }
        } catch (e) {
          // 如果恢复失败，将光标移到末尾
          if (editorRef.current) {
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
            if (isFocused) {
              editorRef.current.focus();
            }
          }
        }
      }, 0);
    }

    isUpdatingContentRef.current = false;
  }, [chat.chatInput, selectedMentions]);

  /**
   * 监听 selectedMentions 变化，更新 contentEditable 内容
   * 注意：只在 selectedMentions 变化时更新，避免用户输入时频繁更新
   */
  useEffect(() => {
    // 延迟更新，确保 DOM 已更新
    const timer = setTimeout(() => {
      updateEditorContent();
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedMentions, updateEditorContent]);

  /**
   * 监听 chat.chatInput 从外部变化（非用户输入），更新 contentEditable 内容
   */
  useEffect(() => {
    // 只有当 chat.chatInput 从外部变化时才更新（比如清空输入框）
    if (
      prevChatInputRef.current !== chat.chatInput &&
      !isUpdatingContentRef.current
    ) {
      const timer = setTimeout(() => {
        updateEditorContent();
        prevChatInputRef.current = chat.chatInput || '';
      }, 0);
      return () => clearTimeout(timer);
    }
    prevChatInputRef.current = chat.chatInput || '';
  }, [chat.chatInput, updateEditorContent]);

  /**
   * 关闭 mentionSelector 弹层
   */
  const handleCloseMenu = useCallback(() => {
    setMentionTrigger({ trigger: false });
    setMentionPosition({ left: 0, top: 0, visible: false });
    setMentionSelectedIndex(0);
  }, []);

  /**
   * 处理删除提及项
   */
  const handleDeleteMention = useCallback(
    (mentionToRemove: MentionItem) => {
      // 如果是数据源，调用 onToggleSelectDataSource 取消选择
      if (mentionToRemove.type === 'datasource' && onToggleSelectDataSource) {
        onToggleSelectDataSource(mentionToRemove.data as DataResource);
      }

      // 从 selectedMentions 中移除
      setSelectedMentions((prev) =>
        prev.filter(
          (mention) =>
            !(
              mention.type === mentionToRemove.type &&
              mention.data.id === mentionToRemove.data.id
            ),
        ),
      );

      // 从输入框中删除对应的 @ 提及文本
      const plainText = chat.chatInput || '';
      const mentionTextToRemove =
        mentionToRemove.type === 'file' || mentionToRemove.type === 'folder'
          ? `@${mentionToRemove.data.path}`
          : `@${mentionToRemove.data.name}`;

      // 替换所有匹配的提及文本（可能有多个）
      const newText = plainText.replace(
        new RegExp(
          mentionTextToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
          'g',
        ),
        '',
      );

      // 更新输入框内容
      chat.setChatInput(newText.trim());
    },
    [chat, onToggleSelectDataSource],
  );

  /**
   * MentionSelector 键盘导航 Hook
   */
  const { handleKeyDown: mentionHandleKeyDown } = useMentionSelectorKeyboard({
    mentionTrigger,
    mentionPosition,
    mentionSelectorRef,
    onSelectedIndexChange: setMentionSelectedIndex,
    onCloseMenu: handleCloseMenu,
    scrollToSelectedItem,
  });

  /**
   * 处理 contentEditable 内的点击事件（用于删除提及项）
   */
  const handleEditorClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      // 检查是否点击了删除按钮
      if (target.classList.contains('mention-delete-btn')) {
        e.preventDefault();
        e.stopPropagation();

        // 找到对应的提及项
        const mentionSpan = target.closest('.mention-highlight') as HTMLElement;
        if (!mentionSpan) return;

        const mentionType = mentionSpan.getAttribute('data-mention-type');
        const mentionId = mentionSpan.getAttribute('data-mention-id');

        if (!mentionType || !mentionId) return;

        // 查找对应的提及项
        const mentionToRemove = selectedMentions.find((mention) => {
          const id =
            mention.type === 'file' || mention.type === 'folder'
              ? mention.data.id
              : mention.data.id;
          const type =
            mention.type === 'file'
              ? 'file'
              : mention.type === 'folder'
              ? 'directory'
              : 'datasource';
          return type === mentionType && String(id) === mentionId;
        });

        if (mentionToRemove) {
          handleDeleteMention(mentionToRemove);
        }
      }
    },
    [selectedMentions, handleDeleteMention],
  );

  // 点击发送事件
  const handleSendMessage = useCallback(
    (requestId?: string) => {
      //如果是输出过程中 或者 中止会话过程中 不能触发enter事件
      if (chat.isChatLoading || isSendingMessage || isStoppingTask) {
        console.warn('正在处理中，不能发送消息');
        return;
      }

      if (chat.chatInput?.trim()) {
        const files = attachmentFiles?.filter(
          (item) =>
            item.status === UploadFileStatus.done && item.url && item.key,
        );
        const prototypeImages = attachmentPrototypeImages?.filter(
          (item) =>
            item.status === UploadFileStatus.done && item.url && item.key,
        );
        // enter事件 - 传递上传的附件、原型图片 和 @ 提及的文件/目录/数据资源
        onEnter(files, prototypeImages, selectedMentions, requestId);
        // 清空输入框
        chat.setChatInput('');
        // 清空附件文件列表
        setAttachmentFiles([]);
        // 清空原型图片附件列表
        setAttachmentPrototypeImages([]);
        // 清空提及列表
        setSelectedMentions([]);
      }
    },
    [
      chat.isChatLoading,
      isSendingMessage,
      isStoppingTask,
      chat.chatInput,
      attachmentFiles,
      attachmentPrototypeImages,
      selectedMentions,
      onEnter,
    ],
  );

  // enter事件（适配 contentEditable）
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // 如果下拉菜单显示，Enter 键由 mentionHandleKeyDown 处理
      if (mentionTrigger.trigger && mentionPosition.visible) {
        mentionHandleKeyDown(e);
        return;
      }

      // 验证：prompt（输入内容）是必填的
      const plainText = editorRef.current
        ? getPlainText(editorRef.current.innerHTML)
        : '';
      if (!plainText?.trim()) {
        return;
      }

      //如果是输出过程中 或者 中止会话过程中 不能触发enter事件
      if (chat.isChatLoading || isSendingMessage) {
        return;
      }

      // shift+enter或者ctrl+enter时换行
      if (
        e.nativeEvent.keyCode === 13 &&
        (e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)
      ) {
        // 在光标位置插入换行符
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const br = document.createElement('br');
          range.deleteContents();
          range.insertNode(br);
          range.setStartAfter(br);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          e.preventDefault();
          handleInputChange();
        }
      } else if (e.nativeEvent.keyCode === 13 && !!plainText.trim()) {
        e.preventDefault();
        const files = attachmentFiles?.filter(
          (item) =>
            item.status === UploadFileStatus.done && item.url && item.key,
        );
        const prototypeImages = attachmentPrototypeImages?.filter(
          (item) =>
            item.status === UploadFileStatus.done && item.url && item.key,
        );
        // enter事件
        onEnter(files, prototypeImages, selectedMentions);
        // 清空输入框
        chat.setChatInput('');
        // 清空附件文件列表
        setAttachmentFiles([]);
        // 清空原型图片附件列表
        setAttachmentPrototypeImages([]);
        // 清空提及列表
        setSelectedMentions([]);
      }
    },
    [
      mentionTrigger,
      mentionPosition,
      chat.isChatLoading,
      isSendingMessage,
      chat.chatInput,
      attachmentFiles,
      attachmentPrototypeImages,
      selectedMentions,
      onEnter,
      handleInputChange,
    ],
  );

  // 上传文件
  const handleChange: UploadProps['onChange'] = (info) => {
    const { fileList } = info;
    setAttachmentFiles(handleUploadFileList(fileList));
  };

  // 上传原型图片
  const handleChangePrototypeImages: UploadProps['onChange'] = (info) => {
    const { fileList } = info;
    setAttachmentPrototypeImages(handleUploadFileList(fileList));
  };

  const handleDelFile = (uid: string) => {
    setAttachmentFiles((attachmentFiles) =>
      attachmentFiles.filter((item) => item.uid !== uid),
    );
  };

  // 删除文件
  const handleDelFilePrototypeImages = (uid: string) => {
    setAttachmentPrototypeImages((attachmentFiles) =>
      attachmentFiles.filter((item) => item.uid !== uid),
    );
  };

  /**
   * 处理粘贴事件 - 支持粘贴多张图片（适配 contentEditable）
   */
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      // 收集所有图片文件
      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        // 只处理图片类型
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            imageFiles.push(file);
          }
        }
      }

      // 如果没有图片，直接返回
      if (imageFiles.length === 0) return;

      // 阻止默认粘贴行为
      e.preventDefault();

      // 检查附件数量限制
      const currentCount = attachmentPrototypeImages.length;
      const totalCount = currentCount + imageFiles.length;

      if (totalCount > MAX_IMAGE_COUNT) {
        // 只上传允许的数量
        imageFiles.splice(MAX_IMAGE_COUNT - currentCount);
        if (imageFiles.length === 0) {
          message.warning(
            `原型图片最多上传${MAX_IMAGE_COUNT}张，当前已有${currentCount}张，最多还能上传${
              MAX_IMAGE_COUNT - currentCount
            }张`,
          );
          return;
        }
      }

      // 批量创建临时文件信息
      const tempFileInfoList: UploadFileInfo[] = imageFiles.map(
        (file, index) => ({
          uid: uuidv4(),
          name: file.name || `粘贴图片-${Date.now()}-${index + 1}.png`,
          size: file.size,
          type: file.type,
          status: UploadFileStatus.uploading,
          percent: 0,
          url: '',
          key: '',
        }),
      );

      // 批量添加到列表（显示上传中）
      setAttachmentPrototypeImages((prev) => [...prev, ...tempFileInfoList]);

      // 并发上传所有图片
      const uploadPromises = imageFiles.map(async (file, index) => {
        const uid = tempFileInfoList[index].uid;

        try {
          // 创建 FormData
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'tmp');

          // 上传文件
          const response = await fetch(UPLOAD_FILE_ACTION, {
            method: 'POST',
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
            body: formData,
          });

          const result = await response.json();

          // 更新文件状态
          if (result.code === SUCCESS_CODE && result.data) {
            setAttachmentPrototypeImages((prev) =>
              prev.map((item) =>
                item.uid === uid
                  ? {
                      ...item,
                      status: UploadFileStatus.done,
                      percent: 100,
                      url: result.data.url || '',
                      key: result.data.key || '',
                      name: result.data.fileName || item.name,
                    }
                  : item,
              ),
            );
            return { success: true, uid };
          } else {
            // 上传失败
            setAttachmentPrototypeImages((prev) =>
              prev.map((item) =>
                item.uid === uid
                  ? {
                      ...item,
                      status: UploadFileStatus.error,
                      percent: 0,
                    }
                  : item,
              ),
            );
            return { success: false, uid, error: result.message };
          }
        } catch (error) {
          console.error('上传图片失败:', error);
          // 上传失败，更新状态
          setAttachmentPrototypeImages((prev) =>
            prev.map((item) =>
              item.uid === uid
                ? {
                    ...item,
                    status: UploadFileStatus.error,
                    percent: 0,
                  }
                : item,
            ),
          );
          return { success: false, uid, error: String(error) };
        }
      });

      // 等待所有上传完成
      const results = await Promise.all(uploadPromises);

      // 统计上传结果
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      // 存在上传失败时，显示上传结果
      if (failCount > 0) {
        message.warning(
          `${successCount}张图片上传成功，${failCount}张上传失败`,
        );
      }
    },
    [attachmentPrototypeImages, token],
  );

  // 订阅发送消息事件
  useEffect(() => {
    const handleSendMessageEvent = (requestId?: string) => {
      console.log('[AutoErrorHandling] eventBus requestId', requestId);
      // 检查是否有输入内容
      if (chat.chatInput?.trim()) {
        handleSendMessage(requestId);
      }
    };

    // 订阅发送消息事件
    eventBus.on(EVENT_NAMES.SEND_CHAT_MESSAGE, handleSendMessageEvent);

    // 组件卸载时取消订阅
    return () => {
      eventBus.off(EVENT_NAMES.SEND_CHAT_MESSAGE, handleSendMessageEvent);
    };
  }, [chat.chatInput, handleSendMessage]);

  /**
   * 处理点击外部关闭 MentionSelector
   */
  const handleCloseMentionSelector = useCallback(
    (event: MouseEvent | TouchEvent) => {
      // 检查点击是否在输入框内
      const target = event.target as Node;
      if (editorRef.current && editorRef.current.contains(target)) {
        // 点击在输入框内，不关闭
        return;
      }

      // 点击在外部，关闭 MentionSelector
      if (mentionTrigger.trigger && mentionPosition.visible) {
        setMentionTrigger({ trigger: false });
        setMentionPosition({ left: 0, top: 0, visible: false });
        setMentionSelectedIndex(0);
      }
    },
    [mentionTrigger.trigger, mentionPosition.visible],
  );

  // 使用 useClickOutside 检测点击外部事件
  useClickOutside(mentionContainerRef, handleCloseMentionSelector, []);

  // 获取模型选项
  const getModeOptions = (models: ModelConfig[]) => {
    return (
      models?.map((model: ModelConfig) => ({
        label: model.name,
        value: model.id,
      })) || []
    );
  };

  // 模型弹窗内容
  const PopoverContent = () => {
    return (
      <div className={cx('flex', styles['model-selector-popover'])}>
        <div
          className={cx('flex-1', 'flex', 'flex-col', 'gap-6', 'overflow-hide')}
        >
          <h4>编码模型</h4>
          <SelectList
            className={cx(styles['select-list'])}
            options={getModeOptions(modelSelector?.models?.chatModelList)}
            value={modelSelector?.selectedModelId}
            onChange={modelSelector?.selectModel}
          />
        </div>
        <div
          className={cx('flex-1', 'flex', 'flex-col', 'gap-6', 'overflow-hide')}
        >
          <h4>视觉模型（可选）</h4>
          <SelectList
            className={cx(styles['select-list'])}
            allowClear
            options={getModeOptions(modelSelector?.models?.multiModelList)}
            value={modelSelector?.selectedMultiModelId}
            onChange={modelSelector?.selectMultiModel}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={cx('w-full', 'relative', className)}>
      <div className={cx(styles['chat-container'], 'flex', 'flex-col')}>
        {/*附件文件列表*/}
        <ConditionRender condition={attachmentFiles?.length}>
          <h5 className={cx(styles['file-title'])}>附件文件</h5>
          <ChatUploadFile files={attachmentFiles} onDel={handleDelFile} />
        </ConditionRender>
        {/*附件文件列表*/}
        <ConditionRender condition={attachmentPrototypeImages?.length}>
          <h5 className={cx(styles['file-title'])}>原型图片</h5>
          <ChatUploadFile
            files={attachmentPrototypeImages}
            onDel={handleDelFilePrototypeImages}
          />
        </ConditionRender>
        {/*输入框*/}
        <div className={cx(styles['input-wrapper'])}>
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className={cx(styles['input-editor'])}
            onInput={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onClick={handleEditorClick}
            role="textbox"
            aria-label="聊天输入框"
          />
          {/* 自定义占位符元素，带淡入淡出动画效果 */}
          {!chat.chatInput?.trim() && (
            <div
              className={cx(
                styles['custom-placeholder'],
                isPlaceholderVisible && styles['placeholder-visible'],
              )}
            >
              {currentPlaceholder}
            </div>
          )}
        </div>
        {/* @ 提及下拉选择器 */}
        <MentionSelector
          ref={mentionSelectorRef}
          visible={mentionTrigger.trigger && mentionPosition.visible}
          position={mentionPosition}
          searchText={mentionTrigger.searchText || ''}
          files={files}
          dataSources={
            dataSourceList?.map((ds) => ({
              ...ds,
              description: ds.description || '', // 确保 description 字段存在
            })) || []
          }
          onSelectFile={handleSelectFile}
          onSelectDataSource={handleSelectDataSource}
          selectedIndex={mentionSelectedIndex}
          containerRef={mentionContainerRef}
          onSelectedIndexChange={setMentionSelectedIndex}
        />
        <footer className={cx('flex-1', styles.footer)}>
          <div className={cx('flex', 'items-center', 'gap-4')}>
            {/*上传附件文件*/}
            <Upload
              action={UPLOAD_FILE_ACTION}
              onChange={handleChange}
              multiple={true}
              fileList={attachmentFiles}
              headers={{
                Authorization: token ? `Bearer ${token}` : '',
              }}
              data={{
                type: 'tmp',
              }}
              disabled={chat.isChatLoading}
              showUploadList={false}
              maxCount={MAX_IMAGE_COUNT}
            >
              <Tooltip title="上传附件">
                <Button
                  type="text"
                  className={cx(styles['svg-icon'], {
                    [styles['upload-box-disabled']]: chat.isChatLoading,
                  })}
                  icon={
                    <SvgIcon
                      name="icons-common-attachments"
                      style={{ fontSize: '14px' }}
                    />
                  }
                />
              </Tooltip>
            </Upload>
            {/*上传原型图片附件*/}
            <Upload
              action={UPLOAD_FILE_ACTION}
              accept="image/*"
              onChange={handleChangePrototypeImages}
              multiple={true}
              fileList={attachmentPrototypeImages}
              headers={{
                Authorization: token ? `Bearer ${token}` : '',
              }}
              data={{
                type: 'tmp',
              }}
              disabled={chat.isChatLoading}
              showUploadList={false}
              maxCount={MAX_IMAGE_COUNT}
            >
              <Tooltip title="上传原型图片">
                <Button
                  type="text"
                  className={cx(styles['svg-icon'], {
                    [styles['upload-box-disabled']]: chat.isChatLoading,
                  })}
                  icon={
                    <SvgIcon
                      name="icons-common-sketch"
                      style={{ fontSize: '14px' }}
                    />
                  }
                />
              </Tooltip>
            </Upload>
          </div>
          <div className={cx('flex', 'items-center', 'content-end', 'gap-10')}>
            {/* 大模型选择 */}
            <Tooltip title="模型">
              <Popover
                content={<PopoverContent />}
                trigger="click"
                open={open}
                onOpenChange={setOpen}
              >
                <div
                  className={cx(
                    'flex',
                    'items-center',
                    'gap-4',
                    'cursor-pointer',
                    styles['model-selector'],
                  )}
                >
                  <span>{modelSelector?.selectedModel?.name}</span>
                  <DownOutlined className={cx(styles['model-arrow'])} />
                </div>
              </Popover>
            </Tooltip>
            {/* 会话进行中仅显示取消按钮 */}
            {chat.isChatLoading ? (
              <Tooltip title={isStoppingTask ? '正在停止...' : '取消AI任务'}>
                <span
                  onClick={handleCancelAgentTask}
                  className={`${styles.box} ${styles['send-box']} ${
                    styles['stop-box']
                  } ${!isStoppingTask ? styles['stop-box-active'] : ''} ${
                    isStoppingTask ? styles.disabled : ''
                  }`}
                >
                  {isStoppingTask ? (
                    <div className={styles['loading-box']}>
                      <LoadingOutlined className={styles['loading-icon']} />
                    </div>
                  ) : (
                    <SvgIcon name="icons-chat-stop" />
                  )}
                </span>
              </Tooltip>
            ) : (
              <span
                onClick={() => handleSendMessage()}
                className={`${styles.box} ${styles['send-box']} ${
                  !chat.chatInput.trim() || isSendingMessage
                    ? styles.disabled
                    : ''
                }`}
              >
                {isSendingMessage ? (
                  <div className={styles['loading-box']}>
                    <LoadingOutlined className={styles['loading-icon']} />
                  </div>
                ) : (
                  <SvgIcon name="icons-chat-send" />
                )}
              </span>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ChatInputHome;
