import { useCallback, useState } from 'react';

/** 同一组入口只允许一个菜单展开，旧入口的关闭回调不能关闭新入口。 */
export default function useExclusiveDropdown() {
  const [activeKey, setActiveKey] = useState<string>();
  const close = useCallback(() => setActiveKey(undefined), []);
  const getDropdownProps = (key: string) => ({
    open: activeKey === key,
    onOpenChange: (open: boolean) => {
      setActiveKey((current) =>
        open ? key : current === key ? undefined : current,
      );
    },
  });
  return { getDropdownProps, close };
}
