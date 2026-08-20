import React from 'react';
import type { FileNode } from '../App';

interface FileTreeProps {
  files: FileNode[];
  activeFileId: string;
  onSelect: (file: FileNode) => void;
}

function getFileIcon(file: FileNode): string {
  if (file.type === 'folder') return '📁';
  const ext = file.name.split('.').pop()?.toLowerCase();
  const icons: Record<string, string> = {
    tsx: '⚙️', ts: '⚙️', js: '⚙️',
    jsx: '⚙️', css: '🎨', json: '📝',
    html: '🌐', md: '📄',
  };
  return icons[ext || ''] || '📄';
}

export const FileTree: React.FC<FileTreeProps> = ({ files, activeFileId, onSelect }) => {
  return (
    <div className="file-tree">
      <div className="file-tree-header">Explorer</div>
      {files.map((file) => (
        <div
          key={file.id}
          className={`file-tree-item ${file.id === activeFileId ? 'active' : ''}`}
          onClick={() => onSelect(file)}
        >
          <span className="icon">{getFileIcon(file)}</span>
          <span>{file.name}</span>
          {file.modified && (
            <span style={{ color: '#f59e0b', fontSize: 10, marginLeft: 4 }}>M</span>
          )}
        </div>
      ))}
    </div>
  );
};
