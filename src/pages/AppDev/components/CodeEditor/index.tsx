import { FileNode } from '@/models/appDev';
import React from 'react';
import MonacoEditor from '../MonacoEditor';
import styles from './index.less';

interface CodeEditorProps {
  currentFile?: FileNode | null;
  onContentChange?: (fileId: string, content: string) => void;
  className?: string;
}

/**
 * 代码编辑器组件
 * 基于Monaco Editor实现，支持多种编程语言
 */
const CodeEditor: React.FC<CodeEditorProps> = ({
  currentFile,
  onContentChange,
  className,
}) => {
  return (
    <div className={`${styles.codeEditor} ${className || ''}`}>
      <MonacoEditor
        currentFile={currentFile}
        onContentChange={onContentChange}
      />
    </div>
  );
};

export default CodeEditor;
