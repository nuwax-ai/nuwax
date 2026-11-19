import {
  readTaskRecord,
  writeTaskRecord,
} from '@/utils/conversationTaskStorage';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { ConversationWorkspaceView } from '../domain/conversationPageCache';
import type { FileTreePanelTab } from './taskUiStateContext';

interface TaskFileTreeState {
  view?: ConversationWorkspaceView;
  visible?: boolean;
  tab?: FileTreePanelTab;
  source?: string;
  directories?: string[];
}

const empty: TaskFileTreeState = {};

export function readTaskFileTree(scope?: string): TaskFileTreeState {
  if (!scope) return empty;
  const value = readTaskRecord<TaskFileTreeState>(`${scope}tree`);
  if (!value || typeof value !== 'object') return empty;
  return {
    view: [
      'closed',
      'filePreview',
      'terminal',
      'desktop',
      'pagePreview',
    ].includes(value.view ?? '')
      ? value.view
      : undefined,
    visible: typeof value.visible === 'boolean' ? value.visible : undefined,
    tab:
      value.tab === 'files' || value.tab === 'sourceControl'
        ? value.tab
        : undefined,
    source: typeof value.source === 'string' ? value.source : undefined,
    directories: Array.isArray(value.directories)
      ? value.directories.filter((path) => typeof path === 'string' && path)
      : undefined,
  };
}

export function useTaskFileTreeState(scope?: string) {
  const initial = useMemo(() => readTaskFileTree(scope), [scope]);
  const [snapshot, setSnapshot] = useState<{
    scope: string;
    state: TaskFileTreeState;
  }>();
  const state = snapshot && snapshot.scope === scope ? snapshot.state : initial;
  const latest = useRef({ scope, state });
  latest.current = { scope, state };
  const update = useCallback(
    (change: (current: TaskFileTreeState) => TaskFileTreeState) => {
      if (!scope || latest.current.scope !== scope) return;
      const current = latest.current.state;
      const next = change(current);
      if (next === current) return;
      latest.current = { scope, state: next };
      writeTaskRecord(`${scope}tree`, next);
      setSnapshot({ scope, state: next });
    },
    [scope],
  );
  return { state, update };
}
