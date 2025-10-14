import { PAGE_SETTING_ACTIONS } from '@/constants/space.constants';
import { apiAgentPageUpdate } from '@/services/agentConfig';
import { HomeIndexEnum } from '@/types/enums/agent';
import { PageSettingEnum } from '@/types/enums/space';
import {
  AgentComponentInfo,
  AgentPageUpdateParams,
} from '@/types/interfaces/agent';
import type { PageSettingModalProps } from '@/types/interfaces/agentConfig';
import { CloseOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { message, Modal } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useEffect, useState } from 'react';
import HomeIndex from './HomeIndex';
import styles from './index.less';
import VisibleToLLM from './VisibleToLLM';

const cx = classNames.bind(styles);

/**
 * 页面设置弹窗
 */
const PageSettingModal: React.FC<PageSettingModalProps> = ({
  open,
  currentComponentInfo,
  allPageComponentList,
  onCancel,
}) => {
  const [action, setAction] = useState<PageSettingEnum>(
    PageSettingEnum.Visible_To_LLM,
  );
  // 智能体页面配置
  const [componentInfo, setComponentInfo] = useState<AgentComponentInfo>();

  useEffect(() => {
    if (open) {
      setAction(PageSettingEnum.Visible_To_LLM);
      setComponentInfo(currentComponentInfo);
    }
  }, [open, currentComponentInfo]);

  // 更新智能体页面配置
  const { runAsync: runUpdate } = useRequest(apiAgentPageUpdate, {
    manual: true,
  });

  // 保存方法调用方式、输出方式或异步运行配置
  const handleSaveSetting = async () => {
    try {
      // 如果当前页面设置为默认首页，则需要将其他页面设置为非默认首页
      if (componentInfo?.bindConfig?.homeIndex === HomeIndexEnum.Yes) {
        // 收集所有需要更新的页面
        const updatePromises: Promise<any>[] = [];

        allPageComponentList?.forEach((item) => {
          // 非当前页面且为默认首页，则设置为非默认首页
          if (
            item.id !== componentInfo?.id &&
            item.bindConfig?.homeIndex === HomeIndexEnum.Yes
          ) {
            const _item = { ...item };
            _item.bindConfig.homeIndex = HomeIndexEnum.No;
            const pageNotHomeIndexData = {
              id: _item?.id,
              bindConfig: _item?.bindConfig,
            } as AgentPageUpdateParams;

            // 为每个请求添加错误处理，避免单个失败影响整体
            updatePromises.push(
              runUpdate(pageNotHomeIndexData).catch((error) => {
                console.error('更新其他页面失败:', error);
                return null;
              }),
            );
          }
        });

        // 等待所有其他页面更新完成（即使部分失败也继续）
        if (updatePromises.length > 0) {
          Promise.all(updatePromises);
        }
      }

      // 更新当前页面配置
      const data = {
        id: componentInfo?.id,
        bindConfig: componentInfo?.bindConfig,
      } as AgentPageUpdateParams;
      await runUpdate(data);
      message.success('保存成功');
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存失败，请重试');
    }
  };

  // 更新智能体页面配置
  const handleChangePageInfo = (attr: string, value: number) => {
    const _componentInfo = cloneDeep(componentInfo);
    if (_componentInfo) {
      _componentInfo.bindConfig[attr] = value;
    }
    setComponentInfo(_componentInfo);
  };

  // 内容区域
  const getContent = () => {
    switch (action) {
      // 是否模型可见
      case PageSettingEnum.Visible_To_LLM:
        return (
          <VisibleToLLM
            visibleToLLMType={componentInfo?.bindConfig?.visibleToLLM}
            onChangePageInfo={handleChangePageInfo}
            onSaveSet={handleSaveSetting}
          />
        );
      // 是否为智能体页面首页
      case PageSettingEnum.Home_Index:
        return (
          <HomeIndex
            homeIndexType={componentInfo?.bindConfig?.homeIndex}
            onChangePageInfo={handleChangePageInfo}
            onSaveSet={handleSaveSetting}
          />
        );
    }
  };

  return (
    <Modal
      centered
      open={open}
      onCancel={onCancel}
      destroyOnHidden
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div className={cx(styles.container, 'flex', 'overflow-hide')}>
          <div className={cx(styles.left)}>
            <h3>设置</h3>
            <ul>
              {PAGE_SETTING_ACTIONS.map((item) => {
                return (
                  <li
                    key={item.type}
                    className={cx(styles.item, 'cursor-pointer', {
                      [styles.checked]: action === item.type,
                    })}
                    onClick={() => setAction(item.type)}
                  >
                    {item.label}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className={cx('flex-1', styles.right)}>{getContent()}</div>
          <CloseOutlined
            className={cx(styles.close, 'cursor-pointer')}
            onClick={onCancel}
          />
        </div>
      )}
    />
  );
};

export default PageSettingModal;
