import type { SelectListType } from '@/types/interfaces/common';
import { CheckOutlined } from '@ant-design/icons';
import { Flex, Select } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const SelectList: React.FC<SelectListType> = (props) => {
  const {
    className,
    value,
    dropdownRenderComponent,
    placeholder,
    disabled,
    allowClear = false,
    options,
    onChange,
    size = 'middle',
  } = props;

  return (
    <Select
      rootClassName={cx(styles.container, className)}
      value={value}
      placeholder={placeholder || '请选择'}
      disabled={disabled}
      onChange={onChange}
      allowClear={allowClear}
      // 阻止冒泡事件
      onClick={(e) => {
        e.stopPropagation();
      }}
      options={options}
      size={size}
      popupRender={(menu) => (
        <>
          {menu}
          {dropdownRenderComponent}
        </>
      )}
      optionRender={(option) => {
        return (
          <Flex gap={8} align={'center'}>
            <div className={cx(styles['option-icon-box'])}>
              {value === option.data.value && (
                <CheckOutlined className={cx(styles.icon)} />
              )}
            </div>
            {!!option?.data?.img && (
              <img
                className={cx(styles.image, 'radius-6')}
                // 确保 option.data.img 是字符串类型，若不是则转换为字符串
                src={String(option.data.img)}
                alt=""
              />
            )}
            <span className={cx('flex-1', 'text-ellipsis')}>
              {option.data.label}
            </span>
          </Flex>
        );
      }}
    />
  );
};

export default SelectList;
