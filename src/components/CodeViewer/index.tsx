import { Spin } from 'antd';
import React, { Suspense } from 'react';

import type { CodeViewerProps } from './CodeViewerImpl';

const LazyCodeViewer = React.lazy(
  () => import(/* webpackChunkName: "monaco-bundle" */ './CodeViewerImpl'),
);

function CodeViewer(props: CodeViewerProps) {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <Spin />
        </div>
      }
    >
      <LazyCodeViewer {...props} />
    </Suspense>
  );
}

export default CodeViewer;
