import { SvgIcon } from '@/components/base';
import PromptOptimizeModal from '@/components/PromptOptimizeModal';
import type { SystemTipsWordProps } from '@/types/interfaces/space';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import { PromptEditorProvider, PromptEditorRender } from 'prompt-kit-editor';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// const { TextArea } = Input;

/**
 * 系统提示词组件暴露的方法
 */
export interface SystemTipsWordRef {
  insertText: (text: string) => void;
}

/**
 * 系统提示词组件
 */
const SystemTipsWord = forwardRef<SystemTipsWordRef, SystemTipsWordProps>(
  ({ value, agentConfigInfo, onChange, onReplace }, ref) => {
    const [open, setOpen] = useState<boolean>(false);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any | null>(null);
    // const textareaRef = useRef<any | null>(null);

    /**
     * 获取当前光标在编辑器中的位置
     */
    // const getCurrentCursorPosition = (): number | null => {
    //   const selection = window.getSelection();
    //   if (!selection || !selection.rangeCount) return null;

    //   const range = selection.getRangeAt(0);
    //   const editorContainer = editorContainerRef.current;

    //   if (!editorContainer) return null;

    //   // 查找编辑器内的实际可编辑元素
    //   const editableElement = editorContainer.querySelector('[contenteditable="true"]') ||
    //                          editorContainer.querySelector('div[role="textbox"]') ||
    //                          editorContainer;

    //   if (!editableElement.contains(range.startContainer)) {
    //     return null;
    //   }

    //   try {
    //     // 创建一个从编辑器开始到光标位置的范围
    //     const preSelectionRange = range.cloneRange();
    //     preSelectionRange.selectNodeContents(editableElement);
    //     preSelectionRange.setEnd(range.startContainer, range.startOffset);

    //     return preSelectionRange.toString().length;
    //   } catch (error) {
    //     console.warn('获取光标位置失败:', error);
    //     return null;
    //   }
    // };

    /**
     * 在光标位置插入文本
     */
    const insertTextAtCursor = (text: string) => {
      console.log('=== 插入文本调试信息 ===');
      console.log('编辑器引用:', editorRef.current);

      if (!editorRef.current) {
        console.log('编辑器引用不存在，使用备用方案');
        const currentValue = value || '';
        const newValue = currentValue ? `${currentValue}\n${text}` : text;
        onChange(newValue);
        return;
      }

      try {
        // 获取当前光标位置
        const cursorPosition = editorRef.current.getCursorPosition();
        console.log('当前光标位置:', cursorPosition);

        // 检查编辑器是否有 replaceText 方法
        if (typeof editorRef.current.replaceText !== 'function') {
          console.error('编辑器没有 replaceText 方法');
          console.log('编辑器可用方法:', Object.keys(editorRef.current));
          throw new Error('replaceText 方法不存在');
        }

        // 使用编辑器的 replaceText API 在光标位置插入文本
        const replaceOptions = {
          from: cursorPosition,
          to: cursorPosition,
          text: text,
          cursorOffset: text.length, // 将光标移动到插入文本的末尾
          scrollIntoView: true,
          userEvent: 'insertText',
        };

        console.log('调用 replaceText 参数:', replaceOptions);
        editorRef.current?.replaceText?.(replaceOptions);

        console.log('使用编辑器 API 插入成功');
        return;
      } catch (error) {
        console.error('编辑器 API 插入失败:', error);
      }

      // 备用方案：追加到末尾
      console.log('使用备用方案：追加到末尾');
      const currentValue = value || '';
      const newValue = currentValue ? `${currentValue}\n${text}` : text;
      onChange(newValue);
    };

    /**
     * 设置光标位置
     */
    // const setCursorPosition = (position: number) => {
    //   const editorContainer = editorContainerRef.current;
    //   if (!editorContainer) return;

    //   const editableElement = editorContainer.querySelector('[contenteditable="true"]') ||
    //                          editorContainer.querySelector('div[role="textbox"]') ||
    //                          editorContainer;

    //   try {
    //     const range = document.createRange();
    //     const selection = window.getSelection();

    //     if (!selection) return;

    //     // 找到指定位置的文本节点
    //     let currentPos = 0;
    //     const walker = document.createTreeWalker(
    //       editableElement,
    //       NodeFilter.SHOW_TEXT,
    //       null
    //     );

    //     let node;
    //     while (node = walker.nextNode()) {
    //       const nodeLength = node.textContent?.length || 0;
    //       if (currentPos + nodeLength >= position) {
    //         // 在这个节点中设置光标位置
    //         const offset = position - currentPos;
    //         range.setStart(node, Math.min(offset, nodeLength));
    //         range.setEnd(node, Math.min(offset, nodeLength));
    //         selection.removeAllRanges();
    //         selection.addRange(range);
    //         return;
    //       }
    //       currentPos += nodeLength;
    //     }

    //     // 如果没找到合适的位置，设置到末尾
    //     range.selectNodeContents(editableElement);
    //     range.collapse(false);
    //     selection.removeAllRanges();
    //     selection.addRange(range);
    //   } catch (error) {
    //     console.warn('设置光标位置失败:', error);
    //   }
    // };

    /**
     * 向外暴露插入文本的方法
     */
    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        insertTextAtCursor(text);
      },
    }));

    const handleReplace = (value?: string) => {
      setOpen(false);
      onReplace(value);
    };
    return (
      <div className={cx('flex', 'flex-col', 'flex-1', styles.container)}>
        <div
          className={cx(
            'flex',
            'items-center',
            'content-between',
            styles['system-tips-wrapper'],
          )}
        >
          <span className={cx(styles['system-tips'])}>系统提示词</span>
          <Tooltip title="自动优化提示词" placement="top">
            <Button
              color="primary"
              variant="filled"
              size="small"
              className={cx(styles['optimize-btn'])}
              icon={
                <SvgIcon name="icons-common-stars" style={{ fontSize: 16 }} />
              }
              onClick={() => setOpen(true)}
            >
              优化
            </Button>
          </Tooltip>
        </div>
        {/*<TextArea*/}
        {/*  classNames={{*/}
        {/*    textarea: 'flex-1',*/}
        {/*  }}*/}
        {/*  ref={textareaRef}*/}
        {/*  rootClassName={styles['text-area']}*/}
        {/*  placeholder={'输入系统提示词，对大模型进行角色塑造'}*/}
        {/*  variant="borderless"*/}
        {/*  value={value}*/}
        {/*  onChange={(e) => onChange(e.target.value)}*/}
        {/*/>*/}

        <PromptEditorProvider>
          <div ref={editorContainerRef} className={'flex-1 scroll-container'}>
            <PromptEditorRender
              value={value}
              onChange={onChange}
              isControled={true}
              placeholder="输入系统提示词，对大模型进行角色塑造"
              getEditor={(editor: any) => {
                editorRef.current = editor;
                console.log('编辑器已初始化:', editor);
              }}
            />
          </div>
        </PromptEditorProvider>
        <PromptOptimizeModal
          open={open}
          onCancel={() => setOpen(false)}
          onReplace={handleReplace}
          targetId={agentConfigInfo?.id}
          defaultValue={
            value ||
            `${agentConfigInfo?.name || ''}` +
              `${agentConfigInfo?.description || ''}`
          }
        />
      </div>
    );
  },
);

SystemTipsWord.displayName = 'SystemTipsWord';

export default SystemTipsWord;
