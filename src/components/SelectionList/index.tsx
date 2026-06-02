import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface SelectionListItem<T = any> {
  icon: string | React.ReactNode;
  label: string | React.ReactNode;
  description?: string | React.ReactNode;
  value: T;
}

export interface SelectionListProps<T = any> {
  title: React.ReactNode;
  list: SelectionListItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

const SelectionList: React.FC<SelectionListProps> = ({
  title,
  list = [],
  value,
  onChange,
  className,
}) => {
  return (
    <div className={cx(styles.container, className)}>
      <div className={cx(styles.header)}>{title}</div>
      <div className={cx(styles['list-wrapper'])}>
        {list.map((item) => {
          const isActive = value === item.value;
          return (
            <div
              key={String(item.value)}
              className={cx(styles.item, { [styles.active]: isActive })}
              onClick={() => onChange(item.value)}
            >
              <div className={cx(styles.icon)}>
                {typeof item.icon === 'string' ? (
                  <img src={item.icon} alt={String(item.label)} />
                ) : (
                  item.icon
                )}
              </div>
              <div className={cx(styles.info)}>
                <div className={cx(styles.name)}>{item.label}</div>
                {item.description && (
                  <div className={cx(styles.description)}>
                    {item.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SelectionList;
