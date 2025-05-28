import { useState } from 'react';

/**
 * 弹窗控制 Hook
 */
export const usePopoverControl = () => {
  const [popoverVisible, setPopoverVisible] = useState(false);

  const showPopover = () => {
    setPopoverVisible(true);
  };

  const hidePopover = () => {
    setPopoverVisible(false);
  };

  const togglePopover = () => {
    setPopoverVisible(!popoverVisible);
  };

  return {
    popoverVisible,
    showPopover,
    hidePopover,
    togglePopover,
  };
};
