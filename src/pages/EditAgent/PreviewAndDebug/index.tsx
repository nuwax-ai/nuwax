import RecommendList from '@/pages/EditAgent/PreviewAndDebug/RecommendList';
import classNames from 'classnames';
import React from 'react';
import ChatView from './ChatView';
import styles from './index.less';
import PreviewAndDebugHeader from './PreviewAndDebugHeader';

const cx = classNames.bind(styles);

interface PreviewAndDebugHeaderProps {
  onPressDebug: () => void;
}

/**
 * 预览与调试组件
 */
const PreviewAndDebug: React.FC<PreviewAndDebugHeaderProps> = ({
  onPressDebug,
}) => {
  const avatar =
    'https://p6-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/a200a4d4715a403cb3b2c52b9c71f6e4~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1739513009&x-signature=ltYlnCs3AvJgGnFoj73k8AKYewI%3D';

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <PreviewAndDebugHeader onPressDebug={onPressDebug} />
      <div className={cx(styles['divider-horizontal'])}></div>
      <div className={cx(styles['main-content'], 'flex-1')}>
        <ChatView
          avatar={avatar}
          nickname={'英雄联盟'}
          content={
            '为你查询到第二届 CSTD 全国学习设计大赛的相关信息：\n' +
            '2017 年 11 月 8 日，随着北京赛区决赛获奖名单的公布，为期 3 个月的第二届 CSTD 全国学习设计大赛圆满落下帷幕。\n' +
            '本届大赛自 2017 年 8 月全面启动，主办方 CSTD 中国人才发展社群共收到来自全国各地 150 余家企业申报的 210 个学习项目参赛。\n' +
            '经过审核入围决赛的 72 个项目在网络投票环节，共吸引 264.2 万人次浏览了项目详情介绍，43.2 万人次为入围项目投票。\n' +
            '决赛分别于 2017 年 10 月 24 日在深圳、10 月 27 日在南京、11 月 3 日在上海、11 月 8 日在北京举办项目路演。每个赛区均有 18 个学习项目进入决赛，四场决赛，场场爆满，共有 2100 多名学习专业人士参加决赛路演，并担任大众评委和专家评委，共同打分现场评出最终获奖名单。'
          }
        />
        <ChatView
          avatar={avatar}
          nickname={'英雄联盟'}
          content={
            '为你查询到第二届 CSTD 全国学习设计大赛的相关信息：\n' +
            '2017 年 11 月 8 日，随着北京赛区决赛获奖名单的公布，为期 3 个月的第二届 CSTD 全国学习设计大赛圆满落下帷幕。\n' +
            '本届大赛自 2017 年 8 月全面启动，主办方 CSTD 中国人才发展社群共收到来自全国各地 150 余家企业申报的 210 个学习项目参赛。\n' +
            '经过审核入围决赛的 72 个项目在网络投票环节，共吸引 264.2 万人次浏览了项目详情介绍，43.2 万人次为入围项目投票。\n' +
            '决赛分别于 2017 年 10 月 24 日在深圳、10 月 27 日在南京、11 月 3 日在上海、11 月 8 日在北京举办项目路演。每个赛区均有 18 个学习项目进入决赛，四场决赛，场场爆满，共有 2100 多名学习专业人士参加决赛路演，并担任大众评委和专家评委，共同打分现场评出最终获奖名单。'
          }
        />
        <RecommendList />
      </div>
    </div>
  );
};

export default PreviewAndDebug;
