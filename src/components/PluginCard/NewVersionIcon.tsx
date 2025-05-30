import classNames from 'classnames';
import styles from './index.less';
const cx = classNames.bind(styles);
export default function NewVersionIcon() {
  return <div className={cx(styles.newVersionIcon)}>有版本更新</div>;
}
