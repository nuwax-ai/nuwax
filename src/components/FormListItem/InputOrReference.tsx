import { InputAndOutConfig, PreviousList } from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import { InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { Dropdown, Input, Popover, Tag, Tree } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import './index.less';
import { InputOrReferenceProps } from './type';

/**
 * 计算字符串显示长度，中文字符计为2，英文和数字计为1
 * @param str 要计算的字符串
 * @returns 显示长度
 */
const getDisplayLength = (str: string): number => {
  if (!str) return 0;
  // 使用正则表达式匹配中文字符，计算长度
  let length = 0;
  for (let i = 0; i < str.length; i++) {
    // 判断是否是中文字符（包括中文标点符号）
    if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(str[i])) {
      length += 2; // 中文字符计为2
    } else {
      length += 1; // 英文、数字和其他字符计为1
    }
  }
  return length;
};

/**
 * 按照显示长度截取字符串
 * @param str 要截取的字符串
 * @param maxLength 最大显示长度
 * @returns 截取后的字符串
 */
const truncateByDisplayLength = (str: string, maxLength: number): string => {
  if (!str) return '';

  let length = 0;
  let result = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const charLength = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char)
      ? 2
      : 1;

    // 如果添加当前字符会超出最大长度，就停止添加
    if (length + charLength > maxLength) {
      break;
    }

    result += char;
    length += charLength;
  }

  // 如果截取了字符，添加省略号
  if (result.length < str.length) {
    result += '...';
  }

  return result;
};

const InputOrReference: React.FC<InputOrReferenceProps> = ({
  placeholder,
  form,
  fieldName,
  style,
  isDisabled = false,
  referenceType = 'Reference',
  isLoop,
  value, // 接收注入的 value
  onChange, // 接收注入的 onChange
  onReferenceSelect, // 受控模式的引用选择回调
}) => {
  const { referenceList, getValue, getLoopValue, setIsModified } =
    useModel('workflow');
  const [displayValue, setDisplayValue] = useState('');
  const [selectKey, setSelectKey] = useState<React.Key[]>([value || '']);
  // 添加状态来存储 Tree 的最大高度
  const [treeMaxHeight, setTreeMaxHeight] = useState(300);

  // 计算 Tree 的最大高度
  useEffect(() => {
    const calculateTreeHeight = () => {
      // 获取视窗高度
      const windowHeight = window.innerHeight;
      // 获取当前元素的位置信息
      const element = document.querySelector('.input-or-reference');
      if (element) {
        const rect = element.getBoundingClientRect();
        // 计算可用高度：视窗高度 - 元素顶部位置 - 底部边距(20px)
        const availableHeight = windowHeight - rect.top - 20;
        // 设置最大高度，最小 200px，最大 400px
        setTreeMaxHeight(Math.min(Math.max(availableHeight, 150), 400));
      }
    };

    // 初始计算
    calculateTreeHeight();
    // 监听窗口大小变化
    window.addEventListener('resize', calculateTreeHeight);
    // 监听滚动事件
    window.addEventListener('scroll', calculateTreeHeight);

    return () => {
      window.removeEventListener('resize', calculateTreeHeight);
      window.removeEventListener('scroll', calculateTreeHeight);
    };
  }, []);

  const updateValues = (newValue: string, valueType: 'Input' | 'Reference') => {
    if (fieldName && form) {
      const basePath = fieldName.slice(0, -1);
      form.setFieldValue([...basePath, 'bindValueType'], valueType);

      if (valueType === 'Reference') {
        const refDataType = referenceList?.argMap?.[newValue]?.dataType;
        form.setFieldValue([...basePath, 'dataType'], refDataType || 'String');
        form.setFieldValue(fieldName, newValue);
        const _name = form.getFieldValue([...basePath, 'name']);
        if (!_name || isDisabled) {
          form.setFieldValue(
            [...basePath, 'name'],
            referenceList.argMap[newValue].name,
          );
        }
      } else {
        form.setFieldValue([...basePath, 'dataType'], 'String');
        form.setFieldValue(fieldName, newValue);
      }
    }
    setIsModified(true); // 标记为已修改
  };

  // 监听表单值变化
  useEffect(() => {
    if (fieldName && form) {
      const value = form.getFieldValue(fieldName);
      const bindValueType = form.getFieldValue([
        ...fieldName.slice(0, -1),
        'bindValueType',
      ]);

      if (bindValueType === 'Reference') {
        const isReferenceKey = value && referenceList.argMap[value];
        setDisplayValue(
          isReferenceKey
            ? isLoop
              ? getLoopValue(value)
              : getValue(value)
            : '',
        );
      } else {
        setDisplayValue(''); // Input类型时不显示Tag
      }
    }
  }, [form?.getFieldsValue(), referenceList.argMap]);

  // 清除引用值
  const handleTagClose = () => {
    updateValues('', 'Input');
    setDisplayValue('');
    setSelectKey(['']);

    // 清空条件分支中的名称 name
    const basePath = fieldName?.slice(0, -1) ?? [];
    form?.setFieldValue([...basePath, 'name'], '');
  };

  // 输入处理
  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   updateValues(e.target.value, 'Input');
  // };

  const renderTitle = (nodeData: InputAndOutConfig) => {
    return (
      <div className="tree-custom-title-style">
        <span title="">{nodeData.name}</span>
        <Popover content={nodeData.description || '暂无描述'}>
          <InfoCircleOutlined
            title=""
            style={{ marginLeft: '4px', fontSize: 12 }}
          />
        </Popover>
        <Tag
          color="#C9CDD4"
          style={{
            marginLeft: '8px',
            fontSize: 10,
            lineHeight: '14px',
          }}
        >
          {nodeData.dataType}
        </Tag>
      </div>
    );
  };

  // 处理 TreeSelect 的选中事件
  const handleTreeSelectChange = (key: React.Key[]) => {
    if (!key || !key.length) return;
    const selectedValue = key[0] as string;
    const refDataType =
      referenceList?.argMap?.[selectedValue]?.dataType || 'String';
    const refName = referenceList?.argMap?.[selectedValue]?.name || '';

    // 如果提供了 onReferenceSelect 回调，使用它（受控模式）
    if (onReferenceSelect) {
      onReferenceSelect(selectedValue, 'Reference', refDataType, refName);
    } else {
      // 否则使用传统的 form.setFieldValue 方式
      updateValues(selectedValue, 'Reference');
    }

    onChange?.(selectedValue); // 通知 Form.Item 值已更新
    setDisplayValue(getValue(key[0]));
    setSelectKey(key); // 更新 selectKey 状态
    setIsModified(true);
  };
  // 动态生成 Dropdown 的 items
  const getMenu = (nodes: PreviousList[]) => {
    if (nodes && nodes.length) {
      let isHitSelect = false;
      return nodes.map((node) => {
        const hasTreeChildren = node?.outputArgs.some(
          (args) => args?.children?.length && args?.children?.length > 0,
        );
        return {
          key: node.id,
          label:
            getDisplayLength(node.name) > 16
              ? truncateByDisplayLength(node.name, 16)
              : node.name,
          icon: returnImg(node.type),
          popupClassName: 'inputOrReferencePopup',
          children: node.outputArgs
            ? [
                {
                  key: `${node.id}-tree-select`,
                  label: (
                    <div
                      style={{
                        paddingTop: 12,
                        paddingRight: 12,
                        paddingBottom: 8,
                      }}
                      onClick={(e) => {
                        // 阻止所有点击事件的冒泡，除了 onSelect
                        if (!isHitSelect) {
                          e.stopPropagation();
                          e.preventDefault();
                        }
                      }}
                    >
                      <Tree
                        onSelect={(keys) => {
                          handleTreeSelectChange(keys);
                          isHitSelect = true;
                        }}
                        defaultExpandAll
                        treeData={node.outputArgs}
                        fieldNames={{
                          title: 'name',
                          key: 'key',
                          children: 'children',
                        }}
                        titleRender={renderTitle}
                        defaultSelectedKeys={selectKey}
                        selectedKeys={selectKey}
                        blockNode
                        className={`custom-tree-style ${
                          hasTreeChildren ? '' : 'custom-tree-no-children-style'
                        }`}
                        style={{
                          maxHeight: `${treeMaxHeight}px`,
                          overflow: 'auto',
                        }}
                      />
                    </div>
                  ),
                },
              ]
            : undefined,
        };
      });
    } else {
      return [
        {
          key: 'no-data',
          popupClassName: 'inputOrReferencePopup',
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
    if (isLoop) {
      return getMenu(referenceList.innerPreviousNodes);
    } else {
      return getMenu(referenceList.previousNodes);
    }
  };

  return (
    <div className="input-or-reference dis-sb" style={style}>
      {referenceType === 'Reference' || referenceType === null ? (
        displayValue ? (
          <Tag
            closable
            onClose={handleTagClose}
            className="input-or-reference-tag text-ellipsis"
            color="#C9CDD4"
          >
            {displayValue.length > 10 ? (
              <Popover content={displayValue} placement="topRight">
                <span className="tag-text-style">{displayValue}</span>
              </Popover>
            ) : (
              <span className="tag-text-style">{displayValue}</span>
            )}
          </Tag>
        ) : (
          <Input
            placeholder={placeholder || '请输入或引用参数'}
            style={{ marginRight: 8 }}
            size="small"
            disabled={isDisabled}
            onChange={(e) => {
              onChange?.(e.target.value);
              updateValues(e.target.value, 'Input');
            }}
          />
        )
      ) : (
        <Input
          placeholder={placeholder || '请输入或引用参数'}
          style={{ marginRight: 8 }}
          size="small"
          disabled={isDisabled}
          value={value}
          onChange={(e) => {
            onChange?.(e.target.value);
            updateValues(e.target.value, 'Input');
          }}
        />
      )}

      <Dropdown
        menu={{
          items: getMenuItems(), // 强制子菜单向左对齐
          style: { maxHeight: 328 },
        }}
        trigger={['click']}
        overlayStyle={{ minWidth: 200 }}
        placement="bottomRight" // 设置弹窗向左对齐
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
