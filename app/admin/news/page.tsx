import { createClient }  from '@/lib/supabase/server'
import Link              from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { pl }            from 'date-fns/locale'
import { Plus, Eye, EyeOff, Pencil, Star } from 'lucide-react'
import { cn }            from '@/lib/utils/cn'
import { togglePublish, toggleFeatured, deletePost } from './actions'

export const dynamic = 'force-dynamic'

export default async function AdminNewsPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('news_posts')
    .select('id, slug, title, category, published, featured, created_at, published_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Aktualności</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {posts?.length ?? 0} postów
          </p>
        </div>
        <Link
          href="/admin/news/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                     bg-amber-500 hover:bg-amber-400 text-black
                     font-bold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nowy post
        </Link>
      </div>

      <div className="space-y-2">
        {posts?.map(post => (
          <div
            key={post.id}
            className="flex items-center gap-4 bg-zinc-900/60 border
                       border-zinc-800 rounded-xl px-5 py-4
                       hover:border-zinc-700 transition-colors"
          >
            {/* Status */}
            <div className={cn(
              'w-2 h-2 rounded-full shrink-0',
              post.published ? 'bg-green-400' : 'bg-zinc-600',
            )} />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm truncate">{post.title}</p>
                {post.featured && (
                  <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full
                                 bg-zinc-800 text-zinc-500 border border-zinc-700">
                  {post.category}
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-0.5">
                /news/{post.slug} ·{' '}
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true, locale: pl,
                })}
              </p>
            </div>

            {/* Akcje */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Edytuj */}
              <Link
                href={`/admin/news/${post.id}`}
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200
                           hover:bg-zinc-800 transition-colors"
                title="Edytuj"
              >
                <Pencil className="w-4 h-4" />
              </Link>

              {/* Wyróżniony */}
              <form action={toggleFeatured.bind(null, post.id, !post.featured)}>
                <button
                  type="submit"
                  title={post.featured ? 'Usuń wyróżnienie' : 'Wyróżnij'}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    post.featured
                      ? 'text-amber-400 hover:bg-amber-400/10'
                      : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800',
                  )}
                >
                  <Star className="w-4 h-4" />
                </button>
              </form>

              {/* Publikacja */}
              <form action={togglePublish.bind(null, post.id, !post.published)}>
                <button
                  type="submit"
                  title={post.published ? 'Cofnij publikację' : 'Opublikuj'}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    post.published
                      ? 'text-green-400 hover:bg-green-400/10'
                      : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800',
                  )}
                >
                  {post.published
                    ? <Eye className="w-4 h-4" />
                    : <EyeOff className="w-4 h-4" />
                  }
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
