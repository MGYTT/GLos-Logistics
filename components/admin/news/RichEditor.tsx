'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit                    from '@tiptap/starter-kit'
import Underline                     from '@tiptap/extension-underline'
import TextAlign                     from '@tiptap/extension-text-align'
import Image                         from '@tiptap/extension-image'
import Link                          from '@tiptap/extension-link'
import Placeholder                   from '@tiptap/extension-placeholder'
import CharacterCount                from '@tiptap/extension-character-count'
import { useCallback }               from 'react'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Code, Minus,
  Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon,
  Undo, Redo,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  value:    string
  onChange: (html: string) => void
}

// ─── Przycisk toolbara ─────────────────────────
function ToolBtn({
  onClick, active = false, disabled = false, title, children,
}: {
  onClick:   () => void
  active?:   boolean
  disabled?: boolean
  title:     string
  children:  React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-1.5 rounded-lg transition-colors',
        active
          ? 'bg-amber-500/20 text-amber-400'
          : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/60',
        disabled && 'opacity-30 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-zinc-700 mx-1 shrink-0" />
}

// ─── Główny edytor ─────────────────────────────
export function RichEditor({ value, onChange }: Props) {
  const editor = useEditor({
    immediatelyRender: false,   // ← fix SSR hydration mismatch
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Zacznij pisać treść artykułu...' }),
      CharacterCount,
    ],
    content:   value,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-amber max-w-none min-h-[400px] p-5 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  const addLink = useCallback(() => {
  if (!editor) return
  const prev = editor.getAttributes('link').href ?? ''
  const url  = window.prompt('URL:', prev)
  if (url === null) return
  url === ''
    ? editor.chain().focus().extendMarkRange('link').unsetLink().run()
    : editor.chain().focus().extendMarkRange('link')
        .setLink({ href: url, target: '_blank' }).run()
}, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const url = window.prompt('URL obrazu:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden">

      {/* ── Toolbar ──────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2
                      border-b border-zinc-800 bg-zinc-900/80">

        {/* Undo / Redo */}
        <ToolBtn title="Cofnij" onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}>
          <Undo className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Ponów" onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}>
          <Redo className="w-4 h-4" />
        </ToolBtn>

        <Divider />

        {/* Nagłówki */}
        {([1, 2, 3] as const).map(level => {
          const Icon = level === 1 ? Heading1 : level === 2 ? Heading2 : Heading3
          return (
            <ToolBtn key={level} title={`Nagłówek ${level}`}
              active={editor.isActive('heading', { level })}
              onClick={() => editor.chain().focus().toggleHeading({ level }).run()}>
              <Icon className="w-4 h-4" />
            </ToolBtn>
          )
        })}

        <Divider />

        {/* Formatowanie tekstu */}
        <ToolBtn title="Pogrubienie" active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Kursywa" active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Podkreślenie" active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Przekreślenie" active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Kod inline" active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="w-4 h-4" />
        </ToolBtn>

        <Divider />

        {/* Wyrównanie */}
        <ToolBtn title="Wyrównaj do lewej" active={editor.isActive({ textAlign: 'left' })}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Wyśrodkuj" active={editor.isActive({ textAlign: 'center' })}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Wyrównaj do prawej" active={editor.isActive({ textAlign: 'right' })}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight className="w-4 h-4" />
        </ToolBtn>

        <Divider />

        {/* Listy */}
        <ToolBtn title="Lista punktowana" active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Lista numerowana" active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Cytat" active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Linia pozioma"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="w-4 h-4" />
        </ToolBtn>

        <Divider />

        {/* Link i obraz */}
        <ToolBtn title="Link" active={editor.isActive('link')} onClick={addLink}>
          <LinkIcon className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Obraz (URL)" onClick={addImage}>
          <ImageIcon className="w-4 h-4" />
        </ToolBtn>
      </div>

      {/* ── Pole edytora ─────────────────────── */}
      <EditorContent editor={editor} />

      {/* ── Stopka — licznik znaków ───────────── */}
      <div className="flex justify-end px-4 py-2 border-t border-zinc-800">
        <span className="text-xs text-zinc-600">
          {editor.storage.characterCount.characters()} znaków ·{' '}
          {editor.storage.characterCount.words()} słów
        </span>
      </div>
    </div>
  )
}
