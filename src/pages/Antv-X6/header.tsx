import { Button } from 'antd';
import React from 'react';
interface HeaderProp {
  title: string;
  icon?: React.ReactNode;
  onSubmit: () => void;
}

const Header: React.FC<HeaderProp> = ({ title, onSubmit }) => {
  return (
    <div className="fold-header-style dis-sb">
      <div>{title}</div>
      <Button onClick={onSubmit} type={'primary'}>
        发布
      </Button>
    </div>
  );
};

export default Header;
