import { Spin } from 'antd';
import React, { Suspense } from 'react';

import type { Props as CodeEditorProps } from './CodeEditorImpl';

const LazyCodeEditor = React.lazy(
  () => import(/* webpackChunkName: "monaco-bundle" */ './CodeEditorImpl'),
);

function CodeEditor(props: CodeEditorProps) {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
          <Spin />
        </div>
      }
    >
      <LazyCodeEditor {...props} />
    </Suspense>
  );
}

export default CodeEditor;
