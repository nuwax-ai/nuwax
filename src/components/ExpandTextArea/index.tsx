import TiptapVariableInput from '@/components/TiptapVariableInput';
import { extractTextFromHTML } from '@/components/TiptapVariableInput/utils/htmlUtils';
import { ICON_OPTIMIZE } from '@/constants/images.constants';
import { useWorkflowModel } from '@/hooks/useWorkflowModel';
import { V3_FORM_IME_SAFE_ENABLED } from '@/pages/Antv-X6/v3/constants/editorConfig';
import { ExpandAltOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ExpandTextArea from './expandTextarea';
import styles from './index.less';
import { ExpandableInputTextareaProps } from './type';

const cx = classNames.bind(styles);

/**
 * 工作流节点可展开输入框。
 * 统一使用 TiptapVariableInput（已移除 prompt-kit-editor 回退路径）。
 *
 * @param title 字段标题
 * @param inputFieldName Form 字段名
 * @param placeholder 占位文案
 * @param rows 估算行高用的行数
 * @param onExpand 是否展示展开按钮
 * @param onOptimize / onOptimizeClick 优化入口
 * @param variables / skills 变量与技能提及数据
 * @param imeSafe 中文 IME 安全模式
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
  imeSafe = V3_FORM_IME_SAFE_ENABLED,
}) => {
  const [uuid, setUuid] = useState('');
  const { setExpanded, expanded } = useWorkflowModel();

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
      {/* 输入框：Tiptap 变量编辑器 */}
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
          imeSafe={imeSafe}
          className={cx(styles['prompt-editor-provider'])}
          style={{ minHeight: rows * 24 + 10 }}
        />
      </Form.Item>

      {/* 展开全屏编辑层 */}
      {expanded && expanded === uuid && (
        <ExpandTextArea
          title={title as string}
          inputFieldName={inputFieldName}
          marginRight={370 + 12 * 2}
          placeholder={placeholder}
          visible={expanded === uuid}
          onClose={() => setExpanded('')}
          variables={variables}
          skills={skills}
          imeSafe={imeSafe}
        />
      )}
    </div>
  );
};

export default ExpandableInputTextarea;
