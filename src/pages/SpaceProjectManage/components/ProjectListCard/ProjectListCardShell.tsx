import AuthorInfo from '@/components/base/AuthorInfo';
import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
import { Skeleton } from 'antd';
import classNames from 'classnames';
import React, { PropsWithChildren } from 'react';
import styles from './ProjectListCardShell.less';

const cx = classNames.bind(styles);

export interface ProjectListCardShellProps {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  /** 标题右侧操作区（如更多菜单） */
  titleAction?: React.ReactNode;
  /** 额外信息 */
  extra?: React.ReactNode;
  /** 内容 */
  content: string;
  /** 标题 */
  title: React.ReactNode;
  /** 头像 */
  avatar?: string;
  /** 名称 */
  name: string;
  /** 图片 */
  icon: string;
  /** 默认图片 */
  defaultIcon: string;
  /** 加载状态 */
  loading?: boolean;
}

/**
 * 项目列表卡片布局壳：图标 + 标题行（含右侧操作）+ 元信息 + 描述，无底部 footer。
 */
const ProjectListCardShell: React.FC<
  PropsWithChildren<ProjectListCardShellProps>
> = ({
  className,
  onClick,
  titleAction,
  extra,
  content,
  title,
  avatar,
  name,
  icon,
  defaultIcon,
  style,
  loading = false,
}) => {
  if (loading) {
    return (
      <div
        className={cx('flex', 'flex-col', 'gap-2', styles.container, className)}
        style={{ ...style, height: 142 }}
      >
        <header className={cx('flex', styles.header)} style={{ gap: 8 }}>
          <Skeleton.Avatar
            active
            size="large"
            shape="square"
            className={styles.image}
            style={{ width: 50, height: 50, borderRadius: 10 }}
          />
          <div
            className={cx(
              'flex-1',
              'flex',
              'flex-col',
              'content-between',
              'overflow-hide',
            )}
            style={{ height: 50 }}
          >
            <Skeleton.Input
              active
              size="small"
              style={{ width: '60%', height: 18 }}
            />
            <div
              className={cx('flex', 'items-center', styles['author-rel-info'])}
              style={{ height: 16 }}
            >
              <Skeleton.Avatar
                active
                size="small"
                style={{ width: 16, height: 16, marginRight: 4 }}
              />
              <Skeleton.Input
                active
                size="small"
                style={{ width: 60, height: 14 }}
              />
              <div className={cx('ml-auto')}>
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: 80, height: 14 }}
                />
              </div>
            </div>
          </div>
        </header>
        <div style={{ marginTop: 4 }}>
          <Skeleton
            active
            paragraph={{ rows: 1, width: ['90%'] }}
            title={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cx('flex', 'flex-col', 'gap-4', styles.container, className)}
      onClick={onClick}
      style={style}
    >
      <header className={cx('flex', styles.header)}>
        <img
          className={cx(styles.image)}
          src={icon || defaultIcon}
          alt=""
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = defaultIcon;
          }}
        />
        <div
          className={cx(
            'flex-1',
            'flex',
            'flex-col',
            'content-between',
            'overflow-hide',
          )}
        >
          <div className={cx(styles.titleRow, 'flex', 'items-center')}>
            <div className={cx('flex-1', 'min-w-0', 'overflow-hide')}>
              {typeof title === 'string' ? (
                <h3 className={cx('text-ellipsis', styles.title)}>{title}</h3>
              ) : (
                <div className={cx('w-full', 'overflow-hide')}>{title}</div>
              )}
            </div>
            {titleAction ? (
              <div
                className={cx(styles.titleAction)}
                onClick={(event) => event.stopPropagation()}
              >
                {titleAction}
              </div>
            ) : null}
          </div>
          <div
            className={cx('flex', 'items-center', styles['author-rel-info'])}
          >
            {avatar && <AuthorInfo avatar={avatar} name={name} />}
            {extra ? (
              <div
                className={cx(
                  'flex',
                  'content-between',
                  'items-center',
                  styles['extra-box'],
                )}
              >
                {extra}
              </div>
            ) : null}
          </div>
        </div>
      </header>
      {content?.length > 0 ? (
        <EllipsisTooltip
          text={content}
          maxLines={2}
          className={cx(styles.content)}
        />
      ) : (
        <div className={cx(styles.content)} />
      )}
    </div>
  );
};

export default ProjectListCardShell;
