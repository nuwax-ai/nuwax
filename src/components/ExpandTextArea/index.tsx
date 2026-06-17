import TiptapVariableInput from '@/components/TiptapVariableInput';
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';
import { ICON_OPTIMIZE } from '@/constants/images.constants';
import { useWorkflowModel } from '@/hooks/useWorkflowModel';
import { ExpandAltOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import classNames from 'classnames';
import { PromptEditorProvider, PromptEditorRender } from 'prompt-kit-editor';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ExpandTextArea from './expandTextarea';
import styles from './index.less';
import { ExpandableInputTextareaProps } from './type';
const cx = classNames.bind(styles);

// 特性开关：是否使用 Tiptap 编辑器
// 如果遇到问题，将此值设置为 false 可回退到旧版 Input.TextArea
const USE_TIPTAP_EDITOR = true; //TODO: 先切换回老的版本 下周再切换回来
/**
 * TODO:周再切换回来
 * 1. 提交后台时要用 rawValue 而不是 value

 */

export const ExpandableInputTextarea: React.FC<
  ExpandableInputTextareaProps
> = ({
  title,
  inputFieldName,
  placeholder,
  rows = 3,
  onExpand,
  onOptimize,
  onOptimizeClick,
  variables,
  skills,
}) => {
  const [uuid, setUuid] = useState('');
  const { setExpanded, expanded } = useWorkflowModel(); // 添加本地状态
  useEffect(() => {
    setUuid(uuidv4());
    return () => {
      setUuid('');
      setExpanded('');
    };
  }, []);

  return (
    <div className={cx(styles.container)}>
      <div className="dis-sb margin-bottom">
        {/* 名称 */}
        <span className="node-title-style gap-6 flex items-center">
          {title}
        </span>
        <div>
          {/* 是否有优化 */}
          {onOptimize && onOptimizeClick && (
            <Button
              type="text"
              icon={<ICON_OPTIMIZE />}
              size="small"
              style={{ marginRight: '6px' }}
              onClick={() => onOptimizeClick()}
            />
          )}
          {/* 是否有展开 */}
          {onExpand && (
            <Button
              type="text"
              icon={<ExpandAltOutlined />}
              size="small"
              onClick={() => setExpanded(uuid)}
            />
          )}
        </div>
      </div>
      {/* 输入框 */}
      {USE_TIPTAP_EDITOR ? (
        <Form.Item
          name={inputFieldName}
          getValueFromEvent={(value) =>
            typeof value === 'string' ? extractTextFromHTML(value) : ''
          }
        >
          <TiptapVariableInput
            placeholder={placeholder}
            variables={variables}
            skills={skills}
            className={cx(styles['prompt-editor-provider'])}
            style={{ minHeight: rows * 24 + 10 }} // 估算高度
          />
        </Form.Item>
      ) : (
        <PromptEditorProvider>
          <Form.Item name={inputFieldName}>
            <PromptEditorRender
              className={cx(
                styles['prompt-editor-provider'],
                'scroll-container',
              )}
              isControled={true}
              placeholder={placeholder}
            />
          </Form.Item>
        </PromptEditorProvider>
      )}

      {/* 如果有展开，就要调用展开的组件 */}
      {expanded &&
        expanded === uuid && ( // 使用本地状态控制显示
          <ExpandTextArea
            title={title as string}
            inputFieldName={inputFieldName}
            marginRight={370 + 12 * 2}
            placeholder={placeholder}
            visible={expanded === uuid}
            onClose={() => setExpanded('')}
            variables={variables}
            skills={skills}
            useTiptap={USE_TIPTAP_EDITOR}
          />
        )}
    </div>
  );
};

export default ExpandableInputTextarea;
