// import { apiHome } from '@/services/Demo';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
// import { useRequest } from 'umi';
import styles from './index.less';
// import { RequestResponse } from '@/types/interfaces/request';
import FoldWrap from '@/components/FoldWrap';
import { ICON_FOLD } from '@/constants/images.constants';
// import Card from '@/components/Card';

const cx = classNames.bind(styles);

interface ShowAreaProps {
  executeResults: string[];
}

const ShowArea: React.FC<ShowAreaProps> = ({ executeResults }) => {
  const [visible, setVisible] = useState<boolean>(true);
  // const [contents, setContents] = useState<[]>([]);

  // const { run, loading } = useRequest(apiHome, {
  //   manual: true,
  //   debounceWait: 300,
  //   onSuccess: (res: RequestResponse<null>) => {
  //     const { data } = res;
  //     if (data) {
  //     }
  //   },
  // });

  useEffect(() => {
    // run();
  }, []);

  const handlerVisible = () => {
    setVisible(!visible);
  };

  return (
    <div className={`flex flex-col items-end ${styles.container}`}>
      <ICON_FOLD onClick={handlerVisible} />
      <FoldWrap
        className={cx(styles.box, 'flex-1')}
        lineMargin
        title={'展示台'}
        visible={visible}
        onClose={() => setVisible(false)}
      >
        <div className={cx(styles['main-wrap'])}>
          {executeResults?.map((item, index) => (
            <div key={index}>{item}</div>
          ))}
          {/*<Card type={CardStyleEnum.ONE} />*/}
          {/*<CardModeSetting*/}
          {/*  type={CardStyleEnum.ONE}*/}
          {/*  checked={checked}*/}
          {/*  onClick={setChecked}*/}
          {/*/>*/}
        </div>
      </FoldWrap>
    </div>
  );
};

export default ShowArea;
