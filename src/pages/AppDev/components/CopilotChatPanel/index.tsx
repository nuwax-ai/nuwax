/**
 * CopilotChatPanel - CopilotKit/AG-UI powered chat panel for AppDev.
 *
 * Replaces the custom SSE chat with CopilotKit's CopilotChat component,
 * adding Generative UI + Human-in-the-Loop capabilities.
 *
 * Uses the same leftPanel dimensions as ChatArea (380px width).
 */
import {
  CopilotKit,
  useCopilotAction,
  useCopilotReadable,
} from '@copilotkit/react-core';
import { CopilotChat } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import { FileNode } from '@/types/interfaces/appDev';
import React, { useMemo } from 'react';
import styles from './index.less';

export interface CopilotChatPanelProps {
  files: FileNode[];
  activeFileId: string;
  activeFileContent: string;
  projectId?: string;
  onCreateFile?: (fileName: string, content: string) => void;
  onUpdateFile?: (filePath: string, content: string) => void;
}

// Simple inline diff card for Generative UI / HITL
const DiffCard: React.FC<{
  fileName: string;
  oldCode: string;
  newCode: string;
  status: string;
  onConfirm: () => void;
}> = ({ fileName, oldCode, newCode, status, onConfirm }) => {
  const [confirmed, setConfirmed] = React.useState(false);
  const oldLines = oldCode.split('\n');
  const newLines = newCode.split('\n');
  const maxLen = Math.max(oldLines.length, newLines.length);
  const diffLines: Array<{ type: 'add' | 'del' | 'ctx'; text: string }> = [];
  for (let i = 0; i < maxLen; i++) {
    if (oldLines[i] === newLines[i]) {
      diffLines.push({ type: 'ctx', text: newLines[i] || '' });
    } else {
      if (oldLines[i] !== undefined) diffLines.push({ type: 'del', text: oldLines[i] });
      if (newLines[i] !== undefined) diffLines.push({ type: 'add', text: newLines[i] });
    }
  }
  const addCount = diffLines.filter((l) => l.type === 'add').length;
  const delCount = diffLines.filter((l) => l.type === 'del').length;

  return (
    <div className={styles.diffCard}>
      <div className={styles.diffHeader}>
        <span>{fileName}</span>
        <span className={styles.diffStats}>+{addCount} -{delCount}</span>
      </div>
      <pre className={styles.diffBody}>
        {diffLines.map((line, i) => (
          <div key={i} className={styles['line_' + line.type] || styles.line_ctx}>
            {line.type === 'add' ? '+ ' : line.type === 'del' ? '- ' : '  '}
            {line.text}
          </div>
        ))}
      </pre>
      {status === 'inProgress' && !confirmed && (
        <div className={styles.diffActions}>
          <button
            className={styles.btnConfirm}
            onClick={() => {
              setConfirmed(true);
              onConfirm();
            }}
          >
            Apply Changes
          </button>
          <button className={styles.btnCancel} onClick={() => setConfirmed(true)}>
            Reject
          </button>
        </div>
      )}
      {confirmed && <div className={styles.applied}>Changes applied to file tree.</div>}
    </div>
  );
};

const CopilotInner: React.FC<CopilotChatPanelProps> = ({
  files,
  activeFileId,
  activeFileContent,
  projectId,
  onCreateFile,
  onUpdateFile,
}) => {
  const fileTreeContext = useMemo(
    () =>
      files.map((f) => ({
        id: f.id,
        name: f.name,
        path: f.path,
        type: f.type,
        language: (f as any).language,
      })),
    [files],
  );

  useCopilotReadable({
    description: 'Project file tree (all files and folders).',
    value: fileTreeContext,
  });

  useCopilotReadable({
    description: 'The currently active/selected file being edited.',
    value: activeFileId
      ? {
          id: activeFileId,
          name: files.find((f) => f.id === activeFileId)?.name,
          path: files.find((f) => f.id === activeFileId)?.path,
          content: activeFileContent?.slice(0, 2000),
        }
      : null,
  });

  useCopilotAction({
    name: 'createFile',
    description: 'Create a new file in the project file tree.',
    parameters: [
      { name: 'fileName', type: 'string', description: 'File name, e.g. Header.tsx', required: true },
      { name: 'content', type: 'string', description: 'Full file content', required: true },
      { name: 'language', type: 'string', description: 'Programming language', required: false },
    ],
    handler: ({ fileName, content }) => {
      onCreateFile?.(fileName, content);
      return 'Created ' + fileName + ' (' + content.length + ' chars).';
    },
  });

  useCopilotAction({
    name: 'updateFile',
    description: 'Update the content of an existing file.',
    parameters: [
      { name: 'filePath', type: 'string', description: 'File path to update', required: true },
      { name: 'content', type: 'string', description: 'New full content', required: true },
    ],
    handler: ({ filePath, content }) => {
      onUpdateFile?.(filePath, content);
      return 'Updated ' + filePath + '.';
    },
  });

  useCopilotAction({
    name: 'previewCodeChange',
    description: 'Show a diff preview in chat and ask user to confirm before applying.',
    parameters: [
      { name: 'fileName', type: 'string', description: 'File being modified', required: true },
      { name: 'oldCode', type: 'string', description: 'Current code', required: true },
      { name: 'newCode', type: 'string', description: 'Proposed new code', required: true },
    ],
    render: ({ args, status }) => (
      <DiffCard
        fileName={args.fileName}
        oldCode={args.oldCode}
        newCode={args.newCode}
        status={status}
        onConfirm={() => onUpdateFile?.(args.fileName, args.newCode)}
      />
    ),
    handler: ({ fileName }) => 'User reviewed changes to ' + fileName + '.',
  });

  return (
    <div className={styles.copilotChatWrap}>
      <CopilotChat
        instructions={'You are an AI coding assistant for the Nuwax AppDev IDE (project: ' + (projectId || 'unknown') + '). You can see the file tree and active file. When the user asks to create something, use createFile. For modifications, use previewCodeChange to show a diff first.'}
        labels={{
          title: 'AI Assistant',
          initial: 'CopilotKit mode active. I can see your file tree and active file. Try: "create a Button component"',
        }}
        className={styles.copilotChat}
      />
    </div>
  );
};

const CopilotChatPanel: React.FC<CopilotChatPanelProps> = (props) => {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <CopilotInner {...props} />
    </CopilotKit>
  );
};

export default CopilotChatPanel;
