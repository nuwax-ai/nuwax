import ToggleWrap from '@/components/ToggleWrap';
import { apiAgentConfigHistoryList } from '@/services/agentConfig';
import { apiPluginConfigHistoryList } from '@/services/plugin';
import { apiPublishItemList, apiPublishOffShelf } from '@/services/publish';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  HistoryData,
  PublishItemInfo,
  PublishOffShelfParams,
  VersionHistoryProps,
} from '@/types/interfaces/publish';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Empty, message, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import ConditionRender from '../ConditionRender';
import Loading from '../Loading';
import CurrentPublishItem from './CurrentPublishItem';
import styles from './index.less';
import PublishRecordItem from './PublishRecordItem';

const cx = classNames.bind(styles);

/**
 * 版本历史组件
 */
const VersionHistory: React.FC<VersionHistoryProps> = ({
  targetId,
  targetName,
  targetType = AgentComponentTypeEnum.Agent,
  visible,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  // 已发布列表
  const [publishList, setPublishList] = useState<PublishItemInfo[]>([]);
  // 历史版本信息
  const [versionHistoryList, setVersionHistoryList] = useState<HistoryData[]>(
    [],
  );

  // 组件类型
  const componentType =
    targetType === AgentComponentTypeEnum.Agent
      ? '智能体'
      : AgentComponentTypeEnum.Plugin
      ? '插件'
      : '工作流';
  // 请求接口
  const apiUrl =
    targetType === AgentComponentTypeEnum.Agent
      ? apiAgentConfigHistoryList
      : apiPluginConfigHistoryList;

  // 版本历史记录
  const { run: runHistory } = useRequest(apiUrl, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: HistoryData[]) => {
      setVersionHistoryList(result);
      setLoading(false);
    },
  });

  // 查询指定智能体插件或工作流已发布列表
  const { run: runPublishList } = useRequest(apiPublishItemList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: PublishItemInfo[]) => {
      setPublishList(result);
    },
  });

  // 下架成功后更新已发布列表
  const offShelfSuccess = (publishId: number) => {
    const _publishList =
      publishList?.map((item: PublishItemInfo) => {
        if (item.publishId === publishId) {
          return { ...item, publishStatus: null };
        }
        return item;
      }) || [];
    setPublishList(_publishList);
  };

  // 智能体、插件、工作流下架
  const { run: runOffShelf } = useRequest(apiPublishOffShelf, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: PublishOffShelfParams[]) => {
      message.success('已成功下架');
      offShelfSuccess(params[0].publishId);
    },
  });

  useEffect(() => {
    if (visible) {
      setLoading(true);
      runHistory(targetId);
      // 查询指定智能体插件或工作流已发布列表
      runPublishList({
        targetId,
        targetType,
      });
    }
  }, [targetId, targetType, visible]);

  // 下架
  const handleOffShelf = (info: PublishItemInfo) => {
    if (!info.publishStatus) {
      return;
    }
    Modal.confirm({
      title: `您确定要下架此${componentType}吗?`,
      icon: <ExclamationCircleFilled />,
      content: targetName,
      okText: '确定',
      maskClosable: true,
      cancelText: '取消',
      onOk() {
        runOffShelf({
          targetType,
          targetId,
          publishId: info.publishId,
        });
      },
    });
  };

  return (
    <ToggleWrap title={'版本历史'} visible={visible} onClose={onClose}>
      {loading ? (
        <Loading className="h-full" />
      ) : publishList?.length || versionHistoryList?.length ? (
        <div className={cx(styles['main-wrap'])}>
          <ConditionRender condition={publishList?.length}>
            <h5 className={cx(styles.title)}>当前发布</h5>
            {publishList?.map((info: PublishItemInfo) => (
              <CurrentPublishItem
                key={info.publishId}
                info={info}
                onOffShelf={() => handleOffShelf(info)}
              />
            ))}
          </ConditionRender>
          <h5 className={cx(styles.title)}>编排与发布记录</h5>
          {versionHistoryList?.map((item) => (
            <PublishRecordItem key={item.id} info={item} />
          ))}
        </div>
      ) : (
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Empty description="暂无历史记录" />
        </div>
      )}
    </ToggleWrap>
  );
};

export default VersionHistory;
