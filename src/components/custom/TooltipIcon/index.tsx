import SvgIcon from '@/components/base/SvgIcon';
import { TooltipTitleTypeEnum } from '@/types/enums/common';
import type { TooltipIconProps } from '@/types/interfaces/space';
import { isKeyboardActivation } from '@/utils/a11y';
import { theme, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 带icon的Tooltip组件
 */
const TooltipIcon: React.FC<TooltipIconProps> = ({
  className,
  type = TooltipTitleTypeEnum.Blank,
  icon,
  title,
  ariaLabel,
  placement,
  onClick,
}) => {
  const bg =
    type === TooltipTitleTypeEnum.Blank ? 'tooltip-blank' : 'tooltip-white';
  const { token } = theme.useToken();
  const accessibleLabel =
    ariaLabel || (typeof title === 'string' ? title : undefined);

  return (
    <Tooltip title={title} classNames={{ root: bg }} placement={placement}>
      <span
        className={cx(
          'hover-box',
          'flex',
          'content-center',
          'items-center',
          'cursor-pointer',
          styles.box,
          className,
        )}
        onClick={onClick}
        onKeyDown={(e) => {
          if (onClick && isKeyboardActivation(e)) {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? accessibleLabel : undefined}
      >
        {/*默认加号（+）*/}
        {icon || (
          <SvgIcon
            name="icons-common-plus"
            style={{ color: token.colorTextTertiary, fontSize: '15px' }}
          />
        )}
      </span>
    </Tooltip>
  );
};

export default TooltipIcon;
