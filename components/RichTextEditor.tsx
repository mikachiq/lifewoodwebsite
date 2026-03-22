import React from 'react';
import { sanitizeRichTextHtml } from '../lib/news';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const TOOLS = [
  { label: 'B', command: 'bold' },
  { label: 'I', command: 'italic' },
  { label: 'U', command: 'underline' },
  { label: '• List', command: 'insertUnorderedList' },
  { label: '1. List', command: 'insertOrderedList' },
] as const;

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML === value) return;
    editorRef.current.innerHTML = value;
  }, [value]);

  const emitChange = React.useCallback(() => {
    const html = sanitizeRichTextHtml(editorRef.current?.innerHTML || '');
    onChange(html);
  }, [onChange]);

  const runCommand = (command: string, valueArg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, valueArg);
    emitChange();
  };

  const insertLink = () => {
    const url = window.prompt('Enter a URL');
    if (!url) return;
    runCommand('createLink', url);
  };

  return (
    <div className="rounded-2xl border border-[#e1dbc9] bg-white overflow-hidden shadow-sm">
      <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-[#efe8dc] bg-[#faf7f1]">
        {TOOLS.map(tool => (
          <button
            key={tool.command}
            type="button"
            onClick={() => runCommand(tool.command)}
            className="px-3 py-1.5 rounded-full border border-[#d9d1c2] bg-white text-[#1a3a2a] text-xs font-black hover:bg-[#f2ece0] transition-colors"
          >
            {tool.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => runCommand('formatBlock', 'p')}
          className="px-3 py-1.5 rounded-full border border-[#d9d1c2] bg-white text-[#1a3a2a] text-xs font-black hover:bg-[#f2ece0] transition-colors"
        >
          Paragraph
        </button>
        <button
          type="button"
          onClick={insertLink}
          className="px-3 py-1.5 rounded-full border border-[#d9d1c2] bg-white text-[#1a3a2a] text-xs font-black hover:bg-[#f2ece0] transition-colors"
        >
          Link
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        className="news-editor min-h-[320px] px-5 py-4 text-sm text-[#1a2e1a] focus:outline-none"
      />
    </div>
  );
}
