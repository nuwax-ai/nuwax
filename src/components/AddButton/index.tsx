import SvgIcon from '@/components/base/SvgIcon';
import { theme } from 'antd';

interface AddButtonProps {
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
  style?: React.CSSProperties;
}

export default function AddButton({ onClick, style }: AddButtonProps) {
  const { token } = theme.useToken();
  return (
    <SvgIcon
      name="icons-common-plus"
      style={{ color: token.colorTextTertiary, fontSize: '15px', ...style }}
      onClick={onClick}
    />
  );
}
