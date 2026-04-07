import ConditionRender from '@/components/ConditionRender';
import CustomInputNumber from '@/components/custom/CustomInputNumber';
import LabelStar from '@/components/LabelStar';
import { t } from '@/services/i18nRuntime';
import { BindCardStyleEnum } from '@/types/enums/plugin';
import { ArgList } from '@/types/interfaces/agent';
import type {
  BindDataSourceProps,
  CardBindSaveParams,
} from '@/types/interfaces/agentConfig';
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
  // Expand/collapse the "bind array for whole card" dropdown
  const [openBindArray, setOpenBindArray] = useState<boolean>(false);
  // Bind data for list items inside the card
  const [argList, setArgList] = useState<ArgList[]>([]);
  // 卡片跳转显隐
  const [urlVisible, setUrlVisible] = useState<boolean>(false);
  const [urlChecked, setUrlChecked] = useState<boolean>(false);
  // 绑定跳转链接地址
  const [bindLinkUrl, setBindLinkUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

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
            // 获取卡片参数的placeholder
            const placeholder =
              cardInfo?.argList?.find((info) => info.key === item.key)
                ?.placeholder || '';
            return {
              // 字段名
              key: item.key,
              // 卡片key值
              cardKey: item.bindValue,
              // 卡片参数的placeholder
              placeholder,
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

  // Dropdown data source for binding card list items
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

  // Bind an array for the whole card
  const handleSelectBindArray = (
    _: React.Key[],
    { node }: { node: BindConfigWithSub },
  ) => {
    setCardKey(String(node.key));
    setOpenBindArray(false);
  };

  // Bind card list item data (toggle dropdown)
  const handleArgList = (index: number, value: React.Key | boolean) => {
    const _argList = cloneDeep(argList);
    _argList[index].open = value;
    setArgList(_argList);
  };

  // Bind card list item data (select dropdown item)
  const handleSelectDataSource = (index: number, node?: BindConfigWithSub) => {
    const _argList = cloneDeep(argList);
    _argList[index].open = false;
    _argList[index].cardKey = node?.key || '';
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
  const handleSave = async () => {
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

    const data: CardBindSaveParams = {
      cardBindConfig: config as CardBindConfig,
    };
    setLoading(true);
    await onSaveSet(data);
    setLoading(false);
  };

  const cardStyleOptions = useMemo(
    () => [
      {
        value: BindCardStyleEnum.SINGLE,
        label: t('PC.Pages.AgentArrangeCardBindDataSource.optionSingle'),
      },
      {
        value: BindCardStyleEnum.LIST,
        label: t('PC.Pages.AgentArrangeCardBindDataSource.optionList'),
      },
    ],
    [],
  );

  return (
    <div className={cx('flex-1', 'flex', 'flex-col')}>
      <Form
        layout="vertical"
        preserve={false}
        rootClassName={cx('flex-1')}
        requiredMark={customizeRequiredMark}
      >
        <Form.Item
          label={t('PC.Pages.AgentArrangeCardBindDataSource.selectStyle')}
        >
          <Radio.Group
            onChange={onChangeCardStyle}
            value={cardStyle}
            options={cardStyleOptions}
          />
        </Form.Item>
        {cardStyle === BindCardStyleEnum.LIST && (
          <>
            <Form.Item
              label={
                <LabelStar
                  label={t(
                    'PC.Pages.AgentArrangeCardBindDataSource.cardListMaxLength',
                  )}
                />
              }
              rules={[
                {
                  required: true,
                  message: t(
                    'PC.Pages.AgentArrangeCardBindDataSource.cardListMaxLengthPlaceholder',
                  ),
                },
              ]}
            >
              <CustomInputNumber
                value={cardListLen}
                onChange={(value) => setCardListLen(value)}
                placeholder={t(
                  'PC.Pages.AgentArrangeCardBindDataSource.cardListMaxLengthPlaceholder',
                )}
                max={20}
                min={1}
              />
            </Form.Item>
            <Form.Item
              label={t('PC.Pages.AgentArrangeCardBindDataSource.bindArray')}
            >
              <Select
                allowClear
                onClear={() => {
                  setCardKey('');
                  setOpenBindArray(false);
                }}
                popupMatchSelectWidth={false}
                open={openBindArray}
                value={cardKey || null}
                onOpenChange={(open) => {
                  setOpenBindArray(open);
                }}
                onClick={() => setOpenBindArray(true)}
                placeholder={t(
                  'PC.Pages.AgentArrangeCardBindDataSource.bindArrayPlaceholder',
                )}
                popupRender={() =>
                  bindArray?.length > 0 ? (
                    <Tree
                      treeData={bindArray}
                      height={300}
                      blockNode
                      defaultExpandAll
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
                    <Empty description={t('PC.Common.Global.emptyData')} />
                  )
                }
              />
            </Form.Item>
          </>
        )}
        <Form.Item
          label={t('PC.Pages.AgentArrangeCardBindDataSource.bindListItemData')}
        >
          {argList?.map((info, index) => (
            <Form.Item key={info.key} className={cx('mb-16')}>
              <div className={cx('flex', 'items-center', styles['space-box'])}>
                <span className={cx(styles['radius-number'])}>{index + 1}</span>
                <Select
                  allowClear
                  onClear={() => handleSelectDataSource(index)}
                  rootClassName={cx('flex-1')}
                  popupMatchSelectWidth={false}
                  disabled={cardStyle === BindCardStyleEnum.LIST && !cardKey}
                  open={Boolean(info?.open)}
                  value={info?.cardKey || null}
                  onOpenChange={(open) => handleArgList(index, open)}
                  onClick={() => handleArgList(index, true)}
                  popupRender={() =>
                    dataSource?.length > 0 ? (
                      <Tree
                        treeData={dataSource}
                        height={300}
                        blockNode
                        defaultExpandAll
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onSelect={(_, { node }) =>
                          handleSelectDataSource(index, node)
                        }
                        fieldNames={{
                          title: 'name',
                          key: 'key',
                          children: 'subArgs',
                        }}
                      />
                    ) : (
                      <Empty description={t('PC.Common.Global.emptyData')} />
                    )
                  }
                  placeholder={
                    info.placeholder || t('PC.Common.Global.pleaseSelect')
                  }
                />
              </div>
            </Form.Item>
          ))}
        </Form.Item>
        <Form.Item
          label={t('PC.Pages.AgentArrangeCardBindDataSource.cardClickJump')}
          tooltip={{
            title: t(
              'PC.Pages.AgentArrangeCardBindDataSource.cardClickJumpTooltip',
            ),
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
              onClear={() => {
                setBindLinkUrl('');
                setUrlVisible(false);
              }}
              rootClassName={cx('flex-1')}
              popupMatchSelectWidth={false}
              open={urlVisible}
              value={bindLinkUrl || null}
              onOpenChange={(open) => setUrlVisible(open)}
              onClick={() => setUrlVisible(true)}
              popupRender={() => (
                <Tree
                  treeData={dataSource}
                  height={300}
                  blockNode
                  defaultExpandAll
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
              placeholder={t(
                'PC.Pages.AgentArrangeCardBindDataSource.urlDataSourcePlaceholder',
              )}
            />
          </ConditionRender>
        </Form.Item>
      </Form>
      <footer className={cx(styles.footer)}>
        <Button type="primary" onClick={handleSave} loading={loading}>
          {t('PC.Common.Global.save')}
        </Button>
      </footer>
    </div>
  );
};

export default BindDataSource;
