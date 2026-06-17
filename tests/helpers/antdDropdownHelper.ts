let lastMenu: any = null;

export const setMenu = (menu: any) => {
  lastMenu = menu;
};

export const getLastMenuProps = () => lastMenu;
