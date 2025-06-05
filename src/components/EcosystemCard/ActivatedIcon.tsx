import ActivatedImage from '@/assets/ecosystem/activated.png';
import { Image } from 'antd';
import classNames from 'classnames';
import styles from './index.less';
const cx = classNames.bind(styles);
export default function ActivatedIcon({
  enabled = false,
  size = 40,
}: {
  enabled?: boolean;
  size?: number;
}) {
  const renderIcon = (enabled: boolean) => {
    if (enabled) {
      return <Image preview={false} src={ActivatedImage} alt="已启用" />;
    }
    return null;
  };
  return (
    <div
      className={cx(styles.activatedIcon)}
      style={{ width: size, height: size }}
    >
      {renderIcon(enabled)}
    </div>
  );
}
