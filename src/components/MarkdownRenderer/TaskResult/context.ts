import React from 'react';

export const TaskResultContext = React.createContext<{
  onTaskResultClick?: (fileId: string) => boolean | void;
}>({});
