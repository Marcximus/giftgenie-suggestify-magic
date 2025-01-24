import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import FontFamily from '@tiptap/extension-font-family';
import { EditorToolbar } from './EditorToolbar';

interface BlogEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const BlogEditor = ({ value, onChange }: BlogEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
      ListItem,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      FontFamily.configure({
        types: ['textStyle'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const handleLinkAdd = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleImageUpload = () => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleTableAdd = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run();
  };

  return (
    <div className="border rounded-md">
      <EditorToolbar 
        editor={editor}
        onImageUpload={handleImageUpload}
        onLinkAdd={handleLinkAdd}
        onTableAdd={handleTableAdd}
      />
      <EditorContent editor={editor} />
    </div>
  );
};