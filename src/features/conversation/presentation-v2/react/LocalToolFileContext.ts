import {
  getLocalFileReference,
  useLocalFilesRevision,
} from '@/features/client-shell/localFileService';
import { createContext, useContext } from 'react';

/** 路径按消息所属会话定位，不能借用其他会话的当前电脑。 */
export const LocalToolFileContext = createContext<number | string | undefined>(
  undefined,
);
export function useLocalToolFileReference(path: string) {
  useLocalFilesRevision();
  const cId = useContext(LocalToolFileContext);
  return cId === undefined ? undefined : getLocalFileReference(path, cId, path);
}
