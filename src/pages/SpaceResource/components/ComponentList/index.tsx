import MoveCopyComponent from '@/components/MoveCopyComponent';
import Loading from '@/components/custom/Loading';
import { dict } from '@/services/i18nRuntime';
import {
  apiRemoveResourceFromGroup,
  apiWorkflowCopyToSpace,
  apiWorkflowDelete,
} from '@/services/library';
import { apiPluginCopyToSpace, apiPluginDelete } from '@/services/plugin';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PluginTypeEnum } from '@/types/enums/plugin';
import {
  ApplicationMoreActionEnum,
  ComponentTypeEnum,
} from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type { ComponentInfo } from '@/types/interfaces/library';
import { modalConfirm } from '@/utils/ant-custom';
import { exportConfigFile } from '@/utils/exportImportFile';
import {
  jumpTo,
  jumpToPlugin,
  jumpToPluginCloudTool,
  jumpToWorkflow,
} from '@/utils/router';
import { Empty, message } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { history, useRequest } from 'umi';
import ComponentItem from '../../../SpaceLibrary/ComponentItem';
import MoveToGroupModal from './components/MoveToGroupModal';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ComponentListProps {
  loading: boolean;
  componentList: ComponentInfo[];
  spaceId: number;
  onDelete: (id: number) => void;
  onRefresh?: () => void;
}

const ComponentList: React.FC<ComponentListProps> = ({
  loading,
  componentList,
  spaceId,
  onDelete,
  onRefresh,
}) => {
  const [currentComponentInfo, setCurrentComponentInfo] =
    useState<ComponentInfo | null>(null);
  const [openMove, setOpenMove] = useState(false);
  const [loadingWorkflow, setLoadingWorkflow] = useState(false);
  const [loadingPlugin, setLoadingPlugin] = useState(false);

  // 移入分组弹窗展示状态
  const [openMoveGroup, setOpenMoveGroup] = useState(false);

  const { run: runPluginDel } = useRequest(apiPluginDelete, {
    manual: true,
    onSuccess: (_: null, p: number[]) => {
      message.success(dict('PC.Pages.SpaceLibrary.Index.pluginDeleteSuccess'));
      onDelete(p[0]);
    },
  });

  const { run: runWorkflowDel } = useRequest(apiWorkflowDelete, {
    manual: true,
    onSuccess: (_: null, p: number[]) => {
      message.success(
        dict('PC.Pages.SpaceLibrary.Index.workflowDeleteSuccess'),
      );
      onDelete(p[0]);
    },
  });

  const handleCopyToSpaceSuccess = (
    targetSpaceId: number,
    data: number,
    type: ComponentTypeEnum,
  ) => {
    setOpenMove(false);
    if (type === ComponentTypeEnum.Plugin) {
      if (currentComponentInfo?.ext === PluginTypeEnum.CODE) {
        jumpToPluginCloudTool(targetSpaceId, data);
      } else {
        jumpToPlugin(targetSpaceId, data);
      }
    } else if (type === ComponentTypeEnum.Workflow) {
      jumpToWorkflow(targetSpaceId, data);
    }
  };

  const { run: runPluginCopyToSpace } = useRequest(apiPluginCopyToSpace, {
    manual: true,
    onSuccess: (data: number, p: number[]) => {
      message.success(dict('PC.Pages.SpaceLibrary.Index.pluginCopySuccess'));
      setLoadingPlugin(false);
      handleCopyToSpaceSuccess(p[1], data, ComponentTypeEnum.Plugin);
    },
    onError: () => setLoadingPlugin(false),
  });

  const { run: runWorkflowCopyToSpace } = useRequest(apiWorkflowCopyToSpace, {
    manual: true,
    onSuccess: (data: number, p: number[]) => {
      message.success(dict('PC.Pages.SpaceLibrary.Index.workflowCopySuccess'));
      setLoadingWorkflow(false);
      handleCopyToSpaceSuccess(p[1], data, ComponentTypeEnum.Workflow);
    },
    onError: () => setLoadingWorkflow(false),
  });

  const handlerConfirmCopyToSpace = (targetSpaceId: number) => {
    if (currentComponentInfo?.type === ComponentTypeEnum.Plugin) {
      setLoadingPlugin(true);
      runPluginCopyToSpace(currentComponentInfo.id, targetSpaceId);
    } else if (currentComponentInfo?.type === ComponentTypeEnum.Workflow) {
      setLoadingWorkflow(true);
      runWorkflowCopyToSpace(currentComponentInfo.id, targetSpaceId);
    }
  };

  const handleClickComponent = (item: ComponentInfo) => {
    const { type, id, spaceId, ext } = item;
    if (type === ComponentTypeEnum.Workflow) {
      jumpTo(`/space/${spaceId}/workflow/${id}`);
    } else if (type === ComponentTypeEnum.Plugin) {
      const url =
        ext === PluginTypeEnum.CODE
          ? `/space/${spaceId}/plugin/${id}/cloud-tool`
          : `/space/${spaceId}/plugin/${id}`;
      jumpTo(url);
    }
  };

  const handleClickMore = (item: CustomPopoverItem, info: ComponentInfo) => {
    const { action, type } = item as unknown as {
      action: ApplicationMoreActionEnum;
      type: ComponentTypeEnum;
    };
    if (action === ApplicationMoreActionEnum.Del) {
      const { id, name } = info;
      modalConfirm(
        dict('PC.Pages.SpaceLibrary.Index.confirmDeleteComponent'),
        name,
        () => {
          if (type === ComponentTypeEnum.Plugin) runPluginDel(id);
          else if (type === ComponentTypeEnum.Workflow) runWorkflowDel(id);
          new Promise((resolve) => {
            setTimeout(resolve, 1000);
          });
        },
      );
    } else if (action === ApplicationMoreActionEnum.Log) {
      const logType =
        type === ComponentTypeEnum.Workflow
          ? AgentComponentTypeEnum.Workflow
          : AgentComponentTypeEnum.Plugin;
      history.push(
        `/space/${spaceId}/library-log?targetType=${logType}&targetId=${
          info?.id ?? ''
        }`,
      );
    } else if (action === ApplicationMoreActionEnum.Copy_To_Space) {
      setOpenMove(true);
      setCurrentComponentInfo(info);
    } else if (action === ApplicationMoreActionEnum.Add_To_Group) {
      setCurrentComponentInfo(info);
      setOpenMoveGroup(true);
    } else if (action === ApplicationMoreActionEnum.Remove_From_Group) {
      const { id, name, groupId } = info;
      if (!groupId) return;
      modalConfirm(
        dict('PC.Pages.SpaceResource.LeftGroupList.confirmRemoveFromGroup'),
        dict('PC.Pages.SpaceResource.LeftGroupList.confirmRemoveDesc').replace(
          '{0}',
          name,
        ),
        () => {
          return apiRemoveResourceFromGroup(groupId, {
            targetType: info.type,
            targetId: id,
          })
            .then((res) => {
              if (res.success) {
                message.success(
                  dict('PC.Pages.SpaceResource.LeftGroupList.removeSuccess'),
                );
                onRefresh?.();
              }
            })
            .catch(() => {});
        },
      );
    } else if (action === ApplicationMoreActionEnum.Export_Config) {
      if (type === ComponentTypeEnum.Plugin) {
        exportConfigFile(info.id, AgentComponentTypeEnum.Plugin);
      } else if (type === ComponentTypeEnum.Workflow) {
        modalConfirm(
          dict(
            'PC.Pages.SpaceLibrary.Index.exportConfigTitle',
            info?.name || '',
          ),
          dict('PC.Pages.SpaceLibrary.Index.exportWorkflowConfigDesc'),
          () => {
            exportConfigFile(info.id, AgentComponentTypeEnum.Workflow);
            new Promise((resolve) => {
              setTimeout(resolve, 1000);
            });
          },
        );
      }
    }
  };

  return (
    <>
      {loading ? (
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Loading />
        </div>
      ) : componentList.length > 0 ? (
        <div
          className={cx(
            styles['main-container'],
            'flex-1',
            'scroll-container-hide',
          )}
        >
          {componentList.map((info) => (
            <ComponentItem
              key={`${info.id}${info.type}`}
              componentInfo={info}
              onClick={() => handleClickComponent(info)}
              onClickMore={(item) => handleClickMore(item, info)}
            />
          ))}
        </div>
      ) : (
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Empty description={dict('PC.Pages.SpaceLibrary.Index.noResults')} />
        </div>
      )}

      <MoveCopyComponent
        spaceId={spaceId}
        loading={loadingPlugin || loadingWorkflow}
        type={ApplicationMoreActionEnum.Copy_To_Space}
        mode={currentComponentInfo?.type as unknown as AgentComponentTypeEnum}
        open={openMove}
        title={currentComponentInfo?.name}
        onCancel={() => setOpenMove(false)}
        onConfirm={handlerConfirmCopyToSpace}
      />

      <MoveToGroupModal
        open={openMoveGroup}
        currentComponentInfo={currentComponentInfo}
        spaceId={spaceId}
        onCancel={() => setOpenMoveGroup(false)}
        onSuccess={() => {
          setOpenMoveGroup(false);
          onRefresh?.();
        }}
      />
    </>
  );
};

export default ComponentList;
