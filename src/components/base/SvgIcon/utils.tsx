import classNames from 'classnames';
import React from 'react';
import styles from './styles.less';
const cx = classNames.bind(styles);
/**
 * SvgIcon（基于 antd Icon 的自定义实现）
 * - 目的：支持通过 style 或 props 动态设置颜色(color)与大小(size)
 * - 使用：
 *   <SvgIcon name="icons-nav-home" size={24} color="#1677ff" />
 *   <SvgIcon name="icons-nav-home" style={{ fontSize: 24, color: '#1677ff' }} />
 */

// 使用文件方式（SVGR）导入 SVG，并包装以便注入统一的 className
export type SvgFactory = React.FC<React.SVGProps<SVGSVGElement>>;
export const wrapSvg =
  (
    Comp: SvgFactory,
    overrideProps?: React.SVGProps<SVGSVGElement>,
  ): SvgFactory =>
  (props) =>
    (
      <Comp
        viewBox="0 0 24 24"
        {...props}
        className={cx(styles['xagi-svg-icon'], props.className)}
        style={{ ...(props.style || {}) }}
        {...overrideProps}
      />
    );
