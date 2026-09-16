import CurrentPublishItem from '@/components/VersionHistory/CurrentPublishItem';
import Loading from '@/components/custom/Loading';
import ToggleWrap from '@/components/ToggleWrap';
import { dict } from '@/services/i18nRuntime';
import { apiPublishItemList, apiPublishOffShelf } from '@/services/publish';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PublishStatusEnum } from '@/types/enums/common';
import type {
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
  /** 全栈应用 ID */
  appId: number;
  /** 应用名称，下架确认弹窗展示 */
  appName?: string;
  /** 关闭侧栏 */
  onClose: () => void;
}

/**
 * AppDevPro 发布版本记录侧栏。
 * 仅调用 POST /api/publish/item/list 查询 UserApp 发布项。
 *
 * @param props.visible 是否显示
 * @param props.appId 应用 ID
 * @param props.appName 应用名称
 * @param props.onClose 关闭回调
 * @returns 发布版本记录侧栏
 */
const AppDevPublishVersionRecords: React.FC<AppDevPublishVersionRecordsProps> = ({
  visible,
  appId,
  appName,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [publishList, setPublishList] = useState<PublishItemInfo[]>([]);

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
        item.publishId === publishId
          ? { ...item, publishStatus: null }
          : item,
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
    // 加载中
    setLoading(true);
    // 清空发布列表
    setPublishList([]);
    // 查询指定全栈应用已发布列表
    runPublishList({
      targetId: appId,
      targetType: AgentComponentTypeEnum.UserApp,
    });
  }, [appId, runPublishList, visible]);

  // 下架全栈应用
  const handleOffShelf = useCallback(
    (info: PublishItemInfo) => {
      if (info?.publishStatus !== PublishStatusEnum.Published) {
        return;
      }

      Modal.confirm({
        title: dict(
          'PC.Components.VersionHistory.confirmOffShelf',
          dict('PC.Components.VersionHistory.userApp'),
        ),
        icon: <ExclamationCircleFilled />,
        content: appName,
        okText: dict('PC.Components.SubmitButton.confirm'),
        maskClosable: true,
        cancelText: dict('PC.Common.Global.cancel'),
        onOk: () => {
          runOffShelf({
            targetType: AgentComponentTypeEnum.UserApp,
            targetId: appId,
            publishId: info.publishId,
          });
        },
      });
    },
    [appId, appName, runOffShelf],
  );

  const content = loading ? (
    <Loading className="h-full" />
  ) : publishList.length > 0 ? (
    <div className={cx(styles.list)}>
      {publishList.map((info) => (
        <CurrentPublishItem
          key={info.publishId}
          info={info}
          onOffShelf={() => handleOffShelf(info)}
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
      className={cx(styles.panel)}
    >
      <div className={cx(styles.content)}>{content}</div>
    </ToggleWrap>
  );
};

export default AppDevPublishVersionRecords;
