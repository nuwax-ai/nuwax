import {apiHome} from '@/services/home';
import classNames from 'classnames';
import React, {useEffect, useState} from 'react';
import {useRequest} from 'umi';
import styles from './index.less';
import { RequestResponse } from '@/types/interfaces/request';

const cx = classNames.bind(styles);

const Home: React.FC = () => {
  const [data, setData] = useState<any[]>([]);

  const {run, loading} = useRequest(apiHome, {
    manual: true,
    debounceWait: 300,
    onSuccess: (res: RequestResponse<T>) => {
      const {data} = res;
      if (data) {
      }
    },
  });

  useEffect(() => {
    run();
  }, []);

  return (
    <div className={cx(styles.container)}>
      
    </div>
  );
};

export default Home;