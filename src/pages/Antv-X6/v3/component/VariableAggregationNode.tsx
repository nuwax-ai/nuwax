// 变量聚合节点
import { DataTypeMap } from '@/constants/common.constants';
import { DataTypeEnum } from '@/types/enums/common';
import {
  InputAndOutConfig,
  PreviousList,
  VariableGroup,
} from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { returnImg } from '@/utils/workflow';
import {
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Form, Input, Popover, Tag, Tree } from 'antd';
import React, { useEffect } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import { TreeOutput } from './commonNode';

/**
 * 变量聚合节点组件
 * 重构版本 - 更紧凑的 UI，自动类型推断，类型过滤
 */
const VariableAggregationNode: React.FC<NodeDisposeProps> = ({ form }) => {
  const strategyOptions = [
    { label: '返回每个分组中第一个非空的值', value: 'FIRST_NON_NULL' },
  ];

  // 获取 workflow model 中的引用列表和状态
  const { setIsModified, referenceList, getValue } = useModel('workflow');

  // 使用 Form.useWatch 监听 variableGroups
  const variableGroups: VariableGroup[] =
    Form.useWatch('variableGroups', { form, preserve: true }) || [];

  // 监听 inputArgs 用于初始化回显
  const inputArgsFromForm = Form.useWatch('inputArgs', {
    form,
    preserve: true,
  });

  // 使用 ref 标记是否已经初始化过
  // 使用 ref 标记是否已经初始化过
  const isInitialized = React.useRef(false);

  // 初始化：从 inputArgs 生成 variableGroups（用于回显已保存的数据）
  useEffect(() => {
    if (isInitialized.current) return;

    const existingGroups = form.getFieldValue('variableGroups');
    if (existingGroups?.length > 0) {
      isInitialized.current = true;
      return;
    }

    if (!inputArgsFromForm?.length) return;

    // 检查是否有需要从 argMap 获取 subArgs 的变量引用
    const hasComplexTypeWithBindValue = inputArgsFromForm.some((arg: any) => {
      const isComplexType =
        arg.dataType === DataTypeEnum.Object ||
        arg.dataType === DataTypeEnum.Array_Object;
      const hasBindValue = (arg.subArgs || arg.children || []).some(
        (subArg: any) => subArg.bindValue,
      );
      return isComplexType && hasBindValue;
    });

    // 如果有复杂类型需要 subArgs，但 argMap 还没加载，则等待
    const argMapKeys = Object.keys(referenceList?.argMap || {});
    if (hasComplexTypeWithBindValue && argMapKeys.length === 0) {
      return; // 等待 referenceList 加载完成
    }

    // 将 inputArgs 转换为 variableGroups 格式
    const initialGroups: VariableGroup[] = inputArgsFromForm.map(
      (arg: any) => ({
        id: arg.key || uuidv4(),
        name: arg.name || 'Group',
        dataType: arg.dataType || DataTypeEnum.String,
        inputs:
          (arg.subArgs || arg.children || []).map((subArg: any) => {
            // 从 referenceList.argMap 获取完整的子字段信息
            // 因为后端返回的 inputArgs 中变量引用的 subArgs 可能是 null
            const bindValue = subArg.bindValue || '';
            const refInfo = referenceList?.argMap?.[bindValue];
            const refSubArgs = refInfo?.subArgs || refInfo?.children || [];

            return {
              key: subArg.key || uuidv4(),
              name: subArg.name || '',
              dataType: subArg.dataType || DataTypeEnum.String,
              description: subArg.description || '',
              require: subArg.require ?? false,
              systemVariable: subArg.systemVariable ?? false,
              bindValue: bindValue,
              bindValueType: subArg.bindValueType || 'Reference',
              // 优先使用 referenceList 中的子字段信息，其次使用原有数据
              subArgs:
                refSubArgs.length > 0
                  ? refSubArgs
                  : subArg.subArgs || subArg.children || [],
            };
          }) || [],
      }),
    );

    if (initialGroups.length > 0) {
      isInitialized.current = true;
      form.setFieldsValue({ variableGroups: initialGroups });
    }
  }, [inputArgsFromForm, form, referenceList]);

  // 当 variableGroups 变化时，同步更新 inputArgs 和 outputArgs
  useEffect(() => {
    if (!variableGroups || variableGroups.length === 0) {
      form.setFieldsValue({ inputArgs: [], outputArgs: [] });
      return;
    }

    // 递归深度复制子字段结构（支持多级嵌套）
    // 为输出生成唯一 key，避免 React 重复 key 警告
    const deepCopySubArgs = (
      items: InputAndOutConfig[] | undefined,
      parentKey: string = '',
    ): InputAndOutConfig[] => {
      if (!items || items.length === 0) return [];
      return items.map((item, index) => {
        // 生成唯一 key：父级key + 名称 + 索引，确保唯一性
        const uniqueKey = `${parentKey}_${item.name || index}_${uuidv4().slice(
          0,
          8,
        )}`;
        return {
          name: item.name || '',
          dataType: item.dataType || DataTypeEnum.String,
          description: item.description || '',
          require: item.require ?? false,
          systemVariable: item.systemVariable ?? false,
          bindValue: '',
          key: uniqueKey,
          // 递归复制嵌套的子字段
          subArgs: deepCopySubArgs(item.subArgs || item.children, uniqueKey),
        };
      });
    };

    // 生成 inputArgs
    const inputArgs: InputAndOutConfig[] = variableGroups.map((group) => {
      const groupEntry: InputAndOutConfig = {
        key: group.id || group.name || uuidv4(),
        name: group.name || 'Group',
        dataType: group.dataType || DataTypeEnum.String,
        description: `${group.name || 'Group'} ${
          DataTypeMap[group.dataType || DataTypeEnum.String] || ''
        }`,
        require: false,
        systemVariable: false,
        bindValue: '',
      };

      if (Array.isArray(group.inputs) && group.inputs.length > 0) {
        groupEntry.subArgs = group.inputs.map((input) => ({
          key: input.key || uuidv4(),
          name: input.name || '',
          dataType: input.dataType || DataTypeEnum.String,
          description: input.description || '',
          require: input.require ?? false,
          systemVariable: input.systemVariable ?? false,
          bindValue: input.bindValue || '',
          bindValueType: input.bindValueType || 'Reference',
          subArgs: input.subArgs || [],
        }));
      }

      return groupEntry;
    });

    // 生成 outputArgs - 根据需求 5 调整逻辑
    const outputArgs: InputAndOutConfig[] = variableGroups.map((group) => {
      const isComplexType =
        group.dataType === DataTypeEnum.Object ||
        group.dataType === DataTypeEnum.Array_Object;
      // 找到第一个有效的变量引用（有 bindValue 的）
      const firstValidInput = (group.inputs || []).find(
        (input) => input.bindValue,
      );

      const base: InputAndOutConfig = {
        name: group.name || 'Group',
        dataType: group.dataType || DataTypeEnum.String,
        description: `${group.name || 'Group'} ${
          DataTypeMap[group.dataType || DataTypeEnum.String] || ''
        }`,
        require: false,
        systemVariable: false,
        bindValue: '',
        key: group.id || group.name || uuidv4(),
      };

      // 需求 5: 复杂类型输出展示逻辑
      // 只有复杂类型且有有效引用时才展示子字段
      const firstInputSubArgs =
        firstValidInput?.subArgs || firstValidInput?.children;
      if (isComplexType && firstInputSubArgs && firstInputSubArgs.length > 0) {
        // 直接展示第一个引用的子字段（不展示引用变量名本身）
        // 使用递归函数支持多级嵌套
        base.subArgs = deepCopySubArgs(firstInputSubArgs);
      }
      // 非复杂类型或无子字段：不展示子字段

      return base;
    });

    form.setFieldsValue({ inputArgs, outputArgs });
  }, [variableGroups, form]);

  // 更新分组并触发保存
  const updateGroups = (newGroups: VariableGroup[]) => {
    form.setFieldsValue({ variableGroups: newGroups });
    setIsModified(true);
  };

  // 添加分组 - 默认类型为 String
  const handleAddGroup = () => {
    const newGroup: VariableGroup = {
      id: uuidv4(),
      name: `Group${variableGroups.length + 1}`,
      dataType: DataTypeEnum.String,
      inputs: [],
    };
    updateGroups([...variableGroups, newGroup]);
  };

  // 删除分组
  const handleRemoveGroup = (groupIndex: number) => {
    const newGroups = variableGroups.filter((_, i) => i !== groupIndex);
    updateGroups(newGroups);
  };

  // 更新分组属性
  const handleUpdateGroup = (
    groupIndex: number,
    updates: Partial<VariableGroup>,
  ) => {
    const newGroups = variableGroups.map((group, i) =>
      i === groupIndex ? { ...group, ...updates } : group,
    );
    updateGroups(newGroups);
  };

  // 添加输入项
  const handleAddInput = (groupIndex: number) => {
    const group = variableGroups[groupIndex];
    const newInput: InputAndOutConfig = {
      key: uuidv4(),
      name: '',
      bindValue: '',
      bindValueType: 'Reference',
      dataType: DataTypeEnum.String,
      description: '',
      require: false,
      systemVariable: false,
    };
    handleUpdateGroup(groupIndex, {
      inputs: [...(group.inputs || []), newInput],
    });
  };

  // 删除输入项
  const handleRemoveInput = (groupIndex: number, inputIndex: number) => {
    const group = variableGroups[groupIndex];
    const newInputs = (group.inputs || []).filter((_, i) => i !== inputIndex);

    // 如果删除的是第一个且还有其他项，需要重新推断类型
    if (inputIndex === 0 && newInputs.length > 0) {
      const newFirstInput = newInputs[0];
      const newType = newFirstInput.dataType || DataTypeEnum.String;
      handleUpdateGroup(groupIndex, { inputs: newInputs, dataType: newType });
    } else if (newInputs.length === 0) {
      // 如果删空了，重置类型为 String
      handleUpdateGroup(groupIndex, {
        inputs: newInputs,
        dataType: DataTypeEnum.String,
      });
    } else {
      handleUpdateGroup(groupIndex, { inputs: newInputs });
    }
  };

  // 处理变量引用选择
  const handleReferenceSelect = (
    groupIndex: number,
    inputIndex: number,
    selectedKey: string,
  ) => {
    const group = variableGroups[groupIndex];
    const refInfo = referenceList?.argMap?.[selectedKey];
    if (!refInfo) return;

    const refDataType = refInfo.dataType || DataTypeEnum.String;
    const refName = refInfo.name || '';
    const refSubArgs = refInfo.subArgs || refInfo.children || [];

    const updates: Partial<InputAndOutConfig> = {
      bindValue: selectedKey,
      bindValueType: 'Reference',
      dataType: refDataType as DataTypeEnum,
      name: refName,
      subArgs: refSubArgs,
    };

    const newInputs = (group.inputs || []).map((input, i) =>
      i === inputIndex ? { ...input, ...updates } : input,
    );

    // 需求 3: 如果是第一个引用，自动设置分组类型
    if (
      inputIndex === 0 ||
      (group.inputs || []).filter((i) => i.bindValue).length === 0
    ) {
      handleUpdateGroup(groupIndex, {
        inputs: newInputs,
        dataType: refDataType as DataTypeEnum,
      });
    } else {
      handleUpdateGroup(groupIndex, { inputs: newInputs });
    }
  };

  // 清除变量引用
  const handleClearReference = (groupIndex: number, inputIndex: number) => {
    const group = variableGroups[groupIndex];
    const newInputs = (group.inputs || []).map((input, i) =>
      i === inputIndex
        ? {
            ...input,
            bindValue: '',
            bindValueType: 'Input' as const,
            name: '',
            subArgs: [],
          }
        : input,
    );

    // 如果清除的是第一个且还有其他有效引用，重新推断类型
    if (inputIndex === 0) {
      const nextValidInput = newInputs.find(
        (inp, idx) => idx > 0 && inp.bindValue,
      );
      if (nextValidInput && nextValidInput.dataType) {
        handleUpdateGroup(groupIndex, {
          inputs: newInputs,
          dataType: nextValidInput.dataType,
        });
      } else {
        handleUpdateGroup(groupIndex, {
          inputs: newInputs,
          dataType: DataTypeEnum.String,
        });
      }
    } else {
      handleUpdateGroup(groupIndex, { inputs: newInputs });
    }
  };

  // 获取分组的允许类型（由第一个有效引用决定）
  const getGroupAllowedType = (
    group: VariableGroup,
  ): DataTypeEnum | undefined => {
    const firstValidInput = (group.inputs || []).find(
      (input) => input.bindValue,
    );
    return firstValidInput?.dataType ?? undefined;
  };

  // 获取分组内已选的变量 keys
  const getSelectedKeys = (group: VariableGroup): Set<string> => {
    return new Set(
      (group.inputs || [])
        .map((input) => input.bindValue)
        .filter(Boolean) as string[],
    );
  };

  // 自定义变量选择器渲染
  const renderVariableSelector = (
    group: VariableGroup,
    groupIndex: number,
    input: InputAndOutConfig,
    inputIndex: number,
  ) => {
    const allowedType = getGroupAllowedType(group);
    const selectedKeys = getSelectedKeys(group);
    const displayValue = input.bindValue ? getValue(input.bindValue) : '';

    // 扩展类型，添加 disabled 和 originalKey 属性
    type FilteredArg = InputAndOutConfig & {
      disabled?: boolean;
      originalKey?: string;
    };

    // 全局计数器用于生成唯一 key
    let keyCounter = 0;

    // 过滤变量树
    const filterOutputArgs = (
      outputArgs: InputAndOutConfig[],
      allowedType: DataTypeEnum | undefined,
      selectedKeys: Set<string>,
    ): FilteredArg[] => {
      return outputArgs
        .map((arg): FilteredArg => {
          const originalKey = arg.key || '';
          const isDisabled =
            selectedKeys.has(originalKey) ||
            (allowedType && arg.dataType !== allowedType);

          const filteredChildren = arg.children
            ? filterOutputArgs(arg.children, allowedType, selectedKeys)
            : undefined;

          // 生成唯一 key 用于 React 渲染，保留原始 key 用于引用查找
          const uniqueKey = `${originalKey}__${keyCounter++}`;

          return {
            ...arg,
            key: uniqueKey,
            originalKey: originalKey, // 保留原始 key
            disabled: isDisabled,
            children: filteredChildren,
          };
        })
        .filter((arg) => !selectedKeys.has(arg.originalKey || '')); // 使用 originalKey 过滤
    };

    // 渲染树节点标题
    const renderTitle = (nodeData: FilteredArg) => {
      const isDisabled = nodeData.disabled;
      return (
        <div
          className="tree-custom-title-style"
          style={{ opacity: isDisabled ? 0.5 : 1 }}
        >
          <span>{nodeData.name}</span>
          <Tag
            color="#C9CDD4"
            style={{ marginLeft: 8, fontSize: 10, lineHeight: '14px' }}
          >
            {nodeData.dataType}
          </Tag>
        </div>
      );
    };

    // 从唯一 key 中提取原始 key
    const extractOriginalKey = (uniqueKey: string): string => {
      const idx = uniqueKey.lastIndexOf('__');
      return idx > 0 ? uniqueKey.substring(0, idx) : uniqueKey;
    };

    // 生成下拉菜单
    const getMenu = (nodes: PreviousList[]) => {
      if (!nodes?.length) {
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

      return nodes.map((node) => {
        const filteredOutputArgs = filterOutputArgs(
          node.outputArgs || [],
          allowedType,
          selectedKeys,
        );

        return {
          key: node.id,
          label:
            node.name.length > 12 ? node.name.slice(0, 12) + '...' : node.name,
          icon: returnImg(node.type),
          popupClassName: 'inputOrReferencePopup',
          children: [
            {
              key: `${node.id}-tree`,
              label: (
                <div
                  style={{ padding: '12px 12px 8px' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Tree
                    onSelect={(keys) => {
                      if (keys[0]) {
                        // 从唯一 key 中提取原始 key 用于引用查找
                        const originalKey = extractOriginalKey(
                          keys[0] as string,
                        );
                        handleReferenceSelect(
                          groupIndex,
                          inputIndex,
                          originalKey,
                        );
                      }
                    }}
                    defaultExpandAll
                    treeData={filteredOutputArgs}
                    fieldNames={{
                      title: 'name',
                      key: 'key',
                      children: 'children',
                    }}
                    titleRender={renderTitle}
                    blockNode
                    className="custom-tree-style"
                    style={{ maxHeight: 300, overflow: 'auto' }}
                  />
                </div>
              ),
            },
          ],
        };
      });
    };

    return (
      <div className="dis-sb" style={{ flex: 1 }}>
        {displayValue ? (
          <Tag
            closable
            onClose={() => handleClearReference(groupIndex, inputIndex)}
            className="input-or-reference-tag text-ellipsis"
            color="#C9CDD4"
            style={{ maxWidth: '100%', marginRight: 8 }}
          >
            {displayValue.length > 15 ? (
              <Popover content={displayValue} placement="topRight">
                <span className="tag-text-style">{displayValue}</span>
              </Popover>
            ) : (
              <span className="tag-text-style">{displayValue}</span>
            )}
          </Tag>
        ) : (
          <span style={{ color: '#bbb', fontSize: 12, marginRight: 8 }}>
            选择变量
          </span>
        )}
        <Dropdown
          menu={{ items: getMenu(referenceList.previousNodes || []) }}
          trigger={['click']}
          overlayStyle={{ minWidth: 200 }}
          placement="bottomRight"
        >
          <SettingOutlined
            style={{ cursor: 'pointer' }}
            className="input-reference-icon-style"
          />
        </Dropdown>
      </div>
    );
  };

  // 计算当前分组的类型显示
  const getGroupTypeDisplay = (group: VariableGroup) => {
    const type = group.dataType || DataTypeEnum.String;
    return DataTypeMap[type] || type;
  };

  return (
    <>
      <div className="node-item-style">
        <div className="node-title-style margin-bottom">聚合策略</div>
        <Form.Item name="aggregationStrategy" initialValue="FIRST_NON_NULL">
          <select
            className="ant-select ant-select-sm"
            style={{
              width: '100%',
              height: 24,
              borderRadius: 4,
              border: '1px solid #d9d9d9',
              padding: '0 8px',
            }}
          >
            {strategyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Form.Item>
      </div>

      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">分组配置</span>
          <Button
            icon={<PlusOutlined />}
            onClick={handleAddGroup}
            size="small"
            type="text"
          />
        </div>

        {variableGroups.map((group, groupIndex) => (
          <div
            key={group.id || groupIndex}
            className="form-list-style"
            style={{ marginBottom: 8, padding: 8 }}
          >
            {/* 分组头部 - 紧凑布局 */}
            <div className="dis-sb" style={{ marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Input
                  size="small"
                  placeholder="分组名称"
                  value={group.name}
                  onChange={(e) =>
                    handleUpdateGroup(groupIndex, { name: e.target.value })
                  }
                  style={{ width: 100, marginRight: 8 }}
                />
                <Tag color="#E8E8E8" style={{ fontSize: 10 }}>
                  {getGroupTypeDisplay(group)}
                </Tag>
              </div>
              <div>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => handleAddInput(groupIndex)}
                  size="small"
                  type="text"
                  style={{ padding: '0 4px' }}
                />
                <Button
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveGroup(groupIndex)}
                  size="small"
                  type="text"
                  danger
                  style={{ padding: '0 4px' }}
                />
              </div>
            </div>

            {/* 变量引用列表 - 紧凑，无参数名 */}
            {(group.inputs || []).map((input, inputIndex) => (
              <div
                key={input.key || inputIndex}
                className="dis-sb"
                style={{ marginTop: 4 }}
              >
                {renderVariableSelector(group, groupIndex, input, inputIndex)}
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  type="text"
                  onClick={() => handleRemoveInput(groupIndex, inputIndex)}
                  style={{ marginLeft: 4, padding: '0 4px' }}
                />
              </div>
            ))}

            {/* 空状态提示 */}
            {(!group.inputs || group.inputs.length === 0) && (
              <div
                style={{
                  color: '#bbb',
                  fontSize: 12,
                  textAlign: 'center',
                  padding: '8px 0',
                }}
              >
                点击 + 添加变量引用
              </div>
            )}
          </div>
        ))}

        {variableGroups.length === 0 && (
          <div
            style={{
              color: '#bbb',
              fontSize: 12,
              textAlign: 'center',
              padding: 16,
            }}
          >
            点击 + 添加分组
          </div>
        )}
      </div>

      {/* 输出展示 */}
      <Form.Item shouldUpdate noStyle>
        {() => {
          const outputArgs = form.getFieldValue('outputArgs') || [];
          return outputArgs.length > 0 ? (
            <>
              <div className="node-title-style margin-bottom">输出</div>
              <TreeOutput treeData={outputArgs} />
            </>
          ) : null;
        }}
      </Form.Item>
    </>
  );
};

export default VariableAggregationNode;
