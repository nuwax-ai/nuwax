import React, { createContext, ReactNode, useContext } from 'react';

type WorkflowVersion = 'v1' | 'v3';

interface WorkflowVersionContextType {
  version: WorkflowVersion;
}

const WorkflowVersionContext = createContext<WorkflowVersionContextType>({
  version: 'v1',
});

export const useWorkflowVersion = () => useContext(WorkflowVersionContext);

export const WorkflowVersionProvider: React.FC<{
  version: WorkflowVersion;
  children: ReactNode;
}> = ({ version, children }) => {
  return (
    <WorkflowVersionContext.Provider value={{ version }}>
      {children}
    </WorkflowVersionContext.Provider>
  );
};
