import MenuListItem from '@/components/base/MenuListItem';
import ConditionRender from '@/components/ConditionRender';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiGetSpaceDetail } from '@/services/teamSetting';
import type { AgentInfo } from '@/types/interfaces/agent';
import { SpaceInfo } from '@/types/interfaces/workspace';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { history, useModel, useParams } from 'umi';
import DynamicSecondMenu from '../DynamicSecondMenu';
import DevCollect from './DevCollect';
import styles from './index.less';
import SpaceTitle from './SpaceTitle';

const cx = classNames.bind(styles);

const SpaceSection: React.FC<{
  activeTab: string;
  style?: React.CSSProperties;
}> = ({ activeTab, style }) => {
  const { spaceId } = useParams();

  const { spaceList, currentSpaceInfo, handleCurrentSpaceInfo, getSpaceId } =
    useModel('spaceModel');
  const { editAgentList, runEdit, runDevCollect } = useModel('devCollectAgent');
  // // 关闭移动端菜单
  // const { handleCloseMobileMenu } = useModel('layout');

  const finalSpaceId = useMemo(() => {
    return spaceId ?? getSpaceId();
  }, [spaceId, getSpaceId]);

  const [dynamicTitle, setDynamicTitle] = useState<string>('');

  useEffect(() => {
    const spaceIdStr = String(finalSpaceId);
    const isInList = spaceList?.some(
      (item: SpaceInfo) => String(item.id) === spaceIdStr,
    );

    if (isInList) {
      setDynamicTitle(currentSpaceInfo?.name || '个人空间');
    } else {
      // Fetch details
      apiGetSpaceDetail(finalSpaceId).then((res) => {
        if (res.code === SUCCESS_CODE && res.data) {
          const { creatorName, name } = res.data;
          const display = creatorName ? `${creatorName} - ${name}` : name;
          setDynamicTitle(display || '个人空间');
        } else {
          setDynamicTitle('个人空间');
        }
      });
    }
  }, [finalSpaceId, spaceList, currentSpaceInfo]);

  useEffect(() => {
    // 根据url地址中的finalSpaceId来重置当前空间信息，因为用户可能手动修改url地址栏中的空间id，也可能是复制来的url
    if (finalSpaceId && !!spaceList?.length) {
      handleCurrentSpaceInfo(spaceList, Number(finalSpaceId));
    }
  }, [spaceList, finalSpaceId]);

  useEffect(() => {
    // 最近编辑
    runEdit({
      size: 5,
    });
    // 开发收藏
    runDevCollect({
      page: 1,
      size: 5,
    });
  }, []);

  // 点击进入"工作空间智能体"
  const handleClick = (info: AgentInfo) => {
    const { agentId, spaceId } = info;
    history.push(`/space/${spaceId}/agent/${agentId}`);
  };

  return (
    <div className={cx('h-full', 'overflow-y', styles.container)} style={style}>
      <div style={{ padding: '0 12px 14px' }}>
        <SpaceTitle name={dynamicTitle} />
      </div>

      {/* 空间菜单列表 */}
      <DynamicSecondMenu parentCode={activeTab} />
      <ConditionRender condition={editAgentList?.length}>
        <h3 className={cx(styles['collection-title'])}>最近编辑</h3>
        <div className="flex flex-col gap-4">
          {editAgentList?.map((item: AgentInfo) => (
            <MenuListItem
              key={item.id}
              onClick={() => handleClick(item)}
              icon={item.icon}
              name={item.name}
            />
          ))}
        </div>
      </ConditionRender>
      <h3 className={cx(styles['collection-title'])}>开发收藏</h3>
      <DevCollect />
    </div>
  );
};

export default SpaceSection;
