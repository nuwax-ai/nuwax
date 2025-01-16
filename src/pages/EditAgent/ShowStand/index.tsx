import Card from '@/components/Card';
import FoldWrap from '@/components/FoldWrap';
import { CardStyleEnum } from '@/types/enums/common';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ShowStandProps {
  visible: boolean;
  onClose: () => void;
}

const LIST = [
  {
    id: 0,
    img: 'https://p6-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/ac5d6879d56243129581b1f1539f310d~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1739513009&x-signature=bLo5WhktyVWLdGyIZrXraFCG26s%3D',
    title: 'python学习助手',
    desc: 'python学习助手python学习助手python学习助手python学习助手',
  },
  {
    id: 1,
    img: 'https://p6-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/ac5d6879d56243129581b1f1539f310d~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1739513009&x-signature=bLo5WhktyVWLdGyIZrXraFCG26s%3D',
    title: 'python学习助手',
    desc: 'python学习助手python学习助手python学习助手python学习助手',
  },
  {
    id: 2,
    img: 'https://p6-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/ac5d6879d56243129581b1f1539f310d~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1739513009&x-signature=bLo5WhktyVWLdGyIZrXraFCG26s%3D',
    title: 'python学习助手',
    desc: 'python学习助手python学习助手python学习助手python学习助手',
  },
  {
    id: 3,
    img: 'https://p6-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/ac5d6879d56243129581b1f1539f310d~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1739513009&x-signature=bLo5WhktyVWLdGyIZrXraFCG26s%3D',
    title: 'python学习助手',
    desc: 'python学习助手python学习助手python学习助手python学习助手',
  },
  {
    id: 4,
    img: 'https://p6-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/ac5d6879d56243129581b1f1539f310d~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1739513009&x-signature=bLo5WhktyVWLdGyIZrXraFCG26s%3D',
    title: 'python学习助手',
    desc: 'python学习助手python学习助手python学习助手python学习助手',
  },
];

/**
 * 展示台
 */
const ShowStand: React.FC<ShowStandProps> = ({ visible, onClose }) => {
  // const [data, setData] = useState<any[]>([]);
  //
  // const { run, loading } = useRequest(apiHome, {
  //   manual: true,
  //   debounceWait: 300,
  //   onSuccess: (res: RequestResponse<T>) => {
  //     const { data } = res;
  //     if (data) {
  //     }
  //   },
  // });
  //
  // useEffect(() => {
  //   run();
  // }, []);

  return (
    <FoldWrap lineMargin title={'展示台'} visible={visible} onClose={onClose}>
      <div className={cx(styles.container)}>
        {LIST.map((item) => (
          <Card
            key={item.id}
            {...item}
            type={CardStyleEnum.ONE}
            className={styles['card-wrapper']}
          />
        ))}
      </div>
    </FoldWrap>
  );
};

export default ShowStand;
