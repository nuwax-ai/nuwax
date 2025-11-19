import { useState } from 'react';

export const useDropdownPosition = () => {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  return {
    cursorPosition,
    setCursorPosition,
  };
};
