import { SvgIcon } from '@/components/base';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { ICON_SETTING } from '@/constants/images.constants';
import { GuidQuestionSetTypeEnum } from '@/types/enums/agent';
import { GuidQuestionDto } from '@/types/interfaces/agent';
import type { OpenRemarksEditProps } from '@/types/interfaces/agentConfig';
import { DeleteOutlined } from '@ant-design/icons';
import { Input, theme } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import GuidQuestionSetModal from './GuidQuestionSetModal';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 开场白编辑
 */
const OpenRemarksEdit: React.FC<OpenRemarksEditProps> = ({
  agentConfigInfo,
  onChangeAgent,
}) => {
  const { token } = theme.useToken();
  // 开场白内容
  const [content, setContent] = useState<string>('');
  // 开场白引导问题
  // const [guidQuestions, setGuidQuestions] = useState<string[]>(['']);
  // 开场白引导问题
  const [guidQuestionDtos, setGuidQuestionDtos] = useState<GuidQuestionDto[]>(
    [],
  );
  // 开场白预置问题设置弹窗
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!!agentConfigInfo) {
      setContent(agentConfigInfo.openingChatMsg);
      // 开场白引导问题(弃用)
      // if (agentConfigInfo.openingGuidQuestions?.length > 0) {
      //   setGuidQuestions(agentConfigInfo.openingGuidQuestions);
      // }
      // 开场白引导问题
      if (agentConfigInfo.guidQuestionDtos?.length > 0) {
        setGuidQuestionDtos(agentConfigInfo.guidQuestionDtos);
      }
    }
  }, [agentConfigInfo]);

  // 新增开场白引导问题
  const handlePlus = () => {
    // const _guidQuestions = [...guidQuestions];
    // _guidQuestions.push('');
    // setGuidQuestions(_guidQuestions);
    const _guidQuestionDtos = [...guidQuestionDtos];
    _guidQuestionDtos.push({
      type: GuidQuestionSetTypeEnum.Question,
      info: '',
    });
    setGuidQuestionDtos(_guidQuestionDtos);
  };

  // 删除开场白引导问题
  const handleDel = (index: number) => {
    // const _guidQuestions = [...guidQuestions];
    // _guidQuestions.splice(index, 1);
    // setGuidQuestions(_guidQuestions);
    // onChangeAgent(_guidQuestions, 'openingGuidQuestions');
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
    // const _guidQuestions = [...guidQuestions];
    // _guidQuestions[index] = value;
    // setGuidQuestions(_guidQuestions);
    // onChangeAgent(_guidQuestions, 'openingGuidQuestions');
    const _guidQuestionDtos = [...guidQuestionDtos];
    _guidQuestionDtos[index].info = value;
    setGuidQuestionDtos(_guidQuestionDtos);
    onChangeAgent(_guidQuestionDtos, 'guidQuestionDtos');
  };

  // 打开设置开场白预置问题弹窗
  const handleSetGuidQuestions = (index: number) => {
    console.log('handleSetGuidQuestions', index);
    setOpen(true);
  };

  // 确认更新开场白预置问题
  const handleConfirmUpdateQuestions = (questions: GuidQuestionDto[]) => {
    console.log('handleConfirmUpdateQuestions', questions);
    setOpen(false);
    // setGuidQuestions(questions);
    // onChangeAgent(questions, 'guidQuestionDtos');
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
        {/*<EditorProvider*/}
        {/*  slotBefore={<MenuBar />}*/}
        {/*  extensions={extensions}*/}
        {/*  content={content}*/}
        {/*  onUpdate={handleUpdate}*/}
        {/*></EditorProvider>*/}
        {/*<EditorContent editor={editor} />*/}
        {/*<FloatingMenu editor={editor}>This is the floating menu</FloatingMenu>*/}
        {/*<BubbleMenu editor={editor}>This is the bubble menu</BubbleMenu>*/}
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
                onClick={() => handleSetGuidQuestions(index)}
              />
            </>
          }
        />
      ))}
      {/* 开场白预置问题设置弹窗 */}
      <GuidQuestionSetModal
        open={open}
        variables={[]}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirmUpdateQuestions}
      />
    </>
  );
};

export default OpenRemarksEdit;
