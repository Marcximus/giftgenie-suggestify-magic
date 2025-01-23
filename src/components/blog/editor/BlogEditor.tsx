import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import { EditorToolbar } from './EditorToolbar';
import { useToast } from "@/components/ui/use-toast";

interface BlogEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const BlogEditor = ({ value, onChange }: BlogEditorProps) => {
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      TextStyle,
      Color,
      ListItem,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto',
        },
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

  const handleLinkAdd = () => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return; // Cancelled
    }

    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    try {
      // Basic URL validation
      new URL(url);
      editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL including http:// or https://",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = () => {
    const url = window.prompt('Image URL');
    if (url) {
      try {
        new URL(url);
        editor?.chain().focus().setImage({ src: url }).run();
      } catch {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid image URL including http:// or https://",
          variant: "destructive",
        });
      }
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <EditorToolbar 
        editor={editor}
        onImageUpload={handleImageUpload}
        onLinkAdd={handleLinkAdd}
      />
      <EditorContent editor={editor} />
    </div>
  );
};