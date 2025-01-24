import { Button } from "@/components/ui/button";
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, List, Heading2, Heading3, Quote, Link as LinkIcon,
  Image as ImageIcon, ListOrdered, AlignLeft, AlignCenter, AlignRight, Palette
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EditorToolbarProps {
  editor: Editor;
  onImageUpload: () => void;
  onLinkAdd: () => void;
}

export const EditorToolbar = ({ editor, onImageUpload, onLinkAdd }: EditorToolbarProps) => {
  return (
    <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-2">
      <Button
        type="button" // Add type="button" to prevent form submission
        onClick={() => editor.chain().focus().toggleBold().run()}
        variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
        size="sm"
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
        size="sm"
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
        size="sm"
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
        size="sm"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
        size="sm"
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
        size="sm"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
        size="sm"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        onClick={onLinkAdd}
        variant={editor.isActive('link') ? 'secondary' : 'ghost'}
        size="sm"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        onClick={onImageUpload}
        variant="ghost"
        size="sm"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
        size="sm"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
        size="sm"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
        size="sm"
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm">
            <Palette className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <div className="grid grid-cols-5 gap-2 p-2">
            {colors.map((color) => (
              <button
                type="button"
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
  );
};

const colors = [
  '#000000', '#9b87f5', '#7E69AB', '#6E59A5', '#D6BCFA',
  '#F97316', '#0EA5E9', '#8B5CF6', '#D946EF', '#ea384c'
];