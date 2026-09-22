import classNames from 'classnames';
import React, { forwardRef } from 'react';
import styles from './index.less';

const isPresent = (node: React.ReactNode): boolean =>
  node !== null && node !== undefined;

export interface PageContainerHeaderProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** 页面标题。统一使用页面级 h3 语义与字号。 */
  title?: React.ReactNode;
  /** 标题前的返回按钮、图标等。 */
  titlePrefix?: React.ReactNode;
  /** 紧随标题的筛选、状态等内容。 */
  titleExtra?: React.ReactNode;
  /** 左侧内容中的第二组控件，例如 Segmented。 */
  middle?: React.ReactNode;
  /** 右侧搜索、创建等操作；空间不足时整体换行并继续右对齐。 */
  actions?: React.ReactNode;
  titleClassName?: string;
  leadingClassName?: string;
  actionsClassName?: string;
}

/**
 * page-container 页面级标题栏。
 *
 * 左侧内容可以在自身内部换行；右侧操作组优先保持完整，当前行空间不足时
 * 自动落到下一行。操作组在任意行均通过 auto margin + flex-end 保持右对齐。
 */
const PageContainerHeader = forwardRef<HTMLElement, PageContainerHeaderProps>(
  (
    {
      title,
      titlePrefix,
      titleExtra,
      middle,
      actions,
      className,
      titleClassName,
      leadingClassName,
      actionsClassName,
      ...rest
    },
    ref,
  ) => {
    const hasLeading =
      isPresent(titlePrefix) ||
      isPresent(title) ||
      isPresent(titleExtra) ||
      isPresent(middle);

    return (
      <header
        ref={ref}
        className={classNames(styles.root, className)}
        {...rest}
      >
        {hasLeading && (
          <div className={classNames(styles.leading, leadingClassName)}>
            {titlePrefix}
            {isPresent(title) && (
              <h3 className={classNames(styles.title, titleClassName)}>
                {title}
              </h3>
            )}
            {isPresent(titleExtra) && (
              <div className={styles['title-extra']}>{titleExtra}</div>
            )}
            {isPresent(middle) && <div className={styles.middle}>{middle}</div>}
          </div>
        )}
        {isPresent(actions) && (
          <div className={classNames(styles.actions, actionsClassName)}>
            {actions}
          </div>
        )}
      </header>
    );
  },
);

PageContainerHeader.displayName = 'PageContainerHeader';

export default PageContainerHeader;
