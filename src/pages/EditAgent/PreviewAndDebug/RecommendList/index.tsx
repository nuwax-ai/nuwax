import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const RecommendList: React.FC = () => {
  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <div
        className={cx(
          styles.box,
          'px-16',
          'radius-6',
          'cursor-pointer',
          'hover-box',
        )}
      >
        你知道哪些最新奇的事物？
      </div>
      <div
        className={cx(
          styles.box,
          'px-16',
          'radius-6',
          'cursor-pointer',
          'hover-box',
        )}
      >
        嗨，你好！我对很多新奇事物都很了解哦。
      </div>
      <div
        className={cx(
          styles.box,
          'px-16',
          'radius-6',
          'cursor-pointer',
          'hover-box',
        )}
      >
        全国学习设计大赛圆满落下帷幕
      </div>
      <div
        className={cx(
          styles.box,
          'px-16',
          'radius-6',
          'cursor-pointer',
          'hover-box',
        )}
      >
        我对很多新奇事物都很了解哦
      </div>
      <div
        className={cx(
          styles.box,
          'px-16',
          'radius-6',
          'cursor-pointer',
          'hover-box',
        )}
      >
        全国学习设计大赛圆满落下帷幕
      </div>
      <div
        className={cx(
          styles.box,
          'px-16',
          'radius-6',
          'cursor-pointer',
          'hover-box',
        )}
      >
        本届大赛自 2017 年 8 月全面启动，主办方 CSTD
        中国人才发展社群共收到来自全国各地 150 余家企业申报的 210 个学习项目参赛
      </div>
      <div
        className={cx(
          styles.box,
          'px-16',
          'radius-6',
          'cursor-pointer',
          'hover-box',
        )}
      >
        全国学习设计大赛圆满落下帷幕
      </div>
    </div>
  );
};

export default RecommendList;
