import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  buildSandboxDocument,
  clampSandboxHeight,
} from './buildSandboxDocument';
import styles from './index.less';
import type { SandboxedUiArtifact } from './types';

const cx = classNames.bind(styles);

interface SandboxedUiCardProps {
  artifact: SandboxedUiArtifact;
}

const SandboxedUiCard: React.FC<SandboxedUiCardProps> = ({ artifact }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(() =>
    clampSandboxHeight(artifact.initialHeight),
  );
  const srcDoc = useMemo(() => buildSandboxDocument(artifact), [artifact]);

  useEffect(() => {
    setHeight(clampSandboxHeight(artifact.initialHeight));
  }, [artifact.initialHeight]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (
        !data ||
        data.type !== 'sandbox_ui_resize' ||
        event.source !== iframeRef.current?.contentWindow ||
        data.artifactId !== (artifact.id || '') ||
        typeof data.height !== 'number'
      ) {
        return;
      }
      setHeight(clampSandboxHeight(data.height));
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [artifact.id]);

  return (
    <section className={cx('sandboxed-ui-card')}>
      {artifact.title && <header>{artifact.title}</header>}
      <iframe
        ref={iframeRef}
        title={artifact.title || 'AI generated interface'}
        sandbox="allow-scripts"
        srcDoc={srcDoc}
        referrerPolicy="no-referrer"
        style={{ height }}
      />
    </section>
  );
};

export default SandboxedUiCard;
