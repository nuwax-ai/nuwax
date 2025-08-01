import ActivatedImage from '@/assets/ecosystem/activated.png';
import { Image } from 'antd';
import classNames from 'classnames';
import styles from './index.less';
const cx = classNames.bind(styles);

interface ActivatedIconProps {
  size?: number;
}

// 已启用图标
const ActivatedIcon: React.FC<ActivatedIconProps> = ({ size = 40 }) => {
  return (
    <div
      className={cx(styles.activatedIcon)}
      style={{ width: size, height: size }}
    >
      <Image preview={false} src={ActivatedImage} alt="已启用" />
    </div>
  );
};

export default ActivatedIcon;
