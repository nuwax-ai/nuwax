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
import {
  CloseOutlined,
  DatabaseOutlined,
  DownOutlined,
  FileOutlined,
  FolderOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, Input, message, Popover, Tooltip, Upload } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';
import MentionSelector from './MentionSelector';
import type {
  MentionPosition,
  MentionSelectorHandle,
  MentionTriggerResult,
} from './MentionSelector/types';
import { calculateMentionPosition } from './MentionSelector/utils';

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
  const mentionSelectorRef = useRef<MentionSelectorHandle>(null);

  // 已选择的提及项（文件、目录和数据源）
  // 使用导出的 MentionItem 类型，确保包含所有类型（file、folder、datasource）
  const [selectedMentions, setSelectedMentions] = useState<MentionItem[]>([]);

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

  /**
   * 提取文件名（不包含路径）
   */
  const getFileName = useCallback((filePath: string) => {
    return filePath.split('/').pop() || filePath;
  }, []);

  /**
   * 判断文件节点是否为目录
   */
  const isDirectory = useCallback((file: FileNode) => {
    return file.type === 'folder' || file.children !== undefined;
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
        // 使用 requestAnimationFrame 确保在下一帧渲染后计算位置
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const position = calculateMentionPosition(textAreaRef);
            setMentionPosition(position);
            setMentionSelectedIndex(0);
          });
        });
      } else {
        setMentionPosition({ left: 0, top: 0, visible: false });
      }
    },
    [chat, checkMentionTrigger, selectedMentions],
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

      // Esc 键：处理返回上一级或关闭下拉菜单
      if (key === 'Escape' || keyCode === 27) {
        e.preventDefault();
        // 如果 MentionSelector 不在主视图，尝试返回上一级
        if (mentionSelectorRef.current) {
          const handled = mentionSelectorRef.current.handleEscapeKey();
          // 如果返回了上一级（返回 true），则不关闭弹层
          // 如果已经在主视图（返回 false），则关闭弹层
          if (!handled) {
            setMentionTrigger({ trigger: false });
            setMentionPosition({ left: 0, top: 0, visible: false });
            setMentionSelectedIndex(0);
          }
        } else {
          // 如果 ref 不存在，直接关闭弹层
          setMentionTrigger({ trigger: false });
          setMentionPosition({ left: 0, top: 0, visible: false });
          setMentionSelectedIndex(0);
        }
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
        // 直接调用 MentionSelector 的方法处理当前选中项的选择
        // 这样可以确保与 onClick 逻辑完全一致
        if (mentionSelectorRef.current) {
          mentionSelectorRef.current.handleSelectCurrentItem();
        }
        return;
      }
    },
    [mentionTrigger, mentionPosition, scrollToSelectedItem],
  );

  // 点击发送事件
  const handleSendMessage = useCallback(
    (requestId?: string) => {
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
      chat.chatInput,
      attachmentFiles,
      attachmentPrototypeImages,
      selectedMentions,
      onEnter,
    ],
  );

  // enter事件
  const handlePressEnter = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    selectedMentionsParam: MentionItem[],
  ) => {
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
      onEnter(files, prototypeImages, selectedMentionsParam);
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

  /**
   * 处理点击外部关闭 MentionSelector
   */
  const handleCloseMentionSelector = useCallback(
    (event: MouseEvent | TouchEvent) => {
      // 检查点击是否在输入框内
      const target = event.target as Node;
      if (textAreaRef.current) {
        const textarea =
          textAreaRef.current.resizableTextArea?.textArea ||
          textAreaRef.current;
        if (textarea && (textarea as HTMLElement).contains(target)) {
          // 点击在输入框内，不关闭
          return;
        }
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
              // 判断类型并获取对应信息
              let displayName: string;
              let fullPath: string;
              let icon: React.ReactNode;
              let itemType: string; // 用于区分文件、目录、数据资源

              if (mention.type === 'file') {
                // 文件或目录
                const fileData = mention.data as FileNode;
                displayName = getFileName(fileData.path); // 只显示末级名字
                fullPath = fileData.path;
                itemType = isDirectory(fileData) ? 'directory' : 'file';
                // 根据类型选择图标
                icon = isDirectory(fileData) ? (
                  <FolderOutlined style={{ fontSize: '14px' }} />
                ) : (
                  <FileOutlined style={{ fontSize: '14px' }} />
                );
              } else {
                // 数据资源
                const dataSourceData = mention.data as DataResource;
                displayName = dataSourceData.name;
                fullPath = dataSourceData.name;
                itemType = 'datasource';
                icon = <DatabaseOutlined style={{ fontSize: '14px' }} />;
              }

              const key =
                mention.type === 'file'
                  ? `file-${mention.data.id}`
                  : `datasource-${mention.data.id}`;

              return (
                <Tooltip key={key} title={fullPath}>
                  <div
                    className={cx(styles['mention-tag'])}
                    data-type={itemType}
                  >
                    {icon}
                    <span className={cx(styles['mention-tag-text'])}>
                      {displayName}
                    </span>
                    <CloseOutlined
                      className={cx(styles['mention-tag-close'])}
                      onClick={() => {
                        // 删除该提及项
                        const mentionToRemove = selectedMentions[index];

                        // 如果是数据源，调用 onToggleSelectDataSource 取消选择
                        if (
                          mentionToRemove.type === 'datasource' &&
                          onToggleSelectDataSource
                        ) {
                          onToggleSelectDataSource(
                            mentionToRemove.data as DataResource,
                          );
                        }

                        // 从 selectedMentions 中移除
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
        {/* 已选择的数据源已统一显示在上方的 @ 提及标签中 */}
        {/* 选择的文件 */}
        {/* {fileContentState?.selectedFile && (
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
        )} */}
        {/*输入框*/}
        <Input.TextArea
          ref={textAreaRef}
          value={chat.chatInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          rootClassName={cx(styles.input)}
          onPressEnter={(e) => handlePressEnter(e, selectedMentions)}
          onPaste={handlePaste}
          placeholder="一句话做网站、应用、提效工具等，可选择工作流、插件等数据资源拓展多种能力"
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
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
