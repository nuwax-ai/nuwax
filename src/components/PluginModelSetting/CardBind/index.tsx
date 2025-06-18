import Loading from '@/components/Loading';
import type { AgentCardInfo } from '@/types/interfaces/agent';
import type { CardBindProps } from '@/types/interfaces/agentConfig';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import BindDataSource from './BindDataSource';
import CardModeSetting from './CardModeSetting';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 卡片绑定
 */
const CardBind: React.FC<CardBindProps> = ({
  loading,
  agentCardList,
  componentInfo,
  onSaveSet,
}) => {
  // 当前卡片信息
  const [cardInfo, setCardInfo] = useState<AgentCardInfo>();

  useEffect(() => {
    // 判断是否已绑定卡片样式
    const cardId = componentInfo?.bindConfig?.cardBindConfig?.cardId;
    if (cardId) {
      setCardInfo(agentCardList.find((item) => item.id === cardId));
    } else {
      setCardInfo(agentCardList[0]);
    }
  }, [agentCardList, componentInfo]);

  return (
    <div className={cx('flex', 'h-full', styles.container)}>
      {loading ? (
        <Loading className={cx('h-full')} />
      ) : (
        <>
          <div className={cx('flex-1', 'px-16', 'py-16')}>
            <h3 className={cx(styles.title)}>选择卡片样式</h3>
            <CardModeSetting
              cardKey={cardInfo?.cardKey}
              list={agentCardList}
              onChoose={setCardInfo}
            />
          </div>
          <div className={cx('flex-1', 'flex', 'flex-col', 'px-16', 'py-16')}>
            <h3 className={cx(styles.title)}>为卡片绑定数据源</h3>
            <BindDataSource
              cardInfo={cardInfo}
              componentInfo={componentInfo}
              onSaveSet={onSaveSet}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CardBind;
