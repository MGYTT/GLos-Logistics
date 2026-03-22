import Link            from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Calendar, Clock, ArrowRight, Sparkles, Star } from 'lucide-react'

export const dynamic  = 'force-dynamic'
export const metadata = { title: 'Aktualności' }

export default async function NewsPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('news_posts')
    .select('slug, title, excerpt, category, cover_url, read_time, featured, published_at, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })

  const featured = posts?.find(p => p.featured) ?? posts?.[0]
  const rest     = posts?.filter(p => p.slug !== featured?.slug) ?? []

  return (
    <div className="min-h-screen py-20 px-4 max-w-4xl mx-auto">

      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                        bg-amber-400/10 border border-amber-400/20
                        text-amber-400 text-xs font-semibold mb-5">
          <Sparkles className="w-3.5 h-3.5" />
          Aktualności i ogłoszenia
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
          Co słychać{' '}
          <span className="text-transparent bg-clip-text
                           bg-gradient-to-r from-amber-400 to-orange-500">
            w VTC?
          </span>
        </h1>
        <p className="text-zinc-500 max-w-sm mx-auto">
          Nowości, aktualizacje panelu, eventy i ogłoszenia
        </p>
      </div>

      {/* Featured */}
      {featured && (
        <Link href={`/news/${featured.slug}`} className="block mb-6 group">
          <article className="relative overflow-hidden rounded-2xl border
                              border-amber-500/20 bg-gradient-to-br
                              from-amber-500/10 via-zinc-900 to-zinc-900
                              p-7 hover:border-amber-500/40
                              transition-all duration-300 hover:-translate-y-0.5">
            {featured.cover_url && (
              <div className="absolute inset-0 opacity-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={featured.cover_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="absolute -top-10 -right-10 w-48 h-48
                            bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs px-2.5 py-1 rounded-full
                                 bg-amber-500 text-black font-bold flex items-center gap-1">
                  <Star className="w-3 h-3" /> Wyróżnione
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full
                                 bg-zinc-800 text-zinc-400 border border-zinc-700">
                  {featured.category}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-3
                             group-hover:text-amber-400 transition-colors leading-tight">
                {featured.title}
              </h2>
              <p className="text-zinc-400 leading-relaxed mb-5 max-w-2xl">
                {featured.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-zinc-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(featured.published_at ?? featured.created_at)
                      .toLocaleDateString('pl-PL')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {featured.read_time} czytania
                  </span>
                </div>
                <span className="flex items-center gap-1.5 text-sm font-bold
                                 text-amber-400 group-hover:gap-2.5 transition-all">
                  Czytaj <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </article>
        </Link>
      )}

      {/* Lista */}
      {rest.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-600 uppercase tracking-wider font-medium px-1">
            Poprzednie wpisy
          </p>
          {rest.map(post => (
            <Link key={post.slug} href={`/news/${post.slug}`} className="block group">
              <article className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5
                                  hover:border-zinc-700 transition-all hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full
                                       bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {post.category}
                      </span>
                    </div>
                    <h2 className="font-bold text-zinc-200 mb-1 truncate
                                   group-hover:text-amber-400 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-zinc-600 text-sm truncate">{post.excerpt}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-zinc-700">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.published_at ?? post.created_at)
                          .toLocaleDateString('pl-PL')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.read_time}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-amber-400
                                        transition-colors shrink-0 mt-1" />
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      {!posts?.length && (
        <div className="text-center py-24 text-zinc-600">
          <p className="font-medium">Brak opublikowanych postów</p>
        </div>
      )}
    </div>
  )
}
