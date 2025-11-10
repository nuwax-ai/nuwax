import React from 'react';
import SvgIcon from '../SvgIcon';

interface IProps {
  name?: string;
  fontSize?: number;
  borderRadius?: number;
  width?: number;
  height?: number;
}

const SvgIconGoodTheme: React.FC<IProps> = ({
  name = 'icons-workspace-table',
  fontSize = 40,
  borderRadius = 12,
  width = '100%',
  height = '100%',
}) => {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--xagi-color-primary-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SvgIcon
        name={name}
        style={{
          fontSize,
          color: 'var(--xagi-color-primary)',
          filter:
            'drop-shadow(0 2px 12px color-mix(in srgb, var(--xagi-color-primary) 60%, var(--xagi-color-primary)  60%))',
        }}
      />
    </div>
  );
};

export default SvgIconGoodTheme;
