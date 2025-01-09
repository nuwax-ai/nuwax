import { CheckOutlined } from '@ant-design/icons';
import { Flex, Select } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface SelectListType {
  className?: string;
  value: string | number;
  // 自定义前缀
  prefix?: React.ReactNode;
  // 自定义的选择框后缀图标
  suffixIcon?: React.ReactNode;
  dropdownRenderComponent?: React.ReactNode;
  placeholder?: string;
  options: { label; value }[];
  // 是否选中的图标或者图片
  selectIcon?: React.ReactNode;
  // label文本前的图片
  img?: string;
  onChange: (value: string) => void;
}

const SelectList: React.FC<SelectListType> = (props) => {
  const {
    className,
    value,
    dropdownRenderComponent,
    placeholder,
    options,
    selectIcon,
    img,
    onChange,
  } = props;
  return (
    <Select
      rootClassName={cx(styles.container, className)}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      open
      options={options}
      dropdownRender={(menu) => (
        <>
          {menu}
          {dropdownRenderComponent}
        </>
      )}
      optionRender={(option) => (
        <Flex gap={8}>
          <div className={cx(styles['option-icon-box'])}>
            {selectIcon ||
              (value === option.data.value && (
                <CheckOutlined className={cx(styles.icon)} />
              ))}
          </div>
          {img && (
            <img className={cx(styles.image, 'radius-6')} src={img} alt="" />
          )}
          <span className={cx('flex-1', 'text-ellipsis')}>
            {option.data.label}
          </span>
        </Flex>
      )}
    />
  );
};

export default SelectList;
