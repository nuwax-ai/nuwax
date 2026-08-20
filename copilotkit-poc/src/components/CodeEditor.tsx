import React, { useRef, useEffect } from 'react';
import type { FileNode } from '../App';

interface CodeEditorProps {
  file: FileNode | null;
  onContentChange: (content: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ file, onContentChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current && file) {
      textareaRef.current.value = file.content || '';
    }
  }, [file?.id]);

  if (!file) {
    return (
      <div className="editor-pane">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
          Select a file to edit
        </div>
      </div>
    );
  }

  return (
    <div className="editor-pane">
      <div className="editor-tab-bar">
        <div className="editor-tab active">
          {file.name}
          {file.modified && <span style={{ color: '#f59e0b' }}> M</span>}
        </div>
      </div>
      <div className="editor-content">
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          defaultValue={file.content || ''}
          onChange={(e) => onContentChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
};
