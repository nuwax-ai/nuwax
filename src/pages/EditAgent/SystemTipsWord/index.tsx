import { SvgIcon } from '@/components/base';
import PromptOptimizeModal from '@/components/PromptOptimizeModal';
import type { SystemTipsWordProps } from '@/types/interfaces/space';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import { PromptEditorProvider, PromptEditorRender } from 'prompt-kit-editor';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

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

    /**
     * 在光标位置插入文本
     */
    const insertTextAtCursor = (text: string) => {
      if (!editorRef.current) {
        const currentValue = value || '';
        const newValue = currentValue ? `${currentValue}\n${text}` : text;
        onChange(newValue);
        return;
      }
      // 获取当前光标位置
      const cursorPosition = editorRef.current?.getCursorPosition();

      try {
        // 检查编辑器是否有 replaceText 方法
        if (typeof editorRef.current?.replaceText !== 'function') {
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

        editorRef.current?.replaceText?.(replaceOptions);
        return;
      } catch {}

      // 备用方案：追加到末尾
      const currentValue = value || '';
      if (currentValue) {
        const firstValue = currentValue.substring(0, cursorPosition);
        const lastValue = currentValue.substring(cursorPosition);
        const newValue = `${firstValue}\n${text}${lastValue}`;
        onChange(newValue);
      } else {
        onChange(text);
      }
    };

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

        <PromptEditorProvider>
          <div ref={editorContainerRef} className={'flex-1 scroll-container'}>
            <PromptEditorRender
              value={value}
              onChange={onChange}
              isControled={true}
              placeholder="输入系统提示词，对大模型进行角色塑造"
              getEditor={(editor: any) => {
                editorRef.current = editor;
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
