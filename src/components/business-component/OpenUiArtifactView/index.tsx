import { dict } from '@/services/i18nRuntime';
import type { OpenUiArtifact } from '@/types/interfaces/openUi';
import { ExportOutlined } from '@ant-design/icons';
import { Renderer } from '@openuidev/react-lang';
import { openuiLibrary } from '@openuidev/react-ui/genui-lib';
import '@openuidev/react-ui/layered/styles/index.css';
import { Alert, Button } from 'antd';
import { useEffect, useRef, useState } from 'react';
import styles from './index.less';

interface OpenUiArtifactViewProps {
  artifact: OpenUiArtifact;
  blockedReason?: 'expired' | 'untrusted';
  onOpenSidecar?: (artifact: OpenUiArtifact) => void;
}

const OpenUiArtifactView: React.FC<OpenUiArtifactViewProps> = ({
  artifact,
  blockedReason,
  onOpenSidecar,
}) => {
  const [renderError, setRenderError] = useState<string | null>(null);
  const autoOpenedArtifactId = useRef<string | undefined>(undefined);
  const isSidecar = artifact.presentation.mode === 'sidecar';

  useEffect(() => {
    setRenderError(null);
  }, [artifact.artifactId]);

  useEffect(() => {
    if (
      isSidecar &&
      artifact.presentation.autoOpen &&
      artifact.page &&
      !blockedReason &&
      onOpenSidecar &&
      autoOpenedArtifactId.current !== artifact.artifactId
    ) {
      autoOpenedArtifactId.current = artifact.artifactId;
      onOpenSidecar(artifact);
    }
  }, [artifact, blockedReason, isSidecar, onOpenSidecar]);

  if (blockedReason) {
    return (
      <Alert
        className={styles.renderState}
        type="warning"
        showIcon
        message={dict(
          blockedReason === 'expired'
            ? 'PC.Components.OpenUi.expired'
            : 'PC.Components.OpenUi.untrustedPage',
        )}
        description={artifact.fallback.markdown}
      />
    );
  }

  if (isSidecar) {
    return (
      <div className={styles.sidecarSummary}>
        <div className={styles.sidecarText}>
          <div className={styles.sidecarTitle}>{artifact.title}</div>
          {artifact.fallback.markdown && (
            <div className={styles.sidecarFallback}>
              {artifact.fallback.markdown}
            </div>
          )}
        </div>
        <Button
          type="primary"
          size="small"
          icon={<ExportOutlined />}
          disabled={!artifact.page || !onOpenSidecar}
          onClick={() => onOpenSidecar?.(artifact)}
        >
          {dict('PC.Components.OpenUi.openPreview')}
        </Button>
      </div>
    );
  }

  if (renderError) {
    return (
      <Alert
        className={styles.renderState}
        type="warning"
        showIcon
        message={dict('PC.Components.OpenUi.renderFailed')}
        description={artifact.fallback.markdown || renderError}
      />
    );
  }

  return (
    <div
      className={styles.inlineRenderer}
      data-openui-artifact={artifact.artifactId}
    >
      <Renderer
        library={openuiLibrary}
        response={artifact.document.source}
        isStreaming={false}
        onError={(errors) => {
          if (errors.length > 0) {
            setRenderError(
              errors[0]?.message || dict('PC.Components.OpenUi.renderFailed'),
            );
          }
        }}
      />
    </div>
  );
};

export default OpenUiArtifactView;
