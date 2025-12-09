import AddButton from '@/components/AddButton';
import ConfigOptionsHeader from '../ConfigOptionsHeader';

interface HeaderToolButtonProps {
  title: string;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
}

export default function HeaderToolButton({
  title,
  onClick,
}: HeaderToolButtonProps) {
  return (
    <ConfigOptionsHeader title={title}>
      <AddButton onClick={onClick} style={{ marginRight: '14px' }} />
    </ConfigOptionsHeader>
  );
}
