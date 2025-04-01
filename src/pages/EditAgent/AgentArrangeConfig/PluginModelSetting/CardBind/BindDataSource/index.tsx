import CustomInputNumber from '@/components/CustomInputNumber';
import { BindCardStyleEnum } from '@/types/enums/plugin';
import { AgentCardInfo, BindConfigWithSub } from '@/types/interfaces/agent';
import {
  findNode,
  loopFilterArray,
  loopOmitArray,
  loopSetDisabled,
} from '@/utils/deepNode';
import { customizeRequiredMark } from '@/utils/form';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Button,
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
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface BindDataSourceProps {
  cardInfo?: AgentCardInfo;
}

// 为卡片绑定数据源组件
const BindDataSource: React.FC<BindDataSourceProps> = ({ cardInfo }) => {
  // 卡片类型
  const [cardStyle, setCardStyle] = useState<BindCardStyleEnum>(
    BindCardStyleEnum.SINGLE,
  );
  // 卡片列表最大长度
  const [cardListLen, setCardListLen] = useState<string>('');
  const [cardKey, setCardKey] = useState<string>('');
  // 卡片整体绑定的数组
  const [bindArray, setBindArray] = useState<BindConfigWithSub[]>([]);
  // 当前组件信息
  const { currentComponentInfo } = useModel('spaceAgent');
  // 出参配置
  const outputArgBindConfigs =
    currentComponentInfo?.bindConfig?.outputArgBindConfigs;
  const [openBindArray, setOpenBindArray] = useState<boolean>(false);

  const [argList, setArgList] = useState([]);

  useEffect(() => {
    if (cardStyle === BindCardStyleEnum.LIST) {
      const _outputArgBindConfigs = cloneDeep(outputArgBindConfigs);
      // 过滤数组
      const list = loopFilterArray(_outputArgBindConfigs);
      // 删除subArgs属性
      const _list = loopOmitArray(list);
      setBindArray(_list);
    }
  }, [outputArgBindConfigs, cardStyle]);

  useEffect(() => {
    setArgList(cardInfo?.argList || []);
  }, [cardInfo]);

  // 下拉数据源
  const dataSource = useMemo(() => {
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

  const onChangeCardStyle = (e: RadioChangeEvent) => {
    setCardStyle(e.target.value);
  };
  const handlerChangeCardLen = (value: string) => {
    setCardListLen(value);
  };

  const onFinish = (values) => {
    console.log(values);
  };

  const onSelect = (_, { node }) => {
    setCardKey(node.key);
    setOpenBindArray(false);
  };

  return (
    <div className={cx('flex-1', 'flex', 'flex-col')}>
      <Form
        layout="vertical"
        preserve={false}
        rootClassName={cx('flex-1')}
        requiredMark={customizeRequiredMark}
        onFinish={onFinish}
      >
        <Form.Item name="cardStyle" label="选择卡片样式">
          <Radio.Group onChange={onChangeCardStyle} value={cardStyle}>
            <Radio value={BindCardStyleEnum.SINGLE}>单张卡片</Radio>
            <Radio value={BindCardStyleEnum.LIST}>竖向列表</Radio>
          </Radio.Group>
        </Form.Item>
        {cardStyle === BindCardStyleEnum.LIST && (
          <>
            <Form.Item
              name="cardLength"
              label="卡片列表最大长度"
              rules={[{ required: true, message: '请输入卡片列表最大长度' }]}
            >
              <CustomInputNumber
                value={cardListLen}
                onChange={handlerChangeCardLen}
                placeholder="请输入卡片列表最大长度"
                max={5}
                min={1}
              />
            </Form.Item>
            <Form.Item label="为卡片整体绑定一个数组">
              <Select
                popupMatchSelectWidth={false}
                open={openBindArray}
                value={cardKey}
                onDropdownVisibleChange={(open) => {
                  setOpenBindArray(open);
                }}
                onClick={() => setOpenBindArray(true)}
                dropdownRender={() => (
                  <Tree
                    treeData={bindArray}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    onSelect={onSelect}
                    fieldNames={{
                      title: 'name',
                      key: 'key',
                      children: 'subArgs',
                    }}
                  />
                )}
                placeholder="请选择"
              ></Select>
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
                  dropdownRender={() => (
                    <Tree
                      treeData={dataSource}
                      fieldNames={{
                        title: 'name',
                        key: 'key',
                        children: 'subArgs',
                      }}
                    />
                  )}
                  placeholder={info.placeholder}
                ></Select>
              </div>
            </Form.Item>
          ))}
        </Form.Item>
        <Form.Item
          label="点击卡片跳转"
          tooltip={{ title: '点击卡片跳转', icon: <InfoCircleOutlined /> }}
        >
          <Switch className={cx(styles['link-switch'])} size="small" />
          <Select options={[]} placeholder="请选择"></Select>
        </Form.Item>
      </Form>
      <footer className={cx(styles.footer)}>
        <Button
          type="primary"
          // onClick={handleSave}
          // disabled={!configArgs?.length}
        >
          保存
        </Button>
      </footer>
    </div>
  );
};

export default BindDataSource;
