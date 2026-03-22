import { notFound }     from 'next/navigation'
import Link             from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Calendar, Clock, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('news_posts')
    .select('title')
    .eq('slug', slug)
    .eq('published', true)
    .single()
  return { title: data?.title ?? 'Nie znaleziono' }
}

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('news_posts')
    .select('*, members(username, avatar_url)')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) notFound()

  return (
    <div className="min-h-screen py-20 px-4 max-w-3xl mx-auto">

      <Link
        href="/news"
        className="inline-flex items-center gap-2 text-zinc-500
                   hover:text-amber-400 transition-colors mb-10 text-sm group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Powrót do aktualności
      </Link>

      {/* Cover */}
      {post.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.cover_url}
          alt={post.title}
          className="w-full h-64 object-cover rounded-2xl mb-8
                     border border-zinc-800"
        />
      )}

      <article>
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs px-2.5 py-1 rounded-full
                           bg-amber-500/10 text-amber-400
                           border border-amber-500/20 font-medium">
            {post.category}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black mb-5
                       leading-tight tracking-tight">
          {post.title}
        </h1>

        <div className="flex items-center gap-5 text-sm text-zinc-500
                        mb-10 pb-8 border-b border-zinc-800">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {new Date(post.published_at ?? post.created_at)
              .toLocaleDateString('pl-PL', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {post.read_time} czytania
          </span>
          {post.members && (
            <span className="text-zinc-600">
              autor: <span className="text-zinc-400">{post.members.username}</span>
            </span>
          )}
        </div>

        {/* Treść z Tiptap — HTML */}
        <div
          className="prose prose-invert prose-amber max-w-none
                     prose-headings:font-black prose-headings:tracking-tight
                     prose-a:text-amber-400 prose-a:no-underline
                     hover:prose-a:underline
                     prose-code:bg-zinc-800 prose-code:text-amber-400
                     prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                     prose-blockquote:border-l-amber-500
                     prose-blockquote:text-zinc-400"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Stopka */}
        <div className="mt-14 p-5 rounded-2xl bg-zinc-900/60
                        border border-zinc-800 flex gap-4">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-zinc-200">
              Znalazłeś błąd lub masz sugestię?
            </p>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Kanał{' '}
              <span className="text-amber-400 font-mono">#błędy-i-sugestie</span>
              {' '}lub prywatna wiadomość:{' '}
              <span className="text-amber-400 font-bold">mgyt</span>
            </p>
          </div>
        </div>
      </article>
    </div>
  )
}
