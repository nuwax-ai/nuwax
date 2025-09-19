import type { OpenRemarksEditProps } from '@/types/interfaces/agentConfig';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';
const cx = classNames.bind(styles);

// import { EditorProvider, useCurrentEditor } from '@tiptap/react';
// import { StarterKit } from '@tiptap/starter-kit';
// import { TextStyle } from '@tiptap/extension-text-style';
// import { Color } from '@tiptap/extension-color';
// import { ListItem } from '@tiptap/extension-list-item';

/**
 * 开场白编辑
 */
const OpenRemarksEdit: React.FC<OpenRemarksEditProps> = ({
  agentConfigInfo,
  onChangeAgent,
}) => {
  const [content, setContent] = useState<string>('');
  const [guidQuestions, setGuidQuestions] = useState<string[]>(['']);

  useEffect(() => {
    if (!!agentConfigInfo) {
      setContent(agentConfigInfo.openingChatMsg);
      if (agentConfigInfo.openingGuidQuestions?.length > 0) {
        setGuidQuestions(agentConfigInfo.openingGuidQuestions);
      }
    }
  }, [agentConfigInfo]);

  // 新增开场白引导问题
  const handlePlus = () => {
    const _guidQuestions = [...guidQuestions];
    _guidQuestions.push('');
    setGuidQuestions(_guidQuestions);
  };

  // 删除开场白引导问题
  const handleDel = (index: number) => {
    const _guidQuestions = [...guidQuestions];
    _guidQuestions.splice(index, 1);
    setGuidQuestions(_guidQuestions);
    onChangeAgent(_guidQuestions, 'openingGuidQuestions');
  };

  // 修改首次打开聊天框自动回复消息
  const handleOpeningChatMsg = (value: string) => {
    setContent(value);
    onChangeAgent(value, 'openingChatMsg');
  };

  // 修改开场白引导问题
  const handleChangeGuidQuestions = (index: number, value: string) => {
    const _guidQuestions = [...guidQuestions];
    _guidQuestions[index] = value;
    setGuidQuestions(_guidQuestions);
    onChangeAgent(_guidQuestions, 'openingGuidQuestions');
  };

  // const MenuBar = () => {
  //   const { editor } = useCurrentEditor();
  //
  //   if (!editor) {
  //     return null;
  //   }
  //
  //   return (
  //     <div className={cx('flex', 'flex-col')}>
  //       <div className={cx('flex', 'flex-wrap', styles['edit-header'])}>
  //         <button
  //           onClick={() => editor?.chain().focus().toggleBold().run()}
  //           disabled={!editor.can().chain().focus().toggleBold().run()}
  //           className={editor.isActive("bold") ? "is-active" : ""}
  //         >
  //           bold
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().toggleItalic().run()}
  //           disabled={!editor.can().chain().focus().toggleItalic().run()}
  //           className={editor.isActive("italic") ? "is-active" : ""}
  //         >
  //           italic
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().toggleStrike().run()}
  //           disabled={!editor.can().chain().focus().toggleStrike().run()}
  //           className={editor.isActive("strike") ? "is-active" : ""}
  //         >
  //           strike
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().toggleCode().run()}
  //           disabled={!editor.can().chain().focus().toggleCode().run()}
  //           className={editor.isActive("code") ? "is-active" : ""}
  //         >
  //           code
  //         </button>
  //         <button onClick={() => editor?.chain().focus().unsetAllMarks().run()}>
  //           clear marks
  //         </button>
  //         <button onClick={() => editor?.chain().focus().clearNodes().run()}>
  //           clear nodes
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().setParagraph().run()}
  //           className={editor.isActive("paragraph") ? "is-active" : ""}
  //         >
  //           paragraph
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
  //           className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
  //         >
  //           h1
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
  //           className={editor.isActive("heading", { level: 2 }) ? "is-active" : ""}
  //         >
  //           h2
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
  //           className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
  //         >
  //           h3
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
  //           className={editor.isActive("heading", { level: 4 }) ? "is-active" : ""}
  //         >
  //           h4
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().toggleHeading({ level: 5 }).run()}
  //           className={editor.isActive("heading", { level: 5 }) ? "is-active" : ""}
  //         >
  //           h5
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().toggleHeading({ level: 6 }).run()}
  //           className={editor.isActive("heading", { level: 6 }) ? "is-active" : ""}
  //         >
  //           h6
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().toggleBulletList().run()}
  //           className={editor.isActive("bulletList") ? "is-active" : ""}
  //         >
  //           bullet list
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().toggleOrderedList().run()}
  //           className={editor.isActive("orderedList") ? "is-active" : ""}
  //         >
  //           ordered list
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
  //           className={editor.isActive("codeBlock") ? "is-active" : ""}
  //         >
  //           code block
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().toggleBlockquote().run()}
  //           className={editor.isActive("blockquote") ? "is-active" : ""}
  //         >
  //           blockquote
  //         </button>
  //         <button onClick={() => editor?.chain().focus().setHorizontalRule().run()}>
  //           horizontal rule
  //         </button>
  //         <button onClick={() => editor?.chain().focus().setHardBreak().run()}>
  //           hard break
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().undo().run()}
  //           disabled={!editor.can().chain().focus().undo().run()}
  //         >
  //           undo
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().redo().run()}
  //           disabled={!editor.can().chain().focus().redo().run()}
  //         >
  //           redo
  //         </button>
  //         <button
  //           onClick={() => editor?.chain().focus().setColor("#958DF1").run()}
  //           className={
  //             editor.isActive("textStyle", { color: "#958DF1" }) ? "is-active" : ""
  //           }
  //         >
  //           purple
  //         </button>
  //       </div>
  //       <div className={cx(styles['divider-line'])}></div>
  //     </div>
  //   );
  // };
  //
  // const extensions = [
  //   Color.configure({ types: [TextStyle.name, ListItem.name] }),
  //   TextStyle.configure({ types: [ListItem.name] }),
  //   StarterKit.configure({
  //     bulletList: {
  //       keepMarks: true,
  //       keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
  //     },
  //     orderedList: {
  //       keepMarks: true,
  //       keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
  //     },
  //   }),
  // ];

  return (
    <div>
      <p className={cx(styles.title)}>开场白文案</p>
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
      <div className={cx('flex', 'content-between')}>
        <p className={cx(styles.title)}>开场白预置问题</p>
        <PlusOutlined
          className={cx(styles.add, 'cursor-pointer')}
          onClick={handlePlus}
        />
      </div>
      <div>
        {guidQuestions?.map((item, index) => (
          <Input
            key={index}
            rootClassName={cx(styles.input)}
            placeholder="输入开场白引导问题"
            value={item}
            onChange={(e) => handleChangeGuidQuestions(index, e.target.value)}
            showCount
            maxLength={30}
            suffix={
              <DeleteOutlined
                className={cx('cursor-pointer')}
                onClick={() => handleDel(index)}
              />
            }
          />
        ))}
      </div>
    </div>
  );
};

export default OpenRemarksEdit;
