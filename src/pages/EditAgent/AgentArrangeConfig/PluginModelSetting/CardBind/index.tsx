import Loading from '@/components/Loading';
import { apiAgentCardList } from '@/services/agentConfig';
import type { AgentCardInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel, useRequest } from 'umi';
import BindDataSource from './BindDataSource';
import CardModeSetting from './CardModeSetting';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 卡片绑定
 */
const CardBind: React.FC = () => {
  // 当前卡片信息
  const [cardInfo, setCardInfo] = useState<AgentCardInfo>();
  const [loading, setLoading] = useState<boolean>(false);
  // 卡片列表
  const [agentCardList, setAgentCardList] = useState<AgentCardInfo[]>([]);
  // 当前组件信息
  const { currentComponentInfo } = useModel('spaceAgent');

  // 查询卡片列表
  const { run: runCard } = useRequest(apiAgentCardList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentCardInfo[]) => {
      if (result?.length) {
        setAgentCardList(result);
        let info;
        // 判断是否已绑定卡片样式
        const cardId = currentComponentInfo?.bindConfig?.cardBindConfig?.cardId;
        if (cardId) {
          info = result.find((item) => item.id === cardId);
        } else {
          info = result[0];
        }

        setCardInfo(info);
      }
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    setLoading(true);
    runCard();
  }, []);

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
            <BindDataSource cardInfo={cardInfo} />
          </div>
        </>
      )}
    </div>
  );
};

export default CardBind;
