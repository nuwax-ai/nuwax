import { useState } from 'react';

/**
 * 弹窗控制 Hook
 */
export const usePopoverControl = (variables: any[]) => {
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
    popoverVisible: variables && variables.length > 0 && popoverVisible,
    showPopover,
    hidePopover,
    togglePopover,
  };
};
