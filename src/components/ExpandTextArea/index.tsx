import { ICON_OPTIMIZE } from '@/constants/images.constants';
import { ExpandAltOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import React, { useEffect, useState } from 'react';
import SmartVariableInput from '../SmartVariableInput';
import ExpandTextArea from './expandTextarea';
import { ExpandableInputTextareaProps } from './type';
const convertVariables = (inputVariables: any[]): any[] => {
  return inputVariables.reduce((acc, item) => {
    const { key, name: title, subArgs } = item;
    const _key = key || title;
    if (_key === null || _key === undefined) {
      return acc;
    }
    //同级 title 相同要去重
    const isExist = acc.find(
      (item: any) => item.key === _key || item.title === _key,
    );
    if (isExist) {
      return acc;
    }

    acc.push({
      key: _key,
      title: title,
      children: convertVariables(subArgs || []),
    });
    return acc;
  }, []);
};

export const ExpandableInputTextarea: React.FC<
  ExpandableInputTextareaProps
> = ({
  title,
  inputFieldName,
  placeholder,
  // rows = 3,
  value,
  onExpand,
  onOptimize,
  onOptimizeClick,
  inputVariables, // 输入参数
  form,
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // 添加本地状态
  const [variables, setVariables] = useState<any[]>([]);

  useEffect(() => {
    if (inputVariables) {
      setVariables(convertVariables(inputVariables));
    }
  }, [inputVariables]);

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
      {/* 输入框 实现一个功能就是用户在输入 {{}} 的时候，popover自动提示可输入变量名，变量名是知识库的输出参数 */}
      <Form.Item name={inputFieldName}>
        <SmartVariableInput
          value={value}
          variables={variables}
          placeholder={placeholder}
          onChange={(value) => {
            form?.setFieldValue(inputFieldName, value);
          }}
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
