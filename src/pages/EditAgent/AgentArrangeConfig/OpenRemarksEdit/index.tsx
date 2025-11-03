import guidQuestionImage from '@/assets/images/guid_question.png';
import { SvgIcon } from '@/components/base';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { ICON_SETTING } from '@/constants/images.constants';
import { GuidQuestionSetTypeEnum } from '@/types/enums/agent';
import { GuidQuestionDto } from '@/types/interfaces/agent';
import type { OpenRemarksEditProps } from '@/types/interfaces/agentConfig';
import { DeleteOutlined } from '@ant-design/icons';
import { Input, theme } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import GuidQuestionSetModal from './GuidQuestionSetModal';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 开场白编辑
 */
const OpenRemarksEdit: React.FC<OpenRemarksEditProps> = ({
  agentConfigInfo,
  pageArgConfigs,
  onChangeAgent,
  onConfirmUpdateEventQuestions,
}) => {
  const { token } = theme.useToken();
  // 开场白内容
  const [content, setContent] = useState<string>('');
  // 开场白引导问题
  const [guidQuestionDtos, setGuidQuestionDtos] = useState<GuidQuestionDto[]>(
    [],
  );
  // 当前开场白引导问题
  const [currentGuidQuestionDto, setCurrentGuidQuestionDto] =
    useState<GuidQuestionDto>();
  // 开场白预置问题设置弹窗
  const [open, setOpen] = useState<boolean>(false);
  // 当前引导问题索引值
  const currentGuidQuestionDtoIndexRef = useRef<number>(-1);

  useEffect(() => {
    if (!!agentConfigInfo) {
      setContent(agentConfigInfo.openingChatMsg);
      // 开场白引导问题
      if (agentConfigInfo.guidQuestionDtos?.length > 0) {
        setGuidQuestionDtos(agentConfigInfo.guidQuestionDtos);
      }
    }
  }, [agentConfigInfo]);

  // 新增开场白引导问题
  const handlePlus = () => {
    const _guidQuestionDtos = [...guidQuestionDtos];
    _guidQuestionDtos.push({
      type: GuidQuestionSetTypeEnum.Question,
      info: '',
    });
    setGuidQuestionDtos(_guidQuestionDtos);
  };

  // 删除开场白引导问题
  const handleDel = (index: number) => {
    const _guidQuestionDtos = [...guidQuestionDtos];
    _guidQuestionDtos.splice(index, 1);
    setGuidQuestionDtos(_guidQuestionDtos);
    onChangeAgent(_guidQuestionDtos, 'guidQuestionDtos');
  };

  // 修改首次打开聊天框自动回复消息
  const handleOpeningChatMsg = (value: string) => {
    setContent(value);
    onChangeAgent(value, 'openingChatMsg');
  };

  // 修改开场白引导问题
  const handleChangeGuidQuestions = (index: number, value: string) => {
    const _guidQuestionDtos = [...guidQuestionDtos];
    _guidQuestionDtos[index].info = value;
    setGuidQuestionDtos(_guidQuestionDtos);
    onChangeAgent(_guidQuestionDtos, 'guidQuestionDtos');
  };

  // 打开设置开场白预置问题弹窗
  const handleSetGuidQuestions = (item: GuidQuestionDto, index: number) => {
    setOpen(true);
    setCurrentGuidQuestionDto(item);
    currentGuidQuestionDtoIndexRef.current = index;
  };

  /**
   * 确认更新开场白预置问题
   * @param newQuestion 更新后的预置问题
   */
  const handleConfirmUpdateQuestions = (newQuestions: GuidQuestionDto[]) => {
    setOpen(false);
    setGuidQuestionDtos(newQuestions);
    onConfirmUpdateEventQuestions(newQuestions, 'guidQuestionDtos');
  };

  return (
    <>
      <p className={cx(styles['header-title'])}>开场白文案</p>
      <div className={cx(styles['content-box'])}>
        <Input.TextArea
          placeholder="请输入开场白"
          value={content}
          onChange={(e) => handleOpeningChatMsg(e.target.value)}
          autoSize={{ minRows: 3, maxRows: 5 }}
        />
      </div>
      <div
        className={cx(
          'flex',
          'content-between',
          'items-center',
          styles['title-box'],
        )}
      >
        <p className={cx(styles.title, 'flex', 'items-center')}>
          开场白预置问题
        </p>
        <TooltipIcon
          title="添加预置问题"
          icon={
            <SvgIcon
              name="icons-common-plus"
              style={{ color: token.colorTextTertiary, fontSize: '15px' }}
            />
          }
          onClick={handlePlus}
        />
      </div>
      {/* 开场白预置问题列表 */}
      {guidQuestionDtos?.map((item, index) => (
        <Input
          key={index}
          rootClassName={cx(styles.input)}
          placeholder="输入开场白引导问题"
          value={item.info}
          onChange={(e) => handleChangeGuidQuestions(index, e.target.value)}
          showCount={false}
          maxLength={30}
          prefix={
            <img
              className={cx(styles['icon-input-prefix'])}
              src={item.icon || guidQuestionImage}
            />
          }
          suffix={
            <>
              <TooltipIcon
                title="删除预置问题"
                className={cx(styles['icon-input-suffix'])}
                icon={<DeleteOutlined className={cx('cursor-pointer')} />}
                onClick={() => handleDel(index)}
              />
              <TooltipIcon
                title="设置"
                icon={<ICON_SETTING className={'cursor-pointer'} />}
                onClick={() => handleSetGuidQuestions(item, index)}
              />
            </>
          }
        />
      ))}
      {/* 开场白预置问题设置弹窗 */}
      <GuidQuestionSetModal
        open={open}
        agentConfigInfo={agentConfigInfo}
        currentGuidQuestionDto={currentGuidQuestionDto}
        pageArgConfigs={pageArgConfigs}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirmUpdateQuestions}
        currentGuidQuestionDtoIndex={currentGuidQuestionDtoIndexRef.current}
      />
    </>
  );
};

export default OpenRemarksEdit;
