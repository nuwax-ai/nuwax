import TooltipIcon from '@/components/custom/TooltipIcon';
import { TooltipTitleTypeEnum } from '@/types/enums/common';
import type { LabelIconProps } from '@/types/interfaces/agent';
import { InfoCircleOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 知识库设置label组件
 */
const LabelIcon: React.FC<LabelIconProps> = ({
  className,
  label,
  title,
  type = TooltipTitleTypeEnum.Blank,
}) => {
  return (
    <div
      className={cx(styles['label-wrapper'], 'flex', 'items-center', className)}
    >
      <span>{label}</span>
      <TooltipIcon title={title} icon={<InfoCircleOutlined />} type={type} />
    </div>
  );
};

export default LabelIcon;
