import React, { useState } from 'react';

interface GenUIDiffProps {
  fileName: string;
  oldCode: string;
  newCode: string;
  status: string;
  result?: string;
  onConfirm: () => void;
}

function computeDiff(oldText: string, newText: string) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const maxLen = Math.max(oldLines.length, newLines.length);
  const lines: Array<{ type: 'add' | 'del' | 'ctx'; text: string }> = [];

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    if (oldLine === newLine) {
      lines.push({ type: 'ctx', text: newLine || '' });
    } else {
      if (oldLine !== undefined) lines.push({ type: 'del', text: oldLine });
      if (newLine !== undefined) lines.push({ type: 'add', text: newLine });
    }
  }
  return lines;
}

export const GenUIDiff: React.FC<GenUIDiffProps> = ({
  fileName, oldCode, newCode, status, result, onConfirm,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const diffLines = computeDiff(oldCode, newCode);
  const addCount = diffLines.filter((l) => l.type === 'add').length;
  const delCount = diffLines.filter((l) => l.type === 'del').length;

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm();
  };

  return (
    <div className="gen-ui-card">
      <div className="gen-ui-title">
        <span>📄</span>
        <span>Code Change: {fileName}</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>
          +{addCount} -{delCount}
        </span>
      </div>
      <div className="gen-ui-diff">
        {diffLines.map((line, i) => (
          <div key={i} className={`line-${line.type}`}>
            {line.type === 'add' ? '+ ' : line.type === 'del' ? '- ' : '  '}
            {line.text}
          </div>
        ))}
      </div>
      {status === 'inProgress' && !confirmed && (
        <div className="gen-ui-hitl">
          <button className="btn-confirm" onClick={handleConfirm}>
            ✅ Apply Changes
          </button>
          <button className="btn-cancel" onClick={() => setConfirmed(true)}>
            ❌ Reject
          </button>
        </div>
      )}
      {confirmed && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#10b981' }}>
          {result || 'Changes applied to file tree.'}
        </div>
      )}
    </div>
  );
};
