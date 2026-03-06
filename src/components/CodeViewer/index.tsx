import React from 'react';
import MonacoEditor from './MonacoEditor';
import styles from './index.less';

interface CodeViewerProps {
  /** 是否动态主题 */
  isDynamicTheme?: boolean;
  /** 文件ID */
  fileId: string;
  /** 文件名 */
  fileName: string;
  /** 文件路径 */
  filePath: string;
  /** 文件内容 */
  content: string;
  /** 是否只读 */
  readOnly: boolean;
  /** 内容变化回调 */
  onContentChange: (fileId: string, content: string) => void;
}

/**
 * 代码查看器组件
 * 显示代码内容，使用 MonacoEditor
 */
const CodeViewer: React.FC<CodeViewerProps> = ({
  isDynamicTheme = false,
  fileId,
  fileName,
  filePath,
  content,
  readOnly,
  onContentChange,
}) => {
  return (
    <div className={styles.fileContentDisplay}>
      <MonacoEditor
        key={fileId}
        isDynamicTheme={isDynamicTheme}
        currentFile={{
          id: fileId,
          name: fileName,
          type: 'file',
          path: filePath,
          content: content,
          lastModified: Date.now(),
          children: [],
        }}
        onContentChange={onContentChange}
        readOnly={readOnly}
        className={styles.monacoEditor}
      />
    </div>
  );
};

export default CodeViewer;
