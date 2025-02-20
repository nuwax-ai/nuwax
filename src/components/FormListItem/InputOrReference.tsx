import { SettingOutlined } from '@ant-design/icons';
import { Dropdown, Input, Tag } from 'antd';
import { InputOrReferenceProps } from './type';

export const InputOrReference: React.FC<InputOrReferenceProps> = ({
  referenceList,
  placeholder,
  value,
  onChange,
  // 新增必要参数
  form, // Form 实例（从父组件传入）
  fieldName, // 当前字段路径（如 "inputItems[0].bindValue"）
}) => {
  // InputOrReference.tsx
  const updateValues = (newValue: string, valueType: 'Input' | 'Reference') => {
    // 获取父路径数组
    const basePath = fieldName.slice(0, -1);
    form.setFieldValue([...basePath, 'bindValueType'], valueType); // 使用数组路径

    //  新增 dataType 处理逻辑
    if (valueType === 'Reference') {
      const refDataType = referenceList?.argMap?.[newValue]?.dataType;
      form.setFieldValue([...basePath, 'dataType'], refDataType || 'String');
    } else {
      form.setFieldValue([...basePath, 'dataType'], 'String');
    }
    onChange?.(newValue);
  };
  // 输入处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    updateValues(newValue, 'Input');
  };

  // 清除引用值
  const handleTagClose = () => {
    updateValues('', 'Input'); // 清空时重置为 Input 类型
  };

  // 获取父节点名称
  const getName = (value: string) => {
    const _id = value.split('.')[0];
    const parentNode = referenceList.previousNodes.find(
      (item) => item.id === Number(_id),
    );
    return parentNode?.name;
  };

  // 生成下拉菜单项
  const menuItems =
    referenceList.previousNodes.length > 0
      ? referenceList.previousNodes.map((node) => ({
          key: node.id,
          label: node.name,
          icon: node.icon,
          children: node.outputArgs?.map((arg) => ({
            key: arg.key,
            label: (
              <div
                style={{ display: 'flex', alignItems: 'center', width: 300 }}
              >
                {arg.name}
                <Tag style={{ marginLeft: 20 }}>{arg.dataType}</Tag>
              </div>
            ),
            onClick: () => updateValues(arg.key!, 'Reference'), // 选择时标记为引用类型
          })),
        }))
      : [
          {
            key: 'no-data',
            label: (
              <div style={{ padding: 8, color: 'red' }}>
                需要上级节点添加连线
              </div>
            ),
            disabled: true,
          },
        ];

  return (
    <div className="input-or-reference dis-sb">
      {value && referenceList.argMap[value] ? (
        <Tag
          closable
          onClose={handleTagClose}
          className="input-or-reference-tag text-ellipsis"
        >
          {`${getName(value)} - ${referenceList.argMap[value].dataType}`}
        </Tag>
      ) : (
        <Input
          value={value}
          placeholder={placeholder || '请输入或引用参数'}
          onChange={handleInputChange}
          style={{ marginRight: 8 }}
        />
      )}
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        overlayStyle={{ width: 200 }}
      >
        <SettingOutlined style={{ cursor: 'pointer' }} />
      </Dropdown>
    </div>
  );
};
