import VariableInferenceInput from '@/components/VariableInferenceInput/VariableInferenceInput';
import { ICON_OPTIMIZE } from '@/constants/images.constants';
import { ExpandAltOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import ExpandTextArea from './expandTextarea';
import styles from './index.less';
import { ExpandableInputTextareaProps } from './type';
const cx = classNames.bind(styles);

export const ExpandableInputTextarea: React.FC<
  ExpandableInputTextareaProps
> = ({
  title,
  inputFieldName,
  placeholder,
  // rows = 3,
  onExpand,
  onOptimize,
  onOptimizeClick,
  variables,
}) => {
  const [uuid, setUuid] = useState('');
  const { setExpanded, expanded } = useModel('workflow'); // 添加本地状态
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
      {/*<Form.Item name={inputFieldName}>*/}
      {/*  <Input.TextArea*/}
      {/*    placeholder={placeholder}*/}
      {/*    autoSize={{ minRows: rows, maxRows: rows }}*/}
      {/*  />*/}
      {/*</Form.Item>*/}

      <Form.Item name={inputFieldName}>
        <VariableInferenceInput
          placeholder={placeholder}
          variables={variables}
          className={cx(styles['prompt-editor-provider'])}
        />
      </Form.Item>

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
          />
        )}
    </div>
  );
};

export default ExpandableInputTextarea;
