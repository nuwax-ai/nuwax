import { ICON_OPTIMIZE } from '@/constants/images.constants';
import { ExpandAltOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import React, { useState } from 'react';
import ExpandTextArea from './expandTextarea';
import { ExpandableInputTextareaProps } from './type';

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
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // 添加本地状态

  return (
    <div>
      <div className="dis-sb margin-bottom">
        {/* 名称 */}
        <span className="node-title-style">{title}</span>
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
              onClick={() => setIsExpanded(true)}
            />
          )}
        </div>
      </div>
      {/* 输入框 */}
      <Form.Item name={inputFieldName}>
        <Input.TextArea
          placeholder={placeholder}
          autoSize={{ minRows: rows, maxRows: rows }}
        />
      </Form.Item>

      {/* 如果有展开，就要调用展开的组件 */}
      {isExpanded && ( // 使用本地状态控制显示
        <ExpandTextArea
          title={title}
          inputFieldName={inputFieldName}
          marginRight={388}
          placeholder={placeholder}
          visible={isExpanded}
          onClose={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default ExpandableInputTextarea;
