import { ICON_OPTIMIZE } from '@/constants/images.constants';
import { ExpandAltOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import React, { useState } from 'react';
import ExpandTextArea from './expandTextarea';
import { ExpandableInputTextareaProps } from './type';

export const ExpandableInputTextarea: React.FC<
  ExpandableInputTextareaProps
> = ({
  title,
  value,
  onChange,
  placeholder,
  rows = 3,
  onExpand,
  onOptimize,
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // 添加本地状态

  return (
    <div className="node-item-style">
      <div className="dis-sb margin-bottom">
        {/* 名称 */}
        <span className="node-title-style">{title}</span>
        <div>
          {/* 是否有展开 */}
          {onExpand && (
            <ExpandAltOutlined onClick={() => setIsExpanded(true)} />
          )}
          {/* 是否有优化 */}
          {onOptimize && <ICON_OPTIMIZE style={{ marginLeft: '10px' }} />}
        </div>
      </div>
      {/* 输入框 */}
      <Input.TextArea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoSize={{ minRows: rows, maxRows: rows }}
        style={{ marginBottom: '10px' }}
      />
      {/* 如果有展开，就要调用展开的组件 */}
      {isExpanded && ( // 使用本地状态控制显示
        <ExpandTextArea
          title={title}
          value={value}
          onChange={(newValue) => onChange(newValue)}
          marginRight={400}
          placeholder={placeholder}
          visible={isExpanded}
          onClose={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default ExpandableInputTextarea;
