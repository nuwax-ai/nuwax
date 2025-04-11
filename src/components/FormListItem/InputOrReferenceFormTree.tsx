import { InputAndOutConfig, PreviousList } from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import { SettingOutlined } from '@ant-design/icons';
import { Dropdown, Input, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import './index.less';

interface Event {
  key: string;
  keyPath: string[];
  domEvent: React.MouseEvent;
}

type MenuItem = {
  key: string;
  label: React.ReactNode;
  onClick: (e: Event) => void;
  children?: MenuItem[];
};

interface InputOrReferenceProps {
  placeholder?: string;
  style?: React.CSSProperties;
  isDisabled?: boolean;
  referenceType?: 'Input' | 'Reference';
  isLoop?: boolean;
  value?: string;
  onChange?: (value: string, type: 'Input' | 'Reference') => void;
}

const InputOrReference: React.FC<InputOrReferenceProps> = ({
  placeholder,
  style,
  isDisabled = false,
  referenceType = 'Reference',
  value,
  onChange,
}) => {
  const { referenceList, getValue } = useModel('workflow');
  const [displayValue, setDisplayValue] = useState('');
  const [inputValue, setInputValue] = useState(''); // 新增状态用于存储输入框的值
  const updateValues = (newValue: string, valueType: 'Input' | 'Reference') => {
    onChange?.(newValue, valueType);
    if (valueType === 'Reference') {
      setDisplayValue(newValue);
    }
  };

  // 监听值变化
  useEffect(() => {
    if (referenceType === 'Reference' && value) {
      const isReferenceKey = value && referenceList.argMap[value];
      setDisplayValue(isReferenceKey ? getValue(value) : '');
    } else {
      setDisplayValue('');
      if (referenceType === 'Input') {
        setInputValue(value || '');
      }
    }
  }, [value, referenceList.argMap, referenceType]);

  // 清除引用值
  const handleTagClose = () => {
    updateValues('', 'Input');
    setDisplayValue('');
  };

  // 递归处理函数
  const mapChildren = (items: InputAndOutConfig[], level = 0): MenuItem[] => {
    return items.map((item) => ({
      key: item.key!,
      label: (
        <div
          className="reference-item-child"
          style={{ marginLeft: level * 10 }}
        >
          <span>{item.name}</span>
          <Tag className="ml-20" color="#C9CDD4">
            {item.dataType}
          </Tag>
        </div>
      ),
      onClick: (e: Event) => {
        e.domEvent.stopPropagation();
        updateValues(e.key!, 'Reference');
        setDisplayValue(getValue(e.key!));
      },
      children: item.children
        ? mapChildren(item.children, level + 1)
        : undefined,
    }));
  };

  const changeMenuItem = (arr: PreviousList[]) => {
    if (arr.length > 0) {
      return arr.map((node) => ({
        key: node.id,
        label: node.name,
        icon: returnImg(node.type),
        children: node.outputArgs?.flatMap((arg) => [
          {
            key: arg.key,
            label: (
              <div className="reference-item-child">
                <span>{arg.name}</span>
                <Tag className="ml-20" color="#C9CDD4">
                  {arg.dataType}
                </Tag>
              </div>
            ),
            onClick: () => {
              //   onChange?.(arg.key!);
              updateValues(arg.key!, 'Reference');
              setDisplayValue(getValue(arg.key!));
            },
          },
          ...(arg.children ? mapChildren(arg.children) : []),
        ]),
      }));
    } else {
      return [
        {
          key: 'no-data',
          label: (
            <div style={{ padding: 8, color: 'red' }}>
              未添加上级节点连线或上级节点无参数
            </div>
          ),
          disabled: true,
        },
      ];
    }
  };

  const getMenuItems = () => {
    return changeMenuItem(referenceList.previousNodes);
  };

  return (
    <div className="input-or-reference dis-sb" style={style}>
      {referenceType === 'Reference' && displayValue !== '' ? (
        <Tag
          closable
          onClose={handleTagClose}
          className="input-or-reference-tag text-ellipsis"
          color="#C9CDD4"
        >
          <span className="tag-text-style">{displayValue}</span>
        </Tag>
      ) : (
        <Input
          placeholder={placeholder || '请输入或引用参数'}
          style={{ marginRight: 8 }}
          size="small"
          disabled={isDisabled}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          onBlur={() => {
            updateValues(inputValue, 'Input');
          }}
        />
      )}

      <Dropdown
        menu={{
          items: getMenuItems(),
        }}
        trigger={['click']}
        overlayStyle={{ width: 200 }}
        placement="bottomLeft"
      >
        <SettingOutlined
          style={{ cursor: 'pointer' }}
          className="input-reference-icon-style"
        />
      </Dropdown>
    </div>
  );
};

export default InputOrReference;
