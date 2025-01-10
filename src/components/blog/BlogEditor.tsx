import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface BlogEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const BlogEditor = ({ value, onChange }: BlogEditorProps) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md">
      <div className="border-b bg-muted/50 p-2 flex gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('bold') ? 'bg-muted' : ''}`}
          type="button"
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('italic') ? 'bg-muted' : ''}`}
          type="button"
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}`}
          type="button"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}`}
          type="button"
        >
          H3
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('bulletList') ? 'bg-muted' : ''}`}
          type="button"
        >
          Bullet List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('orderedList') ? 'bg-muted' : ''}`}
          type="button"
        >
          Numbered List
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-muted ${editor.isActive('blockquote') ? 'bg-muted' : ''}`}
          type="button"
        >
          Quote
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};