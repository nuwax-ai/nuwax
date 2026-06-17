import React from 'react';

export const customizeRequiredMark = (
  label: React.ReactNode,
  { required }: { required: boolean },
) => (
  <>
    {label}
    {required ? (
      <span style={{ color: 'red', fontWeight: 600, marginLeft: '4px' }}>
        *
      </span>
    ) : null}
  </>
);

export const customizeRequiredNoStarMark = (label: React.ReactNode) => (
  <>{label}</>
);
