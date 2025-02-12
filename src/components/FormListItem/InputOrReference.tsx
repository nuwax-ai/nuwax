import { SettingOutlined } from '@ant-design/icons';
import { Dropdown, Input, Tag } from 'antd';
import { InputOrReferenceProps } from './type';
// 输入或引用参数
export const InputOrReference: React.FC<InputOrReferenceProps> = ({
  referenceList,
  placeholder,
  value, // 使用新增的 value 属性
  onChange, // 使用新增的 onChange 回调
}) => {
  const handleSelect = (parentKey: number, childKey: string) => {
    // 将选中的父选项和子选项作为字符串集合添加到 selected 数组中
    const selectedItem = `${parentKey}-${childKey}`;
    // 调用 onChange 更新值
    onChange(selectedItem);
  };
  // 更新表单值为输入框内容
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleTagClose = () => {
    onChange('');
  };

  return (
    <div className="input-or-reference dis-center">
      {value && value.includes('-') ? (
        <Tag
          closable
          closeIcon
          onClose={handleTagClose}
          className="input-or-reference-tag text-ellipsis "
        >
          {value}
        </Tag>
      ) : (
        <Input
          value={value}
          placeholder={placeholder ? placeholder : '请输入或引用参数'}
          onChange={handleInputChange}
          style={{ marginRight: 8 }}
        />
      )}
      <Dropdown
        overlayStyle={{ width: '200px' }}
        menu={{
          items: referenceList.map((item) => ({
            key: item.id,
            label: item.name,
            icon: item.icon,
            children: item.outputArgs?.map((subItem) => ({
              key: subItem.key,
              label: (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '300px',
                  }}
                >
                  {subItem.name}
                  <Tag style={{ marginLeft: 20 }}>{subItem.dataType}</Tag>
                </div>
              ),
              onClick: () => handleSelect(item.id, subItem.key as string),
            })),
          })),
        }}
        trigger={['click']}
      >
        <SettingOutlined style={{ cursor: 'pointer' }} />
      </Dropdown>
    </div>
  );
};
