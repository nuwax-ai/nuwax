import Loading from '@/components/custom/Loading';
import ToggleWrap from '@/components/ToggleWrap';
import CurrentPublishItem from '@/components/VersionHistory/CurrentPublishItem';
import PublishRecordItem from '@/components/VersionHistory/PublishRecordItem';
import { dict } from '@/services/i18nRuntime';
import { apiPublishItemList, apiPublishOffShelf } from '@/services/publish';
import { apiUserAppConfigHistoryList } from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PublishStatusEnum } from '@/types/enums/common';
import type {
  HistoryData,
  PublishItemInfo,
  PublishOffShelfParams,
} from '@/types/interfaces/publish';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Empty, message, Modal } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AppDevPublishVersionRecordsProps {
  /** 是否显示侧栏 */
  visible: boolean;
  /** 目标 ID（全栈应用 / 三方应用等项目 ID） */
  appId: number;
  /** 目标类型，默认全栈应用 */
  targetType?: AgentComponentTypeEnum;
  /** 应用名称，下架确认弹窗展示 */
  appName?: string;
  /** 侧栏容器额外类名（用于页面级布局微调） */
  className?: string;
  /** 关闭侧栏 */
  onClose: () => void;
}

/**
 * 发布版本记录侧栏（全栈应用 / 三方应用共用）。
 * 当前发布：POST /api/publish/item/list；发布记录：GET /api/user-project/config/history/list。
 *
 * @param props.visible 是否显示
 * @param props.appId 目标 ID
 * @param props.targetType 目标类型
 * @param props.appName 应用名称
 * @param props.onClose 关闭回调
 * @returns 发布版本记录侧栏
 */
const AppDevPublishVersionRecords: React.FC<
  AppDevPublishVersionRecordsProps
> = ({
  visible,
  appId,
  targetType = AgentComponentTypeEnum.UserApp,
  appName,
  className,
  onClose,
}) => {
  const offShelfTargetLabel =
    targetType === AgentComponentTypeEnum.ThirdApp
      ? dict('PC.Components.VersionHistory.thirdApp')
      : dict('PC.Components.VersionHistory.userApp');
  const [loading, setLoading] = useState<boolean>(false);
  const [publishList, setPublishList] = useState<PublishItemInfo[]>([]);
  const [versionHistoryList, setVersionHistoryList] = useState<HistoryData[]>(
    [],
  );

  // 查询全栈应用配置历史（发布记录）
  const { run: runHistory } = useRequest(apiUserAppConfigHistoryList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: HistoryData[]) => {
      setVersionHistoryList(result ?? []);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 查询指定全栈应用已发布列表
  const { run: runPublishList } = useRequest(apiPublishItemList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: PublishItemInfo[]) => {
      setPublishList(result ?? []);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  const offShelfSuccess = useCallback((publishId: number) => {
    setPublishList((prev) =>
      prev.map((item) =>
        item.publishId === publishId ? { ...item, publishStatus: null } : item,
      ),
    );
  }, []);

  // 下架全栈应用
  const { run: runOffShelf } = useRequest(apiPublishOffShelf, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: PublishOffShelfParams[]) => {
      message.success(dict('PC.Components.VersionHistory.offShelfSuccess'));
      offShelfSuccess(params[0].publishId);
    },
  });

  useEffect(() => {
    if (!visible || !appId) {
      return;
    }
    setLoading(true);
    setPublishList([]);
    setVersionHistoryList([]);
    runHistory(appId, targetType);
    runPublishList({
      targetId: appId,
      targetType,
    });
  }, [appId, runHistory, runPublishList, targetType, visible]);

  const handleOffShelf = useCallback(
    (info: PublishItemInfo) => {
      if (info?.publishStatus !== PublishStatusEnum.Published) {
        return;
      }

      Modal.confirm({
        title: dict(
          'PC.Components.VersionHistory.confirmOffShelf',
          offShelfTargetLabel,
        ),
        icon: <ExclamationCircleFilled />,
        content: appName,
        okText: dict('PC.Components.SubmitButton.confirm'),
        maskClosable: true,
        cancelText: dict('PC.Common.Global.cancel'),
        onOk: () => {
          runOffShelf({
            targetType,
            targetId: appId,
            publishId: info.publishId,
          });
        },
      });
    },
    [appId, appName, offShelfTargetLabel, runOffShelf, targetType],
  );

  const content = loading ? (
    <Loading className="h-full" />
  ) : publishList.length > 0 || versionHistoryList.length > 0 ? (
    <div className={cx(styles['main-wrap'])}>
      {publishList.length > 0 ? (
        <>
          <h5 className={cx(styles.title)}>
            {dict('PC.Components.VersionHistory.currentPublish')}
          </h5>
          {publishList.map((info) => (
            <CurrentPublishItem
              key={info.publishId}
              info={info}
              onOffShelf={() => handleOffShelf(info)}
            />
          ))}
        </>
      ) : null}
      <h5 className={cx(styles.title)}>
        {dict('PC.Components.PublishComponentModal.publishRecord')}
      </h5>
      {versionHistoryList.map((item) => (
        <PublishRecordItem
          key={item.id}
          info={item}
          renderActions={() => null}
        />
      ))}
    </div>
  ) : (
    <div className={cx(styles.empty)}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={dict('PC.Pages.AppDevPro.publishVersionRecordsEmpty')}
      />
    </div>
  );

  return (
    <ToggleWrap
      title={dict('PC.Pages.AppDevPro.publishVersionRecords')}
      visible={visible}
      onClose={onClose}
      className={cx(styles.panel, className)}
    >
      <div className={cx(styles.content)}>{content}</div>
    </ToggleWrap>
  );
};

export default AppDevPublishVersionRecords;
