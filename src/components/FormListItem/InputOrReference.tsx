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
  // 更新表单值为输入框内容
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    }
  };

  // 获取父组件的中文名称
  const getName = (value: string) => {
    // console
    const _id = value.split('.')[0];
    const _item = referenceList.previousNodes.find(
      (item) => item.id === Number(_id),
    );
    return _item?.name;
  };

  const handleTagClose = () => {
    onChange('');
  };

  const menuItems =
    referenceList.previousNodes.length > 0
      ? referenceList.previousNodes.map((item) => ({
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
            onClick: () => onChange(subItem.key as string),
          })),
        }))
      : [
          {
            key: 'no-data',
            label: (
              <div style={{ padding: '8px', color: 'red' }}>
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
          closeIcon
          onClose={handleTagClose}
          className="input-or-reference-tag text-ellipsis "
        >
          {`${getName(value)} - ${referenceList.argMap[value].dataType}`}
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
          items: menuItems,
        }}
        trigger={['click']}
      >
        <SettingOutlined style={{ cursor: 'pointer' }} />
      </Dropdown>
    </div>
  );
};
