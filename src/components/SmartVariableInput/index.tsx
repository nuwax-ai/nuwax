import { useRef, useState } from 'react';
import './index.less';

export default function SmartVariableInput({
  variables = [],
  placeholder = '请输入内容...',
}: {
  variables: string[];
  placeholder?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const [filteredVars, setFilteredVars] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isEmpty, setIsEmpty] = useState(true);

  // 获取当前光标前面的内容
  const getWordBeforeCursor = (): string => {
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return '';
    const text = selection.anchorNode.textContent;
    const offset = selection.anchorOffset;
    return text?.slice(0, offset) || '';
  };
  // 当用户输入"{"时自动补全"}" 并把光标放在中间
  const updatePopover = () => {
    const word = getWordBeforeCursor();
    // 支持 { 或 {{ 开头的变量输入
    const match = word.match(/\{+(\w*)$/);
    if (match) {
      const query = match[1].toLowerCase();
      const filtered = variables.filter((v) => v.toLowerCase().includes(query));
      setFilteredVars(filtered);
      setPopoverVisible(true);
      setActiveIndex(0);
      // 更新 Popover 位置
      setTimeout(() => {
        const range = window.getSelection()?.getRangeAt(0);
        const rect = range?.getBoundingClientRect();
        if (rect) {
          setPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + window.scrollX,
          });
        }
      }, 0);
    } else {
      setPopoverVisible(false);
    }
  };

  // 插入变量
  const insertVariable = (variable: string) => {
    const sel = window.getSelection();
    if (!sel || !sel.getRangeAt) return;

    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    const offset = range.startOffset;

    const text = node.textContent || '';
    const before = text.slice(0, offset).replace(/\{+\w*$/, ''); // 删除 "{..." 或 "{{..." 部分
    const after = text.slice(offset);

    // 创建新的文本内容
    const variableText = `{{${variable}}}`;
    const newText = `${before}${variableText}${after}`;
    const newNode = document.createTextNode(newText);
    node.parentNode?.replaceChild(newNode, node);

    // 先设置光标到变量后面
    const cursorPosition = before.length + variableText.length;
    const newRange = document.createRange();
    newRange.setStart(
      newNode,
      Math.min(cursorPosition, newNode.textContent?.length || 0),
    );
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);

    setPopoverVisible(false);

    // 插入变量后更新状态
    setTimeout(() => {
      const content = editorRef.current?.textContent || '';
      setIsEmpty(content.trim() === '');
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!popoverVisible) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredVars.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(
        (prev) => (prev - 1 + filteredVars.length) % filteredVars.length,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredVars[activeIndex]) {
        insertVariable(filteredVars[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setPopoverVisible(false);
    }
  };

  const handleInput = () => {
    // 检查编辑器内容是否为空
    const content = editorRef.current?.textContent || '';
    setIsEmpty(content.trim() === '');

    // 延迟执行弹窗更新
    setTimeout(() => {
      updatePopover();
      // const div = editorRef.current;
      // if (!div) return;

      // // 获取纯文本内容，避免重复包裹
      // const text = div.textContent || '';
      // const html = text.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
      //   return `<span class="highlight-var">{{${varName}}}</span>`;
      // });

      // // 替换内容为高亮后的 HTML
      // const selection = window.getSelection();
      // const range = selection?.getRangeAt(0);
      // div.innerHTML = html;

      // // 重新设置光标
      // if (range && selection) {
      //   selection.removeAllRanges();
      //   selection.addRange(range); // 尽量恢复原光标（可以进一步精细定位）
      // }
    }, 0);
  };

  const renderContent = (
    <div style={{ minWidth: 160, maxHeight: 200, overflow: 'auto' }}>
      {filteredVars.map((item, idx) => (
        <div
          key={item}
          style={{
            padding: '4px 8px',
            cursor: 'pointer',
            backgroundColor: idx === activeIndex ? '#e6f7ff' : undefined,
          }}
          onMouseEnter={() => setActiveIndex(idx)}
          onMouseDown={(e) => {
            e.preventDefault();
            insertVariable(item);
          }}
        >
          {item}
        </div>
      ))}
      {filteredVars.length === 0 && (
        <div style={{ padding: 8, color: '#999' }}>无匹配变量</div>
      )}
    </div>
  );

  return (
    <>
      <div
        style={{
          position: 'relative',
        }}
      >
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          style={{
            border: '1px solid #ccc',
            borderRadius: 4,
            minHeight: 100,
            padding: 8,
            outline: 'none',
          }}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            // 聚焦时检查内容是否为空
            const content = editorRef.current?.textContent || '';
            setIsEmpty(content.trim() === '');
          }}
          onBlur={() => {
            // 失焦时检查内容是否为空
            const content = editorRef.current?.textContent || '';
            setIsEmpty(content.trim() === '');
          }}
        />
        {isEmpty && (
          <div
            style={{
              position: 'absolute',
              top: 9,
              left: 9,
              color: '#999',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {placeholder}
          </div>
        )}
      </div>
      {popoverVisible && (
        <div
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            zIndex: 999,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {renderContent}
        </div>
      )}
    </>
  );
}
