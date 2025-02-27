import docImage from '@/assets/images/doc_image.jpg';
import type { DataProcessProps } from '@/types/interfaces/knowledge';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 数据处理
 */
const DataProcess: React.FC<DataProcessProps> = ({ uploadFileList }) => {
  return (
    <>
      {uploadFileList?.map((info) => (
        <div key={info.key} className={cx(styles.container)}>
          <div className={cx('flex', 'items-center', 'radius-6', styles.box)}>
            <img className={cx('radius-6')} src={docImage as string} alt="" />
            <div className={cx('flex-1', 'overflow-hide')}>
              <h3 className={cx('text-ellipsis')}>{info.fileName}</h3>
              <span className={cx(styles.desc)}>{`${info.size} Byte`}</span>
            </div>
            <span>处理中.处理完成</span>
          </div>
        </div>
      ))}
    </>
  );
};

export default DataProcess;
