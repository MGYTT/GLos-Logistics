'use client'

import { useState, useTransition } from 'react'
import { useRouter }               from 'next/navigation'
import dynamic                     from 'next/dynamic'
import { upsertPost }              from './actions'
import { Loader2, Save, Eye, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

// Tiptap ładowany tylko client-side
const RichEditor = dynamic(
  () => import('@/components/admin/news/RichEditor').then(m => m.RichEditor),
  { ssr: false, loading: () => (
    <div className="h-64 rounded-xl border border-zinc-700 bg-zinc-900
                    animate-pulse" />
  )},
)

const CATEGORIES = [
  'Ogłoszenia', 'Aktualizacje', 'Eventy', 'Rankingi', 'Społeczność', 'Inne',
]

interface Post {
  id:        string
  slug:      string
  title:     string
  excerpt:   string
  content:   string
  category:  string
  cover_url: string | null
  read_time: string
  published: boolean
  featured:  boolean
}

interface Props { post: Post | null }

export function NewsPostForm({ post }: Props) {
  const [content,  setContent]  = useState(post?.content  ?? '')
  const [title,    setTitle]    = useState(post?.title    ?? '')
  const [excerpt,  setExcerpt]  = useState(post?.excerpt  ?? '')
  const [category, setCategory] = useState(post?.category ?? 'Ogłoszenia')
  const [readTime, setReadTime] = useState(post?.read_time ?? '2 min')
  const [coverUrl, setCoverUrl] = useState(post?.cover_url ?? '')
  const [slug,     setSlug]     = useState(post?.slug     ?? '')
  const [pending,  startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('content', content)
    startTransition(() => upsertPost(fd))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Nagłówek */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/news"
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700
                       transition-colors text-zinc-400"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black">
              {post ? 'Edytuj post' : 'Nowy post'}
            </h1>
            <p className="text-xs text-zinc-600 mt-0.5">
              {post ? `/news/${post.slug}` : 'Nowy artykuł'}
            </p>
          </div>
        </div>

        {post?.slug && (
          <Link
            href={`/news/${post.slug}`}
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded-xl
                       bg-zinc-800 hover:bg-zinc-700 transition-colors
                       text-zinc-400 text-sm"
          >
            <Eye className="w-4 h-4" />
            Podgląd
          </Link>
        )}
      </div>

      {/* Formularz */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {post && <input type="hidden" name="id" value={post.id} />}

        {/* Tytuł */}
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
            Tytuł *
          </label>
          <input
            name="title"
            value={title}
            onChange={e => {
              setTitle(e.target.value)
              if (!post) setSlug(e.target.value
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
              )
            }}
            required
            placeholder="Tytuł artykułu..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl
                       px-4 py-3 text-white placeholder-zinc-600
                       focus:outline-none focus:border-amber-500/50
                       text-lg font-bold"
          />
        </div>

        {/* Slug + kategoria + czas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
              Slug (URL)
            </label>
            <input
              name="slug"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="moj-artykul"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl
                         px-4 py-2.5 text-white placeholder-zinc-600 text-sm
                         focus:outline-none focus:border-amber-500/50 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
              Kategoria
            </label>
            <select
              name="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl
                         px-4 py-2.5 text-white text-sm
                         focus:outline-none focus:border-amber-500/50"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
              Czas czytania
            </label>
            <input
              name="read_time"
              value={readTime}
              onChange={e => setReadTime(e.target.value)}
              placeholder="3 min"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl
                         px-4 py-2.5 text-white placeholder-zinc-600 text-sm
                         focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        {/* Cover URL */}
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
            Okładka (URL obrazu — opcjonalnie)
          </label>
          <input
            name="cover_url"
            value={coverUrl}
            onChange={e => setCoverUrl(e.target.value)}
            placeholder="https://..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl
                       px-4 py-2.5 text-white placeholder-zinc-600 text-sm
                       focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {/* Excerpt */}
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
            Skrót (wyświetlany na liście) *
          </label>
          <textarea
            name="excerpt"
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            required
            rows={2}
            placeholder="Krótki opis artykułu widoczny na stronie głównej..."
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl
                       px-4 py-3 text-white placeholder-zinc-600 text-sm
                       focus:outline-none focus:border-amber-500/50 resize-none"
          />
        </div>

        {/* Edytor treści */}
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
            Treść artykułu *
          </label>
          <RichEditor value={content} onChange={setContent} />
        </div>

        {/* Zapisz */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={pending || !title || !excerpt || !content}
            className={cn(
              'flex items-center gap-2 px-6 py-3 rounded-xl',
              'font-bold text-sm transition-all',
              pending || !title || !excerpt || !content
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-black',
            )}
          >
            {pending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />
            }
            {pending ? 'Zapisuję...' : post ? 'Zapisz zmiany' : 'Utwórz post'}
          </button>
        </div>
      </form>
    </div>
  )
}
