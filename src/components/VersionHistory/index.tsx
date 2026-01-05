import ToggleWrap from '@/components/ToggleWrap';
import { apiAgentConfigHistoryList } from '@/services/agentConfig';
import { apiPluginConfigHistoryList } from '@/services/plugin';
import { apiPublishItemList, apiPublishOffShelf } from '@/services/publish';
import { apiSkillConfigHistoryList } from '@/services/skill';
import { apiWorkflowConfigHistoryList } from '@/services/workflow';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PermissionsEnum, PublishStatusEnum } from '@/types/enums/common';
import {
  HistoryData,
  PublishItemInfo,
  PublishOffShelfParams,
  VersionHistoryProps,
} from '@/types/interfaces/publish';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Drawer, Empty, message, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import ConditionRender from '../ConditionRender';
import Loading from '../custom/Loading';
import CurrentPublishItem from './CurrentPublishItem';
import styles from './index.less';
import PublishRecordItem from './PublishRecordItem';

const cx = classNames.bind(styles);

/**
 * 版本历史组件
 */
const VersionHistory: React.FC<VersionHistoryProps> = ({
  headerClassName,
  targetId,
  targetName,
  targetType = AgentComponentTypeEnum.Agent,
  permissions = [],
  visible,
  isDrawer = false,
  onClose,
  renderActions = () => null,
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
      : targetType === AgentComponentTypeEnum.Plugin
      ? '插件'
      : '工作流';

  // 请求接口
  const apiUrl =
    targetType === AgentComponentTypeEnum.Agent
      ? apiAgentConfigHistoryList
      : targetType === AgentComponentTypeEnum.Plugin
      ? apiPluginConfigHistoryList
      : targetType === AgentComponentTypeEnum.Skill
      ? apiSkillConfigHistoryList
      : apiWorkflowConfigHistoryList;

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

  // 智能体、插件、工作流、技能下架
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
    }
  }, [targetId, visible]);

  useEffect(() => {
    if (visible && permissions?.includes(PermissionsEnum.Publish)) {
      // 查询指定智能体插件或工作流已发布列表
      runPublishList({
        targetId,
        targetType,
      });
    }
  }, [visible, targetId, targetType, permissions]);

  // 下架
  const handleOffShelf = (info: PublishItemInfo) => {
    if (info?.publishStatus !== PublishStatusEnum.Published) {
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

  // 内容区域
  const content = loading ? (
    <Loading className="h-full" />
  ) : publishList?.length || versionHistoryList?.length ? (
    <div className={cx(styles['main-wrap'])}>
      <ConditionRender
        condition={
          permissions?.includes(PermissionsEnum.Publish) && publishList?.length
        }
      >
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
        <PublishRecordItem
          key={item.id}
          info={item}
          renderActions={renderActions}
        />
      ))}
    </div>
  ) : (
    <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
      <Empty
        description="暂无版本历史记录"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <div style={{ color: '#8c8c8c', fontSize: '12px', marginTop: '8px' }}>
          当您对项目进行修改时，系统会自动保存版本历史
        </div>
      </Empty>
    </div>
  );

  // 抽屉模式
  if (isDrawer) {
    return (
      <Drawer
        classNames={{
          body: cx(styles['drawer-body']),
        }}
        closable
        title={
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600 }}>版本历史</div>
            <div
              style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}
            >
              {targetName} - {componentType}
            </div>
          </div>
        }
        placement="right"
        open={visible}
        onClose={onClose}
        width={480}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <ToggleWrap
      title={'版本历史'}
      visible={visible}
      onClose={onClose}
      headerClassName={headerClassName}
    >
      {content}
    </ToggleWrap>
  );
};

export default VersionHistory;
