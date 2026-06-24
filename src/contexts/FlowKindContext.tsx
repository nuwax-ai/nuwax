import { FlowKindEnum } from '@/types/enums/common';
import React, { createContext, ReactNode, useContext } from 'react';

interface FlowKindContextType {
  flowKind: FlowKindEnum;
}

const FlowKindContext = createContext<FlowKindContextType>({
  flowKind: FlowKindEnum.Workflow,
});

export const useFlowKind = () => useContext(FlowKindContext).flowKind;

export const FlowKindProvider: React.FC<{
  flowKind: FlowKindEnum;
  children: ReactNode;
}> = ({ flowKind, children }) => {
  return (
    <FlowKindContext.Provider value={{ flowKind }}>
      {children}
    </FlowKindContext.Provider>
  );
};
