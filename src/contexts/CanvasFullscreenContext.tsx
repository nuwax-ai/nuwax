import React, { createContext, ReactNode, useContext } from 'react';

/**
 * 画布全屏状态上下文
 *
 * 仅 AgentFlowCanvas 提供：全屏时控制条恢复原始尺寸，
 * 内嵌（默认画布大小）时走紧凑态。未提供时默认 false。
 */
interface CanvasFullscreenContextType {
  fullscreen: boolean;
}

const CanvasFullscreenContext = createContext<CanvasFullscreenContextType>({
  fullscreen: false,
});

export const useCanvasFullscreen = () =>
  useContext(CanvasFullscreenContext).fullscreen;

export const CanvasFullscreenProvider: React.FC<{
  fullscreen: boolean;
  children: ReactNode;
}> = ({ fullscreen, children }) => {
  return (
    <CanvasFullscreenContext.Provider value={{ fullscreen }}>
      {children}
    </CanvasFullscreenContext.Provider>
  );
};
