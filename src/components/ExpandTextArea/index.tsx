import { ICON_OPTIMIZE } from '@/constants/images.constants';
import { ExpandAltOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
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
              onClick={() => setExpanded(uuid)}
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
      {expanded &&
        expanded === uuid && ( // 使用本地状态控制显示
          <ExpandTextArea
            title={title}
            inputFieldName={inputFieldName}
            marginRight={388}
            placeholder={placeholder}
            visible={expanded === uuid}
            onClose={() => setExpanded('')}
          />
        )}
    </div>
  );
};

export default ExpandableInputTextarea;
