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
      const selection = window.getSelection();
      const editorContainer = editorContainerRef.current;

      console.log('=== 插入文本调试信息 ===');
      console.log('编辑器容器:', editorContainer);
      console.log('当前选择:', selection);

      if (!selection || !selection.rangeCount || !editorContainer) {
        console.log('没有选择或编辑器容器，使用备用方案');
        const currentValue = value || '';
        const newValue = currentValue ? `${currentValue}\n${text}` : text;
        onChange(newValue);
        return;
      }

      const range = selection.getRangeAt(0);
      console.log('选择范围:', range);
      console.log('起始容器:', range.startContainer);
      console.log('起始偏移:', range.startOffset);

      // 检查光标是否在编辑器内
      const editableElement =
        editorContainer.querySelector('[contenteditable="true"]') ||
        editorContainer.querySelector('div[role="textbox"]') ||
        editorContainer.querySelector('.ProseMirror') ||
        editorContainer;

      console.log('可编辑元素:', editableElement);

      if (!editableElement.contains(range.startContainer)) {
        console.log('光标不在编辑器内，使用备用方案');
        const currentValue = value || '';
        const newValue = currentValue ? `${currentValue}\n${text}` : text;
        onChange(newValue);
        return;
      }

      try {
        console.log('尝试直接 DOM 插入');

        // 保存当前光标位置
        // const startContainer = range.startContainer;
        // const startOffset = range.startOffset;

        // 删除当前选择的内容（如果有）
        range.deleteContents();

        // 创建文本节点并插入
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);

        // 将光标移动到插入文本的末尾
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);

        // 触发各种事件来通知编辑器更新
        const events = ['input', 'change', 'keyup', 'blur'];
        events.forEach((eventType) => {
          const event = new Event(eventType, {
            bubbles: true,
            cancelable: true,
          });
          editableElement.dispatchEvent(event);
        });

        // 强制更新编辑器内容
        setTimeout(() => {
          const newContent =
            editableElement.textContent || editableElement.innerText || '';
          console.log('DOM 插入后的内容:', newContent);
          if (newContent !== value) {
            onChange(newContent);
          }
        }, 100);

        console.log('DOM 插入成功');
        return;
      } catch (error) {
        console.warn('DOM 插入失败:', error);
      }

      // 最后的备用方案：追加到末尾
      console.log('使用最终备用方案：追加到末尾');
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
