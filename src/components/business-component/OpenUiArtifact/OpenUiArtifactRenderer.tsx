import PagePreviewIframe from '@/components/business-component/PagePreviewIframe';
import type React from 'react';
import OpenUiInlineFrame from './OpenUiInlineFrame';
import styles from './index.less';
import type { OpenUiArtifact } from './types';

interface OpenUiArtifactRendererProps {
  artifacts?: OpenUiArtifact[];
}

const OpenUiArtifactRenderer: React.FC<OpenUiArtifactRendererProps> = ({
  artifacts,
}) => {
  if (!artifacts?.length) {
    return null;
  }

  return (
    <div className={styles.artifacts} data-openui-artifacts>
      {artifacts.map((artifact) =>
        artifact.renderTarget === 'inline' ? (
          <OpenUiInlineFrame key={artifact.artifactId} artifact={artifact} />
        ) : (
          <div key={artifact.artifactId} className={styles.pageArtifact}>
            <PagePreviewIframe
              pagePreviewData={{
                name: artifact.title,
                uri: artifact.workspaceUrl,
              }}
              showCloseButton={false}
              showHeader
            />
          </div>
        ),
      )}
    </div>
  );
};

export default OpenUiArtifactRenderer;
