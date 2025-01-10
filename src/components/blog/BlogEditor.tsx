import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  Heading2,
  Heading3,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const colors = [
  '#000000', '#9b87f5', '#7E69AB', '#6E59A5', '#D6BCFA',
  '#F97316', '#0EA5E9', '#8B5CF6', '#D946EF', '#ea384c'
];

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

  const setLink = () => {
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

  return (
    <div className="border rounded-md">
      <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-2">
        <Button
          onClick={() => editor.chain().focus().toggleBold().run()}
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
          size="sm"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
          size="sm"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="sm"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="sm"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
          size="sm"
        >
          <Quote className="h-4 w-4" />
        </Button>

        <Button
          onClick={setLink}
          variant={editor.isActive('link') ? 'secondary' : 'ghost'}
          size="sm"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <Button
          onClick={handleImageUpload}
          variant="ghost"
          size="sm"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
          size="sm"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
          size="sm"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>

        <Button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
          size="sm"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="grid grid-cols-5 gap-2 p-2">
              {colors.map((color) => (
                <button
                  key={color}
                  className="w-8 h-8 rounded-full border border-gray-200"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};