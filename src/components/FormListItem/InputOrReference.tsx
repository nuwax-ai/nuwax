/*
 * @Author: binxiaolin 18030705033
 * @Date: 2025-01-17 13:41:27
 * @LastEditors: binxiaolin 18030705033
 * @LastEditTime: 2025-01-17 13:43:36
 * @FilePath: \agent-platform-front\src\components\FormListItem\InputOrReference.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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
  const handleSelect = (parentKey: string, childKey: string) => {
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

  return (
    <Input
      value={value && !value.includes('-') ? value : ''} // 如果有选中项，则清空输入框文本
      placeholder={placeholder ? placeholder : '请输入或引用参数'}
      onChange={handleInputChange}
      addonBefore={
        value &&
        value.includes('-') && (
          <Tag closable onClose={() => onChange('')} style={{ marginRight: 8 }}>
            {value}
          </Tag>
        )
      }
      suffix={
        <Dropdown
          overlayStyle={{ width: '200px' }}
          menu={{
            items: referenceList.map((item) => ({
              key: item.key,
              label: item.label,
              icon: item.icon,
              children: item.children?.map((subItem) => ({
                key: subItem.key,
                label: (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '300px',
                    }}
                  >
                    {subItem.label}
                    <Tag style={{ marginLeft: 20 }}>{subItem.tag}</Tag>
                  </div>
                ),
                onClick: () => handleSelect(item.key, subItem.key),
              })),
            })),
          }}
          trigger={['click']}
        >
          <SettingOutlined style={{ cursor: 'pointer' }} />
        </Dropdown>
      }
    />
  );
};
