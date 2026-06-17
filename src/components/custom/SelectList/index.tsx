import { dict } from '@/services/i18nRuntime';
import type { SelectListType } from '@/types/interfaces/common';
import { CheckOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const SelectList: React.FC<SelectListType> = (props) => {
  const {
    className,
    value,
    prefix,
    dropdownRenderComponent,
    placeholder,
    disabled,
    allowClear = false,
    options,
    onChange,
    size = 'middle',
    style,
    showDescription = false,
  } = props;

  return (
    <Select
      rootClassName={cx(styles.container, className)}
      value={value}
      prefix={prefix}
      placeholder={placeholder || dict('PC.Components.SelectList.pleaseSelect')}
      disabled={disabled}
      onChange={onChange}
      style={style}
      allowClear={allowClear}
      // 阻止冒泡事件
      onClick={(e) => {
        e.stopPropagation();
      }}
      options={options}
      size={size}
      popupMatchSelectWidth={false}
      classNames={{
        popup: {
          root: styles['dropdown-popup'],
        },
      }}
      popupRender={(menu) => (
        <>
          {menu}
          {dropdownRenderComponent}
        </>
      )}
      optionRender={(option) => {
        const label = option.data.label;
        return (
          <div className={styles['option-row']}>
            <div className={cx(styles['option-icon-box'])}>
              {value === option.data.value && (
                <CheckOutlined className={cx(styles.icon)} />
              )}
            </div>
            {!!option?.data?.img && (
              <img
                className={cx(styles.image, 'radius-6')}
                src={String(option.data.img)}
                alt=""
              />
            )}
            <div className={styles['option-text']}>
              <span className={styles['option-label']}>{label}</span>
              {showDescription && !!option?.data?.description && (
                <span className={styles['option-description']}>
                  {String(option.data.description)}
                </span>
              )}
            </div>
          </div>
        );
      }}
    />
  );
};

export default SelectList;
