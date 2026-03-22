import { createClient }  from '@/lib/supabase/server'
import { notFound }      from 'next/navigation'
import { NewsPostForm }  from '../NewsPostForm'

export const dynamic = 'force-dynamic'

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (id === 'new') {
    return <NewsPostForm post={null} />
  }

  const supabase = await createClient()
  const { data: post } = await supabase
    .from('news_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!post) notFound()

  return <NewsPostForm post={post} />
}
