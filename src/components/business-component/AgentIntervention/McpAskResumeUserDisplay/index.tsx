import { getCurrentLang } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React, { memo, useMemo } from 'react';
import {
  fileUrlToAttachmentFile,
  parseMcpAskResumeDisplayContent,
  stripMcpAskResumeDisplayArtifacts,
} from '../utils/mcpAskResumeMessage';
import ResumeAuthImage from './ResumeAuthImage';
import ResumeDocumentFile from './ResumeDocumentFile';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface McpAskResumeUserDisplayProps {
  /** 用户消息原始文本（只读，不写回 message） */
  text: string;
}

/**
 * MCP Ask resume 用户消息展示：文本、图片缩略图、文档附件卡片内联展示。
 */
const McpAskResumeUserDisplay: React.FC<McpAskResumeUserDisplayProps> = memo(
  ({ text }) => {
    const content = useMemo(
      () => parseMcpAskResumeDisplayContent(text),
      [text],
    );

    const labelSeparator = useMemo(() => {
      return getCurrentLang().toLowerCase().startsWith('en') ? ': ' : '：';
    }, []);

    if (content.kind === 'plain') {
      return <>{stripMcpAskResumeDisplayArtifacts(text).trim()}</>;
    }

    return (
      <div className={cx(styles.root)}>
        {content.preamble ? (
          <div className={styles.line}>{content.preamble}</div>
        ) : null}
        {content.fields?.map((field, index) => {
          const fieldKey = `${field.label}-${index}`;
          const imageUrls = field.imageUrls ?? [];
          const fileUrls = field.fileUrls ?? [];
          const hasMedia = imageUrls.length > 0 || fileUrls.length > 0;

          return (
            <div key={fieldKey} className={styles.field}>
              {field.textValue ? (
                <div className={styles.line}>
                  {field.label}
                  {labelSeparator}
                  {field.textValue}
                </div>
              ) : null}
              {hasMedia ? (
                <>
                  {!field.textValue ? (
                    <div className={styles.line}>
                      {field.label}
                      {labelSeparator}
                    </div>
                  ) : null}
                  {imageUrls.length > 0 ? (
                    <div className={styles.imageList}>
                      {imageUrls.map((url) => (
                        <ResumeAuthImage key={url} url={url} />
                      ))}
                    </div>
                  ) : null}
                  {fileUrls.length > 0 ? (
                    <div className={styles.documentList}>
                      {fileUrls.map((url) => (
                        <ResumeDocumentFile
                          key={url}
                          file={fileUrlToAttachmentFile(url)}
                        />
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  },
);

McpAskResumeUserDisplay.displayName = 'McpAskResumeUserDisplay';

export default McpAskResumeUserDisplay;
