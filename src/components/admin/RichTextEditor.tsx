import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import {
  Bold, Italic, Heading1, Heading2, Link as LinkIcon,
  List, ListOrdered, Minus,
} from 'lucide-react';

interface Props {
  content: string;
  onChange: (html: string) => void;
  dir?: 'ltr' | 'rtl';
  placeholder?: string;
}

function ToolbarButton({
  active, onClick, children,
}: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
        active ? 'bg-[#2A2A2A] text-white' : 'text-[#888] hover:bg-[#2A2A2A] hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ content, onChange, dir = 'ltr', placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary underline' } }),
    ],
    content,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[360px] p-4 outline-none focus:outline-none prose-headings:text-white prose-p:text-[#ccc] prose-li:text-[#ccc] prose-strong:text-white prose-a:text-primary',
        dir,
      },
    },
  });

  // Sync external content changes (e.g. tab switch)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt('URL');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="rounded-lg border border-[#2A2A2A] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-[#1A1A1A] border-b border-[#2A2A2A]">
        <ToolbarButton active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('link')} onClick={setLink}>
          <LinkIcon size={15} />
        </ToolbarButton>
        <div className="w-px h-5 bg-[#2A2A2A] mx-1" />
        <ToolbarButton active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered size={15} />
        </ToolbarButton>
        <div className="w-px h-5 bg-[#2A2A2A] mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus size={15} />
        </ToolbarButton>
      </div>
      {/* Editor */}
      <div className="bg-[#0D0D0D]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
