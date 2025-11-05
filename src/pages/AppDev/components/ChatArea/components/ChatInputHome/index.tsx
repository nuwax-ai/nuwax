import SvgIcon from '@/components/base/SvgIcon';
import ChatUploadFile from '@/components/ChatUploadFile';
import ConditionRender from '@/components/ConditionRender';
import SelectList from '@/components/custom/SelectList';
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
import {
  CloseOutlined,
  DownOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, Input, message, Popover, Tooltip, Upload } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import DataSourceList from './DataSourceList';
import styles from './index.less';
import MentionSelector from './MentionSelector';
import type {
  MentionPosition,
  MentionTriggerResult,
} from './MentionSelector/types';

const cx = classNames.bind(styles);

// 聊天输入框组件
export interface ChatInputProps {
  // 聊天信息
  chat: any;
  // 大模型选择器
  modelSelector: any;
  // 文件内容状态
  fileContentState: any;
  // 设置选中的文件
  onSetSelectedFile: (fileId: string) => void;
  // 是否正在停止任务
  isStoppingTask: boolean;
  // 是否正在发送消息
  isSendingMessage: boolean;
  // 取消任务
  handleCancelAgentTask: () => void;
  className?: React.CSSProperties;
  onEnter: (
    files?: UploadFileInfo[],
    prototypeImages?: UploadFileInfo[],
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
  fileContentState,
  onSetSelectedFile,
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
  // TextArea ref，用于处理粘贴事件
  const textAreaRef = useRef<any>(null);

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

  // 已选择的提及项（文件和数据源）
  type MentionItem =
    | { type: 'file'; data: FileNode }
    | { type: 'datasource'; data: DataResource };
  const [selectedMentions, setSelectedMentions] = useState<MentionItem[]>([]);

  /**
   * 提取文件名（不包含路径）
   */
  const getFileName = useCallback((filePath: string) => {
    return filePath.split('/').pop() || filePath;
  }, []);

  /**
   * 检测 @ 字符触发（参考 react-mentions-ts 的 trigger 检测）
   */
  const checkMentionTrigger = useCallback(
    (value: string, cursorPosition: number): MentionTriggerResult => {
      const textBeforeCursor = value.slice(0, cursorPosition);
      // 参考 react-mentions-ts: 使用 RegExp，包含两个捕获组
      // 第一个捕获组：触发字符+查询文本（如 @mention）
      // 第二个捕获组：查询文本（如 mention）
      const TRIGGER_REGEX = /(@)(\w*)$/;
      const match = textBeforeCursor.match(TRIGGER_REGEX);
      if (match) {
        return {
          trigger: true,
          triggerChar: match[1], // '@'
          searchText: match[2] || '', // 查询文本
          startIndex: match.index || 0, // @ 字符位置
        };
      }
      return { trigger: false };
    },
    [],
  );

  /**
   * 计算下拉菜单位置（参考 Ant Design Mentions 的智能定位）
   * 使用镜像元素精确计算光标位置
   */
  const calculateMentionPosition = useCallback(() => {
    if (!textAreaRef.current) {
      return { left: 0, top: 0, visible: false };
    }

    const textarea =
      textAreaRef.current.resizableTextArea?.textArea || textAreaRef.current;
    if (!textarea) {
      return { left: 0, top: 0, visible: false };
    }

    const { selectionStart } = textarea;
    const rect = textarea.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(textarea);

    // 创建镜像元素，完全模拟 textarea 的样式
    const mirror = document.createElement('div');
    const mirrorStyles: Record<string, string> = {
      position: 'absolute',
      visibility: 'hidden',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
      font: computedStyle.font,
      fontSize: computedStyle.fontSize,
      fontFamily: computedStyle.fontFamily,
      fontWeight: computedStyle.fontWeight,
      fontStyle: computedStyle.fontStyle,
      letterSpacing: computedStyle.letterSpacing,
      textTransform: computedStyle.textTransform,
      padding: computedStyle.padding,
      border: computedStyle.border,
      boxSizing: computedStyle.boxSizing,
      width: `${textarea.clientWidth}px`,
      minHeight: '1px',
      top: '0',
      left: '0',
      zIndex: '-1',
    };
    Object.assign(mirror.style, mirrorStyles);

    // 获取文本内容
    const textBeforeCursor = textarea.value.slice(0, selectionStart);
    const textAfterCursor = textarea.value.slice(selectionStart);

    // 获取行高（用于计算行底部位置）
    const lineHeight =
      parseFloat(computedStyle.lineHeight) ||
      parseFloat(computedStyle.fontSize) * 1.5;

    // 创建文本节点，在光标位置插入标记
    // 使用更简单的方法：在文本中插入一个零宽度的标记元素
    const textNode1 = document.createTextNode(textBeforeCursor);
    const marker = document.createElement('span');
    // 创建一个零宽度的标记，高度等于行高，确保底部对齐到行底部
    marker.style.display = 'inline-block';
    marker.style.width = '1px';
    marker.style.height = `${lineHeight}px`; // 使用行高作为高度
    marker.style.verticalAlign = 'top';
    marker.style.position = 'relative';
    marker.style.overflow = 'hidden';
    // 使用零宽空格作为内容，确保标记在文本流中
    marker.textContent = '\u200B'; // 零宽空格
    const textNode2 = document.createTextNode(textAfterCursor);

    mirror.appendChild(textNode1);
    mirror.appendChild(marker);
    mirror.appendChild(textNode2);

    // 将镜像元素添加到 body，使用 fixed 定位确保位置准确
    document.body.appendChild(mirror);

    // 获取标记的位置（这就是光标位置）
    // 使用 getBoundingClientRect 获取相对于视口的位置
    const markerRect = marker.getBoundingClientRect();

    // 计算光标位置
    // 标记的位置就是光标位置（相对于视口）
    let cursorX = markerRect.left;

    // 如果标记位置无效（可能是因为标记没有正确渲染），使用备用方法
    if (
      (markerRect.width === 0 && markerRect.height === 0) ||
      markerRect.left === 0 ||
      markerRect.top === 0
    ) {
      // 备用方法：计算文本宽度
      const textWidth = mirror.offsetWidth;

      // 计算最后一行的宽度
      const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
      let cursorXInLine = textWidth;

      if (lastNewlineIndex !== -1) {
        const lastLineText = textBeforeCursor.slice(lastNewlineIndex + 1);
        const lastLineDiv = document.createElement('div');
        Object.assign(lastLineDiv.style, mirrorStyles);
        lastLineDiv.textContent = lastLineText;
        document.body.appendChild(lastLineDiv);
        cursorXInLine = lastLineDiv.offsetWidth;
        document.body.removeChild(lastLineDiv);
      }

      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const borderLeft = parseFloat(computedStyle.borderLeftWidth) || 0;
      const scrollLeft = textarea.scrollLeft || 0;

      cursorX =
        rect.left + borderLeft + paddingLeft + cursorXInLine - scrollLeft;
    }

    // 清理临时元素
    document.body.removeChild(mirror);

    // 弹层尺寸（参考 Ant Design Mentions）
    const dropdownWidth = 400;
    const dropdownHeight = 400;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const minMargin = 8; // 最小边距
    const horizontalOffset = 2; // 水平偏移量，让下拉菜单稍微靠右一点

    // 计算弹层位置（参考 Ant Design Mentions 的智能定位）
    // X 轴：弹层左侧对齐光标位置右侧
    let left = cursorX + horizontalOffset;

    // Y 轴：下拉菜单底部与输入框容器底部对齐
    // 获取 textarea 容器的底部位置
    const textareaBottom = rect.bottom;
    // 下拉菜单的 top = textarea 底部 - 下拉菜单高度
    let top = textareaBottom - dropdownHeight;

    // 水平定位：优先在光标右侧，如果右侧空间不够，调整到左侧
    if (
      cursorX + dropdownWidth + horizontalOffset >
      viewportWidth - minMargin
    ) {
      // 右侧空间不够，尝试将弹层左边缘对齐光标位置
      if (cursorX - dropdownWidth >= minMargin) {
        // 左侧有足够空间，将弹层放在光标左侧
        left = cursorX - dropdownWidth - horizontalOffset;
      } else {
        // 左右都不够，则右对齐到视口右边缘
        left = viewportWidth - dropdownWidth - minMargin;
      }
    }

    // 垂直定位：下拉菜单底部对齐输入框底部
    // 如果上方空间不够（top < minMargin），调整到最小边距
    if (top < minMargin) {
      // 上方空间不够，将下拉菜单顶部设置为最小边距
      top = minMargin;
    }

    // 如果下拉菜单超出视口底部，向上调整
    if (top + dropdownHeight > viewportHeight - minMargin) {
      top = viewportHeight - dropdownHeight - minMargin;
    }

    // 确保位置在视口范围内
    left = Math.max(
      minMargin,
      Math.min(left, viewportWidth - dropdownWidth - minMargin),
    );
    top = Math.max(
      minMargin,
      Math.min(top, viewportHeight - dropdownHeight - minMargin),
    );

    // 下拉菜单使用 fixed 定位
    return {
      left,
      top,
      visible: true,
    };
  }, []);

  /**
   * 插入提及文本（参考 react-mentions-ts 的 markup 处理）
   */
  const insertMention = useCallback(
    (mentionText: string, appendSpace = true) => {
      if (!textAreaRef.current) return;

      const textarea =
        textAreaRef.current.resizableTextArea?.textArea || textAreaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd, value } = textarea;
      const textBeforeCursor = value.slice(0, selectionStart);
      const textAfterCursor = value.slice(selectionEnd);

      const atIndex = textBeforeCursor.lastIndexOf('@');
      if (atIndex === -1) return;

      const space = appendSpace ? ' ' : '';
      const newValue =
        value.slice(0, atIndex) + `@${mentionText}${space}` + textAfterCursor;

      chat.setChatInput(newValue);

      const newCursorPos =
        atIndex + mentionText.length + 1 + (appendSpace ? 1 : 0);
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);

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
   * 处理输入变化，检测 @ 字符和提及删除
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      const cursorPosition = e.target.selectionStart;
      chat.setChatInput(value);

      // 检测已删除的提及项（与上框同步）
      // 遍历当前选中的提及项，检查文本中是否还存在
      const mentionsToRemove: number[] = [];
      selectedMentions.forEach((mention, index) => {
        const mentionText =
          mention.type === 'file'
            ? `@${mention.data.path}`
            : `@${mention.data.name}`;
        // 如果文本中不再包含该提及，标记为删除
        if (!value.includes(mentionText)) {
          mentionsToRemove.push(index);
        }
      });

      // 从上框中移除已删除的提及项
      if (mentionsToRemove.length > 0) {
        setSelectedMentions((prev) =>
          prev.filter((_, index) => !mentionsToRemove.includes(index)),
        );
      }

      const triggerResult = checkMentionTrigger(value, cursorPosition);
      setMentionTrigger(triggerResult);

      if (triggerResult.trigger) {
        // 延迟计算位置，确保 DOM 已更新
        setTimeout(() => {
          const position = calculateMentionPosition();
          setMentionPosition(position);
          setMentionSelectedIndex(0);
        }, 0);
      } else {
        setMentionPosition({ left: 0, top: 0, visible: false });
      }
    },
    [chat, checkMentionTrigger, calculateMentionPosition, selectedMentions],
  );

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
   * 处理键盘事件（参考 Ant Design Mentions 的键盘交互）
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // 如果下拉菜单未显示，不处理键盘导航
      if (!mentionTrigger.trigger || !mentionPosition.visible) {
        return;
      }

      const { key, keyCode } = e.nativeEvent;

      // Esc 键：关闭下拉菜单
      if (key === 'Escape' || keyCode === 27) {
        e.preventDefault();
        setMentionTrigger({ trigger: false });
        setMentionPosition({ left: 0, top: 0, visible: false });
        setMentionSelectedIndex(0);
        return;
      }

      // 上下箭头键：导航选择（参考 Ant Design Mentions）
      if (key === 'ArrowUp' || keyCode === 38) {
        e.preventDefault();
        setMentionSelectedIndex((prev) => {
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
        setMentionSelectedIndex((prev) => {
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
        // 触发当前选中项的点击事件
        const mentionSelector = mentionContainerRef.current;
        if (mentionSelector) {
          // 尝试多种选择器格式
          const selectors = [
            '[class*="mention-item"][class*="selected"]',
            '.mention-item.selected',
          ];
          let selectedElement: HTMLElement | null = null;
          for (const selector of selectors) {
            selectedElement = mentionSelector.querySelector(
              selector,
            ) as HTMLElement;
            if (selectedElement) break;
          }
          if (selectedElement) {
            selectedElement.click();
          }
        }
        return;
      }
    },
    [mentionTrigger, mentionPosition, scrollToSelectedItem],
  );

  // 点击发送事件
  const handleSendMessage = (requestId?: string) => {
    if (chat.chatInput?.trim()) {
      const files = attachmentFiles?.filter(
        (item) => item.status === UploadFileStatus.done && item.url && item.key,
      );
      const prototypeImages = attachmentPrototypeImages?.filter(
        (item) => item.status === UploadFileStatus.done && item.url && item.key,
      );
      // enter事件
      onEnter(files, prototypeImages, requestId);
      // 清空输入框
      chat.setChatInput('');
      // 清空附件文件列表
      setAttachmentFiles([]);
      // 清空原型图片附件列表
      setAttachmentPrototypeImages([]);
      // 清空提及列表
      setSelectedMentions([]);
    }
  };

  // enter事件
  const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 如果下拉菜单显示，Enter 键由 handleKeyDown 处理
    if (mentionTrigger.trigger && mentionPosition.visible) {
      return;
    }

    e.preventDefault();
    const { value, selectionStart, selectionEnd } =
      e.target as HTMLTextAreaElement;

    // 验证：prompt（输入内容）是必填的
    if (!value?.trim()) {
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
      const newValue =
        value.slice(0, selectionStart) + '\n' + value.slice(selectionEnd);
      chat.setChatInput(newValue);
    } else if (e.nativeEvent.keyCode === 13 && !!value.trim()) {
      const files = attachmentFiles?.filter(
        (item) => item.status === UploadFileStatus.done && item.url && item.key,
      );
      const prototypeImages = attachmentPrototypeImages?.filter(
        (item) => item.status === UploadFileStatus.done && item.url && item.key,
      );
      // enter事件
      onEnter(files, prototypeImages);
      // 清空输入框
      chat.setChatInput('');
      // 清空附件文件列表
      setAttachmentFiles([]);
      // 清空原型图片附件列表
      setAttachmentPrototypeImages([]);
      // 清空提及列表
      setSelectedMentions([]);
    }
  };

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
   * 处理粘贴事件 - 支持粘贴多张图片
   */
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
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
        {/*已选择的提及项（文件/数据源）*/}
        <ConditionRender condition={selectedMentions?.length}>
          <h5 className={cx(styles['file-title'])}>@ 提及</h5>
          <div
            className={cx(
              styles['mentions-list'],
              'flex',
              'flex-wrap',
              'gap-8',
            )}
          >
            {selectedMentions.map((mention, index) => {
              const displayName =
                mention.type === 'file'
                  ? getFileName(mention.data.path)
                  : mention.data.name;
              const fullPath =
                mention.type === 'file' ? mention.data.path : mention.data.name;
              const key =
                mention.type === 'file'
                  ? `file-${mention.data.id}`
                  : `datasource-${mention.data.id}`;

              return (
                <Tooltip key={key} title={fullPath}>
                  <div className={cx(styles['mention-tag'])}>
                    <span className={cx(styles['mention-tag-text'])}>
                      @{displayName}
                    </span>
                    <CloseOutlined
                      className={cx(styles['mention-tag-close'])}
                      onClick={() => {
                        // 删除该提及项
                        const mentionToRemove = selectedMentions[index];
                        setSelectedMentions((prev) =>
                          prev.filter((_, i) => i !== index),
                        );

                        // 从输入框中删除对应的 @ 提及文本
                        if (!textAreaRef.current) return;
                        const textarea =
                          textAreaRef.current.resizableTextArea?.textArea ||
                          textAreaRef.current;
                        if (!textarea) return;

                        const currentText = textarea.value;
                        // 构建要删除的提及文本
                        const mentionTextToRemove =
                          mentionToRemove.type === 'file'
                            ? `@${mentionToRemove.data.path}`
                            : `@${mentionToRemove.data.name}`;

                        // 替换所有匹配的提及文本（可能有多个）
                        const newText = currentText.replace(
                          new RegExp(
                            mentionTextToRemove.replace(
                              /[.*+?^${}()|[\]\\]/g,
                              '\\$&',
                            ),
                            'g',
                          ),
                          '',
                        );

                        // 更新输入框内容
                        chat.setChatInput(newText.trim());
                      }}
                    />
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </ConditionRender>
        {/*选择的数据源*/}
        <ConditionRender condition={dataSourceList?.length}>
          <DataSourceList
            dataSourceList={dataSourceList}
            onToggleSelectDataSource={onToggleSelectDataSource}
          />
        </ConditionRender>
        {/* 选择的文件 */}
        {fileContentState?.selectedFile && (
          <Tooltip title={fileContentState.selectedFile}>
            <div className={`flex ${styles.selectedFileDisplay}`}>
              <div className={cx('text-ellipsis', styles['file-name'])}>
                {getFileName(fileContentState.selectedFile)}
              </div>
              <CloseOutlined
                className={cx('cursor-pointer', styles['close-icon'])}
                onClick={() => {
                  onSetSelectedFile('');
                }}
              />
            </div>
          </Tooltip>
        )}
        {/*输入框*/}
        <Input.TextArea
          ref={textAreaRef}
          value={chat.chatInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rootClassName={cx(styles.input)}
          onPressEnter={handlePressEnter}
          onPaste={handlePaste}
          placeholder="一句话做网站、应用、提效工具等，可选择工作流、插件等数据资源拓展多种能力"
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
        {/* @ 提及下拉选择器 */}
        <MentionSelector
          visible={mentionTrigger.trigger && mentionPosition.visible}
          position={mentionPosition}
          searchText={mentionTrigger.searchText || ''}
          files={files}
          dataSources={dataSourceList || []}
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
