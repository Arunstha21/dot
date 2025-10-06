'use client'

import { useCallback, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Color from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import { Button } from "@/components/ui/button"
import { Bold, Italic, UnderlineIcon } from 'lucide-react'
import { TextStyle } from '@tiptap/extension-text-style'

interface RichTextEditorProps {
  content: string;
  onChange?: (content: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange = () => {} }) => {
  const extensions = useMemo(() => [
    StarterKit.configure({
      hardBreak: {
        keepMarks: true,
      },
    }),
    Underline,
    TextStyle,
    Color,
    Image,
  ], [])

  const editor = useEditor({
    extensions,
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] w-full',
      },

      handlePaste: (view, event) => {
        if (!view || !event) {
          return false;
        }
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of items) {
            if (item.type.startsWith("image/")) {
              const file = item.getAsFile();
              if (file) {
                const reader = new FileReader();
                reader.onload = async () => {
                  try {
                    const base64Data = reader.result as string;
                    editor?.chain().focus().setImage({ src: base64Data }).run();
                  } catch (error) {
                    console.error("Error during upload:", error);
                  }
                };
      
                reader.readAsDataURL(file);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
  })

  const setColor = useCallback((color: string) => {
    editor?.chain().focus().setColor(color).run()
  }, [editor])

  if (!editor) {
    return null
  }

  const currentColor = editor.getAttributes('textStyle').color || '#000000'

  return (
    <div className="border rounded-md flex flex-col">
      <div className="flex items-center border-b p-2 gap-2 flex-wrap" role="toolbar" aria-label="Text formatting options">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-secondary' : ''}
          aria-label="Toggle bold"
          aria-pressed={editor.isActive('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-secondary' : ''}
          aria-label="Toggle italic"
          aria-pressed={editor.isActive('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'bg-secondary' : ''}
          aria-label="Toggle underline"
          aria-pressed={editor.isActive('underline')}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          <input
            type="color"
            onChange={(e) => setColor(e.target.value)}
            value={currentColor}
            className="w-6 h-6 p-0 border-none"
            aria-label="Text color"
          />
        </div>
      </div>
      <EditorContent editor={editor} className="flex-grow p-4 overflow-y-auto" />
    </div>
  )
}

export default RichTextEditor
