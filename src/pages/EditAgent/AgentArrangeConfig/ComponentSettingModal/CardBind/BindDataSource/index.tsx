import ConditionRender from '@/components/ConditionRender';
import CustomInputNumber from '@/components/CustomInputNumber';
import LabelStar from '@/components/LabelStar';
import { BIND_CARD_STYLE_LIST } from '@/constants/agent.constants';
import { BindCardStyleEnum } from '@/types/enums/plugin';
import { ArgList } from '@/types/interfaces/agent';
import type { BindDataSourceProps } from '@/types/interfaces/agentConfig';
import {
  CardArgsBindConfigInfo,
  CardBindConfig,
} from '@/types/interfaces/cardInfo';
import type { BindConfigWithSub } from '@/types/interfaces/common';
import {
  findNode,
  loopFilterAndDisabledArray,
  loopOmitArray,
  loopSetDisabled,
} from '@/utils/deepNode';
import { customizeRequiredMark } from '@/utils/form';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Empty,
  Form,
  Radio,
  RadioChangeEvent,
  Select,
  Switch,
  Tree,
} from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 为卡片绑定数据源组件
const BindDataSource: React.FC<BindDataSourceProps> = ({
  componentInfo,
  cardInfo,
  onSaveSet,
}) => {
  // 卡片类型
  const [cardStyle, setCardStyle] = useState<BindCardStyleEnum>(
    BindCardStyleEnum.SINGLE,
  );
  // 卡片列表最大长度
  const [cardListLen, setCardListLen] = useState<string>('5');
  const [cardKey, setCardKey] = useState<string>('');
  // 卡片整体绑定的数组
  const [bindArray, setBindArray] = useState<BindConfigWithSub[]>([]);
  // 展开、隐藏"为卡片整体绑定一个数组"下拉列表
  const [openBindArray, setOpenBindArray] = useState<boolean>(false);
  // 为卡片内的列表项绑定数据
  const [argList, setArgList] = useState<ArgList[]>([]);
  // 卡片跳转显隐
  const [urlVisible, setUrlVisible] = useState<boolean>(false);
  const [urlChecked, setUrlChecked] = useState<boolean>(false);
  // 绑定跳转链接地址
  const [bindLinkUrl, setBindLinkUrl] = useState<string>('');

  // 出参配置
  const outputArgBindConfigs = componentInfo?.bindConfig?.outputArgBindConfigs;
  // 卡片绑定配置
  const cardBindConfig = componentInfo?.bindConfig?.cardBindConfig;

  useEffect(() => {
    // 卡片样式是竖向列表时，卡片整体绑定一个数组（需要从出参配置中过滤出数组）
    if (cardStyle === BindCardStyleEnum.LIST) {
      const _outputArgBindConfigs = cloneDeep(outputArgBindConfigs);
      // 过滤数组
      const list = loopFilterAndDisabledArray(_outputArgBindConfigs);
      // 删除subArgs属性
      const _list = loopOmitArray(list);
      setBindArray(_list);
    }
  }, [outputArgBindConfigs, cardStyle]);

  useEffect(() => {
    // 回显卡片绑定数据
    if (cardBindConfig && cardInfo?.id === cardBindConfig.cardId) {
      setCardStyle(cardBindConfig.bindCardStyle);
      setCardListLen(cardBindConfig?.maxCardCount || '5');
      setCardKey(cardBindConfig?.bindArray);
      if (cardBindConfig?.bindLinkUrl) {
        setUrlChecked(true);
        setBindLinkUrl(cardBindConfig?.bindLinkUrl);
      }

      if (cardBindConfig?.cardArgsBindConfigs?.length) {
        const list = cardBindConfig?.cardArgsBindConfigs?.map(
          (item: CardArgsBindConfigInfo) => {
            return {
              // 字段名
              key: item.key,
              // 卡片key值
              cardKey: item.bindValue,
            };
          },
        );
        setArgList(list);
      }
    } else {
      setCardStyle(BindCardStyleEnum.SINGLE);
      setCardKey('');
      setCardListLen('5');
      setUrlChecked(false);
      setBindLinkUrl('');
      setArgList(cardInfo?.argList || []);
    }
  }, [cardInfo, cardBindConfig]);

  // "为卡片内的列表项绑定数据"下拉数据源
  const dataSource: BindConfigWithSub[] = useMemo(() => {
    const _outputArgBindConfigs = cloneDeep(outputArgBindConfigs);
    if (cardStyle === BindCardStyleEnum.SINGLE) {
      return loopSetDisabled(_outputArgBindConfigs);
    } else {
      if (!cardKey) {
        return [];
      }
      return findNode(_outputArgBindConfigs, cardKey)?.subArgs || [];
    }
  }, [outputArgBindConfigs, cardStyle, cardKey]);

  // 选择卡片样式
  const onChangeCardStyle = (e: RadioChangeEvent) => {
    const { value } = e.target;
    setCardStyle(value);
    setUrlChecked(false);
    setBindLinkUrl('');
    setArgList(cardInfo?.argList || []);
  };

  // 为卡片整体绑定一个数组
  const handleSelectBindArray = (
    _: React.Key[],
    { node }: { node: BindConfigWithSub },
  ) => {
    setCardKey(String(node.key));
    setOpenBindArray(false);
  };

  // 为卡片内的列表项绑定数据(展开、隐藏下拉选择)
  const handleArgList = (index: number, value: React.Key | boolean) => {
    const _argList = cloneDeep(argList);
    _argList[index].open = value;
    setArgList(_argList);
  };

  // 为卡片内的列表项绑定数据(选择下拉选择项)
  const handleSelectDataSource = (node: BindConfigWithSub, index: number) => {
    const _argList = cloneDeep(argList);
    _argList[index].open = false;
    _argList[index].cardKey = node.key;
    setArgList(_argList);
  };

  // 切换卡片跳转
  const handleChangeUrl = (checked: boolean) => {
    setUrlChecked(checked);
    if (!checked) {
      setBindLinkUrl('');
    }
  };

  // 保存卡片绑定
  const handleSave = () => {
    const configs = argList?.map((item) => {
      return {
        key: item.key,
        bindValue: item?.cardKey || '',
      };
    });
    const singleConfig = {
      cardId: cardInfo?.id,
      cardKey: cardInfo?.cardKey,
      bindCardStyle: cardStyle,
      cardArgsBindConfigs: configs,
      bindLinkUrl,
    };

    const config =
      cardStyle === BindCardStyleEnum.SINGLE
        ? singleConfig
        : {
            ...singleConfig,
            maxCardCount: cardListLen,
            bindArray: cardKey,
          };
    onSaveSet('cardBindConfig', config as CardBindConfig);
  };

  return (
    <div className={cx('flex-1', 'flex', 'flex-col')}>
      <Form
        layout="vertical"
        preserve={false}
        rootClassName={cx('flex-1')}
        requiredMark={customizeRequiredMark}
      >
        <Form.Item label="选择卡片样式">
          <Radio.Group
            onChange={onChangeCardStyle}
            value={cardStyle}
            options={BIND_CARD_STYLE_LIST}
          />
        </Form.Item>
        {cardStyle === BindCardStyleEnum.LIST && (
          <>
            <Form.Item
              label={<LabelStar label="卡片列表最大长度" />}
              rules={[{ required: true, message: '请输入卡片列表最大长度' }]}
            >
              <CustomInputNumber
                value={cardListLen}
                onChange={(value) => setCardListLen(value)}
                placeholder="请输入卡片列表最大长度"
                max={20}
                min={1}
              />
            </Form.Item>
            <Form.Item label="为卡片整体绑定一个数组">
              <Select
                popupMatchSelectWidth={false}
                open={openBindArray}
                value={cardKey || null}
                onDropdownVisibleChange={(open) => {
                  setOpenBindArray(open);
                }}
                onClick={() => setOpenBindArray(true)}
                placeholder="请为卡片整体绑定一个数组"
                dropdownRender={() =>
                  bindArray?.length > 0 ? (
                    <Tree
                      treeData={bindArray}
                      height={300}
                      blockNode
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      onSelect={handleSelectBindArray}
                      fieldNames={{
                        title: 'name',
                        key: 'key',
                        children: 'subArgs',
                      }}
                    />
                  ) : (
                    <Empty description="暂无数据" />
                  )
                }
              />
            </Form.Item>
          </>
        )}
        <Form.Item label="为卡片内的列表项绑定数据">
          {argList?.map((info, index) => (
            <Form.Item key={info.key} className={cx('mb-16')}>
              <div className={cx('flex', 'items-center', styles['space-box'])}>
                <span className={cx(styles['radius-number'])}>{index + 1}</span>
                <Select
                  rootClassName={cx('flex-1')}
                  popupMatchSelectWidth={false}
                  disabled={cardStyle === BindCardStyleEnum.LIST && !cardKey}
                  open={Boolean(info?.open)}
                  value={info?.cardKey}
                  onDropdownVisibleChange={(open) => handleArgList(index, open)}
                  onClick={() => handleArgList(index, true)}
                  dropdownRender={() =>
                    dataSource?.length > 0 ? (
                      <Tree
                        treeData={dataSource}
                        height={300}
                        blockNode
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onSelect={(_, { node }) =>
                          handleSelectDataSource(node, index)
                        }
                        fieldNames={{
                          title: 'name',
                          key: 'key',
                          children: 'subArgs',
                        }}
                      />
                    ) : (
                      <Empty description="暂无数据" />
                    )
                  }
                  placeholder={info.placeholder || '请选择'}
                />
              </div>
            </Form.Item>
          ))}
        </Form.Item>
        <Form.Item
          label="点击卡片跳转"
          tooltip={{
            title: '绑定后，用户在智能体对话流中点击 卡片可跳转至其他页面',
            icon: <InfoCircleOutlined />,
          }}
        >
          <Switch
            className={cx(styles['link-switch'])}
            disabled={!dataSource?.length}
            size="small"
            checked={urlChecked}
            onChange={handleChangeUrl}
          />
          <ConditionRender condition={urlChecked}>
            <Select
              allowClear
              rootClassName={cx('flex-1')}
              popupMatchSelectWidth={false}
              open={urlVisible}
              value={bindLinkUrl || null}
              onDropdownVisibleChange={(open) => setUrlVisible(open)}
              onClick={() => setUrlVisible(true)}
              dropdownRender={() => (
                <Tree
                  treeData={dataSource}
                  height={300}
                  blockNode
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onSelect={(_, { node }) => {
                    setBindLinkUrl(node.key as string);
                    setUrlVisible(false);
                  }}
                  fieldNames={{
                    title: 'name',
                    key: 'key',
                    children: 'subArgs',
                  }}
                />
              )}
              placeholder="为url选择数据来源"
            />
          </ConditionRender>
        </Form.Item>
      </Form>
      <footer className={cx(styles.footer)}>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </footer>
    </div>
  );
};

export default BindDataSource;
