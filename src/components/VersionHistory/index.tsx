import ToggleWrap from '@/components/ToggleWrap';
import { apiPublishedOffShelf } from '@/services/library';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PublishedOffShelfParams } from '@/types/interfaces/library';
import type { VersionHistoryProps } from '@/types/interfaces/space';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { message, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import CurrentPublishItem from './CurrentPublishItem';
import styles from './index.less';
import PublishRecordItem from './PublishRecordItem';

const cx = classNames.bind(styles);

/**
 * 版本历史组件
 */
const VersionHistory: React.FC<VersionHistoryProps> = ({
  list,
  visible,
  onClose,
}) => {
  const [publishList, setPublishList] = useState([]);
  // 智能体、插件、工作流下架
  const { run: runOffShelf } = useRequest(apiPublishedOffShelf, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: PublishedOffShelfParams[]) => {
      message.success('已成功下架');
      const { targetId } = params[0];
      console.log('下架成功', targetId);
      const _agentList: any =
        publishList?.map((item: any) => {
          if (item.id === targetId) {
            return { ...item, publishStatus: null };
          }
          return item;
        }) || [];
      setPublishList(_agentList);
    },
  });

  useEffect(() => {
    setPublishList([]);
  }, []);

  // 下架
  const handleOff = (info: any) => {
    Modal.confirm({
      title: '您确定要下架此智能体吗?',
      icon: <ExclamationCircleFilled />,
      content: info?.name,
      okText: '确定',
      maskClosable: true,
      cancelText: '取消',
      onOk() {
        runOffShelf({
          targetType: AgentComponentTypeEnum.Agent,
          targetId: info.id,
        });
      },
    });
  };

  return (
    <ToggleWrap title={'版本历史'} visible={visible} onClose={onClose}>
      <div className={cx(styles['main-wrap'])}>
        <h5 className={cx(styles.title)}>当前发布</h5>
        {publishList?.map((info: any) => (
          <CurrentPublishItem key={info.id} onOff={() => handleOff(info)} />
        ))}
        <h5 className={cx(styles.title)}>编排与发布记录</h5>
        {list?.map((item) => (
          <PublishRecordItem key={item.id} info={item} />
        ))}
      </div>
    </ToggleWrap>
  );
};

export default VersionHistory;
