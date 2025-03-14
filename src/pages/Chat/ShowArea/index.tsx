import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import { ICON_FOLD } from '@/constants/images.constants';
import ShowStand from '@/components/ShowStand';
import { EditAgentShowType } from '@/types/enums/space';
import { useModel } from 'umi';

const cx = classNames.bind(styles);

const ShowArea: React.FC = () => {
  const { showType, setShowType } = useModel('conversationInfo');

  const handlerVisible = () => {
    if (showType === EditAgentShowType.Hide) {
      setShowType(EditAgentShowType.Show_Stand);
    } else {
      setShowType(EditAgentShowType.Hide);
    }
  };

  return (
    <div className={cx('flex', 'flex-col', 'items-end', styles.container)}>
      <ICON_FOLD onClick={handlerVisible} />
      {/*展示台*/}
      <ShowStand
        className={cx('flex-1')}
        list={[]}
        visible={showType === EditAgentShowType.Show_Stand}
        onClose={() => setShowType(EditAgentShowType.Hide)}
      />
    </div>
  );
};

export default ShowArea;
