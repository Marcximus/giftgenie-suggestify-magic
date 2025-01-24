import { Button } from "@/components/ui/button";
import { Editor } from '@tiptap/react';
import {
  Bold, Italic, List, Heading2, Heading3, Quote, Link as LinkIcon,
  Image as ImageIcon, ListOrdered, AlignLeft, AlignCenter, AlignRight, 
  Palette, Table, Type, TextQuote
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EmojiPicker from 'emoji-picker-react';

interface EditorToolbarProps {
  editor: Editor;
  onImageUpload: () => void;
  onLinkAdd: () => void;
  onTableAdd: () => void;
}

export const EditorToolbar = ({ editor, onImageUpload, onLinkAdd, onTableAdd }: EditorToolbarProps) => {
  const fonts = [
    'Arial',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana'
  ];

  return (
    <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-2">
      <div className="flex items-center gap-1 border-r pr-2">
        <Button
          type="button"
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

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <Type className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40">
            <div className="flex flex-col gap-1">
              {fonts.map((font) => (
                <Button
                  key={font}
                  type="button"
                  variant="ghost"
                  onClick={() => editor.chain().focus().setFontFamily(font).run()}
                  className={editor.isActive('textStyle', { fontFamily: font }) ? 'bg-secondary' : ''}
                >
                  <span style={{ fontFamily: font }}>{font}</span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-1 border-r pr-2">
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
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
          size="sm"
        >
          <TextQuote className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 border-r pr-2">
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
      </div>

      <div className="flex items-center gap-1 border-r pr-2">
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
      </div>

      <div className="flex items-center gap-1">
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
          onClick={onTableAdd}
          variant="ghost"
          size="sm"
        >
          <Table className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              😊
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                editor.chain().focus().insertContent(emojiData.emoji).run();
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};