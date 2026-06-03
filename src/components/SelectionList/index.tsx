import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Empty, Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface SelectionListItem<T = any> {
  icon: string | React.ReactNode;
  label: string | React.ReactNode;
  description?: string | React.ReactNode;
  extra?: React.ReactNode;
  value: T;
  allowEdit?: boolean;
  allowDelete?: boolean;
}

export interface SelectionListProps<T = any> {
  title: React.ReactNode;
  list: SelectionListItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  onEdit?: (item: SelectionListItem<T>, e: React.MouseEvent) => void;
  onDelete?: (item: SelectionListItem<T>, e: React.MouseEvent) => void;
  emptyText?: React.ReactNode;
  maxDescriptionLines?: number;
}

const SelectionList: React.FC<SelectionListProps> = ({
  title,
  list = [],
  value,
  onChange,
  className,
  onEdit,
  onDelete,
  emptyText,
  maxDescriptionLines = 1,
}) => {
  return (
    <div className={cx(styles.container, className)}>
      <div className={cx(styles.header)}>{title}</div>
      <div className={cx(styles['list-wrapper'])}>
        {list.length > 0 ? (
          list.map((item) => {
            const isActive = value === item.value;
            const showActions =
              (item.allowEdit && onEdit) || (item.allowDelete && onDelete);
            return (
              <div
                key={String(item.value)}
                data-value={String(item.value)}
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
                  <div className={cx(styles['name-wrap'])}>
                    <Typography.Text
                      className={cx(styles.name)}
                      ellipsis={{
                        tooltip: item.label,
                      }}
                    >
                      {item.label}
                    </Typography.Text>
                    {item.extra && (
                      <div className={cx(styles.extra)}>{item.extra}</div>
                    )}
                  </div>
                  {item.description && (
                    <Typography.Paragraph
                      className={cx(styles.description)}
                      ellipsis={{
                        rows: maxDescriptionLines,
                        tooltip: item.description,
                      }}
                    >
                      {item.description}
                    </Typography.Paragraph>
                  )}
                </div>
                {showActions && (
                  <div
                    className={cx(styles.actions)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.allowEdit && onEdit && (
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        className={cx(styles['action-btn'])}
                        onClick={(e) => onEdit(item, e)}
                      />
                    )}
                    {item.allowDelete && onDelete && (
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        className={cx(styles['action-btn'])}
                        onClick={(e) => onDelete(item, e)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className={cx(styles['empty-wrapper'])}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={emptyText}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectionList;
