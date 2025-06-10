import ShowStand from '@/components/ShowStand';
// import { ICON_FOLD } from '@/constants/images.constants';
import { EditAgentShowType } from '@/types/enums/space';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const ShowArea: React.FC = () => {
  const { cardList, showType, setShowType } = useModel('conversationInfo');

  // const handlerVisible = () => {
  //   if (showType === EditAgentShowType.Hide) {
  //     setShowType(EditAgentShowType.Show_Stand);
  //   } else {
  //     setShowType(EditAgentShowType.Hide);
  //   }
  // };

  return (
    <div
      className={cx('flex', 'flex-col', 'items-end', styles.container)}
      style={{
        display: showType === EditAgentShowType.Show_Stand ? 'flex' : 'none',
      }}
    >
      {/*<ICON_FOLD onClick={handlerVisible} />*/}
      {/*展示台*/}
      <ShowStand
        className={cx('flex-1')}
        cardList={cardList}
        visible={showType === EditAgentShowType.Show_Stand}
        onClose={() => setShowType(EditAgentShowType.Hide)}
      />
    </div>
  );
};

export default ShowArea;
