import React, { useState, useCallback } from 'react';
import {
  CopilotKit,
  useCopilotReadable,
  useCopilotAction,
} from '@copilotkit/react-core';
import { CopilotSidebar } from '@copilotkit/react-ui';
import '@copilotkit/react-ui/styles.css';
import { FileTree } from './components/FileTree';
import { CodeEditor } from './components/CodeEditor';
import { GenUIDiff } from './components/GenUIDiff';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  language?: string;
  modified?: boolean;
}

const INITIAL_FILES: FileNode[] = [
  {
    id: '1',
    name: 'package.json',
    path: '/package.json',
    type: 'file',
    language: 'json',
    content: '{\n  "name": "my-nuwax-project",\n  "version": "1.0.0"\n}',
  },
  {
    id: '2',
    name: 'App.tsx',
    path: '/src/App.tsx',
    type: 'file',
    language: 'typescript',
    content: "import React from 'react';\n\nexport default function App() {\n  return (\n    <div>\n      <h1>Hello Nuwax</h1>\n    </div>\n  );\n}",
  },
  {
    id: '3',
    name: 'index.css',
    path: '/src/index.css',
    type: 'file',
    language: 'css',
    content: 'body {\n  font-family: sans-serif;\n  margin: 0;\n}',
  },
];

function detectLanguage(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript',
    jsx: 'javascript', css: 'css', json: 'json', html: 'html', md: 'markdown',
  };
  return map[ext || ''] || 'text';
}

function AppInner() {
  const [files, setFiles] = useState<FileNode[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string>('2');
  const activeFile = files.find((f) => f.id === activeFileId);

  const handleContentChange = useCallback((content: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFileId ? { ...f, content, modified: true } : f,
      ),
    );
  }, [activeFileId]);

  // Feature 1: useCopilotReadable - shares app state with AI
  useCopilotReadable({
    description: 'Current project file tree with name, path, language, content.',
    value: files.map((f) => ({
      name: f.name, path: f.path, language: f.language,
      content: f.content?.slice(0, 500), modified: f.modified,
    })),
  });
  useCopilotReadable({
    description: 'The currently active/selected file being edited.',
    value: activeFile
      ? { name: activeFile.name, path: activeFile.path, content: activeFile.content }
      : null,
  });

  // Feature 2: useCopilotAction - AI-callable tools (replaces tool_call SSE events)
  useCopilotAction({
    name: 'createFile',
    description: 'Create a new file in the project.',
    parameters: [
      { name: 'fileName', type: 'string', description: 'File name e.g. Header.tsx', required: true },
      { name: 'content', type: 'string', description: 'Full file content', required: true },
      { name: 'language', type: 'string', description: 'Programming language', required: false },
    ],
    handler: ({ fileName, content, language }) => {
      const newFile: FileNode = {
        id: `file-${Date.now()}`,
        name: fileName.split('/').pop() || fileName,
        path: fileName.startsWith('/') ? fileName : `/${fileName}`,
        type: 'file' as const,
        content,
        language: language || detectLanguage(fileName),
        modified: true,
      };
      setFiles((prev) => [...prev, newFile]);
      setActiveFileId(newFile.id);
      return `Created ${fileName} (${content.length} chars).`;
    },
  });

  useCopilotAction({
    name: 'updateFile',
    description: 'Update content of an existing file.',
    parameters: [
      { name: 'filePath', type: 'string', description: 'File path to update', required: true },
      { name: 'content', type: 'string', description: 'New full content', required: true },
    ],
    handler: ({ filePath, content }) => {
      setFiles((prev) => prev.map((f) =>
        f.path === filePath ? { ...f, content, modified: true } : f,
      ));
      return `Updated ${filePath}.`;
    },
  });

  // Feature 3: Generative UI + HITL - renders custom component in chat
  useCopilotAction({
    name: 'previewCodeChange',
    description: 'Show a diff preview and ask user to confirm before applying.',
    parameters: [
      { name: 'fileName', type: 'string', description: 'File being modified', required: true },
      { name: 'oldCode', type: 'string', description: 'Current code', required: true },
      { name: 'newCode', type: 'string', description: 'Proposed new code', required: true },
    ],
    render: ({ args, status, result }) => (
      <GenUIDiff
        fileName={args.fileName}
        oldCode={args.oldCode}
        newCode={args.newCode}
        status={status}
        result={result}
        onConfirm={() => {
          setFiles((prev) => prev.map((f) =>
            f.name === args.fileName
              ? { ...f, content: args.newCode, modified: true }
              : f,
          ));
        }}
      />
    ),
    handler: ({ fileName }) => `User reviewed changes to ${fileName}.`,
  });

  return (
    <div className="appdev-layout">
      <div className="appdev-main">
        <div className="appdev-header">
          <h1>Nuwax AppDev</h1>
          <span className="badge">CopilotKit PoC</span>
          <span style={{ fontSize: 12, color: '#999' }}>my-nuwax-project</span>
          <span className="file-count-badge">{files.length} files</span>
        </div>
        <div className="appdev-body">
          <FileTree
            files={files}
            activeFileId={activeFileId}
            onSelect={(f) => f.type === 'file' && setActiveFileId(f.id)}
          />
          <CodeEditor file={activeFile || null} onContentChange={handleContentChange} />
        </div>
      </div>
      <CopilotSidebar
        defaultOpen={true}
        instructions={`You are an AI coding assistant for the Nuwax AppDev IDE.
You can see the file tree and active file. You can create files, update files, and preview changes.
When the user asks to create something, use the createFile action.
For modifications, use previewCodeChange to show a diff first.`}
        labels={{
          title: 'AI Assistant',
          initial: 'Hi! I am your Nuwax AI coding assistant. I can see your project files and help you write code. Try asking me to create a new component!',
        }}
      />
      <div className="integration-banner">
        <span>PoC: CopilotKit v1.60 + AG-UI Protocol | Runtime: Express on :4001</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <AppInner />
    </CopilotKit>
  );
}
