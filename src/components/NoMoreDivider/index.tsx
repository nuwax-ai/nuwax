import { Divider } from 'antd';
import React from 'react';

export interface NoMoreDividerProps {
  /** 自定义文本，默认为"没有更多了" */
  text?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

const NoMoreDivider: React.FC<NoMoreDividerProps> = ({
  text = '没有更多了',
  style,
  className,
}) => {
  const dividerStyle: React.CSSProperties = {
    ...style,
    borderColor: 'transparent',
  };

  return (
    <Divider style={dividerStyle} plain className={className}>
      {text}
    </Divider>
  );
};

export default NoMoreDivider;
